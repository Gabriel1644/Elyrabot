// ══════════════════════════════════════════════════════════
//  design.js — Sistema de Design / Temas do Menu
//  Temas prontos + comandos de customização rápida
// ══════════════════════════════════════════════════════════
import { CONFIG } from '../../config.js'

// ── Temas prontos ─────────────────────────────────────────
const TEMAS = {
  default: {
    nome: '⚙️ Default',
    borderTop:   '╭',
    borderBot:   '╰',
    borderSide:  '│',
    separator:   '─',
    itemPrefix:  '┣',
    subPrefix:   '┃ └',
    headerExtra: '',
    footerExtra: '',
    headerTexto: 'MENU DE COMANDOS',
    negrito: true, italico: false,
  },
  redline: {
    nome: '🏎️ Redline',
    borderTop:   '╭════════════════════╮',
    borderBot:   '╰════════════════════╯',
    borderSide:  '│',
    separator:   '═',
    itemPrefix:  '🛞',
    subPrefix:   '  ✧',
    headerExtra: '│ REDLINE // RACE CONTROL │\n│ Velocidade é poder.       │',
    footerExtra: '',
    headerTexto: '☽ COMANDOS',
    negrito: true, italico: false,
  },
  neon: {
    nome: '🌌 Neon',
    borderTop:   '┌─────────────────────┐',
    borderBot:   '└─────────────────────┘',
    borderSide:  '│',
    separator:   '·',
    itemPrefix:  '⟡',
    subPrefix:   '  ↳',
    headerExtra: '',
    footerExtra: '',
    headerTexto: '✦ NEON SYSTEM ✦',
    negrito: true, italico: true,
  },
  minimal: {
    nome: '🤍 Minimal',
    borderTop:   '▸',
    borderBot:   '◂',
    borderSide:  '›',
    separator:   ' ',
    itemPrefix:  '•',
    subPrefix:   '  ·',
    headerExtra: '',
    footerExtra: '',
    headerTexto: 'COMANDOS',
    negrito: false, italico: false,
  },
  stars: {
    nome: '⭐ Stars',
    borderTop:   '✦═══════════════════✦',
    borderBot:   '✦═══════════════════✦',
    borderSide:  '✦',
    separator:   '═',
    itemPrefix:  '⋆',
    subPrefix:   '  ✩',
    headerExtra: '',
    footerExtra: '',
    headerTexto: '★ MENU ESTELAR ★',
    negrito: true, italico: false,
  },
  sakura: {
    nome: '🌸 Sakura',
    borderTop:   '╭🌸━━━━━━━━━━━━━━━🌸╮',
    borderBot:   '╰🌸━━━━━━━━━━━━━━━🌸╯',
    borderSide:  '🌸',
    separator:   '━',
    itemPrefix:  '🌺',
    subPrefix:   '  🌹',
    headerExtra: '',
    footerExtra: '',
    headerTexto: '✿ MENU SAKURA ✿',
    negrito: true, italico: true,
  },
  hacker: {
    nome: '💚 Hacker',
    borderTop:   '┌[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]┐',
    borderBot:   '└[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]┘',
    borderSide:  '|',
    separator:   '▓',
    itemPrefix:  '>>',
    subPrefix:   '  |__',
    headerExtra: '',
    footerExtra: '',
    headerTexto: 'SYS://COMMANDS',
    negrito: true, italico: false,
  },
  royal: {
    nome: '👑 Royal',
    borderTop:   '┌─꧁𓆩𓆪꧂─────────────┐',
    borderBot:   '└─────────────꧁𓆩𓆪꧂─┘',
    borderSide:  '│',
    separator:   '─',
    itemPrefix:  '◈',
    subPrefix:   '  └◉',
    headerExtra: '',
    footerExtra: '',
    headerTexto: '♛ ROYAL COMMANDS ♛',
    negrito: true, italico: false,
  },
}

function applyTheme(tema) {
  const t = TEMAS[tema]
  if (!t) return false
  const menu = { ...CONFIG.menu, ...t }
  delete menu.nome
  CONFIG.menu = menu
  return true
}

