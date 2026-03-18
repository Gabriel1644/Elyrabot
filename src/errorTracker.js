// ══════════════════════════════════════════════════════════
//  errorTracker.js — Detector de erros + notificação ao dono
//  + opção de auto-correção via IA
// ══════════════════════════════════════════════════════════
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = path.resolve(__dirname, '../data')
const LOG_FILE  = path.join(DATA_DIR, 'erros-ia.txt')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const _seen   = new Set()
const _queue  = []
let   _busy   = false
let   _io     = null
let   _sock   = null  // sock do Baileys para DM ao dono

// Aguardando resposta do dono: cmdName → { resolve }
const _pendingFix = new Map()

export function setTrackerSocket(io) { _io = io }
export function setTrackerSock(sock) { _sock = sock }

function hashStr(s) {
  let h = 0
  for (let i = 0; i < Math.min(s.length, 200); i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h.toString(36)
}

function writeToFile(bloco) {
  const sep = '═'.repeat(70)
  fs.appendFileSync(LOG_FILE, `\n${sep}\n${bloco}\n`, 'utf-8')
}

function now() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

// ── DM ao dono com opções de correção ─────────────────────
export async function notifyOwner(sock, cmdNome, error, analise = null) {
  try {
    const { CONFIG } = await import('./config.js')
    const owner = CONFIG.owner
    if (!owner) return

    const ownerJid = `${owner}@s.whatsapp.net`
    const msg = [
      `🔴 *ERRO DETECTADO — ${cmdNome}*`,
      ``,
      `❌ *Mensagem:* ${error.message}`,
      ``,
      analise ? `🤖 *Diagnóstico IA:*\n${analise.split('\n').slice(0, 5).join('\n')}` : '',
      ``,
      `*O que deseja fazer?*`,
      ``,
      `1️⃣  Auto-corrigir com IA`,
      `2️⃣  Ver código atual`,
      `3️⃣  Ignorar`,
      ``,
      `_Responda com 1, 2 ou 3_`,
    ].filter(l => l !== undefined).join('\n')

    await sock.sendMessage(ownerJid, { text: msg })

    // Registra pending
    _pendingFix.set(owner, { cmdNome, error, analise })
  } catch {}
}

// Chamado pelo handler ao receber msg do dono no privado
export function handleOwnerReply(userId, texto, sock) {
  const owner = userId.split('@')[0].split(':')[0]
  if (!_pendingFix.has(owner)) return false

  const { cmdNome, error } = _pendingFix.get(owner)
  const choice = texto.trim()

  if (choice === '1') {
    _pendingFix.delete(owner)
    autoFixCommand(sock, owner, cmdNome, error)
    return true
  }
  if (choice === '2') {
    _pendingFix.delete(owner)
    showCommandSource(sock, owner, cmdNome)
    return true
  }
  if (choice === '3') {
    _pendingFix.delete(owner)
    sock.sendMessage(`${owner}@s.whatsapp.net`, { text: `✅ Ok, erro ignorado.` })
    return true
  }
  return false
}

async function autoFixCommand(sock, owner, cmdNome, error) {
  const ownerJid = `${owner}@s.whatsapp.net`
  try {
    await sock.sendMessage(ownerJid, { text: `🤖 Tentando corrigir *${cmdNome}*...` })

    const { getCommandSource, createCommand, getCommand } = await import('./loader.js')
    const name = cmdNome.replace('!', '')
    const src  = getCommandSource(name)
    const cmd  = getCommand(name)
    if (!src) return sock.sendMessage(ownerJid, { text: `❌ Código-fonte de ${cmdNome} não encontrado.` })

    const { default: Groq } = await import('groq-sdk')
    const { CONFIG } = await import('./config.js')
    const key = CONFIG.groqKey || process.env.GROQ_API_KEY
    if (!key) return sock.sendMessage(ownerJid, { text: `❌ GROQ_API_KEY não configurada.` })

    const groq = new Groq({ apiKey: key })
    const resp = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `Corrija este comando de WhatsApp (baileys). Responda APENAS com o código JS corrigido, sem markdown.\n\nErro: ${error.message}\n\nCódigo atual:\n${src}`
      }],
      max_tokens: 2000,
      temperature: 0.1,
    })

    let code = resp.choices[0].message.content.trim()
    code = code.replace(/^```(?:javascript|js)?\n?/m, '').replace(/\n?```$/m, '').trim()

    await createCommand({ name, code, category: cmd?.category || 'misc' })
    await sock.sendMessage(ownerJid, {
      text: `✅ *${cmdNome} foi corrigido e recarregado!*\n\n_Teste novamente o comando._`
    })
  } catch (e) {
    await sock.sendMessage(ownerJid, { text: `❌ Não consegui corrigir automaticamente: ${e.message}` })
  }
}

async function showCommandSource(sock, owner, cmdNome) {
  const ownerJid = `${owner}@s.whatsapp.net`
  try {
    const { getCommandSource } = await import('./loader.js')
    const src = getCommandSource(cmdNome.replace('!', ''))
    if (!src) return sock.sendMessage(ownerJid, { text: `❌ Código-fonte não encontrado.` })
    await sock.sendMessage(ownerJid, {
      text: `📄 *Código de ${cmdNome}:*\n\`\`\`\n${src.substring(0, 3500)}\n\`\`\``
    })
  } catch {}
}

