// ══════════════════════════════════════════════════════════
//  grupo.js — Controle de grupos e restrições
// ══════════════════════════════════════════════════════════
import { allowedGroupsDB, configDB, groupsDB } from '../../database.js'
import { CONFIG } from '../../config.js'

// ── !allowbot — autoriza um grupo ────────────────────────
export const allowbot = {
  name: 'allowbot',
  aliases: ['liberargrupo', 'allowgroup'],
  description: 'Autoriza o bot neste grupo',
  category: 'owner',
  usage: '!allowbot',
  cooldown: 3,
  async execute({ sock, from, reply, isGrupo, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!isGrupo) return reply('❌ Use em grupos!')
    let nome = from
    try { const m = await sock.groupMetadata(from); nome = m.subject } catch {}
    allowedGroupsDB.set(from, { jid: from, nome, addedAt: new Date().toISOString() })
    await reply(`✅ Grupo *${nome}* autorizado!\nO bot vai responder aqui.`)
  }
}

// ── !denybot — bloqueia um grupo ─────────────────────────
export const denybot = {
  name: 'denybot',
  aliases: ['bloqueargrupo', 'denygroup'],
  description: 'Bloqueia o bot neste grupo',
  category: 'owner',
  usage: '!denybot',
  cooldown: 3,
  async execute({ from, reply, isGrupo, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!isGrupo) return reply('❌ Use em grupos!')
    allowedGroupsDB.delete(from)
    await reply('🔒 Grupo bloqueado. Bot não vai mais responder aqui.')
  }
}

// ── !restricaogrupos — liga/desliga restrição global ──────
export const restricaoGrupos = {
  name: 'restricaogrupos',
  aliases: ['grouprestriction', 'restricao'],
  description: 'Liga/desliga restrição de grupos',
  category: 'owner',
  usage: '!restricaogrupos on/off',
  cooldown: 3,
  async execute({ args, reply, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const sub = args[0]?.toLowerCase()
    if (sub === 'on' || sub === 'ativar') {
      configDB.set('groupRestriction', true)
      return reply('🔒 Restrição ativada!\nO bot só responde em grupos autorizados.')
    }
    if (sub === 'off' || sub === 'desativar') {
      configDB.set('groupRestriction', false)
      return reply('🔓 Restrição desativada!\nO bot responde em todos os grupos.')
    }
    const atual = configDB.get('groupRestriction', false)
    const grupos = Object.values(allowedGroupsDB.all())
    await reply(
      `🔒 *Status da Restrição*\n\n` +
      `Estado: *${atual ? 'ATIVA' : 'INATIVA'}*\n` +
      `Grupos autorizados: *${grupos.length}*\n\n` +
      `• !restricaogrupos on — ativar\n` +
      `• !restricaogrupos off — desativar\n` +
      `• !allowbot — autorizar este grupo\n` +
      `• !denybot — bloquear este grupo`
    )
  }
}

// ── !listargrupos ─────────────────────────────────────────
export const listarGrupos = {
  name: 'listargrupos',
  aliases: ['listgroups', 'grupos'],
  description: 'Lista grupos autorizados',
  category: 'owner',
  usage: '!listargrupos',
  cooldown: 5,
  async execute({ reply, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const grupos = Object.values(allowedGroupsDB.all())
    const restricao = configDB.get('groupRestriction', false)
    if (!grupos.length) return reply(
      `📋 *Grupos Autorizados*\n\nNenhum grupo cadastrado.\n` +
      `Restrição: ${restricao ? '🔒 ATIVA' : '🔓 INATIVA'}`
    )
    const lista = grupos.map((g, i) => `${i + 1}. *${g.nome || g.jid}*\n   \`${g.jid}\``).join('\n')
    await reply(`📋 *Grupos Autorizados*\nRestrição: ${restricao ? '🔒 ATIVA' : '🔓 INATIVA'}\n\n${lista}`)
  }
}

// ── !setprefixo — define prefixo por grupo ────────────────
export const setprefixoGrupo = {
  name: 'setprefixo',
  aliases: ['setprefix', 'prefixo'],
  description: 'Define o prefixo do bot neste grupo',
  category: 'owner',
  usage: '!setprefixo <prefixo>',
  cooldown: 5,
  async execute({ from, args, reply, isOwner, isSubdono, isGrupo }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!isGrupo) return reply('❌ Use em grupos!')
    const novo = args[0]
    if (!novo || novo.length > 3) return reply('❌ Prefixo inválido! Max 3 caracteres.')
    const prefixos = CONFIG.prefixosGrupo || {}
    prefixos[from] = novo
    CONFIG['prefixosGrupo'] = prefixos
    await reply(`✅ Prefixo deste grupo: *${novo}*`)
  }
}

// ── !resetprefixo ─────────────────────────────────────────
export const resetprefixoGrupo = {
  name: 'resetprefixo',
  aliases: ['resetprefix'],
  description: 'Reseta o prefixo deste grupo para o padrão',
  category: 'owner',
  usage: '!resetprefixo',
  cooldown: 5,
  async execute({ from, reply, isOwner, isSubdono, isGrupo }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!isGrupo) return reply('❌ Use em grupos!')
    const prefixos = CONFIG.prefixosGrupo || {}
    delete prefixos[from]
    CONFIG['prefixosGrupo'] = prefixos
    await reply(`✅ Prefixo resetado para o padrão: *${CONFIG.prefixo}*`)
  }
}

export default [allowbot, denybot, restricaoGrupos, listarGrupos, setprefixoGrupo, resetprefixoGrupo]