function temaAtual() {
  const m = CONFIG.menu || {}
  // Detecta tema pelo borderTop
  for (const [k, t] of Object.entries(TEMAS)) {
    if (k === 'default') continue
    if (m.borderTop === t.borderTop && m.borderBot === t.borderBot) return k
  }
  return 'personalizado'
}

// ── !design ────────────────────────────────────────────────
export const designCmd = {
  name: 'design',
  aliases: ['tema', 'theme', 'estilo'],
  description: 'Gerencia o design/tema do menu',
  category: 'core',
  usage: '!design [tema | list | preview <tema>]',
  cooldown: 3,
  async execute({ reply, args, isOwner, isSubdono, prefix: p }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const sub = args[0]?.toLowerCase()

    if (!sub || sub === 'list' || sub === 'listar') {
      const atual = temaAtual()
      let txt = `🎨 *Temas Disponíveis*\n\n`
      txt += `📌 Tema atual: *${atual}*\n\n`
      for (const [k, t] of Object.entries(TEMAS)) {
        txt += `${t.nome} — ${p}design ${k}\n`
      }
      txt += `\n_Use ${p}design preview <tema> para visualizar_`
      txt += `\n_Use ${p}design <nome> para aplicar_`
      return reply(txt)
    }

    if (sub === 'preview') {
      const nomeTema = args[1]?.toLowerCase()
      const t = TEMAS[nomeTema]
      if (!t) return reply(`❌ Tema *${nomeTema}* não encontrado.\n\nTemas: ${Object.keys(TEMAS).join(', ')}`)
      const prev = gerarPreview(t, CONFIG.nome || 'Bot', p)
      return reply(`🎨 *Preview — ${t.nome}*\n\n${prev}`)
    }

    // Aplicar tema
    const ok = applyTheme(sub)
    if (!ok) return reply(`❌ Tema *${sub}* não encontrado.\n\nTemas: ${Object.keys(TEMAS).join(', ')}`)
    return reply(`✅ Tema *${TEMAS[sub].nome}* aplicado!\n\n${gerarPreview(TEMAS[sub], CONFIG.nome || 'Bot', p)}`)
  }
}

function gerarPreview(t, nomeBot, p = '!') {
  const TOP  = t.borderTop
  const BOT  = t.borderBot
  const SID  = t.borderSide
  const SEP  = (t.separator || '─').repeat(20)
  const ITM  = t.itemPrefix
  const nm   = t.negrito ? `*${nomeBot}*` : nomeBot
  const hdr  = t.negrito ? `*${t.headerTexto}*` : t.headerTexto

  let txt = `${TOP}\n`
  if (t.headerExtra) txt += `${t.headerExtra}\n`
  txt += `${SID}\n`
  txt += `${SID}  🤖 ${nm}\n`
  txt += `${SID}  ${hdr}\n`
  txt += `${SID}\n`
  txt += `${SID}  ${ITM} ${p}menu fun\n`
  txt += `${SID}  ${ITM} ${p}menu admin\n`
  txt += `${SID}  ${ITM} ${p}menu ia\n`
  txt += `${SID}\n`
  txt += `${BOT}`
  return txt
}

// ── !setborda / !setbordafim / !setbordameio etc. ──────────
export const setborda = {
  name: 'setborda',
  description: 'Altera a borda superior do menu',
  category: 'core',
  usage: '!setborda <texto>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!argStr) return reply('❌ Informe o novo valor! Ex: !setborda ╭══════════╮')
    const menu = { ...CONFIG.menu, borderTop: argStr }
    CONFIG.menu = menu
    reply(`✅ Borda superior atualizada:\n${argStr}`)
  }
}

export const setbordafim = {
  name: 'setbordafim',
  aliases: ['setbordainf', 'setbordabaixo'],
  description: 'Altera a borda inferior do menu',
  category: 'core',
  usage: '!setbordafim <texto>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!argStr) return reply('❌ Informe o novo valor!')
    CONFIG.menu = { ...CONFIG.menu, borderBot: argStr }
    reply(`✅ Borda inferior atualizada:\n${argStr}`)
  }
}

