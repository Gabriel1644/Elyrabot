// ══════════════════════════════════════════════════════════
//  hooks_cmd.js — Comandos para gerenciar hooks de mensagem
//
//  O sistema de hooks permite que qualquer comando "ouça"
//  mensagens sem modificar o handler.js.
//
//  Exemplo de uso no seu próprio comando:
//
//  import { registerHook, removeHook } from '../../hooks.js'
//
//  registerHook({
//    id: 'meu-hook',
//    name: 'Meu Interceptor',
//    priority: 10,
//    filter: ({ isGrupo }) => isGrupo,
//    handle: async ({ texto, reply }) => {
//      if (texto.includes('algo')) {
//        await reply('Detectei!')
//        return true  // para propagação
//      }
//    }
//  })
// ══════════════════════════════════════════════════════════
import { registerHook, removeHook, listHooks, hookCount } from '../../hooks.js'
import { groupsDB } from '../../database.js'
import { CONFIG } from '../../config.js'

// ── !hooks — listar hooks ativos ──────────────────────────
export const hooksCmd = {
  name: 'hooks',
  aliases: ['listhooks', 'hookstatus'],
  description: 'Lista todos os hooks de mensagem ativos',
  category: 'owner',
  usage: '.hooks',
  cooldown: 3,
  async execute({ reply, isOwner, isSubdono, prefix: p }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono/sub-dono.')

    const hooks = listHooks()
    if (!hooks.length) {
      return reply(
        `🔌 *Sistema de Hooks*\n\n` +
        `Nenhum hook registrado.\n\n` +
        `_Hooks permitem que comandos interceptem mensagens sem modificar o handler.js._\n\n` +
        `*Hooks incluídos:*\n` +
        `• ${p}antiword on — filtro de palavras\n` +
        `• ${p}autoreact on — reage automaticamente a mensagens`
      )
    }

    const lista = hooks.map((h, i) =>
      `${i + 1}. *${h.name}* \`[${h.id}]\`\n   Prioridade: ${h.priority}`
    ).join('\n')

    await reply(`🔌 *Hooks Ativos (${hooks.length})*\n\n${lista}\n\n_Use ${p}hooks remove <id> para remover_`)
  }
}

