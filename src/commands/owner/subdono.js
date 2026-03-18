// ══════════════════════════════════════════════════════════
//  subdono.js — Comandos de gerenciamento de sub-donos,
//               VIPs, banimentos e Minions
// ══════════════════════════════════════════════════════════
import {
  addSubdono, removeSubdono, listSubdonos, getMinionList,
  getMinionByNum, getMinionStats, setSubdonoPerm, setSubdonoLabel,
  getRole, ROLES, ROLE_NAMES, ROLE_EMOJIS, cleanNum, isBanido
} from '../../permissions.js'
import { minionsDB, subdonsDB } from '../../database.js'

// ── !subdono ──────────────────────────────────────────────
export const subdono = {
  name: 'subdono',
  aliases: ['sd', 'subowner'],
  description: 'Gerencia sub-donos do bot',
  category: 'owner',
  usage: '!subdono add/remove/list/perm/label',
  cooldown: 3,
  async execute({ reply, args, isOwner, isSubdono, prefix: p, sock, from, msg }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const sub = args[0]?.toLowerCase()

    // ── Listar ─────────────────────────────────────────
    if (!sub || sub === 'list' || sub === 'listar') {
      const list = listSubdonos()
      if (!list.length) return reply('📋 Nenhum sub-dono cadastrado.\n\nUse: !subdono add <número>')
      let txt = `🌟 *Sub-Donos & VIPs* (${list.length})\n\n`
      list.forEach(u => {
        const emoji = ROLE_EMOJIS[u.role] || '👤'
        const label = u.label ? ` — _${u.label}_` : ''
        txt += `${emoji} +${u.num}${label}\n`
        if (u.permissoes?.allOwnerCmds === false) txt += `   ⚠️ _sem acesso a cmds de dono_\n`
      })
      return reply(txt)
    }

    // ── Adicionar ──────────────────────────────────────
    if (sub === 'add' || sub === 'adicionar') {
      const num  = (args[1] || '').replace(/[^0-9]/g, '')
      const role = args[2]?.toLowerCase() === 'vip' ? ROLES.VIP : ROLES.SUBDONO
      if (!num) return reply('❌ Uso: !subdono add <número> [vip]')
      addSubdono(num, role)
      const emoji = ROLE_EMOJIS[role]
      await sock.sendMessage(from, {
        text: `✅ +${num} adicionado como ${emoji} *${ROLE_NAMES[role]}*!`,
        quoted: msg
      })
      // Notifica o subdono
      try {
        await sock.sendMessage(`${num}@s.whatsapp.net`, {
          text: `🎉 Você foi promovido a *${ROLE_NAMES[role]}* do bot *${(await import('../../config.js')).CONFIG.nome}*!\n\nAgora você tem acesso a comandos exclusivos.`
        })
      } catch {}
      return
    }

    // ── Remover ────────────────────────────────────────
    if (sub === 'remove' || sub === 'remover' || sub === 'del') {
      const num = (args[1] || '').replace(/[^0-9]/g, '')
      if (!num) return reply('❌ Uso: !subdono remove <número>')
      removeSubdono(num)
      return reply(`✅ +${num} removido dos sub-donos.`)
    }

    // ── Label ──────────────────────────────────────────
    if (sub === 'label' || sub === 'nome') {
      const num   = (args[1] || '').replace(/[^0-9]/g, '')
      const label = args.slice(2).join(' ')
      if (!num || !label) return reply('❌ Uso: !subdono label <número> <apelido>')
      setSubdonoLabel(num, label)
      return reply(`✅ Apelido de +${num} definido como: _${label}_`)
    }

    // ── Permissão ──────────────────────────────────────
    if (sub === 'perm') {
      if (!isOwner) return reply('❌ Apenas o dono pode alterar permissões.')
      const num   = (args[1] || '').replace(/[^0-9]/g, '')
      const perm  = args[2]
      const valor = args[3] !== 'off'
      if (!num || !perm) return reply('❌ Uso: !subdono perm <número> <permissao> [on/off]\n\nPermissões: allOwnerCmds, canBan, canAddVip, noCooldown')
      setSubdonoPerm(num, perm, valor)
      return reply(`✅ Permissão _${perm}_ de +${num} → *${valor ? 'ON' : 'OFF'}*`)
    }

    return reply(
      `🌟 *Sub-Donos*\n\n` +
      `${p}subdono add <num>      — Adicionar\n` +
      `${p}subdono add <num> vip  — Adicionar como VIP\n` +
      `${p}subdono remove <num>   — Remover\n` +
      `${p}subdono label <num> <apelido>\n` +
      `${p}subdono perm <num> allOwnerCmds off\n` +
      `${p}subdono list           — Listar todos`
    )
  }
}

