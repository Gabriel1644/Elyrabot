// ── env.js DEVE ser o PRIMEIRO import (carrega .env antes de tudo) ──
import './src/env.js'

import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { CONFIG } from './src/config.js'
import { printBanner, startPulse, stopPulse } from './src/utils.js'
import { handleMessage, setBotJid, setSock as setHandlerSock } from './src/handler.js'
import { loadCommands } from './src/loader.js'
import { startDashboard } from './src/dashboard.js'
import { logInfo, logOk, logWarn, logError, emitStatus, emitQR } from './src/logger.js'
import { groupsDB } from './src/database.js'
import { initErrorTracker, setTrackerSocket, setTrackerSock } from './src/errorTracker.js'
import { initGit, pushFullBot, startAutoUpdateScheduler } from './src/github.js'
import { cleanNum } from './src/permissions.js'

printBanner()
initErrorTracker()

// ── Dashboard — iniciado UMA SÓ VEZ (fora de conectar) ────
// Bug anterior: estava dentro de conectar(), que reconecta.
// Isso causava EADDRINUSE em toda reconexão.
const io = startDashboard()
setTrackerSocket(io)

// Listener de pairing code compartilhado
let _sock = null
io.on('connection', (socket) => {
  socket.on('request_pairing', async ({ phone }) => {
    if (!_sock) return
    try {
      const code = await _sock.requestPairingCode(phone.trim())
      emitQR(code)
      logOk(`🔑 Código: ${code}`)
    } catch (e) {
      logError(`Pairing: ${e.message}`)
    }
  })
})

// ── GitHub: inicializa e faz push do bot completo ─────────
const repoUrl = CONFIG['github.repo'] || process.env.GITHUB_REPO_WITH_TOKEN || process.env.GITHUB_REPO || ''
if (repoUrl) {
  logInfo('Configurando GitHub...')
  const gitOk = await initGit({
    repoUrl,
    userName:  CONFIG.nome || 'ElyraBot',
    userEmail: `${CONFIG.owner || 'bot'}@elyrabot.local`
  })
  if (gitOk) {
    // Push inicial do bot completo em background (não bloqueia o boot)
    pushFullBot().then(r => {
      if (r.ok) logOk(`GitHub: ${r.message}`)
      else logWarn(`GitHub push: ${r.reason}`)
    }).catch(() => {})

    // Auto-update a cada 6h se habilitado
    if (CONFIG.autoUpdate || process.env.AUTO_UPDATE === 'true') {
      startAutoUpdateScheduler(6)
    }
  }
}

logInfo('Carregando comandos...')
await loadCommands()

if (CONFIG.autoCodeDetect !== false) logInfo('Detector de código: ativo')

let reconnectAttempts = 0

async function conectar() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const { version } = await fetchLatestBaileysVersion()
  logInfo(`Baileys v${version.join('.')}`)

  const sock = makeWASocket({
    version,
    auth:                state,
    printQRInTerminal:   false,
    logger:              pino({ level: 'silent' }),
    browser:             ['Windows', 'Chrome', '121.0.6167.184'],
    connectTimeoutMs:    60000,
    keepAliveIntervalMs: 30000,
    markOnlineOnConnect: true,
  })

  _sock = sock
  setHandlerSock(sock)
  setTrackerSock(sock)

  // Autenticação via terminal
  if (!sock.authState.creds.registered) {
    logWarn('Não autenticado! Use o Dashboard ou responda abaixo.')
    const { default: readline } = await import('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question('\n  📱 Conectar via Pairing Code? (s/n): ', async (choice) => {
      if (choice.toLowerCase() === 's') {
        rl.question('\n  📱 Número (ex: 5511999999999): ', async (phone) => {
          try {
            const code = await sock.requestPairingCode(phone.trim())
            logOk(`\n  ╔══════════════════════╗\n  ║  CÓDIGO: ${code}  ║\n  ╚══════════════════════╝\n`)
            emitQR(code)
          } catch (e) {
            logError(`Erro: ${e.message}`)
          } finally { rl.close() }
        })
      } else {
        logInfo('Aguardando via Dashboard...')
        rl.close()
      }
    })
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      emitQR(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`)
      logInfo('QR gerado — acesse o Dashboard.')
    }
    if (connection === 'close') {
      stopPulse()
      emitStatus('close')
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) {
        reconnectAttempts++
        const delay = Math.min(5000 * reconnectAttempts, 30000)
        logWarn(`Desconectado (${code}). Reconectando em ${delay/1000}s...`)
        setTimeout(conectar, delay)
      } else {
        logError('Sessão encerrada (logout). Delete auth/ e reinicie.')
      }
    } else if (connection === 'open') {
      reconnectAttempts = 0
      setBotJid(sock.user?.id || null)
      emitStatus('open', { jid: sock.user?.id })
      logOk(`${CONFIG.nome} conectada! JID: ${sock.user?.id}`)

      // Self-bot: usa o número do próprio bot como dono
      if (CONFIG.selfBot && sock.user?.id) {
        const botNum = cleanNum(sock.user.id)
        if (botNum && CONFIG.owner !== botNum) {
          CONFIG.owner = botNum
          logInfo(`🤖 Self-bot: dono definido como ${botNum}`)
        }
      }
      startPulse(CONFIG.nome)
    } else if (connection === 'connecting') {
      logInfo('Conectando...')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) await handleMessage(sock, msg)
  })

  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    const gd   = groupsDB.get(id, {})
    const jids = (participants || []).map(p =>
      typeof p === 'string' ? p : (p?.id || p?.jid || String(p))
    )
    if (action === 'add') {
      for (const jid of jids) {
        if (gd.antifake && !jid.startsWith('55')) {
          logInfo(`Anti-Fake: removendo ${jid}`)
          try { await sock.groupParticipantsUpdate(id, [jid], 'remove') } catch {}
          continue
        }
        if (gd.bemvindo) {
          const txt = (gd.welcomeMsg || 'Bem-vindo(a) ao grupo, {nome}! 🎉')
            .replace('{nome}', `@${jid.split('@')[0]}`)
          try { await sock.sendMessage(id, { text: txt, mentions: [jid] }) } catch {}
        }
      }
    }
    if (action === 'remove') {
      logInfo(`Membro saiu: ${jids[0]?.split('@')[0] || '?'}`)
    }
  })
}

conectar()
