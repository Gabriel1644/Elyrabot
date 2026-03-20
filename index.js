// ── env.js DEVE ser o PRIMEIRO import (carrega .env antes de tudo) ──
import './src/env.js'

import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom }    from '@hapi/boom'
import pino        from 'pino'
import { CONFIG }  from './src/config.js'
import { printBanner, startPulse, stopPulse } from './src/utils.js'
import { handleMessage, setBotJid, setSock as setHandlerSock } from './src/handler.js'
import { loadCommands } from './src/loader.js'
import { startDashboard } from './src/dashboard.js'
import { logInfo, logOk, logWarn, logError, emitStatus, emitQR } from './src/logger.js'
import { groupsDB, configDB, allowedGroupsDB } from './src/database.js'
import { initErrorTracker, setTrackerSocket, setTrackerSock } from './src/errorTracker.js'
import { initGit, pushFullBot, startAutoUpdateScheduler } from './src/github.js'
import { cleanNum } from './src/permissions.js'

printBanner()
initErrorTracker()

// ── Dashboard — iniciado UMA SÓ VEZ ──────────────────────
const io = startDashboard()
setTrackerSocket(io)

// Listener de pairing code
let _sock = null
io.on('connection', (socket) => {
  socket.on('request_pairing', async ({ phone }) => {
    if (!_sock) return
    try {
      const code = await _sock.requestPairingCode(phone.trim())
      emitQR(code)
      logOk(`🔑 Código: ${code}`)
    } catch (e) { logError(`Pairing: ${e.message}`) }
  })
})

// ── Safety: reseta groupRestriction se não há grupos autorizados ──
{
  const restricted = configDB.get('groupRestriction', false)
  const grupos     = Object.keys(allowedGroupsDB.all())
  if (restricted && grupos.length === 0) {
    configDB.set('groupRestriction', false)
    logWarn('⚠️  groupRestriction ON sem grupos autorizados → desativado automaticamente')
    logWarn('    Use .restricaogrupos on + .allowbot para reativar com grupos')
  }
}

// ── GitHub (background, nunca bloqueia o boot) ────────────
const repoUrl = CONFIG['github.repo'] || process.env.GITHUB_REPO_WITH_TOKEN || process.env.GITHUB_REPO || ''
if (repoUrl) {
  logInfo('GitHub: configurando...')
  initGit({
    repoUrl,
    userName:  CONFIG.nome || 'KaiusBot',
    userEmail: `${CONFIG.owner || 'bot'}@bot.local`
  }).then(r => {
    if (!r?.ok) return logWarn('GitHub: ' + (r?.reason || 'falhou'))
    logOk('GitHub: pronto')
    if (CONFIG.autoUpdate || process.env.AUTO_UPDATE === 'true') {
      startAutoUpdateScheduler(6)
    }
  }).catch(e => logWarn('GitHub init: ' + e.message))
}

logInfo('Carregando comandos...')
await loadCommands()

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
    logWarn('Não autenticado! Use o Dashboard (aba Conectar) para gerar o código.')
    const { default: readline } = await import('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question('\n  📱 Conectar via Pairing Code? (s/n): ', async (choice) => {
      if (choice.toLowerCase() === 's') {
        rl.question('\n  📱 Número (ex: 5511999999999): ', async (phone) => {
          try {
            const code = await sock.requestPairingCode(phone.trim())
            logOk(`\n  ╔══════════════════════╗\n  ║  CÓDIGO: ${code}  ║\n  ╚══════════════════════╝\n`)
            emitQR(code)
          } catch (e) { logError(`Erro: ${e.message}`) } finally { rl.close() }
        })
      } else { rl.close() }
    })
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (connection === 'close') {
      stopPulse()
      emitStatus('close')
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      if (code === DisconnectReason.loggedOut) {
        logError('Sessão encerrada (logout). Delete auth/ e reinicie.')
      } else {
        reconnectAttempts++
        const delay = Math.min(5000 * reconnectAttempts, 30000)
        logWarn(`Desconectado (${code}). Reconectando em ${delay / 1000}s...`)
        setTimeout(conectar, delay)
      }
    } else if (connection === 'open') {
      reconnectAttempts = 0
      setBotJid(sock.user?.id || null)
      emitStatus('open', { jid: sock.user?.id })
      logOk(`${CONFIG.nome} conectada! JID: ${sock.user?.id}`)
      logOk(`Prefixo: "${CONFIG.prefixo}"  |  Dono: +${CONFIG.owner}`)

      // Self-bot: usa o número do próprio bot como dono
      if (CONFIG.selfBot && sock.user?.id) {
        const botNum = cleanNum(sock.user.id)
        if (botNum && CONFIG.owner !== botNum) {
          CONFIG.owner = botNum
          logInfo(`🤖 Self-bot: dono definido como ${botNum}`)
        }
      }
      startPulse(CONFIG.nome)

      // Restaura hooks de mensagem salvos (antiword, autoreact, etc.)
      import('./src/commands/owner/hooks_cmd.js')
        .then(m => m.restoreHooks?.(sock))
        .catch(() => {})
    } else if (connection === 'connecting') {
      logInfo('Conectando...')
      emitStatus('connecting')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // ── Mensagens recebidas ──────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg)
      } catch (e) {
        logError(`Erro no handleMessage: ${e.message}`)
        // Não deixa o listener morrer — processa próximas mensagens
      }
    }
  })

  // ── Entradas/saídas de grupo ─────────────────────────────
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