// ── Análise com IA ────────────────────────────────────────
async function analisarComIA(errorInfo) {
  try {
    const { default: Groq } = await import('groq-sdk')
    const key = process.env.GROQ_API_KEY
    if (!key) return null
    const groq = new Groq({ apiKey: key })
    const resp = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Analise este erro Node.js de forma objetiva. Responda em português, máximo 200 palavras.

ERRO: ${errorInfo.tipo}
MENSAGEM: ${errorInfo.mensagem}
LOCAL: ${errorInfo.local}
STACK:
${errorInfo.stack}

Formato EXATO (sem markdown):
DIAGNÓSTICO:
[causa em 1-2 frases]

COMO RESOLVER:
1. [passo 1]
2. [passo 2]
3. [passo 3 se precisar]

PREVENÇÃO:
[como evitar]`
      }],
      max_tokens: 500,
      temperature: 0.1,
    })
    return resp.choices[0].message.content.trim()
  } catch { return null }
}

// ── Fila de processamento ─────────────────────────────────
async function processQueue() {
  if (_busy || _queue.length === 0) return
  _busy = true

  const errorInfo = _queue.shift()
  const hash = hashStr(errorInfo.mensagem + errorInfo.local)

  if (_seen.has(hash)) { _busy = false; processQueue(); return }
  _seen.add(hash)

  try {
    const { C } = await import('./config.js')
    console.log(`\n  ${C.red}╔══ ERRO CAPTURADO ══════════════════════════╗${C.reset}`)
    console.log(`  ${C.red}║${C.reset} ${C.yellow}${errorInfo.tipo}${C.reset}`)
    console.log(`  ${C.red}║${C.reset} ${errorInfo.mensagem.substring(0, 68)}`)
    console.log(`  ${C.red}║${C.reset} ${C.gray}📍 ${errorInfo.local.substring(0, 60)}${C.reset}`)
    console.log(`  ${C.red}║${C.reset} ${C.cyan}🤖 Analisando com IA...${C.reset}`)
    console.log(`  ${C.red}╚════════════════════════════════════════════╝${C.reset}\n`)
  } catch {}

  _io?.emit('log', {
    type: 'error',
    data: `[${errorInfo.tipo}] ${errorInfo.mensagem} — ${errorInfo.local}`,
    time: now(), ts: Date.now(),
  })

  const analise = await analisarComIA(errorInfo)

  // Salva no arquivo
  const bloco = [
    `📅 DATA/HORA: ${now()}`,
    `🔴 TIPO: ${errorInfo.tipo}`,
    `❌ MENSAGEM: ${errorInfo.mensagem}`,
    `📍 LOCAL: ${errorInfo.local}`,
    ``,
    `📋 STACK TRACE:`,
    errorInfo.stack,
    ``,
    analise
      ? `🤖 ANÁLISE DA IA:\n${analise}`
      : `🤖 ANÁLISE DA IA: (indisponível — configure GROQ_API_KEY)`,
    ``,
    `─`.repeat(70),
  ].join('\n')

  writeToFile(bloco)

  // Log resumo no terminal
  if (analise) {
    try {
      const { C } = await import('./config.js')
      const diag = analise.split('\n').find(l => l.startsWith('DIAGNÓSTICO:'))
      if (diag) console.log(`  ${C.cyan}◆${C.reset} ${C.gray}IA:${C.reset} ${diag.replace('DIAGNÓSTICO:','').trim()}`)
    } catch {}

    _io?.emit('log', {
      type: 'warn',
      data: `🤖 ${analise.split('\n').find(l=>l.startsWith('DIAGNÓSTICO:'))?.replace('DIAGNÓSTICO:','').trim() || '(ver erros-ia.txt)'}`,
      time: now(), ts: Date.now(),
    })
  }

  // DM ao dono com análise
  if (_sock && errorInfo.tipo.startsWith('Erro no comando')) {
    const error = new Error(errorInfo.mensagem)
    error.stack = errorInfo.stack
    await notifyOwner(_sock, errorInfo.tipo.replace('Erro no comando ', ''), error, analise)
  }

  _busy = false
  setTimeout(processQueue, 2000)
}

export function capturar(tipo, error, contexto = '') {
  if (!error) return
  const mensagem = error?.message || String(error)
  const stack    = (error?.stack || '').split('\n').slice(0, 6).join('\n')
  const localMatch = stack.match(/at .+ \((.+:\d+:\d+)\)/) || stack.match(/at (.+:\d+:\d+)/)
  const local = contexto || (localMatch ? localMatch[1].replace(process.cwd(), '') : 'desconhecido')
  if (!mensagem || mensagem === 'undefined') return

  const ignorar = [
    'Connection Closed','connection closed','timed out',
    'rate-overlimit','ECONNRESET','socket hang up','not-authorized',
    'Connection Failure', 'EADDRINUSE'
  ]
  if (ignorar.some(i => mensagem.includes(i))) return

  _queue.push({ tipo, mensagem, stack, local })
  processQueue()
}

export function initErrorTracker() {
  const header = `╔══════════════════════════════════════════════════════════════════════╗
║              ElyraBot — Registro de Erros com IA                    ║
╚══════════════════════════════════════════════════════════════════════╝\n`
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, header, 'utf-8')
  } else {
    fs.appendFileSync(LOG_FILE, `\n${'▓'.repeat(70)}\nNOVA SESSÃO: ${now()}\n${'▓'.repeat(70)}\n`)
  }

  process.on('uncaughtException', (error) => capturar('uncaughtException', error))
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    capturar('unhandledRejection', error)
  })

  console.log(`  \x1b[92m✔\x1b[0m \x1b[90mError Tracker ativo → data/erros-ia.txt\x1b[0m`)
}
