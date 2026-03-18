// ══════════════════════════════════════════════════════════
//  logger.js — Log bonito no terminal + emit para dashboard
// ══════════════════════════════════════════════════════════
import { C } from './config.js'
import { statsDB } from './database.js'

let _io = null
let _lastStatus = null
const _logs = []
const MAX_LOGS = 300

export function setSocket(io) { _io = io }

// ── Tempo ─────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

// ── Trunca strings longas ─────────────────────────────────
function trunc(str, max = 40) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

// ── Formata número curto ──────────────────────────────────
function shortNum(jid = '') {
  const num = jid.split('@')[0].split(':')[0]
  if (num.length >= 10) return `…${num.slice(-6)}`
  return num
}

// ── Emit para dashboard ───────────────────────────────────
function emit(type, data) {
  const entry = { type, data, time: getTime(), ts: Date.now() }
  _logs.push(entry)
  if (_logs.length > MAX_LOGS) _logs.shift()
  _io?.emit('log', entry)
}

export function getLogs() { return [..._logs] }

// ── Linha divisória ───────────────────────────────────────
function linha(char = '─', tam = 58) {
  return C.gray + char.repeat(tam) + C.reset
}

// ── Sistema: info / ok / warn / error ─────────────────────

export function logInfo(msg) {
  console.log(`  ${C.cyan}◆${C.reset} ${C.gray}${getTime()}${C.reset}  ${C.silver}${msg}${C.reset}`)
  emit('info', msg)
}

export function logOk(msg) {
  console.log(`  ${C.green}✔${C.reset} ${C.gray}${getTime()}${C.reset}  ${C.green}${msg}${C.reset}`)
  emit('ok', msg)
}

export function logWarn(msg) {
  console.log(`  ${C.yellow}⚠${C.reset} ${C.gray}${getTime()}${C.reset}  ${C.yellow}${msg}${C.reset}`)
  emit('warn', msg)
}

export function logError(msg) {
  console.log(`  ${C.red}✘${C.reset} ${C.gray}${getTime()}${C.reset}  ${C.red}${msg}${C.reset}`)
  emit('error', msg)
}

// ── Log de comando (o principal) ──────────────────────────
//
//  ┌─ [GRUPO] ─────────────────────────────────────────────
//  │  👤 João Silva  (556799…)   📍 Dev Brasil
//  │  ⚡ .ytmp3   →  Never gonna give you up
//  └───────────────────────────────────────────────────────
//
//  ┌─ [PRIVADO] ───────────────────────────────────────────
//  │  👤 Maria  (556711…)
//  │  ⚡ .menu
//  └───────────────────────────────────────────────────────

export function logMsg({ usuario, grupo, conteudo, tipo, comando, userId }) {
  const h   = getTime()
  const isG = tipo === 'GRUPO'

  // Ícone e cor do tipo
  const tipoTag  = isG
    ? `${C.blue}${C.bold}[GRUPO]${C.reset}`
    : `${C.magenta}${C.bold}[PRIVADO]${C.reset}`

  // Número curto
  const numStr = userId ? `${C.gray}(${shortNum(userId)})${C.reset}` : ''

  // Nome truncado
  const nomeStr = `${C.white}${C.bold}${trunc(usuario || 'Desconhecido', 22)}${C.reset}`

  // Grupo truncado
  const grupoStr = isG && grupo
    ? `${C.dim}📍 ${trunc(grupo, 28)}${C.reset}`
    : ''

  // Comando e args
  const cmdStr = comando
    ? `${C.yellow}${C.bold}⚡ ${comando}${C.reset}`
    : `${C.dim}· msg${C.reset}`

  // Args (o que veio depois do comando)
  const prefix  = conteudo?.match(/^[^\w\s]/)?.[ 0] || ''
  const argsStr = conteudo
    ? `${C.gray}→  ${C.reset}${C.dim}${trunc(conteudo.slice(prefix.length + comando.length + 1).trim(), 36)}${C.reset}`
    : ''

  // ─── Linha superior ──────────────────────────────────────
  const sep = `${C.gray}─${C.reset}`
  console.log(`\n  ${C.gray}┌${sep.repeat(2)} ${tipoTag} ${C.gray}${h} ${'─'.repeat(18)}${C.reset}`)
  console.log(`  ${C.gray}│${C.reset}  👤 ${nomeStr}  ${numStr}  ${grupoStr}`)
  console.log(`  ${C.gray}│${C.reset}  ${cmdStr}  ${argsStr}`)
  console.log(`  ${C.gray}└${'─'.repeat(52)}${C.reset}`)

  // Emit para dashboard
  emit('message', { usuario, grupo, conteudo, tipo, comando, userId, time: h })

  // ── Estatísticas ─────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const tot   = statsDB.get('total', {})
  statsDB.set('total', { ...tot, msgs: (tot.msgs || 0) + 1 })
  if (comando) {
    const cmds = statsDB.get('commands', {})
    cmds[comando] = (cmds[comando] || 0) + 1
    statsDB.set('commands', cmds)
  }
  const daily = statsDB.get(today, { msgs: 0, cmds: 0 })
  statsDB.set(today, { msgs: daily.msgs + 1, cmds: daily.cmds + (comando ? 1 : 0) })
}

export function emitStatus(status, data = {}) {
  _lastStatus = { status, ...data }
  _io?.emit('status', { status, ...data })
}

export function emitQR(qr) {
  _io?.emit('qr', { qr })
}
export function getLastStatus() { return _lastStatus }