// ── !hooks remove — remove um hook pelo ID ────────────────
export const hooksRemove = {
  name: 'removehook',
  aliases: ['hookremove', 'rmhook'],
  description: 'Remove um hook ativo pelo ID',
  category: 'owner',
  usage: '.removehook <id>',
  cooldown: 3,
  async execute({ reply, args, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono/sub-dono.')
    const id = args.join('-').toLowerCase()
    if (!id) return reply('❌ Informe o ID do hook!\nEx: .removehook meu-hook-id')
    const ok = removeHook(id)
    await reply(ok ? `✅ Hook \`${id}\` removido!` : `❌ Hook \`${id}\` não encontrado.`)
  }
}

// ── !antiword — filtra palavras proibidas via hook ────────
export const antiword = {
  name: 'antiword',
  aliases: ['filtropalavras', 'wordfilter'],
  description: 'Ativa/desativa filtro de palavras no grupo via hook',
  category: 'admin',
  usage: '.antiword on/off | .antiword add <palavra> | .antiword list',
  cooldown: 5,
  async execute({ sock, from, args, reply, isAdmin, isOwner, isSubdono, isGrupo }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas admins.')

    const sub = args[0]?.toLowerCase()
    const gd  = groupsDB.get(from, {})

    if (sub === 'add' || sub === 'adicionar') {
      const palavra = args.slice(1).join(' ').toLowerCase().trim()
      if (!palavra) return reply('❌ Informe a palavra!\nEx: .antiword add palavrão')
      gd.antiwordList = gd.antiwordList || []
      if (gd.antiwordList.includes(palavra)) return reply('⚠️ Palavra já na lista!')
      gd.antiwordList.push(palavra)
      groupsDB.set(from, gd)
      // Atualiza o hook ativo
      _registerAntiwordHook(from, gd.antiwordList)
      return reply(`✅ Palavra "*${palavra}*" adicionada ao filtro!`)
    }

    if (sub === 'remove' || sub === 'remover') {
      const palavra = args.slice(1).join(' ').toLowerCase().trim()
      gd.antiwordList = (gd.antiwordList || []).filter(p => p !== palavra)
      groupsDB.set(from, gd)
      _registerAntiwordHook(from, gd.antiwordList)
      return reply(`✅ Palavra "*${palavra}*" removida do filtro!`)
    }

    if (sub === 'list' || sub === 'listar') {
      const lista = gd.antiwordList || []
      if (!lista.length) return reply('📋 Nenhuma palavra no filtro.')
      return reply(`📋 *Palavras filtradas:*\n${lista.map((p, i) => `${i + 1}. ${p}`).join('\n')}`)
    }

    if (sub === 'on' || sub === 'ativar') {
      gd.antiword = true
      gd.antiwordList = gd.antiwordList || []
      groupsDB.set(from, gd)
      _registerAntiwordHook(from, gd.antiwordList)
      return reply(
        `✅ *Anti-palavrão ativado!*\n\n` +
        `${gd.antiwordList.length ? `Palavras: ${gd.antiwordList.join(', ')}` : 'Lista vazia — adicione com .antiword add <palavra>'}\n\n` +
        `_Mensagens com palavras proibidas serão deletadas._`
      )
    }

    if (sub === 'off' || sub === 'desativar') {
      gd.antiword = false
      groupsDB.set(from, gd)
      removeHook(`antiword:${from}`)
      return reply('✅ Anti-palavrão *desativado* neste grupo!')
    }

    // Status atual
    const ativo = gd.antiword && (gd.antiwordList?.length > 0)
    await reply(
      `🔤 *Anti-Palavrão*\n\n` +
      `Estado: *${ativo ? '🟢 ATIVO' : '🔴 INATIVO'}*\n` +
      `Palavras: *${(gd.antiwordList || []).length}*\n\n` +
      `• .antiword on — ativar\n` +
      `• .antiword off — desativar\n` +
      `• .antiword add <palavra> — adicionar\n` +
      `• .antiword remove <palavra> — remover\n` +
      `• .antiword list — ver lista`
    )
  }
}

function _registerAntiwordHook(from, lista) {
  if (!lista?.length) { removeHook(`antiword:${from}`); return }
  registerHook({
    id:       `antiword:${from}`,
    name:     `Anti-palavrão [${from.split('@')[0].slice(-6)}]`,
    priority: 5,  // Alta prioridade — roda antes de quase tudo
    filter:   (ctx) => ctx.from === from && ctx.isGrupo,
    handle:   async (ctx) => {
      const textoLower = ctx.texto.toLowerCase()
      const encontrada = lista.find(p => textoLower.includes(p))
      if (!encontrada) return false

      try {
        // Deleta a mensagem
        await ctx.sock.sendMessage(ctx.from, { delete: ctx.msg.key })
        // Avisa o usuário
        await ctx.sock.sendMessage(ctx.from, {
          text: `⛔ @${ctx.userId.split('@')[0]} Palavra proibida detectada!`,
          mentions: [ctx.userId]
        })
      } catch {}
      return true  // Para propagação — não processa comando
    }
  })
}

// ── !autoreact — reage automaticamente com emoji ──────────
export const autoreact = {
  name: 'autoreact',
  aliases: ['autoemoji', 'react'],
  description: 'Bot reage com emoji a mensagens no grupo',
  category: 'admin',
  usage: '.autoreact on [emoji] | .autoreact off',
  cooldown: 5,
  async execute({ sock, from, args, reply, isAdmin, isOwner, isSubdono, isGrupo }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas admins.')

    const sub   = args[0]?.toLowerCase()
    const emoji = args[1] || '❤️'
    const gd    = groupsDB.get(from, {})

    if (sub === 'on' || sub === 'ativar') {
      gd.autoreact      = true
      gd.autoreactEmoji = emoji
      groupsDB.set(from, gd)

      registerHook({
        id:       `autoreact:${from}`,
        name:     `Auto-react ${emoji} [${from.split('@')[0].slice(-6)}]`,
        priority: 90,  // Baixa prioridade — roda depois de tudo
        filter:   (ctx) => ctx.from === from && ctx.isGrupo && !ctx.texto.startsWith(CONFIG.prefixo),
        handle:   async (ctx) => {
          try {
            await ctx.sock.sendMessage(ctx.from, {
              react: { text: emoji, key: ctx.msg.key }
            })
          } catch {}
          return false  // Não para propagação
        }
      })

      return reply(`✅ Auto-react *${emoji}* ativado!\nVou reagir a todas as mensagens do grupo.`)
    }

    if (sub === 'off' || sub === 'desativar') {
      gd.autoreact = false
      groupsDB.set(from, gd)
      removeHook(`autoreact:${from}`)
      return reply('✅ Auto-react *desativado*!')
    }

    const ativo = gd.autoreact
    await reply(
      `😄 *Auto-React*\n\n` +
      `Estado: *${ativo ? `🟢 ATIVO ${gd.autoreactEmoji || '❤️'}` : '🔴 INATIVO'}*\n\n` +
      `• .autoreact on ❤️ — ativar com emoji\n` +
      `• .autoreact off — desativar`
    )
  }
}

// ── Recarregar hooks salvos ao iniciar ────────────────────
// Quando o bot reinicia, relê as configs do DB e registra hooks dos grupos
export async function restoreHooks(sock) {
  try {
    const grupos = Object.entries(groupsDB.all())
    let restored = 0

    for (const [jid, gd] of grupos) {
      // Restaura antiword
      if (gd.antiword && gd.antiwordList?.length) {
        _registerAntiwordHook(jid, gd.antiwordList)
        restored++
      }
      // Restaura autoreact
      if (gd.autoreact && gd.autoreactEmoji) {
        const emoji = gd.autoreactEmoji
        registerHook({
          id:       `autoreact:${jid}`,
          name:     `Auto-react ${emoji} [${jid.split('@')[0].slice(-6)}]`,
          priority: 90,
          filter:   (ctx) => ctx.from === jid && ctx.isGrupo && !ctx.texto.startsWith(CONFIG.prefixo),
          handle:   async (ctx) => {
            try { await ctx.sock.sendMessage(ctx.from, { react: { text: emoji, key: ctx.msg.key } }) } catch {}
            return false
          }
        })
        restored++
      }
    }

    if (restored > 0) {
      const { logInfo } = await import('../../logger.js')
      logInfo(`[Hooks] ${restored} hook(s) restaurado(s) de sessões anteriores`)
    }
  } catch {}
}

export default [hooksCmd, hooksRemove, antiword, autoreact]