// ── !banir / !desbanir ────────────────────────────────────
export const banir = {
  name: 'banir',
  aliases: ['ban', 'bloquear'],
  description: 'Bane um usuário de usar o bot',
  category: 'owner',
  usage: '!banir <número> [motivo]',
  cooldown: 3,
  async execute({ reply, args, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const num   = (args[0] || '').replace(/[^0-9]/g, '')
    const motivo = args.slice(1).join(' ') || 'sem motivo'
    if (!num) return reply('❌ Informe o número! Ex: !banir 5511999999999')
    const { default: JsonDB } = await import('../../database.js')
    const { subdonsDB } = await import('../../database.js')
    subdonsDB.set(num, { num, role: 99, motivo, banidoEm: new Date().toISOString() })
    const { minionsDB } = await import('../../database.js')
    const m = minionsDB.get(num, {})
    minionsDB.set(num, { ...m, bloqueado: true, role: 99 })
    return reply(`🚫 +${num} foi *banido* do bot.\nMotivo: _${motivo}_`)
  }
}

export const desbanir = {
  name: 'desbanir',
  aliases: ['unban', 'desbloquear'],
  description: 'Remove o banimento de um usuário',
  category: 'owner',
  usage: '!desbanir <número>',
  cooldown: 3,
  async execute({ reply, args, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const num = (args[0] || '').replace(/[^0-9]/g, '')
    if (!num) return reply('❌ Informe o número!')
    removeSubdono(num)
    const { minionsDB } = await import('../../database.js')
    const m = minionsDB.get(num, {})
    minionsDB.set(num, { ...m, bloqueado: false, role: ROLES.USUARIO })
    return reply(`✅ +${num} foi *desbanido*!`)
  }
}

// ── !minions ──────────────────────────────────────────────
export const minions = {
  name: 'minions',
  aliases: ['usuarios', 'users', 'membros'],
  description: 'Vê todos usuários que já usaram o bot',
  category: 'owner',
  usage: '!minions [all/ativos/vips/banidos] [página]',
  cooldown: 5,
  async execute({ reply, args, isOwner, isSubdono, prefix: p }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')

    const filter = args[0]?.toLowerCase() || 'all'
    const page   = Math.max(0, (parseInt(args[1]) || 1) - 1)

    // ── Stats resumo ────────────────────────────────────
    if (filter === 'stats' || filter === 'resumo') {
      const s = getMinionStats()
      return reply(
        `📊 *Minions — Estatísticas*\n\n` +
        `👥 Total: *${s.total}*\n` +
        `✅ Ativos (7d): *${s.ativos}*\n` +
        `🌟 Sub-donos: *${s.subdons}*\n` +
        `💎 VIPs: *${s.vips}*\n` +
        `🚫 Banidos: *${s.banidos}*`
      )
    }

    const result = getMinionList(filter, page, 15)

    if (!result.total) return reply(`📋 Nenhum usuário encontrado com filtro: _${filter}_`)

    const filtroNome = { all: 'Todos', ativos: 'Ativos (7d)', vips: 'VIPs', banidos: 'Banidos' }
    let txt = `👥 *Minions — ${filtroNome[filter] || filter}* (${result.total})\n`
    txt += `Página ${page + 1}/${result.pages}\n\n`

    result.items.forEach(u => {
      const emoji   = ROLE_EMOJIS[u.role] || '👤'
      const tempo   = Math.floor((Date.now() - u.ultimoUso) / 60000)
      const tempoStr = tempo < 60 ? `${tempo}min atrás` : tempo < 1440 ? `${Math.floor(tempo/60)}h atrás` : `${Math.floor(tempo/1440)}d atrás`
      txt += `${emoji} *${u.nome || 'Desconhecido'}* (+${u.num})\n`
      txt += `   💬 ${u.totalMsgs}msgs  •  _${tempoStr}_\n`
    })

    if (result.pages > 1) txt += `\n_Use ${p}minions ${filter} ${page + 2} para próxima página_`

    return reply(txt)
  }
}

// ── !perfil (de qualquer usuário) ─────────────────────────
export const perfilCmd = {
  name: 'verminion',
  aliases: ['minioninfo', 'userinfo'],
  description: 'Vê informações de um usuário do bot',
  category: 'owner',
  usage: '!verminion <número>',
  cooldown: 3,
  async execute({ reply, args, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const num = (args[0] || '').replace(/[^0-9]/g, '')
    if (!num) return reply('❌ Informe o número! Ex: !verminion 5511999999999')
    const u = getMinionByNum(num)
    if (!u) return reply(`❌ Usuário +${num} não encontrado no banco de Minions.`)
    const role = ROLE_NAMES[u.role] || '👤 Usuário'
    const dias = Math.floor((Date.now() - u.primeiroUso) / 86400000)
    return reply(
      `👤 *Perfil do Minion*\n\n` +
      `📛 Nome: *${u.nome || 'Desconhecido'}*\n` +
      `📱 Número: +${u.num}\n` +
      `🏷️ Cargo: ${role}\n` +
      `💬 Mensagens: *${u.totalMsgs}*\n` +
      `📅 Desde: _${new Date(u.primeiroUso).toLocaleDateString('pt-BR')}_ (${dias}d)\n` +
      `🕐 Último uso: _${new Date(u.ultimoUso).toLocaleString('pt-BR')}_\n` +
      `📍 Grupos: ${(u.grupos || []).slice(0, 3).join(', ') || 'nenhum'}\n` +
      `🚫 Banido: ${u.bloqueado ? 'Sim' : 'Não'}`
    )
  }
}

// ── !dm (envia mensagem para um minion) ───────────────────
export const dmMinion = {
  name: 'dm',
  aliases: ['mensagem', 'enviar'],
  description: 'Envia DM para um usuário do bot',
  category: 'owner',
  usage: '!dm <número> <mensagem>',
  cooldown: 5,
  async execute({ reply, args, sock, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const num = (args[0] || '').replace(/[^0-9]/g, '')
    const txt = args.slice(1).join(' ')
    if (!num || !txt) return reply('❌ Uso: !dm <número> <mensagem>')
    const u = getMinionByNum(num)
    try {
      await sock.sendMessage(`${num}@s.whatsapp.net`, { text: txt })
      reply(`✅ Mensagem enviada para ${u?.nome || '+' + num}!`)
    } catch (e) {
      reply(`❌ Não consegui enviar para +${num}: ${e.message}`)
    }
  }
}

// ── !broadcast (p/ todos Minions) ─────────────────────────
export const broadcastMinions = {
  name: 'bcast',
  aliases: ['broadcast', 'massmsg'],
  description: 'Envia mensagem para todos os Minions (ativos)',
  category: 'owner',
  usage: '!bcast <mensagem>',
  cooldown: 60,
  async execute({ reply, args, sock, isOwner, argStr }) {
    if (!isOwner) return reply('❌ Apenas o dono pode fazer broadcast.')
    if (!argStr) return reply('❌ Informe a mensagem!')

    const result = getMinionList('ativos', 0, 999)
    await reply(`📢 Enviando para *${result.total}* usuários ativos...`)

    let ok = 0, err = 0
    for (const u of result.items) {
      try {
        await sock.sendMessage(`${u.num}@s.whatsapp.net`, { text: `📢 *Mensagem do bot:*\n\n${argStr}` })
        ok++
        await new Promise(r => setTimeout(r, 600))
      } catch { err++ }
    }
    await reply(`✅ Enviado: ${ok}  ❌ Erros: ${err}`)
  }
}

export default [subdono, banir, desbanir, minions, perfilCmd, dmMinion, broadcastMinions]
