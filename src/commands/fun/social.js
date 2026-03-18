// ══════════════════════════════════════════════════════════
//  social.js — Interações sociais e RP no grupo
// ══════════════════════════════════════════════════════════

const ACOES = {
  abracar:  { emoji: '🤗', verb: 'abraçou',   msg: (a,b) => `${a} deu um abraço quentinho em ${b}! 🤗` },
  beijo:    { emoji: '💋', verb: 'beijou',    msg: (a,b) => `${a} deu um beijo em ${b}! 💋` },
  tapa:     { emoji: '👋', verb: 'tapou',     msg: (a,b) => `${a} deu um tapa em ${b}! 👋` },
  socar:    { emoji: '👊', verb: 'socou',     msg: (a,b) => `${a} socou ${b}! 👊 *AU!*` },
  oi:       { emoji: '👋', verb: 'acenou',    msg: (a,b) => `${a} acenou para ${b}! 👋 Oi!` },
  morder:   { emoji: '😬', verb: 'mordeu',    msg: (a,b) => `${a} mordeu ${b}! 😬` },
  cafune:   { emoji: '💆', verb: 'fez cafuné em', msg: (a,b) => `${a} fez cafuné em ${b}! 💆‍♀️` },
  cutucar:  { emoji: '👉', verb: 'cutucou',   msg: (a,b) => `${a} cutucou ${b}! 👉` },
  chute:    { emoji: '🦵', verb: 'chutou',    msg: (a,b) => `${a} chutou ${b}! 🦵` },
  flor:     { emoji: '🌸', verb: 'deu flor para', msg: (a,b) => `${a} deu flores para ${b}! 🌸` },
}

function makeAcao(name, data) {
  return {
    name,
    aliases: [data.emoji],
    description: `${data.verb.charAt(0).toUpperCase() + data.verb.slice(1)} alguém`,
    category: 'fun',
    usage: `!${name} @alguem`,
    cooldown: 3,
    async execute({ reply, sock, from, msg, args, usuario, membros }) {
      let alvo = args[0]?.replace('@', '')
      if (!alvo) {
        // Escolhe membro aleatório do grupo
        const outros = (membros || []).filter(m => !m.id.includes('bot'))
        if (outros.length) alvo = outros[Math.floor(Math.random() * outros.length)].id.split('@')[0]
        else return reply(`❌ Mencione alguém! Ex: !${name} @pessoa`)
      }
      await reply(data.msg(`*${usuario}*`, `@${alvo}`))
    }
  }
}

// Cria todos os comandos de ação social
export const abracar  = makeAcao('abracar',  ACOES.abracar)
export const beijocmd = makeAcao('beijar',   ACOES.beijo)
export const tapacmd  = makeAcao('tapa',     ACOES.tapa)
export const socar    = makeAcao('socar',    ACOES.socar)
export const oicmd    = makeAcao('acenar',   ACOES.oi)
export const morder   = makeAcao('morder',   ACOES.morder)
export const cafune    = makeAcao('cafune',   ACOES.cafune)
export const cutucar  = makeAcao('cutucar',  ACOES.cutucar)
export const chute    = makeAcao('chutar',   ACOES.chute)
export const florcmd  = makeAcao('flor',     ACOES.flor)

// ── !perfil ───────────────────────────────────────────────
export const perfil = {
  name: 'perfil',
  aliases: ['profile', 'card'],
  description: 'Mostra o perfil/card de um membro',
  category: 'fun',
  usage: '!perfil [@alguem]',
  cooldown: 5,
  async execute({ reply, sock, from, msg, args, usuario, userId, membros, isGrupo }) {
    let jid = userId
    let nome = usuario

    if (args[0]) {
      const num = args[0].replace(/[^0-9]/g, '')
      if (num) {
        jid  = `${num}@s.whatsapp.net`
        const membro = (membros || []).find(m => m.id.includes(num))
        nome = membro ? (membro.name || num) : num
      }
    }

    const num    = jid.split('@')[0].split(':')[0]
    const isAdm  = (membros || []).find(m => m.id.includes(num))?.admin
    const cargo  = isAdm ? (isAdm === 'superadmin' ? '👑 Dono do grupo' : '⭐ Admin') : '👤 Membro'

    await reply(
      `╭────────────────────╮\n` +
      `│  👤 *${nome}*\n` +
      `│\n` +
      `│  📱 Número: +${num}\n` +
      `│  ${cargo}\n` +
      `│  🌍 ${isGrupo ? 'Grupo' : 'Privado'}\n` +
      `╰────────────────────╯`
    )
  }
}

// ── !casamento ────────────────────────────────────────────
const casamentos = new Map() // userId → {partner, data}
export const casar = {
  name: 'casar',
  aliases: ['marry', 'noivado'],
  description: 'Casa com alguém no grupo',
  category: 'fun',
  usage: '!casar @alguem',
  cooldown: 10,
  async execute({ reply, args, usuario, userId }) {
    if (!args[0]) return reply('❌ Mencione com quem quer casar!')
    if (casamentos.has(userId)) {
      const c = casamentos.get(userId)
      return reply(`💍 Você já é casado(a) com *@${c.partner}* desde ${c.data}!\n\nUse !divorcio para separar.`)
    }
    const alvo = args[0].replace(/[^0-9]/g, '')
    casamentos.set(userId, { partner: alvo, data: new Date().toLocaleDateString('pt-BR') })
    await reply(`💒 *${usuario}* se casou com *@${alvo}*!\n\n💍 Parabéns ao casal! 🎊`)
  }
}

export const divorcio = {
  name: 'divorcio',
  aliases: ['separar', 'divorce'],
  description: 'Cancela casamento',
  category: 'fun',
  usage: '!divorcio',
  cooldown: 10,
  async execute({ reply, usuario, userId }) {
    if (!casamentos.has(userId)) return reply('❌ Você não está casado(a).')
    const c = casamentos.get(userId)
    casamentos.delete(userId)
    await reply(`💔 *${usuario}* se divorciou de @${c.partner}...`)
  }
}

// ── !xp / ranking social ──────────────────────────────────
export const xp = {
  name: 'xp',
  aliases: ['nivel', 'level', 'exp'],
  description: 'Mostra seu nível de atividade no grupo',
  category: 'fun',
  usage: '!xp',
  cooldown: 10,
  async execute({ reply, userId, usuario }) {
    // XP simulado baseado no hash do userId para ser consistente
    let hash = 0
    for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) | 0
    const xp    = Math.abs(hash % 9000) + 100
    const nivel = Math.floor(xp / 500) + 1
    const prox  = nivel * 500
    const barra = '█'.repeat(Math.floor((xp % 500) / 50)) + '░'.repeat(10 - Math.floor((xp % 500) / 50))

    await reply(
      `⚡ *Perfil de ${usuario}*\n\n` +
      `🏆 Nível: *${nivel}*\n` +
      `✨ XP: *${xp} / ${prox}*\n\n` +
      `[${barra}]\n\n` +
      `_Continue interagindo para subir de nível!_`
    )
  }
}

export default [abracar, beijocmd, tapacmd, socar, oicmd, morder, cafune, cutucar, chute, florcmd, perfil, casar, divorcio, xp]
