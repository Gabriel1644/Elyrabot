// ═══════════════════════════════════════════════════════════════════
// rpg.js — Sistema RPG Profissional v2.0
// ═══════════════════════════════════════════════════════════════════

import { rpgDB, statsDB } from '../../database.js'

const CD = {
  MINE:      15 * 60 * 1000,
  WORK:      30 * 60 * 1000,
  FISH:      12 * 60 * 1000,
  EXPLORE:   15 * 60 * 1000,
  HUNT:      20 * 60 * 1000,
};

const CLASSES = {
  guerreiro: { emoji:'⚔️',  name:'Guerreiro', atk:25, def:10, passiva:'Fúria — +30% dano em duelos' },
  mago:      { emoji:'🧙',  name:'Mago',      atk:15, def:5,  passiva:'Arcano — +25% EXP em todas as ações' },
  arqueiro:  { emoji:'🏹',  name:'Arqueiro',  atk:20, def:8,  passiva:'Precisão — +20% crítico em caça' },
  ladino:    { emoji:'🗡️', name:'Ladino',    atk:18, def:8,  passiva:'Sombra — +25% sucesso em crimes' },
  paladino:  { emoji:'🛡️', name:'Paladino',  atk:12, def:30, passiva:'Proteção — -25% dano recebido' },
};

const MONSTROS = [
  { nome: 'Goblin',      emoji: '👺', hp: 50,  atk: 10, xp: 30, gold: 20 },
  { nome: 'Lobo',        emoji: '🐺', hp: 80,  atk: 15, xp: 50, gold: 35 },
  { nome: 'Esqueleto',   emoji: '💀', hp: 100, atk: 20, xp: 80, gold: 50 },
  { nome: 'Orc',         emoji: '👹', hp: 150, atk: 30, xp: 150, gold: 100 },
  { nome: 'Dragão',      emoji: '🐉', hp: 500, atk: 80, xp: 1000, gold: 500 },
];

function getP(userId) {
  let p = rpgDB.get(userId)
  if (!p) return null
  // Garantir campos básicos
  p.cooldowns = p.cooldowns || {}
  p.inventario = p.inventario || []
  return p
}

function saveP(userId, p) {
  rpgDB.set(userId, p)
}

function checkCD(p, type) {
  const now = Date.now()
  const last = p.cooldowns[type] || 0
  if (now - last < CD[type]) {
    return Math.ceil((CD[type] - (now - last)) / 1000)
  }
  return 0
}

// ──────────────── COMANDOS ────────────────

export const ficha = {
  name: 'ficha',
  aliases: ['rpg', 'perfil'],
  description: 'Mostra seu perfil no RPG',
  category: 'rpg',
  async execute({ reply, userId, usuario, args }) {
    if (args[0] === 'criar') {
      if (getP(userId)) return reply('❌ Você já tem um personagem!')
      const classe = args[1]?.toLowerCase() || 'guerreiro'
      if (!CLASSES[classe]) return reply(`❌ Classe inválida! Escolha: ${Object.keys(CLASSES).join(', ')}`)
      
      const p = {
        nome: usuario,
        classe: classe,
        nivel: 1,
        xp: 0,
        xpProx: 100,
        hp: 100,
        hpMax: 100,
        gold: 100,
        atk: CLASSES[classe].atk,
        def: CLASSES[classe].def,
        inventario: [],
        cooldowns: {},
        vitorias: 0
      }
      saveP(userId, p)
      return reply(`✨ *Personagem criado!* Bem-vindo(a), ${usuario} o ${CLASSES[classe].name}!`)
    }

    const p = getP(userId)
    if (!p) return reply('❌ Você não tem um personagem! Use *!ficha criar <classe>*')

    const progress = Math.floor((p.xp / p.xpProx) * 10)
    const bar = '▰'.repeat(progress) + '▱'.repeat(10 - progress)

    reply(`👤 *PERFIL DE AVENTUREIRO*
    
    *Nome:* ${p.nome}
    *Classe:* ${CLASSES[p.classe].emoji} ${CLASSES[p.classe].name}
    *Nível:* ${p.nivel}
    *XP:* [${bar}] ${p.xp}/${p.xpProx}
    
    ❤️ *HP:* ${p.hp}/${p.hpMax}
    ⚔️ *ATK:* ${p.atk} | 🛡️ *DEF:* ${p.def}
    💰 *Gold:* ${p.gold}
    🏆 *Vitórias:* ${p.vitorias}
    
    _Use !ajuda rpg para ver os comandos de ação!_`)
  }
}

