// ══════════════════════════════════════════════════════════
//  grupo.js — Comandos de controle de grupos
//  !allowbot !denybot !setprefixo !meugrupo
// ══════════════════════════════════════════════════════════
import { allowedGroupsDB, configDB, groupsDB } from '../../database.js'
import { CONFIG } from '../../config.js'

// ── !allowbot — libera o bot neste grupo ──────────────────
export const allowbot = {
  name: 'allowbot',
  aliases: ['liberarbot', 'ativarbot', 'botativo'],
  description: 'Libera o bot para funcionar neste grupo',
  category: 'owner',
  usage: '!allowbot [jid]',
  cooldown: 3,
  async execute({ reply, args, isOwner, from, isGrupo, sock }) {
    if (!isOwner) return reply('❌ Apenas o dono.')
    const jid = args[0] || from
    if (!jid.endsWith('@g.us')) return reply('❌ JID de grupo inválido! Use em um grupo ou passe o JID.')
    let nome = jid
    try { const m = await sock.groupMetadata(jid); nome = m.subject } catch {}
    allowedGroupsDB.set(jid, { jid, nome, addedAt: new Date().toISOString() })
    reply(`✅ Bot liberado no grupo *${nome}*!`)
  }
}

// ── !denybot — bloqueia o bot neste grupo ─────────────────
export const denybot = {
  name: 'denybot',
  aliases: ['bloquearbot', 'desativarbot', 'botinatv'],
  description: 'Bloqueia o bot neste grupo',
  category: 'owner',
  usage: '!denybot [jid]',
  cooldown: 3,
  async execute({ reply, args, isOwner, from, isGrupo }) {
    if (!isOwner) return reply('❌ Apenas o dono.')
    const jid = args[0] || from
    if (!jid.endsWith('@g.us')) return reply('❌ JID de grupo inválido!')
    allowedGroupsDB.delete(jid)
    reply(`✅ Bot bloqueado no grupo ${jid}`)
  }
}

// ── !restricaogrupos — ativa/desativa restrição global ────
export const restricaoGrupos = {
  name: 'restricaogrupos',
  aliases: ['grouprestriction', 'restricao'],
  description: 'Ativa/desativa restrição de grupos',
  category: 'owner',
  usage: '!restricaogrupos on/off',
  cooldown: 3,
  async execute({ reply, args, isOwner }) {
    if (!isOwner) return reply('❌ Apenas o dono.')
    const val = args[0]?.toLowerCase()
    if (val === 'on') {
      configDB.set('groupRestriction', true)
      return reply('🔒 Restrição de grupos *ATIVADA*.\nO bot só funcionará em grupos autorizados com *!allowbot*.')
    }
    if (val === 'off') {
      configDB.set('groupRestriction', false)
      return reply('🔓 Restrição de grupos *DESATIVADA*.\nO bot funciona em todos os grupos.')
    }
    const atual = configDB.get('groupRestriction', false)
    const grupos = Object.values(allowedGroupsDB.all())
    let txt = `🔒 *Restrição de Grupos*\n\nStatus: *${atual ? 'ATIVADA' : 'DESATIVADA'}*\n\n`
    txt += `Use:\n!restricaogrupos on — ativar\n!restricaogrupos off — desativar\n\n`
    if (grupos.length) {
      txt += `*Grupos autorizados (${grupos.length}):*\n`
      grupos.slice(0, 10).forEach(g => { txt += `• ${g.nome}\n` })
      if (grupos.length > 10) txt += `_... e mais ${grupos.length - 10}_`
    } else {
      txt += '_Nenhum grupo autorizado ainda._\nUse !allowbot em um grupo para autorizar.'
    }
    reply(txt)
  }
}

// ── !listargrupos — lista grupos permitidos ───────────────
export const listarGrupos = {
  name: 'listargrupos',
  aliases: ['gruposbot', 'botgrupos'],
  description: 'Lista grupos autorizados a usar o bot',
  category: 'owner',
  usage: '!listargrupos',
  cooldown: 5,
  async execute({ reply, isOwner }) {
    if (!isOwner) return reply('❌ Apenas o dono.')
    const grupos = Object.values(allowedGroupsDB.all())
    const ativo  = configDB.get('groupRestriction', false)
    if (!grupos.length) return reply(`🔒 Restrição: *${ativo ? 'ATIVA' : 'INATIVA'}*\n\nNenhum grupo autorizado.`)
    let txt = `🔒 Restrição: *${ativo ? 'ATIVA' : 'INATIVA'}*\n\n*Grupos autorizados (${grupos.length}):*\n\n`
    grupos.forEach((g, i) => { txt += `${i + 1}. *${g.nome}*\n   \`${g.jid}\`\n` })
    reply(txt)
  }
}

// ── !setprefixo — define prefixo personalizado do grupo ──
export const setprefixoGrupo = {
  name: 'setprefixo',
  aliases: ['prefixogrupo', 'setprefix'],
  description: 'Define o prefixo do bot neste grupo',
  category: 'admin',
  usage: '!setprefixo <símbolo>',
  cooldown: 5,
  async execute({ reply, args, isAdmin, isOwner, isSubdono, isGrupo, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas administradores.')
    const novoPrefix = args[0]?.trim()
    if (!novoPrefix || novoPrefix.length > 3) return reply('❌ Informe um símbolo válido (até 3 chars)!\nEx: !setprefixo /')
    // Salva no mapa de prefixos por grupo
    const prefixos = configDB.get('prefixosGrupo', {})
    prefixos[from] = novoPrefix
    configDB.set('prefixosGrupo', prefixos)
    // Atualiza CONFIG também
    CONFIG.prefixosGrupo = prefixos
    reply(`✅ Prefixo deste grupo definido como: *${novoPrefix}*\n\nAgora use: ${novoPrefix}menu`)
  }
}

// ── !resetprefixo — reseta prefixo do grupo ──────────────
export const resetprefixoGrupo = {
  name: 'resetprefixo',
  aliases: ['resetprefix', 'prefixopadrao'],
  description: 'Reseta o prefixo deste grupo para o padrão',
  category: 'admin',
  usage: '!resetprefixo',
  cooldown: 5,
  async execute({ reply, isAdmin, isOwner, isSubdono, isGrupo, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas administradores.')
    const prefixos = configDB.get('prefixosGrupo', {})
    delete prefixos[from]
    configDB.set('prefixosGrupo', prefixos)
    CONFIG.prefixosGrupo = prefixos
    reply(`✅ Prefixo resetado para o padrão: *${CONFIG.prefixo}*`)
  }
}

export default [allowbot, denybot, restricaoGrupos, listarGrupos, setprefixoGrupo, resetprefixoGrupo]
