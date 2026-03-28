// ══════════════════════════════════════════════════════════
//  permissions.js — Sistema de permissões
// ══════════════════════════════════════════════════════════
import { CONFIG } from './config.js'
import { subdonsDB, minionsDB } from './database.js'

export const ROLES = { DONO: 1, SUBDONO: 2, ADMIN: 3, VIP: 4, USUARIO: 5, BANIDO: 99 }
export const ROLE_NAMES = { 1:'👑 Dono', 2:'🌟 Sub-dono', 3:'⭐ Admin', 4:'💎 VIP', 5:'👤 Usuário', 99:'🚫 Banido' }
export const ROLE_EMOJIS = { 1:'👑', 2:'🌟', 3:'⭐', 4:'💎', 5:'👤', 99:'🚫' }

/**
 * Extrai o número puro de qualquer formato de JID.
 * '556796701839:74@s.whatsapp.net' → '556796701839'
 * '556796701839@s.whatsapp.net'    → '556796701839'
 * '556796701839'                   → '556796701839'
 * CRÍTICO: split('@')[0].split(':')[0] ANTES de remover chars
 */
export function cleanNum(jid = '') {
  return String(jid).split('@')[0].split(':')[0].replace(/\D/g, '')
}

export function getRole(userId) {
  const num   = cleanNum(userId)
  const owner = cleanNum(CONFIG.owner || process.env.OWNER_NUMBER || '')

  if (!num) return ROLES.USUARIO
  if (!owner) {
    // No owner configured — nobody is dono
    const data = subdonsDB.get(num, null)
    if (data) return data.role || ROLES.SUBDONO
    return ROLES.USUARIO
  }

  if (num === owner) return ROLES.DONO

  const data = subdonsDB.get(num, null)
  if (data) return data.role || ROLES.SUBDONO

  return ROLES.USUARIO
}

export function hasPermission(userId, minRole) {
  const role = getRole(userId)
  if (role === ROLES.BANIDO) return false
  return role <= minRole
}

export const isDono    = (u) => getRole(u) === ROLES.DONO
export const isSubdono = (u) => hasPermission(u, ROLES.SUBDONO)
export const isVip     = (u) => hasPermission(u, ROLES.VIP)
export const isBanido  = (u) => getRole(u) === ROLES.BANIDO

// ── CRUD subdons ──────────────────────────────────────────
export function addSubdono(userId, role = ROLES.SUBDONO, label = '') {
  const num = cleanNum(userId)
  if (!num) return
  subdonsDB.set(num, {
    num, role: Number(role), label,
    adicionadoEm: new Date().toISOString(),
    permissoes: role <= ROLES.SUBDONO
      ? { allOwnerCmds: true, canBan: true, canAddVip: true }
      : { noCooldown: true },
  })
}

export function removeSubdono(userId) { subdonsDB.delete(cleanNum(userId)) }

export function listSubdonos() {
  return Object.values(subdonsDB.all()).sort((a, b) => a.role - b.role)
}

export function setSubdonoLabel(userId, label) {
  const num = cleanNum(userId)
  subdonsDB.set(num, { ...subdonsDB.get(num, {}), label })
}

export function getSubdonoPerms(userId) {
  return subdonsDB.get(cleanNum(userId), {})?.permissoes || {}
}

export function setSubdonoPerm(userId, perm, value) {
  const num   = cleanNum(userId)
  const entry = subdonsDB.get(num, {})
  entry.permissoes = { ...(entry.permissoes || {}), [perm]: value }
  subdonsDB.set(num, entry)
}

// ── Minions ───────────────────────────────────────────────
export function trackUser({ userId, usuario, isGrupo, grupo, from }) {
  const num = cleanNum(userId)
  if (!num) return
  const now      = Date.now()
  const existing = minionsDB.get(num, null)
  
  // Sistema de Níveis (XP)
  const xpGanho = Math.floor(Math.random() * 11) + 5 // 5 a 15 XP por msg
  const xpAtual = (existing?.xp || 0) + xpGanho
  const lvlAtual = existing?.level || 1
  const xpProx = lvlAtual * lvlAtual * 100 // Fórmula simples: lvl^2 * 100
  
  let novoLvl = lvlAtual
  if (xpAtual >= xpProx) novoLvl++

  minionsDB.set(num, {
    num,
    nome:        usuario || existing?.nome || 'Desconhecido',
    jid:         userId,
    primeiroUso: existing?.primeiroUso || now,
    ultimoUso:   now,
    totalMsgs:   (existing?.totalMsgs || 0) + 1,
    grupos:      [...new Set([...(existing?.grupos || []), ...(isGrupo && grupo ? [grupo] : [])])].slice(-10),
    role:        getRole(userId),
    bloqueado:   isBanido(userId),
    xp:          xpAtual,
    level:       novoLvl,
    up:          novoLvl > lvlAtual // Flag para avisar no chat se subiu
  })

  return { up: novoLvl > lvlAtual, level: novoLvl, xp: xpAtual, xpProx }
}

export function getMinionStats() {
  const all   = Object.values(minionsDB.all())
  const semana = Date.now() - 7 * 86400000
  return {
    total:   all.length,
    ativos:  all.filter(u => u.ultimoUso > semana).length,
    subdons: listSubdonos().filter(u => u.role <= ROLES.SUBDONO).length,
    vips:    listSubdonos().filter(u => u.role === ROLES.VIP).length,
    banidos: all.filter(u => u.bloqueado).length,
  }
}

export function getMinionList(filter = 'all', page = 0, size = 20) {
  let all = Object.values(minionsDB.all())
  const semana = Date.now() - 7 * 86400000
  if (filter === 'ativos')  all = all.filter(u => u.ultimoUso > semana)
  if (filter === 'banidos') all = all.filter(u => u.bloqueado)
  if (filter === 'vips')    all = all.filter(u => u.role <= ROLES.VIP && u.role >= ROLES.SUBDONO)
  all.sort((a, b) => b.ultimoUso - a.ultimoUso)
  return {
    total: all.length,
    page,
    pages: Math.ceil(all.length / size),
    items: all.slice(page * size, (page + 1) * size),
  }
}

export function getMinionByNum(num) {
  return minionsDB.get(cleanNum(num), null)
}