export const minerar = {
  name: 'minerar',
  aliases: ['mine'],
  description: 'Trabalhe nas minas para ganhar gold e XP',
  category: 'rpg',
  async execute({ reply, userId }) {
    const p = getP(userId)
    if (!p) return reply('❌ Crie sua ficha primeiro!')
    
    const cd = checkCD(p, 'MINE')
    if (cd) return reply(`⏳ Você está cansado! Aguarde ${cd}s para minerar novamente.`)
    
    const gold = Math.floor(Math.random() * 50) + 20
    const xp = Math.floor(Math.random() * 30) + 10
    
    p.gold += gold
    p.xp += xp
    p.cooldowns.MINE = Date.now()
    
    let msg = `⛏️ *MINERAÇÃO*\n\nVocê encontrou minérios valiosos!\n💰 +${gold} Gold\n✨ +${xp} XP`
    
    if (p.xp >= p.xpProx) {
      p.nivel++
      p.xp = 0
      p.xpProx = Math.floor(p.xpProx * 1.5)
      p.hpMax += 20
      p.hp = p.hpMax
      p.atk += 5
      p.def += 2
      msg += `\n\n🌟 *LEVEL UP!* Você alcançou o nível ${p.nivel}!`
    }
    
    saveP(userId, p)
    reply(msg)
  }
}

export const caçar = {
  name: 'caçar',
  aliases: ['hunt'],
  description: 'Cace monstros para ganhar recompensas',
  category: 'rpg',
  async execute({ reply, userId }) {
    const p = getP(userId)
    if (!p) return reply('❌ Crie sua ficha primeiro!')
    
    const cd = checkCD(p, 'HUNT')
    if (cd) return reply(`⏳ Aguarde ${cd}s para caçar novamente.`)
    
    const m = MONSTROS[Math.floor(Math.random() * MONSTROS.length)]
    let log = `⚔️ *CAÇADA: ${p.nome} vs ${m.emoji} ${m.nome}*\n\n`
    
    const danoM = Math.max(5, m.atk - p.def)
    const danoP = Math.max(10, p.atk)
    
    p.hp -= danoM
    if (p.hp <= 0) {
      p.hp = 10
      p.gold = Math.max(0, p.gold - 50)
      p.cooldowns.HUNT = Date.now()
      saveP(userId, p)
      return reply(log + `💀 Você foi derrotado pelo ${m.nome} e perdeu 50 gold!`)
    }
    
    p.gold += m.gold
    p.xp += m.xp
    p.vitorias++
    p.cooldowns.HUNT = Date.now()
    
    log += `✅ Você derrotou o ${m.nome}!\n❤️ HP Restante: ${p.hp}\n💰 +${m.gold} Gold\n✨ +${m.xp} XP`
    
    saveP(userId, p)
    reply(log)
  }
}

export const curar = {
  name: 'curar',
  description: 'Recupere seu HP usando gold',
  category: 'rpg',
  async execute({ reply, userId }) {
    const p = getP(userId)
    if (!p) return reply('❌ Crie sua ficha primeiro!')
    
    if (p.hp >= p.hpMax) return reply('❤️ Seu HP já está cheio!')
    
    const custo = 50
    if (p.gold < custo) return reply(`❌ Você precisa de ${custo} gold para se curar!`)
    
    p.gold -= custo
    p.hp = p.hpMax
    saveP(userId, p)
    reply(`🏨 Você descansou na taverna e recuperou todo seu HP!\n💰 Custo: ${custo} Gold`)
  }
}

export default [ficha, minerar, caçar, curar]
