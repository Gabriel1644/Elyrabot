// ══════════════════════════════════════════════════════════
//  alias.js — Gerenciamento de aliases dinâmicos
// ══════════════════════════════════════════════════════════
import { addDynamicAlias, removeDynamicAlias, listAliasesForCommand, getDynamicAliases, getCommand } from '../../loader.js'

export default {
  name: 'alias',
  aliases: ['atalho', 'apelido'],
  description: 'Gerencia aliases (apelidos) para comandos',
  category: 'core',
  usage: '!alias add <cmd> <alias> | remove <alias> | list <cmd> | listall',
  cooldown: 3,
  async execute({ reply, args, isOwner, prefix: p }) {
    if (!isOwner) return reply('❌ Apenas o dono pode gerenciar aliases.')

    const sub    = args[0]?.toLowerCase()
    const target = args[1]?.toLowerCase()
    const value  = args[2]?.toLowerCase()

    // ── Listar todos os aliases dinâmicos ────────────────
    if (!sub || sub === 'listall' || sub === 'todos') {
      const all = getDynamicAliases()
      if (!Object.keys(all).length) return reply('📋 Nenhum alias dinâmico cadastrado ainda.\n\nUse:\n!alias add <cmd> <alias>')
      let txt = `📋 *Aliases Dinâmicos:*\n\n`
      for (const [alias, cmd] of Object.entries(all)) {
        txt += `  • ${p}${alias} → ${p}${cmd}\n`
      }
      return reply(txt)
    }

    // ── Adicionar alias ──────────────────────────────────
    if (sub === 'add' || sub === 'adicionar') {
      if (!target || !value) return reply(`❌ Uso: !alias add <cmd> <alias>\nEx: !alias add ytmp3 musica2`)
      if (!getCommand(target)) return reply(`❌ Comando *!${target}* não existe!`)
      // Verifica se alias já está em uso
      if (getCommand(value)) return reply(`❌ *${p}${value}* já existe como comando ou alias!`)
      addDynamicAlias(value, target)
      return reply(`✅ Alias adicionado!\n\n${p}${value} → ${p}${target}\n\n_Já pode usar: ${p}${value}_`)
    }

    // ── Remover alias ────────────────────────────────────
    if (sub === 'remove' || sub === 'remover' || sub === 'del') {
      if (!target) return reply(`❌ Uso: !alias remove <alias>`)
      const all = getDynamicAliases()
      if (!all[target]) return reply(`❌ Alias *${target}* não encontrado.`)
      removeDynamicAlias(target)
      return reply(`✅ Alias *${p}${target}* removido!`)
    }

    // ── Listar aliases de um comando ─────────────────────
    if (sub === 'list' || sub === 'ver') {
      if (!target) return reply(`❌ Uso: !alias list <cmd>`)
      const cmd = getCommand(target)
      if (!cmd) return reply(`❌ Comando *!${target}* não encontrado.`)
      const list = listAliasesForCommand(target)
      if (!list.length) return reply(`📋 *!${target}* não tem aliases.`)
      let txt = `📋 *Aliases de !${target}:*\n\n`
      list.forEach(({ alias, type }) => {
        txt += `  • ${p}${alias} ${type === 'dinâmico' ? '_(dinâmico)_' : '_(estático)_'}\n`
      })
      return reply(txt)
    }

    // ── Renomear alias ────────────────────────────────────
    if (sub === 'rename' || sub === 'renomear') {
      if (!target || !value) return reply(`❌ Uso: !alias rename <alias_antigo> <alias_novo>`)
      const all = getDynamicAliases()
      if (!all[target]) return reply(`❌ Alias *${target}* não encontrado.`)
      const cmd = all[target]
      removeDynamicAlias(target)
      addDynamicAlias(value, cmd)
      return reply(`✅ *${p}${target}* renomeado para *${p}${value}*!`)
    }

    return reply(
      `⚙️ *Gerenciador de Aliases*\n\n` +
      `${p}alias add <cmd> <alias>   — Adiciona alias\n` +
      `${p}alias remove <alias>      — Remove alias\n` +
      `${p}alias list <cmd>          — Aliases de um comando\n` +
      `${p}alias listall             — Todos os aliases dinâmicos\n` +
      `${p}alias rename <old> <new>  — Renomeia alias\n\n` +
      `_Aliases dinâmicos são salvos no banco e persistem entre reinicializações._`
    )
  }
}
