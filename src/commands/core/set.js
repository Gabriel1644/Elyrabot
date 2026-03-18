import { CONFIG } from '../../config.js'
import { loadCommands, toggleCommand } from '../../loader.js'
import { groupsDB } from '../../database.js'

export default {
  name: 'set',
  aliases: ['config', 'cfg', 'configurar'],
  description: 'Configura o bot',
  category: 'core',
  usage: '!set <opção> <valor>',
  cooldown: 2,
  async execute({ args, reply, isOwner, isAdmin, from, isGrupo }) {
    const [opcao, ...resto] = args
    const valor = resto.join(' ')

    if (!opcao) return reply(
`╭─── ⚙️ *CONFIGURAÇÕES* ───╮
│
│ *Globais (só dono):*
│ !set prefixo <símbolo>
│ !set nome <nome>
│ !set personalidade <texto>
│ !set modelo <modelo groq>
│ !set antispam on/off
│ !set recarregar
│ !set cmd <nome> on/off
│
│ *Menu (só dono/subdono):*
│ !set menu.header <texto>
│ !set menu.footer <texto>
│ !set menu.foto <url>
│ !set menu.negrito on/off
│ !set menu.italico on/off
│ !set menu.icone <cat> <emoji>
│ !set menu.nome <cat> <texto>
│
│ *Design Rápido:*
│ !design <tema>  (ver: !design list)
│ !setborda, !setbordafim
│ !setbordameio, !setitem
│ !setseparador, !settitulo
│ !verdesign, !resetdesign
│
│ *Grupo (admins):*
│ !set ia on/off
│ !set antilink on/off
│ !set bemvindo on/off
│ !set welcome <mensagem>
│
╰──────────────────────────╯`
    )

    // ── Configurações de grupo ─────────────────────────────
    if (isGrupo && (isAdmin || isOwner)) {
      const gd = groupsDB.get(from, {})
      const grupoOps = { ia: 'iaAtiva', antilink: 'antilink', bemvindo: 'bemvindo', antifake: 'antifake' }
      if (grupoOps[opcao] !== undefined) {
        gd[grupoOps[opcao]] = valor === 'on'
        groupsDB.set(from, gd)
        return reply(`✅ *${opcao}* ${valor === 'on' ? 'ativado' : 'desativado'} neste grupo!`)
      }
      if (opcao === 'welcome') {
        gd.welcomeMsg = valor
        groupsDB.set(from, gd)
        return reply(`✅ Mensagem de boas-vindas definida!\nUse {nome} para mencionar o usuário.`)
      }
    }

    // ── Globais — só dono ──────────────────────────────────
    if (!isOwner) return reply('❌ Apenas o dono pode alterar configurações globais.')

    if (opcao === 'prefixo' || opcao === 'prefix') {
      CONFIG.prefixo = valor.charAt(0)
      return reply(`✅ Prefixo: *${CONFIG.prefixo}*`)
    }
    if (opcao === 'nome') { CONFIG.nome = valor; return reply(`✅ Nome: *${valor}*`) }
    if (opcao === 'personalidade') { CONFIG.personalidade = valor; return reply(`✅ Personalidade atualizada!`) }
    if (opcao === 'modelo') { CONFIG.modelo = valor; return reply(`✅ Modelo IA: *${valor}*`) }
    if (opcao === 'antispam') { CONFIG.antiSpam = valor === 'on'; return reply(`✅ Anti-spam ${valor === 'on' ? 'ativado' : 'desativado'}!`) }
    if (opcao === 'recarregar') {
      const t = await loadCommands()
      return reply(`♻️ *${t} comandos recarregados!*`)
    }
    if (opcao === 'cmd') {
      const [nome, estado] = valor.split(' ')
      toggleCommand(nome, estado === 'on')
      return reply(`✅ *!${nome}* ${estado === 'on' ? 'ativado' : 'desativado'}!`)
    }

    // ── Menu ────────────────────────────────────────────────
    if (opcao.startsWith('menu.')) {
      const sub = opcao.slice(5)
      const menu = { ...CONFIG.menu }
      const map = {
        header: 'headerTexto', footer: 'footerTexto', foto: 'botFoto',
        botnome: 'botNomeDisplay', top: 'borderTop', bot: 'borderBot',
        lado: 'borderSide', sep: 'separator', item: 'itemPrefix', sub2: 'subPrefix',
      }
      if (sub === 'negrito' || sub === 'italico' || sub === 'descricao') {
        const k = sub === 'descricao' ? 'mostrarDescricao' : sub
        menu[k] = valor === 'on'
        CONFIG.menu = menu
        return reply(`✅ Menu.${sub} ${valor === 'on' ? 'ativado' : 'desativado'}!`)
      }
      if (sub === 'icone') {
        const [cat, ...emojiParts] = valor.split(' ')
        const emoji = emojiParts.join(' ')
        menu.icons = { ...menu.icons, [cat]: emoji }
        CONFIG.menu = menu
        return reply(`✅ Ícone de *${cat}* → ${emoji}`)
      }
      if (sub === 'nome') {
        const [cat, ...nomeParts] = valor.split(' ')
        menu.nomes = { ...menu.nomes, [cat]: nomeParts.join(' ').toUpperCase() }
        CONFIG.menu = menu
        return reply(`✅ Nome de *${cat}* → ${nomeParts.join(' ').toUpperCase()}`)
      }
      if (map[sub]) {
        menu[map[sub]] = valor
        CONFIG.menu = menu
        return reply(`✅ Menu.${sub} = *${valor}*`)
      }
    }

    return reply(`❌ Opção desconhecida: *${opcao}*\nUse *!set* para ver as opções.`)
  }
}
