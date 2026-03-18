// ═══════════════════════════════════════════════════════════════════
// extra.js — Zilhões de Comandos de Diversão e Utilidade
// ═══════════════════════════════════════════════════════════════════

import { statsDB } from '../../database.js'

export const ship = {
  name: 'ship',
  aliases: ['casal', 'love'],
  description: 'Calcula o amor entre duas pessoas',
  category: 'fun',
  async execute({ reply, args, usuario }) {
    if (!args[0]) return reply('❌ Mencione alguém ou digite um nome!')
    const p1 = usuario
    const p2 = args[0].replace('@', '')
    const love = Math.floor(Math.random() * 101)
    
    let msg = `❤️ *LOVE CALCULATOR* ❤️\n\n`
    msg += `👤 ${p1}\n`
    msg += `👤 ${p2}\n\n`
    msg += `💘 *Compatibilidade:* ${love}%\n`
    
    if (love > 80) msg += '💍 *Casal perfeito! Já podem casar!*'
    else if (love > 50) msg += '🔥 *Tem química, hein?*'
    else if (love > 20) msg += '😐 *Talvez como amigos...*'
    else msg += '💔 *Melhor nem tentar.*'
    
    reply(msg)
  }
}

export const gay = {
  name: 'gay',
  aliases: ['gaymeter'],
  description: 'Calcula o nível de gay de alguém',
  category: 'fun',
  async execute({ reply, args, usuario }) {
    const target = args[0] ? args[0].replace('@', '') : usuario
    const level = Math.floor(Math.random() * 101)
    reply(`🌈 *GAYMETER* 🌈\n\n👤 *Alvo:* ${target}\n🏳️‍🌈 *Nível:* ${level}%`)
  }
}

export const gado = {
  name: 'gado',
  description: 'Calcula o nível de gado de alguém',
  category: 'fun',
  async execute({ reply, args, usuario }) {
    const target = args[0] ? args[0].replace('@', '') : usuario
    const level = Math.floor(Math.random() * 101)
    reply(`🐂 *GADÔMETRO* 🐂\n\n👤 *Alvo:* ${target}\n🌾 *Nível:* ${level}%`)
  }
}

export const tapa = {
  name: 'tapa',
  description: 'Dê um tapa em alguém',
  category: 'fun',
  async execute({ reply, args, usuario }) {
    if (!args[0]) return reply('❌ Mencione alguém para dar um tapa!')
    const target = args[0].replace('@', '')
    reply(`🖐️ *${usuario}* deu um tapa bem dado em *${target}*! 💥`)
  }
}

export const beijar = {
  name: 'beijar',
  aliases: ['kiss'],
  description: 'Dê um beijo em alguém',
  category: 'fun',
  async execute({ reply, args, usuario }) {
    if (!args[0]) return reply('❌ Mencione alguém para beijar!')
    const target = args[0].replace('@', '')
    reply(`💋 *${usuario}* deu um beijo carinhoso em *${target}*! ❤️`)
  }
}

export const abraçar = {
  name: 'abraçar',
  aliases: ['hug'],
  description: 'Dê um abraço em alguém',
  category: 'fun',
  async execute({ reply, args, usuario }) {
    if (!args[0]) return reply('❌ Mencione alguém para abraçar!')
    const target = args[0].replace('@', '')
    reply(`🫂 *${usuario}* deu um abraço apertado em *${target}*! ✨`)
  }
}

export const sorte = {
  name: 'sorte',
  description: 'Veja sua sorte de hoje',
  category: 'fun',
  async execute({ reply, usuario }) {
    const sortes = [
      '🍀 Hoje é seu dia de sorte!',
      '💰 Você encontrará dinheiro no chão.',
      '❤️ Um novo amor está por vir.',
      '⚠️ Cuidado ao atravessar a rua.',
      '🌟 Grandes oportunidades aparecerão.',
      '🍕 Alguém vai te pagar uma pizza.',
      '😴 Melhor ficar na cama hoje.',
      '🌈 O final do arco-íris está perto.'
    ]
    const s = sortes[Math.floor(Math.random() * sortes.length)]
    reply(`🔮 *PREVISÃO DO DIA* 🔮\n\n👤 *Aventureiro:* ${usuario}\n📜 *Sorte:* ${s}`)
  }
}

export const dado = {
  name: 'dado',
  aliases: ['dice'],
  description: 'Joga um dado de 6 lados',
  category: 'fun',
  async execute({ reply }) {
    const d = Math.floor(Math.random() * 6) + 1
    const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    reply(`🎲 *DADO* 🎲\n\nVocê jogou o dado e caiu: ${emojis[d-1]} *(${d})*`)
  }
}

export const piada = {
  name: 'piada',
  description: 'Conta uma piada aleatória',
  category: 'fun',
  async execute({ reply }) {
    const piadas = [
      'Por que o livro de matemática se suicidou? Porque tinha muitos problemas.',
      'O que o pato disse para a pata? Vem Quá!',
      'Por que o jacaré tirou o filho da escola? Porque ele "ré-ptil".',
      'Qual é o doce preferido do átomo? O pé-de-molécula.',
      'O que o zero disse para o oito? Belo cinto!',
      'Por que o pinheiro não se perde na floresta? Porque ele tem um "mapinha".'
    ]
    const p = piadas[Math.floor(Math.random() * piadas.length)]
    reply(`😂 *PIADA DO DIA* 😂\n\n${p}`)
  }
}

