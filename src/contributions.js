// ══════════════════════════════════════════════════════════
//  contributions.js — Sistema de contribuições
//
//  Quando um novo comando é criado/detectado pelo bot,
//  o dono pode optar por enviá-lo para o repo oficial.
//  Os comandos ficam em "fila de contribuição" até serem
//  revisados e aceitos/rejeitados.
// ══════════════════════════════════════════════════════════
import { contribDB } from './database.js'
import { uploadCommand } from './github.js'
import { CONFIG } from './config.js'
import { logInfo, logOk, logWarn } from './logger.js'
import axios from 'axios'

// ── Registra um comando para possível contribuição ────────
export function registerForContribution({ name, category, code, description, author }) {
  const existing = contribDB.get(name, null)
  if (existing?.status === 'accepted') return // já aceito, não mexe

  contribDB.set(name, {
    name,
    category,
    code,
    description,
    author:        author || 'anon',
    registradoEm:  new Date().toISOString(),
    status:        'pending',   // pending | approved | rejected | submitted
    votes:         0,
    autoShare:     CONFIG.autoUpload === true || CONFIG.autoUpload === 'true',
  })

  logInfo(`Comando !${name} registrado para contribuição.`)
}

// ── Lista contribuições pendentes ─────────────────────────
export function getPendingContribs() {
  return Object.values(contribDB.all()).filter(c => c.status === 'pending')
}

export function getAllContribs() {
  return Object.values(contribDB.all())
}

// ── Aprova e envia para o GitHub ──────────────────────────
export async function approveContrib(name) {
  const c = contribDB.get(name, null)
  if (!c) return { ok: false, reason: 'Contribuição não encontrada' }

  contribDB.set(name, { ...c, status: 'submitted' })

  const result = await uploadCommand({
    name:        c.name,
    category:    c.category,
    code:        c.code,
    description: c.description,
  })

  if (result.ok) {
    contribDB.set(name, { ...c, status: 'accepted', enviadoEm: new Date().toISOString() })
    logOk(`Contribuição !${name} enviada ao GitHub!`)
    return { ok: true, message: `✅ *!${name}* enviado ao repositório oficial!` }
  } else {
    contribDB.set(name, { ...c, status: 'pending' })
    return { ok: false, reason: result.reason }
  }
}

// ── Rejeita ───────────────────────────────────────────────
export function rejectContrib(name, motivo = '') {
  const c = contribDB.get(name, null)
  if (!c) return false
  contribDB.set(name, { ...c, status: 'rejected', motivo })
  return true
}

// ── Notifica dono sobre novo comando disponível ───────────
export async function notifyNewCommand(sock, { name, category, description }) {
  try {
    const owner = CONFIG.owner
    if (!owner) return
    const ownerJid = `${owner}@s.whatsapp.net`

    const msg =
      `🆕 *Novo comando criado: !${name}*\n\n` +
      `📦 Categoria: _${category}_\n` +
      `📝 ${description || 'Sem descrição'}\n\n` +
      `Deseja contribuir com a comunidade?\n\n` +
      `*Responda:*\n` +
      `✅ sim — Enviar para o GitHub oficial\n` +
      `❌ não — Manter apenas localmente`

    await sock.sendMessage(ownerJid, { text: msg })

    // Registra pending de resposta
    _awaitingContribReply.set(owner, name)
  } catch {}
}

// ── Aguardando resposta do dono ───────────────────────────
const _awaitingContribReply = new Map()

export function handleContribReply(userId, texto, sock) {
  const num   = userId.replace(/[^0-9]/g, '').replace(/:.*/, '')
  const owner = (CONFIG.owner || '').replace(/[^0-9]/g, '')
  if (num !== owner) return false
  if (!_awaitingContribReply.has(num)) return false

  const cmdName = _awaitingContribReply.get(num)
  const resp    = texto.trim().toLowerCase()

  if (resp === 'sim' || resp === 's' || resp === 'yes') {
    _awaitingContribReply.delete(num)
    approveContrib(cmdName).then(r => {
      const jid = `${num}@s.whatsapp.net`
      sock.sendMessage(jid, { text: r.ok ? r.message : `❌ ${r.reason}` }).catch(() => {})
    })
    return true
  }

  if (resp === 'não' || resp === 'nao' || resp === 'n' || resp === 'no') {
    _awaitingContribReply.delete(num)
    sock.sendMessage(`${num}@s.whatsapp.net`, {
      text: `✅ Ok! *!${cmdName}* mantido localmente.`
    }).catch(() => {})
    return true
  }

  return false
}

// ── Stats ─────────────────────────────────────────────────
export function getContribStats() {
  const all = getAllContribs()
  return {
    total:    all.length,
    pending:  all.filter(c => c.status === 'pending').length,
    accepted: all.filter(c => c.status === 'accepted').length,
    rejected: all.filter(c => c.status === 'rejected').length,
  }
}
