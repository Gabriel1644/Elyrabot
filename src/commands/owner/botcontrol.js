// ══════════════════════════════════════════════════════════
//  botcontrol.js — !bangp !botoff !boton !statusbot
// ══════════════════════════════════════════════════════════
import { allowedGroupsDB, configDB } from '../../database.js'
import { CONFIG } from '../../config.js'
import { ROLES, getRole } from '../../permissions.js'

// ── !bangp — toggle do bot NESTE grupo apenas ─────────────
export const bangp = {
  name: 'bangp',
  aliases: ['bangrupo'],
  description: 'Liga/desliga o bot NESTE grupo sem afetar outros',
  category: 'owner',
  usage: '!bangp',
  cooldown: 3,
  async execute({ reply, sock, from, isGrupo, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!isGrupo) return reply('❌ Use em grupos!')

    let nomeGrupo = from
    try { const m = await sock.groupMetadata(from); nomeGrupo = m.subject } catch {}

    // Se restrição não está ativa: ativa e libera este grupo
    if (!configDB.get('groupRestriction', false)) {
      configDB.set('groupRestriction', true)
      allowedGroupsDB.set(from, { jid: from, nome: nomeGrupo, addedAt: new Date().toISOString() })
      return reply(
        `🔒 *Restrição ativada!*\n\n` +
        `✅ *${nomeGrupo}* está *liberado*.\n` +
        `❌ Outros grupos bloqueados por padrão.\n\n` +
        `Use *!allowbot* em outros grupos para liberar.\n` +
        `Use *!bangp* de novo para bloquear este grupo.`
      )
    }

    // Restrição ativa — alterna SOMENTE este grupo
    if (allowedGroupsDB.has(from)) {
      allowedGroupsDB.delete(from)
      return reply(`🔒 Bot *desativado* neste grupo: _${nomeGrupo}_\n\nUse *!bangp* para reativar.`)
    } else {
      allowedGroupsDB.set(from, { jid: from, nome: nomeGrupo, addedAt: new Date().toISOString() })
      return reply(`✅ Bot *ativado* neste grupo: _${nomeGrupo}_\n\nUse *!bangp* para desativar.`)
    }
  }
}

// ── !botoff — pausa o bot globalmente ─────────────────────
export const botoff = {
  name: 'botoff',
  aliases: ['desligarbot'],
  description: 'Pausa o bot globalmente',
  category: 'owner',
  usage: '!botoff',
  cooldown: 3,
  async execute({ reply, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    configDB.set('botPaused', true)
    reply(`🔴 *Bot pausado!*\nNão vai responder a nenhum comando.\n\nUse *!boton* para reativar.`)
  }
}

// ── !boton — reativa o bot ────────────────────────────────
export const boton = {
  name: 'boton',
  aliases: ['ligarbot'],
  description: 'Reativa o bot globalmente',
  category: 'owner',
  usage: '!boton',
  cooldown: 3,
  async execute({ reply, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    configDB.set('botPaused', false)
    reply(`🟢 *Bot reativado!*\nVoltando a responder normalmente.`)
  }
}

// ── !statusbot ────────────────────────────────────────────
export const statusBot = {
  name: 'statusbot',
  aliases: ['botstatus'],
  description: 'Status do bot (pausado/ativo, restrição)',
  category: 'owner',
  usage: '!statusbot',
  cooldown: 5,
  async execute({ reply, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const paused      = configDB.get('botPaused', false)
    const restriction = configDB.get('groupRestriction', false)
    const grupos      = Object.values(allowedGroupsDB.all())
    const selfBot     = CONFIG.selfBot || false
    reply(
      `🤖 *Status do Bot*\n\n` +
      `${paused ? '🔴' : '🟢'} Estado: *${paused ? 'PAUSADO' : 'ATIVO'}*\n` +
      `${restriction ? '🔒' : '🔓'} Restrição de grupos: *${restriction ? 'ATIVA' : 'INATIVA'}*\n` +
      `👤 Modo: *${selfBot ? 'Self-Bot' : 'Multi-usuário'}*\n` +
      `📋 Grupos autorizados: *${grupos.length}*\n\n` +
      `!botoff / !boton — pausar/reativar\n` +
      `!bangp — toggle neste grupo\n` +
      `!restricaogrupos on/off`
    )
  }
}

export default [bangp, botoff, boton, statusBot]