export const frase = {
  name: 'frase',
  description: 'Uma frase motivacional',
  category: 'fun',
  async execute({ reply }) {
    const frases = [
      'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
      'Acredite em você e o resto virá naturalmente.',
      'Não espere por oportunidades, crie-as.',
      'Sua única limitação é você mesmo.',
      'Grandes coisas nunca vêm de zonas de conforto.'
    ]
    const f = frases[Math.floor(Math.random() * frases.length)]
    reply(`💡 *MOTIVAÇÃO* 💡\n\n"${f}"`)
  }
}

export const coinflip = {
  name: 'coinflip',
  aliases: ['caraoucoroa'],
  description: 'Joga uma moeda',
  category: 'fun',
  async execute({ reply }) {
    const res = Math.random() > 0.5 ? 'CARA' : 'COROA'
    reply(`🪙 *MOEDA* 🪙\n\nResultado: *${res}*!`)
  }
}

export const rps = {
  name: 'rps',
  aliases: ['ppt', 'pedrapapeltesoura'],
  description: 'Joga Pedra, Papel ou Tesoura',
  category: 'fun',
  async execute({ reply, args }) {
    const choices = ['pedra', 'papel', 'tesoura']
    const user = args[0]?.toLowerCase()
    if (!choices.includes(user)) return reply('❌ Escolha: pedra, papel ou tesoura!')
    
    const bot = choices[Math.floor(Math.random() * 3)]
    let res = ''
    
    if (user === bot) res = 'Empate! 🤝'
    else if (
      (user === 'pedra' && bot === 'tesoura') ||
      (user === 'papel' && bot === 'pedra') ||
      (user === 'tesoura' && bot === 'papel')
    ) res = 'Você venceu! 🎉'
    else res = 'Eu venci! 🤖'
    
    reply(`🎮 *PEDRA, PAPEL OU TESOURA* 🎮\n\n👤 Você: *${user}*\n🤖 Eu: *${bot}*\n\n*${res}*`)
  }
}

export const uptime = {
  name: 'uptime',
  description: 'Tempo de atividade do bot',
  category: 'info',
  async execute({ reply }) {
    const uptime = process.uptime()
    const h = Math.floor(uptime / 3600)
    const m = Math.floor((uptime % 3600) / 60)
    const s = Math.floor(uptime % 60)
    reply(`🕒 *UPTIME* 🕒\n\nEstou online há: *${h}h ${m}m ${s}s*`)
  }
}

export const ping = {
  name: 'ping',
  description: 'Verifica a latência do bot',
  category: 'info',
  async execute({ reply }) {
    const start = Date.now()
    await reply('🏓 Pong!')
    const end = Date.now()
    reply(`🏓 *PONG!* Latência: *${end - start}ms*`)
  }
}

export const fake = {
  name: 'fake',
  description: 'Cria uma mensagem fake de alguém',
  category: 'fun',
  async execute({ reply, args, sock, from, msg }) {
    if (!args[0]) return reply('❌ Mencione alguém e digite o texto!')
    const target = args[0].replace('@', '') + '@s.whatsapp.net'
    const text = args.slice(1).join(' ')
    if (!text) return reply('❌ Digite o texto da mensagem!')
    
    await sock.sendMessage(from, { text }, { quoted: { key: { remoteJid: from, fromMe: false, id: 'FAKE', participant: target }, message: { conversation: '...' } } })
  }
}

export const iq = {
  name: 'iq',
  description: 'Calcula seu QI',
  category: 'fun',
  async execute({ reply, usuario }) {
    const iq = Math.floor(Math.random() * 200)
    reply(`🧠 *TESTE DE QI* 🧠\n\n👤 *Usuário:* ${usuario}\n💡 *Seu QI é:* ${iq}`)
  }
}

export const dancar = {
  name: 'dancar',
  aliases: ['dance'],
  description: 'Começa a dançar',
  category: 'fun',
  async execute({ reply, usuario }) {
    reply(`💃 *${usuario}* está dançando muito! 🕺\n\n┏(･o･)┛\n┗(･o･)┓\n┏(･o･)┛\n┗(･o･)┓`)
  }
}

export const xingar = {
  name: 'xingar',
  description: 'Xinga alguém aleatoriamente',
  category: 'fun',
  async execute({ reply, args, usuario }) {
    if (!args[0]) return reply('❌ Mencione alguém para xingar!')
    const xingamentos = ['Cabeça de guidão', 'Pé de chinelo', 'Arrombado', 'Lixo', 'Inútil', 'Pau no cu', 'Corno', 'Filho de uma quenga']
    const x = xingamentos[Math.floor(Math.random() * xingamentos.length)]
    reply(`🤬 *${usuario}* xingou *${args[0]}* de: *${x}*!`)
  }
}

export default [ship, gay, gado, tapa, beijar, abraçar, sorte, frase, coinflip, rps, uptime, ping, fake, iq, dancar, xingar]
