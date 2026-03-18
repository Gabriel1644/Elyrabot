// ══════════════════════════════════════════════════════════
//  menu.js — Sistema de menus completo com fotos
// ══════════════════════════════════════════════════════════
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { commandMap }   from '../../loader.js'
import { CONFIG }       from '../../config.js'
import { statsDB, groupsDB, menuTargetDB } from '../../database.js'
import { ROLES, getRole } from '../../permissions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '../../..')
const MIDIAS    = path.join(ROOT, 'midias')

// ── Estilo ────────────────────────────────────────────────
function bold(t)   { return `*${t}*` }
function italic(t) { return `_${t}_` }

// ── Stats ─────────────────────────────────────────────────
function totalCmds() { return commandMap.size }
function totalMsgs() {
  const n = statsDB.get('total', {})?.msgs || 0
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

// ── Bordes ────────────────────────────────────────────────
function buildTop(nomeBot, m) {
  if (m?.borderTop?.trim()) return m.borderTop
  const nm = m?.negrito ? `*${nomeBot}*` : nomeBot
  return `┏━━━⪩ ${nm} ⪨━━━┓`
}
function buildBot(m) {
  if (m?.borderBot?.trim()) return m.borderBot
  return '┗━━━━━━━━━━━━━━━━━━┛'
}
function getSide(m) { return m?.borderSide || '│' }

// ── Extras do menuTarget ──────────────────────────────────
function appendExtras(txt, menuId, SID, ITM, LST, p, m) {
  const all    = menuTargetDB.all()
  const extras = Object.entries(all)
    .filter(([, menus]) => Array.isArray(menus) && menus.includes(menuId))
    .map(([name]) => commandMap.get(name))
    .filter(Boolean)
  if (!extras.length) return txt
  txt += `${SID} ✦ ${bold('EXTRAS')}\n`
  extras.forEach((cmd, i) => {
    const pfx = i === extras.length - 1 ? LST : ITM
    txt += `${SID} ${pfx} ${p}${cmd.name}`
    if (m?.mostrarDescricao && cmd.description) txt += ` — _${cmd.description}_`
    txt += '\n'
  })
  return txt + `${SID}\n`
}

// ── Envia menu com mídia ──────────────────────────────────
async function sendWithMedia(sock, from, msg, caption, gdata = {}, mediaOverrides = []) {
  const m   = CONFIG.menu || {}
  const gFoto = m.botFoto

  // Lista de candidatos de mídia (local primeiro, depois URL)
  const candidatos = [
    ...(mediaOverrides || []),
    gdata.menuFoto,
    ...mediaOverrides,
    gFoto ? null : null,
  ].filter(Boolean)

  for (const mp of candidatos) {
    if (!mp) continue
    // URL remota
    if (mp.startsWith('http')) {
      try {
        await sock.sendMessage(from, { image: { url: mp }, caption }, { quoted: msg })
        return
      } catch {}
      continue
    }
    // Arquivo local
    if (!fs.existsSync(mp)) continue
    try {
      const isVideo = /\.(mp4|gif)$/i.test(mp)
      const buf     = fs.readFileSync(mp)
      await sock.sendMessage(from, {
        [isVideo ? 'video' : 'image']: buf,
        caption,
        gifPlayback: /\.gif$/i.test(mp),
        mimetype:    isVideo ? 'video/mp4' : 'image/jpeg',
      }, { quoted: msg })
      return
    } catch {}
  }
  // Fallback texto
  await sock.sendMessage(from, { text: caption }, { quoted: msg })
}


// ── Helper: retorna a mídia padrão do menu (1 imagem para todos) ─
function getMenuMedia(gdata = {}) {
  const m = CONFIG.menu || {}
  return [
    gdata.menuFoto,
    m.botFoto,
    path.join(MIDIAS, 'menu.mp4'),
    path.join(MIDIAS, 'menu.gif'),
    path.join(MIDIAS, 'menu.jpg'),
    path.join(MIDIAS, 'menu.jpeg'),
    path.join(MIDIAS, 'menu.png'),
  ].filter(Boolean)
}

// ── buildSubMenu genérico com extras ──────────────────────
function buildSubMenu(titulo, sections, prefix, menuId = null) {
  const m   = CONFIG.menu || {}
  const p   = prefix
  const SID = getSide(m)
  const ITM = m.itemPrefix || '├'
  const LST = m.subPrefix  || '└'
  const TOP = buildTop(titulo, m)
  const BOT = buildBot(m)

  let txt = `${TOP}\n${SID}\n`

  for (const { nome: secNome, cmds } of sections) {
    if (!cmds?.length) continue
    txt += `${SID} ✦ ${bold(secNome)}\n`
    cmds.forEach((cmd, i) => {
      const pfx = i === cmds.length - 1 ? LST : ITM
      txt += `${SID} ${pfx} ${p}${cmd.name}`
      if (m.mostrarDescricao && cmd.description) txt += ` — _${cmd.description}_`
      txt += '\n'
    })
    txt += `${SID}\n`
  }

  if (menuId) txt = appendExtras(txt, menuId, SID, ITM, LST, p, m)
  txt += `${BOT}`
  return txt
}

// ── Pega comandos de uma categoria ────────────────────────
function getCat(catName) {
  const result = []
  for (const cmd of commandMap.values()) {
    if (cmd.category === catName) result.push(cmd)
  }
  return result
}

// ── Menu principal ────────────────────────────────────────
export function buildMenu(categoria = null, prefix = CONFIG.prefixo) {
  const m       = CONFIG.menu || {}
  const p       = prefix
  const nomeBot = m.botNomeDisplay || CONFIG.nome
  const SID     = getSide(m)
  const ITM     = m.itemPrefix || '├'
  const LST     = m.subPrefix  || '└'

  if (categoria) {
    const catKey = categoria === 'dono' ? 'owner' : categoria
    const cmds   = getCat(catKey)
    if (!cmds.length) return `❌ Categoria *${catKey}* não encontrada.`
    const TOP = buildTop(catKey.toUpperCase(), m)
    const BOT = buildBot(m)
    let txt = `${TOP}\n${SID}\n`
    cmds.forEach((cmd, i) => {
      const pfx = i === cmds.length - 1 ? LST : ITM
      txt += `${SID} ${pfx} ${p}${cmd.name}`
      if (m.mostrarDescricao && cmd.description) txt += ` — _${cmd.description}_`
      txt += '\n'
    })
    txt += `${SID}\n${BOT}`
    return txt
  }

  const menuLines = m.menuLines || [
    { label: '!menubn'          },
    { label: '!menugold'        },
    { label: '!menudown'        },
    { label: '!menujogos'       },
    { label: '!menudono'        },
    { label: '!menuutils'       },
    { label: '!menufig'         },
    { label: '!menuadm'         },
    { label: '!menumemb'        },
  ]

  const TOP    = buildTop(nomeBot, m)
  const BOT    = buildBot(m)
  const footer = (m.footerTexto || 'Powered by DevSquad').replace('{prefix}', p)
  const last   = menuLines.length - 1

  let txt = `${TOP}\n${SID}\n`
  txt += `${SID} 📊 ${bold('Estatísticas')}\n`
  txt += `${SID} ${ITM} Comandos: ${bold(String(totalCmds()))}\n`
  txt += `${SID} ${LST} Mensagens: ${bold(totalMsgs())}\n`
  txt += `${SID}\n`
  txt += `${SID} ✦ ${bold('MENUS')}\n`
  menuLines.forEach((line, i) => {
    const pfx = i === last ? LST : ITM
    const lbl = line.label?.startsWith('!') ? line.label : `${p}${line.label}`
    txt += `${SID} ${pfx} ${lbl}\n`
  })
  txt += `${SID}\n${BOT}\n\n${italic('- ' + footer)}`
  return txt
}

// ══════════════════════════════════════════════════════════
//  COMANDOS
// ══════════════════════════════════════════════════════════

// !menu
export const menuCmd = {
  name: 'menu',
  aliases: ['help', 'ajuda', 'start', 'h'],
  description: 'Menu principal do bot',
  category: 'core', usage: '!menu [categoria]', cooldown: 5,
  async execute({ reply, sock, from, msg, args, prefix, isOwner, isAdmin, isSubdono, userId, isGrupo }) {
    const cat      = args[0]?.toLowerCase()
    const userRole = getRole(userId)
    if (cat === 'admin' && !isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas administradores.')
    if ((cat === 'owner' || cat === 'dono') && userRole > ROLES.SUBDONO) return reply('❌ Apenas dono ou sub-dono.')
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const texto = buildMenu(cat || null, prefix)
    if (cat) return reply(texto)
    // Com mídia
    const mediaList = [
      gdata.menuFoto,
      path.join(MIDIAS, 'menu.mp4'),
      path.join(MIDIAS, 'menu.gif'),
      path.join(MIDIAS, 'menu.jpg'),
      path.join(MIDIAS, 'menu.jpeg'),
      path.join(MIDIAS, 'menu.png'),
    ].filter(Boolean)
    await sendWithMedia(sock, from, msg, texto, gdata, mediaList)
  }
}

// !menubn — Brincadeiras: tapa, beijo, social
export const menuBnCmd = {
  name: 'menubn',
  aliases: ['menubrinc', 'menubrincadeiras', 'mbn'],
  description: 'Brincadeiras: tapa, beijo, social',
  category: 'core', usage: '!menubn', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const sections = [
      { nome: 'SOCIAL', cmds: getCat('fun').filter(c => ['tapa','beijo','abraco','carinho','chute','morder','casamento','status','amor'].some(k => c.name.includes(k) || c.aliases?.some(a => a.includes(k)))) },
      { nome: 'BRINCADEIRAS', cmds: getCat('fun').filter(c => !['tapa','beijo','abraco','carinho','chute','morder','casamento','status','amor'].some(k => c.name.includes(k) || c.aliases?.some(a => a.includes(k)))) },
    ].filter(s => s.cmds.length)
    // Fallback se filtros não funcionarem
    if (!sections.length || sections.every(s => !s.cmds.length)) {
      const allFun = getCat('fun')
      if (allFun.length) sections.push({ nome: 'DIVERSÃO', cmds: allFun })
    }
    const txt = buildSubMenu('BRINCADEIRAS', sections, prefix, 'menubn')
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menugold / !menuvip — RPG
export const menuGoldCmd = {
  name: 'menugold',
  aliases: ['menuvip', 'menurpg', 'mgold', 'mvip'],
  description: 'Comandos RPG e Gold/VIP',
  category: 'core', usage: '!menugold', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, userId, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const sections = [
      { nome: 'RPG', cmds: getCat('rpg') },
      { nome: 'GOLD / VIP', cmds: [] }, // extras via menuTarget
    ].filter(s => s.cmds.length)
    const txt = buildSubMenu('💎 GOLD / RPG', sections.length ? sections : [{ nome: 'RPG', cmds: getCat('rpg') }], prefix, 'menugold')
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menudown — Downloads
export const menuDownCmd = {
  name: 'menudown',
  aliases: ['menudownload', 'mdown'],
  description: 'Comandos de download',
  category: 'core', usage: '!menudown', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const m     = CONFIG.menu || {}
    const SID   = getSide(m), ITM = m.itemPrefix||'├', LST = m.subPrefix||'└', p = prefix
    const TOP   = buildTop('DOWNLOADS', m), BOT = buildBot(m)
    const cmds  = [
      { n:'ytmp3',d:'YouTube → MP3'},{ n:'ytmp4',d:'YouTube → MP4'},
      { n:'ytinfo',d:'Info YouTube'},{ n:'tiktok',d:'TikTok'},
      { n:'instagram',d:'Instagram'},{ n:'twitter',d:'Twitter/X'},
      { n:'pinterest',d:'Pinterest (carrossel)'},{ n:'gif',d:'GIF'},
    ]
    let txt = `${TOP}\n${SID}\n${SID} ✦ ${bold('DOWNLOAD')}\n`
    cmds.forEach((c,i)=>{ txt+=`${SID} ${i===cmds.length-1?LST:ITM} ${p}${c.n} — _${c.d}_\n` })
    txt+=`${SID}\n`
    txt = appendExtras(txt, 'menudown', SID, ITM, LST, p, m)
    txt+=`${BOT}`
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menujogos — Jogos
export const menuJogosCmd = {
  name: 'menujogos',
  aliases: ['menugames', 'mjogos'],
  description: 'Comandos de jogos',
  category: 'core', usage: '!menujogos', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const sections = [
      { nome: 'JOGOS', cmds: getCat('fun').filter(c => ['trivia','forca','roleta','adivinhar','vod','contador','8ball','jokempo','dado','moeda'].some(k => c.name.includes(k))) },
    ].filter(s => s.cmds.length)
    if (!sections[0]?.cmds.length) sections[0] = { nome: 'JOGOS', cmds: getCat('fun') }
    const txt = buildSubMenu('🎮 JOGOS', sections, prefix, 'menujogos')
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menudono — Comandos do dono (os "apelões")
export const menuDonoCmd = {
  name: 'menudono',
  aliases: ['menuowner', 'mensd', 'mdono'],
  description: 'Comandos exclusivos do dono',
  category: 'core', usage: '!menudono', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isOwner, isSubdono, isGrupo }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const sections = [
      { nome: 'CONTROLE', cmds: getCat('owner') },
    ]
    const txt = buildSubMenu('👑 DONO', sections, prefix, 'menudono')
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menuutils — Utilidades
export const menuUtilsCmd = {
  name: 'menuutils',
  aliases: ['menutools', 'mutils'],
  description: 'Comandos úteis: clima, hora, lembrete…',
  category: 'core', usage: '!menuutils', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const m     = CONFIG.menu || {}
    const SID   = getSide(m), ITM = m.itemPrefix||'├', LST = m.subPrefix||'└', p = prefix
    const TOP   = buildTop('UTILIDADES', m), BOT = buildBot(m)
    const infoC = getCat('info')
    const toolC = getCat('tools')
    let txt = `${TOP}\n${SID}\n`
    if (infoC.length) {
      txt += `${SID} ✦ ${bold('INFORMAÇÃO')}\n`
      infoC.forEach((c,i)=>{ txt+=`${SID} ${i===infoC.length-1?LST:ITM} ${p}${c.name}${m.mostrarDescricao&&c.description?` — _${c.description}_`:''}\n` })
      txt+=`${SID}\n`
    }
    if (toolC.length) {
      txt += `${SID} ✦ ${bold('FERRAMENTAS')}\n`
      toolC.forEach((c,i)=>{ txt+=`${SID} ${i===toolC.length-1?LST:ITM} ${p}${c.name}${m.mostrarDescricao&&c.description?` — _${c.description}_`:''}\n` })
      txt+=`${SID}\n`
    }
    txt = appendExtras(txt, 'menuutils', SID, ITM, LST, p, m)
    txt+=`${BOT}`
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menufig — Imagens e Vídeos (figurinhas, downloads de mídia, busca)
export const menuFigCmd = {
  name: 'menufig',
  aliases: ['menusticker', 'menumedia', 'mfig'],
  description: 'Imagens, vídeos e figurinhas',
  category: 'core', usage: '!menufig', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const m     = CONFIG.menu || {}
    const SID   = getSide(m), ITM = m.itemPrefix||'├', LST = m.subPrefix||'└', p = prefix
    const TOP   = buildTop('IMAGENS & MÍDIA', m), BOT = buildBot(m)
    const sec1  = [{n:'fig',d:'Imagem/vídeo → figurinha'},{n:'figanimatada',d:'GIF/vídeo → animada'},{n:'figurl',d:'URL → figurinha'},{n:'toimg',d:'Figurinha → imagem'}]
    const sec2  = getCat('media').filter(c => !['fig','toimg','figurl','figanimatada'].includes(c.name))
    let txt = `${TOP}\n${SID}\n${SID} ✦ ${bold('FIGURINHAS')}\n`
    sec1.forEach((c,i)=>{ txt+=`${SID} ${i===sec1.length-1?LST:ITM} ${p}${c.n} — _${c.d}_\n` })
    txt+=`${SID}\n`
    if (sec2.length) {
      txt += `${SID} ✦ ${bold('MÍDIA')}\n`
      sec2.forEach((c,i)=>{ txt+=`${SID} ${i===sec2.length-1?LST:ITM} ${p}${c.name}${m.mostrarDescricao&&c.description?` — _${c.description}_`:''}\n` })
      txt+=`${SID}\n`
    }
    txt = appendExtras(txt, 'menufig', SID, ITM, LST, p, m)
    txt+=`${BOT}`
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menuadm — Admin: mutar, banir, adicionar, promover
export const menuAdmCmd = {
  name: 'menuadm',
  aliases: ['menuadmin', 'cmdadm'],
  description: 'Comandos de administração de grupo',
  category: 'core', usage: '!menuadm', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isAdmin, isOwner, isSubdono, isGrupo }) {
    if (!isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas administradores.')
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const sections = [{ nome: 'ADMINISTRAÇÃO', cmds: getCat('admin') }]
    const txt = buildSubMenu('⭐ ADMIN', sections, prefix, 'menuadm')
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menumemb — Atividade, Leveling, Menção
export const menuMembCmd = {
  name: 'menumemb',
  aliases: ['menumembro', 'mmemb'],
  description: 'Atividade, leveling e menção',
  category: 'core', usage: '!menumemb', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const m     = CONFIG.menu || {}
    const SID   = getSide(m), ITM = m.itemPrefix||'├', LST = m.subPrefix||'└', p = prefix
    const TOP   = buildTop('MEMBROS', m), BOT = buildBot(m)
    let txt = `${TOP}\n${SID}\n`
    txt += `${SID} ✦ ${bold('ATIVIDADE')}\n`
    txt += `${SID} ${ITM} ${p}rankativo\n`
    txt += `${SID} ${ITM} ${p}rankinativo\n`
    txt += `${SID} ${LST} ${p}checkativo\n`
    txt += `${SID}\n`
    txt += `${SID} ✦ ${bold('LEVELING')}\n`
    txt += `${SID} ${ITM} ${p}level [@user]\n`
    txt += `${SID} ${LST} ${p}ranklevel\n`
    txt += `${SID}\n`
    txt += `${SID} ✦ ${bold('MENÇÃO')}\n`
    txt += `${SID} ${LST} ${p}mention <modo>\n`
    txt += `${SID}\n`
    txt = appendExtras(txt, 'menumemb', SID, ITM, LST, p, m)
    txt += `${BOT}`
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menuia — Inteligência Artificial
export const menuIaCmd = {
  name: 'menuia',
  aliases: ['menuai', 'mia'],
  description: 'Comandos de IA',
  category: 'core', usage: '!menuia', cooldown: 5,
  async execute({ reply, sock, from, msg, prefix, isGrupo }) {
    const gdata = isGrupo ? groupsDB.get(from, {}) : {}
    const m     = CONFIG.menu || {}
    const SID   = getSide(m), ITM = m.itemPrefix||'├', LST = m.subPrefix||'└', p = prefix
    const TOP   = buildTop('INTELIGÊNCIA ARTIFICIAL', m), BOT = buildBot(m)
    const cmds  = [{n:'ia',d:'Conversa com IA'},{n:'agente',d:'Agente autônomo'},{n:'resumo',d:'Resumir texto'},{n:'corrigir',d:'Corrigir texto'},{n:'traduzir',d:'Traduzir'},{n:'piada',d:'Piada com IA'}]
    let txt = `${TOP}\n${SID}\n${SID} ✦ ${bold('IA')}\n`
    cmds.forEach((c,i)=>{ txt+=`${SID} ${i===cmds.length-1?LST:ITM} ${p}${c.n} — _${c.d}_\n` })
    txt+=`${SID}\n`
    txt = appendExtras(txt, 'menuia', SID, ITM, LST, p, m)
    txt+=`${BOT}`
    const mediaList = getMenuMedia(gdata)
    await sendWithMedia(sock, from, msg, txt, gdata, mediaList)
  }
}

// !menuall — Todos os comandos
export const menuAllCmd = {
  name: 'menuall',
  aliases: ['menutudo', 'mtudo'],
  description: 'Todos os comandos',
  category: 'core', usage: '!menuall', cooldown: 10,
  async execute({ reply, prefix, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const cats = ['core','fun','rpg','media','info','tools','admin','owner','misc']
    const sections = cats.map(c => ({ nome: c.toUpperCase(), cmds: getCat(c) })).filter(s => s.cmds.length)
    await reply(buildSubMenu('📋 TODOS OS COMANDOS', sections, prefix, 'menuall'))
  }
}

// Comandos de personalização de menu por grupo
export const setMenuMidiaCmd = {
  name: 'setmenumidia',
  aliases: ['setmenufoto'],
  description: 'Define a foto do menu neste grupo (só dono/sub-dono)',
  category: 'owner', usage: '!setmenumidia — Responda uma imagem/vídeo', cooldown: 5,
  async execute({ sock, msg, from, reply, isOwner, isSubdono, isGrupo }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono podem definir a foto do menu.')
    const inner  = msg.message
    const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasImg = inner?.imageMessage || quoted?.imageMessage
    const hasVid = inner?.videoMessage || quoted?.videoMessage
    if (!hasImg && !hasVid) return reply('❌ Responda uma *imagem* ou *vídeo*!')
    try {
      const tipo = hasImg ? 'image' : 'video'
      const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
      const mediaMsg = hasImg ? (inner?.imageMessage || quoted?.imageMessage) : (inner?.videoMessage || quoted?.videoMessage)
      const stream = await downloadContentFromMessage(mediaMsg, tipo)
      const chunks = []; for await (const c of stream) chunks.push(c)
      const buf  = Buffer.concat(chunks)
      const ext  = hasImg ? 'jpg' : 'mp4'
      const dir  = path.join(ROOT, 'data', 'group_medias')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const fp   = path.join(dir, `${from.split('@')[0]}.${ext}`)
      fs.writeFileSync(fp, buf)
      const gd = groupsDB.get(from, {})
      gd.menuFoto = fp
      groupsDB.set(from, gd)
      reply('✅ Foto do menu definida para este grupo!')
    } catch (e) { reply(`❌ Erro: ${e.message}`) }
  }
}

export const setMenuNomeCmd = {
  name: 'setmenunome',
  aliases: ['setbotnome'],
  description: 'Define o nome do bot neste grupo',
  category: 'admin', usage: '!setmenunome <nome>', cooldown: 5,
  async execute({ reply, args, from, isAdmin, isOwner, isSubdono, isGrupo }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas administradores.')
    const nome = args.join(' ').trim()
    if (!nome) return reply('❌ Informe o nome!')
    const gd = groupsDB.get(from, {}); gd.menuNome = nome; groupsDB.set(from, gd)
    reply(`✅ Nome do bot neste grupo: *${nome}*`)
  }
}

export const resetMenuGrupoCmd = {
  name: 'resetmenugrupo',
  aliases: ['resetgroupmenu'],
  description: 'Reseta personalizações do menu deste grupo',
  category: 'admin', usage: '!resetmenugrupo', cooldown: 5,
  async execute({ reply, from, isAdmin, isOwner, isSubdono, isGrupo }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner && !isSubdono) return reply('❌ Apenas administradores.')
    const gd = groupsDB.get(from, {})
    delete gd.menuFoto; delete gd.menuNome
    groupsDB.set(from, gd)
    reply('✅ Personalizações do menu resetadas!')
  }
}

export default [
  menuCmd, menuBnCmd, menuGoldCmd, menuDownCmd, menuJogosCmd,
  menuDonoCmd, menuUtilsCmd, menuFigCmd, menuAdmCmd, menuMembCmd,
  menuIaCmd, menuAllCmd,
  setMenuMidiaCmd, setMenuNomeCmd, resetMenuGrupoCmd
]