export const setbordameio = {
  name: 'setbordameio',
  aliases: ['setlado', 'setlateral'],
  description: 'Altera a borda lateral do menu',
  category: 'core',
  usage: '!setbordameio <caractere>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!argStr) return reply('❌ Informe o novo valor!')
    CONFIG.menu = { ...CONFIG.menu, borderSide: argStr }
    reply(`✅ Borda lateral atualizada: ${argStr}`)
  }
}

export const setitem = {
  name: 'setitem',
  description: 'Altera o ícone dos itens do menu',
  category: 'core',
  usage: '!setitem <emoji>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!argStr) return reply('❌ Informe o ícone!')
    CONFIG.menu = { ...CONFIG.menu, itemPrefix: argStr }
    reply(`✅ Ícone de item atualizado: ${argStr}`)
  }
}

export const setseparador = {
  name: 'setseparador',
  description: 'Altera o caractere separador do menu',
  category: 'core',
  usage: '!setseparador <caractere>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!argStr) return reply('❌ Informe o caractere!')
    CONFIG.menu = { ...CONFIG.menu, separator: argStr }
    reply(`✅ Separador atualizado: ${argStr}`)
  }
}

export const settitulo = {
  name: 'settitulo',
  aliases: ['setheader', 'settitle'],
  description: 'Altera o texto do título/header do menu',
  category: 'core',
  usage: '!settitulo <texto>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!argStr) return reply('❌ Informe o texto!')
    CONFIG.menu = { ...CONFIG.menu, headerTexto: argStr }
    reply(`✅ Título do menu: *${argStr}*`)
  }
}

export const setfooter = {
  name: 'setfooter',
  aliases: ['setrodape'],
  description: 'Altera o rodapé do menu',
  category: 'core',
  usage: '!setfooter <texto>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    if (!argStr) return reply('❌ Informe o texto!')
    CONFIG.menu = { ...CONFIG.menu, footerTexto: argStr }
    reply(`✅ Rodapé do menu atualizado!`)
  }
}

export const resetdesign = {
  name: 'resetdesign',
  aliases: ['resetmenu', 'resetestilo'],
  description: 'Reseta o design do menu para o padrão',
  category: 'core',
  usage: '!resetdesign',
  cooldown: 3,
  async execute({ reply, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    applyTheme('default')
    reply('✅ Design resetado para o padrão!')
  }
}

export const verdesign = {
  name: 'verdesign',
  aliases: ['verdesign', 'designatual', 'showdesign'],
  description: 'Mostra as configurações atuais do design',
  category: 'core',
  usage: '!verdesign',
  cooldown: 3,
  async execute({ reply, prefix: p, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const m = CONFIG.menu || {}
    const atual = temaAtual()
    reply(
      `🎨 *Design Atual — ${atual}*\n\n` +
      `╭─────── CONFIGURAÇÕES ───────╮\n` +
      `│ 🔸 Borda Sup: ${m.borderTop || '╭'}\n` +
      `│ 🔸 Borda Inf: ${m.borderBot || '╰'}\n` +
      `│ 🔸 Lateral:   ${m.borderSide || '│'}\n` +
      `│ 🔸 Separador: ${m.separator || '─'}\n` +
      `│ 🔸 Item:      ${m.itemPrefix || '┣'}\n` +
      `│ 🔸 Sub-item:  ${m.subPrefix || '┃ └'}\n` +
      `│ 🔸 Título:    ${m.headerTexto || 'MENU'}\n` +
      `│ 🔸 Footer:    ${m.footerTexto || 'Use {prefix}menu'}\n` +
      `│ 🔸 Negrito:   ${m.negrito ? '✅' : '❌'}\n` +
      `│ 🔸 Itálico:   ${m.italico ? '✅' : '❌'}\n` +
      `╰──────────────────────────────╯\n\n` +
      `_Temas prontos: ${p}design list_\n` +
      `_Customizar: ${p}setborda, ${p}setitem, etc._`
    )
  }
}

export default [
  designCmd, setborda, setbordafim, setbordameio,
  setitem, setseparador, settitulo, setfooter,
  resetdesign, verdesign
]
