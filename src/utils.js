import { CONFIG, C } from './config.js'
import { commandMap } from './loader.js'
import { statsDB } from './database.js'

export const CAT_EMOJI = {
  core:  '⚙️',
  fun:   '🎉',
  rpg:   '⚔️',
  media: '🎬',
  info:  '🔍',
  admin: '🛡️',
  misc:  '✨',
  ia:    '🤖',
  owner: '👑'
}

export const CAT_NOME = {
  core:  'SISTEMA',
  fun:   'DIVERSÃO',
  rpg:   'RPG',
  media: 'MÍDIA',
  info:  'INFORMAÇÃO',
  admin: 'ADMINISTRAÇÃO',
  misc:  'EXTRAS',
  ia:    'INTELIGÊNCIA ARTIFICIAL',
  owner: 'DONO'
}

export function getMenuTexto(categoria = null, prefix = CONFIG.prefixo) {
  const p = prefix
  const categorias = {}

  for (const cmd of commandMap.values()) {
    const cat = cmd.category || 'misc'
    if (!categorias[cat]) categorias[cat] = []
    categorias[cat].push(cmd)
  }

  if (categoria) {
    const cmds = categorias[categoria]
    if (!cmds) return `❌ Categoria *${categoria}* não encontrada.`
    
    const emoji = CAT_EMOJI[categoria] || '✨'
    const nome  = CAT_NOME[categoria]  || categoria.toUpperCase()
    
    let menu = `╭─── ${emoji} *${nome}* ───╮\n│\n`
    for (const cmd of cmds) {
      menu += `│ ┣ ${p}${cmd.name}\n`
      if (cmd.description) menu += `│ ┃ └ _${cmd.description}_\n`
    }
    menu += `│\n╰────────────────────╯`
    return menu
  }

  let menu = ''
  if (CONFIG.bannerMenu) {
    menu += `✦ *${CONFIG.nome}* ✦\n\n`
  }
  menu += `╭─────────────────────────╮\n│  🤖 *${CONFIG.nome}* — Menu v${CONFIG.versao}  │\n╰─────────────────────────╯\n\n`

  const ordem = ['core', 'fun', 'rpg', 'media', 'info', 'ia', 'misc']
  for (const cat of ordem) {
    const cmds = categorias[cat]
    if (!cmds) continue
    const emoji = CAT_EMOJI[cat] || '✨'
    const nome  = CAT_NOME[cat]  || cat.toUpperCase()
    menu += `${emoji} *${nome}*\n`
    menu += `  └ _${p}menu ${cat}_ (${cmds.length} cmds)\n\n`
  }

  const total = statsDB.get('total', {})
  menu += `╭─────────────────────╮\n│ 📊 ${total.msgs || 0} msgs processadas │\n│ 🔑 Prefixo: *${p}*           │\n╰─────────────────────╯`

  return menu
}

export function getMenuCompleto(prefix = CONFIG.prefixo) {
  const p = prefix
  const categorias = {}

  for (const cmd of commandMap.values()) {
    const cat = cmd.category || 'misc'
    if (!categorias[cat]) categorias[cat] = []
    categorias[cat].push(cmd)
  }

  let menu = ''
  if (CONFIG.bannerMenu) {
    menu += `✦ *${CONFIG.nome}* ✦\n\n`
  }
  menu += `╭─────────────────────────╮\n│  🤖 *${CONFIG.nome}* — Lista Completa  │\n╰─────────────────────────╯\n\n`

  const ordem = ['core', 'fun', 'rpg', 'media', 'info', 'ia', 'misc']
  for (const cat of ordem) {
    const cmds = categorias[cat]
    if (!cmds) continue
    const emoji = CAT_EMOJI[cat] || '✨'
    const nome  = CAT_NOME[cat]  || cat.toUpperCase()
    
    menu += `${emoji} *${nome}*\n`
    for (const cmd of cmds) {
      menu += `  ┣ ${p}${cmd.name}\n`
    }
    menu += '\n'
  }

  const total = statsDB.get('total', {})
  menu += `╭─────────────────────╮\n│ 📊 ${total.msgs || 0} msgs processadas │\n│ 🔑 Prefixo: *${p}*           │\n╰─────────────────────╯`

  return menu
}

export function getUptime() {
  const ms = process.uptime() * 1000
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  return `${h}h ${m}m ${s}s`
}

export function formatNumber(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

// Extrai JIDs de menções em uma mensagem
export function getMentionedJids(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
}

// Retorna texto da mensagem (suporta quoted)
export function getMessageText(msg) {
  const m = msg?.message
  if (!m) return ''
  
  // Extrai texto de mensagens interativas (botões novos)
  let interactiveText = ''
  if (m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const params = JSON.parse(m.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
      interactiveText = params.id || params.selected_id || ''
    } catch {
      interactiveText = m.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson
    }
  }

  return (
    m.conversation                            ||
    m.extendedTextMessage?.text               ||
    m.imageMessage?.caption                   ||
    m.videoMessage?.caption                   ||
    m.documentMessage?.caption                ||
    m.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    interactiveText                           ||
    m.ephemeralMessage?.message?.conversation ||
    m.viewOnceMessage?.message?.imageMessage?.caption ||
    m.viewOnceMessage?.message?.videoMessage?.caption ||
    ''
  )
}

// Retorna o tipo de mídia da mensagem
export function getMediaType(msg) {
  const m = msg.message
  if (!m) return null
  if (m.imageMessage)   return 'image'
  if (m.videoMessage)   return 'video'
  if (m.audioMessage)   return 'audio'
  if (m.stickerMessage) return 'sticker'
  if (m.documentMessage) return 'document'
  return null
}

// Banner do terminal
export function printBanner() {
  console.clear()
  const line = `${C.gray}${'═'.repeat(62)}${C.reset}`
  console.log(line)
  console.log(`${C.cyan}${C.bold}`)
  console.log(`   ███████╗██╗  ██╗   ██╗██████╗  █████╗  ██████╗`)
  console.log(`   ██╔════╝██║  ╚██╗ ██╔╝██╔══██╗██╔══██╗ ╚════██╗`)
  console.log(`   █████╗  ██║   ╚████╔╝ ██████╔╝███████║  █████╔╝`)
  console.log(`   ██╔══╝  ██║    ╚██╔╝  ██╔══██╗██╔══██║ ██╔═══╝`)
  console.log(`   ███████╗███████╗██║   ██║  ██║██║  ██║ ███████╗`)
  console.log(`   ╚══════╝╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══════╝`)
  console.log(`${C.reset}`)
  console.log(`${C.gray}         ✦  WhatsApp Bot  —  v2.0.0  —  Termux  ✦${C.reset}`)
  console.log(line)
  console.log(`  ${C.silver}Powered by ${C.cyan}${C.bold}Groq AI${C.reset}  ${C.gray}│${C.reset}  ${C.silver}Dashboard: ${C.green}http://localhost:${CONFIG.dashboardPort}${C.reset}`)
  console.log(line)
  console.log()
}

let _pulse = null
export function startPulse(nome) {
  const f = ['◉', '◎', '○', '◎']
  let i = 0
  _pulse = setInterval(() => {
    const t = new Date().toLocaleTimeString('pt-BR')
    process.stdout.write(`\r  ${C.green}${f[i++ % 4]}${C.reset}  ${C.white}${C.bold}${nome}${C.reset} ${C.green}ONLINE${C.reset}   ${C.gray}${t}${C.reset}   `)
  }, 400)
}
export function stopPulse() {
  if (_pulse) { clearInterval(_pulse); _pulse = null; process.stdout.write('\n') }
}
