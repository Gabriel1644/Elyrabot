// ══════════════════════════════════════════════════════════
//  utils_extra.js — Comandos utilitários extras
// ══════════════════════════════════════════════════════════
import axios from 'axios'

// ── .ascii — converte texto em arte ASCII ────────────────
export const asciiArt = {
  name: 'ascii',
  aliases: ['arte', 'letras'],
  description: 'Cria arte ASCII com o texto',
  category: 'fun',
  usage: '.ascii <texto>',
  cooldown: 5,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .ascii Kaius')
    if (argStr.length > 20) return reply('❌ Máximo 20 caracteres!')
    try {
      const { data } = await axios.get(`https://artii.herokuapp.com/make?text=${encodeURIComponent(argStr)}&font=big`, { timeout: 8000 })
      await reply('```\n' + data.slice(0, 1000) + '\n```')
    } catch {
      // Fallback: simples mas funciona offline
      const chars = argStr.toUpperCase().split('')
      await reply('```\n' + chars.join(' ') + '\n' + chars.map(() => '▓').join(' ') + '\n```')
    }
  }
}

// ── .binario — texto ↔ binário ────────────────────────────
export const binario = {
  name: 'binario',
  aliases: ['binary', 'bin'],
  description: 'Converte texto para binário e vice-versa',
  category: 'fun',
  usage: '.binario <texto>  ou  .binario 01001000',
  cooldown: 3,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .binario Oi\n.binario 01001111 01101001')
    const isBin = /^[01\s]+$/.test(argStr) && argStr.includes(' ')
    if (isBin) {
      const text = argStr.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('')
      await reply(`📟 *Binário → Texto:*\n\`${text}\``)
    } else {
      const bin = argStr.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
      await reply(`💻 *Texto → Binário:*\n\`\`\`${bin}\`\`\``)
    }
  }
}

// ── .hex — texto ↔ hexadecimal ───────────────────────────
export const hexCmd = {
  name: 'hex',
  aliases: ['hexadecimal'],
  description: 'Converte texto para hex e vice-versa',
  category: 'fun',
  cooldown: 3,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .hex Oi')
    const isHex = /^[0-9a-fA-F\s]+$/.test(argStr) && argStr.includes(' ')
    if (isHex) {
      const text = argStr.trim().split(/\s+/).map(h => String.fromCharCode(parseInt(h, 16))).join('')
      await reply(`🔢 *Hex → Texto:* \`${text}\``)
    } else {
      const hex = argStr.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
      await reply(`🔢 *Texto → Hex:*\n\`\`\`${hex}\`\`\``)
    }
  }
}

// ── .timestamp — data/hora atual ou converter ─────────────
export const timestampCmd = {
  name: 'timestamp',
  aliases: ['ts', 'epoch', 'unixtime'],
  description: 'Mostra timestamp atual ou converte',
  category: 'info',
  cooldown: 3,
  async execute({ reply, args }) {
    const agora = Date.now()
    if (!args[0]) {
      const d = new Date(agora)
      await reply(
        `🕐 *Timestamp Atual*\n\n` +
        `Unix: \`${Math.floor(agora/1000)}\`\n` +
        `Ms:   \`${agora}\`\n` +
        `UTC:  ${d.toUTCString()}\n` +
        `BR:   ${d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
      )
      return
    }
    const ts = parseInt(args[0])
    if (!isNaN(ts)) {
      const d = new Date(ts < 1e10 ? ts * 1000 : ts)
      await reply(`📅 ${d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    }
  }
}

// ── .palindromo — verifica se é palíndromo ───────────────
export const palindromo = {
  name: 'palindromo',
  aliases: ['palindrome'],
  description: 'Verifica se uma palavra é palíndromo',
  category: 'fun',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .palindromo arara')
    const limpo = argStr.toLowerCase().replace(/[^a-záàâãéêíóôõúü]/g, '')
    const rev = limpo.split('').reverse().join('')
    const eh = limpo === rev
    await reply(
      `${eh ? '✅' : '❌'} *"${argStr}"*\n` +
      `${eh ? '🪞 É um palíndromo!' : `Reverso: "${argStr.split('').reverse().join('')}"`}`
    )
  }
}

// ── .vogais — conta vogais/consoantes ────────────────────
export const vogais = {
  name: 'vogais',
  aliases: ['contar', 'letras'],
  description: 'Analisa uma palavra ou frase',
  category: 'fun',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .vogais Kaius Bot')
    const v = (argStr.match(/[aeiouáàâãéêíóôõúü]/gi) || []).length
    const c = (argStr.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length
    const n = (argStr.match(/\d/g) || []).length
    const palavras = argStr.trim().split(/\s+/).length
    await reply(
      `📊 *Análise de Texto*\n\n` +
      `📝 Texto: _${argStr}_\n` +
      `🔤 Caracteres: ${argStr.length}\n` +
      `📖 Palavras: ${palavras}\n` +
      `🔵 Vogais: ${v}\n` +
      `🟢 Consoantes: ${c}\n` +
      `🔢 Números: ${n}`
    )
  }
}

// ── .gerar — gera coisas aleatórias ─────────────────────
export const gerarCmd = {
  name: 'gerar',
  aliases: ['random', 'aleatorio'],
  description: 'Gera cor, UUID, frase, nome, placa...',
  category: 'fun',
  usage: '.gerar cor | uuid | frase | nome | placa | cpf',
  cooldown: 3,
  async execute({ reply, args }) {
    const tipo = args[0]?.toLowerCase() || 'cor'
    switch (tipo) {
      case 'cor':
      case 'color': {
        const hex = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
        await reply(`🎨 *Cor Aleatória*\n\nHEX: \`${hex}\`\nRGB: \`rgb(${r}, ${g}, ${b})\`\nHSL: calculando...`)
        break
      }
      case 'uuid': {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })
        await reply(`🆔 \`${uuid}\``)
        break
      }
      case 'nome': {
        const nomes = ['João','Maria','Pedro','Ana','Carlos','Julia','Lucas','Sofia','Gabriel','Valentina','Miguel','Alice','Arthur','Laura','Mateus','Luiza']
        const sobrenomes = ['Silva','Santos','Oliveira','Souza','Lima','Ferreira','Costa','Pereira','Rodrigues','Almeida']
        const n = nomes[Math.floor(Math.random()*nomes.length)] + ' ' + sobrenomes[Math.floor(Math.random()*sobrenomes.length)]
        await reply(`👤 Nome aleatório: *${n}*`)
        break
      }
      case 'placa': {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const nums   = '0123456789'
        const l = () => letras[Math.floor(Math.random()*letras.length)]
        const n = () => nums[Math.floor(Math.random()*nums.length)]
        const placa = `${l()}${l()}${l()}-${n()}${l()}${n()}${n()}`
        await reply(`🚗 Placa: \`${placa}\` _(Mercosul)_`)
        break
      }
      case 'cpf': {
        // CPF válido fictício (sem dados reais)
        const n = Array.from({length: 9}, () => Math.floor(Math.random()*10))
        let d1 = n.reduce((s,v,i) => s + v*(10-i), 0) % 11
        d1 = d1 < 2 ? 0 : 11 - d1
        let d2 = [...n, d1].reduce((s,v,i) => s + v*(11-i), 0) % 11
        d2 = d2 < 2 ? 0 : 11 - d2
        const cpf = `${n.slice(0,3).join('')}.${n.slice(3,6).join('')}.${n.slice(6,9).join('')}-${d1}${d2}`
        await reply(`🪪 CPF fictício: \`${cpf}\`\n_⚠️ Gerado para fins de teste apenas_`)
        break
      }
      default:
        await reply('❓ Tipos: *cor*, *uuid*, *nome*, *placa*, *cpf*\nEx: .gerar cor')
    }
  }
}

// ── .anagrama — embaralha as letras ──────────────────────
export const anagrama = {
  name: 'anagrama',
  aliases: ['scramble', 'embaralhar'],
  description: 'Embaralha as letras de uma palavra',
  category: 'fun',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .anagrama Kaius')
    const arr = argStr.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    await reply(`🔀 *Anagrama:*\n${argStr} → *${arr.join('')}*`)
  }
}

// ── .emoji — busca emoji por nome ────────────────────────
export const emojiSearch = {
  name: 'emoji',
  aliases: ['emojis', 'achouemoji'],
  description: 'Busca emojis por palavra-chave',
  category: 'fun',
  cooldown: 3,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .emoji fogo')
    const EMOJIS = {
      fogo:['🔥','♨️','🌋'], água:['💧','🌊','🫧'], coração:['❤️','🧡','💛','💚','💙','💜','🖤','🤍'],
      rosto:['😀','😂','🥹','😍','🤔','😎','🥳','😴'], animal:['🐶','🐱','🐺','🦊','🐼','🦁'],
      comida:['🍕','🍔','🍣','🍜','🍦','🎂'], estrela:['⭐','🌟','✨','💫'], lua:['🌙','🌕','🌑'],
      sol:['☀️','🌞','🌤️'], planta:['🌿','🍀','🌺','🌸','🌹'], música:['🎵','🎶','🎸','🎹'],
      esporte:['⚽','🏀','🎾','🏆'], viagem:['✈️','🚀','🏖️','🗺️'], dinheiro:['💰','💵','💎','🏦']
    }
    const key = argStr.toLowerCase()
    const found = Object.entries(EMOJIS).filter(([k]) => k.includes(key) || key.includes(k))
    if (!found.length) return reply(`❌ Nenhum emoji para "${argStr}"`)
    const lista = found.map(([k, emojis]) => `*${k}:* ${emojis.join(' ')}`).join('\n')
    await reply(`😊 *Emojis — "${argStr}"*\n\n${lista}`)
  }
}

// ── .morse — texto ↔ morse ───────────────────────────────
export const morse = {
  name: 'morse',
  aliases: ['morsecode'],
  description: 'Converte texto para código morse e vice-versa',
  category: 'fun',
  cooldown: 3,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Ex: .morse SOS  ou  .morse ... --- ...')
    const MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',' ':'/'}
    const REV = Object.fromEntries(Object.entries(MAP).map(([k,v])=>[v,k]))
    const isMorse = /^[.\-\/\s]+$/.test(argStr)
    if (isMorse) {
      const text = argStr.trim().split(' / ').map(word => word.split(' ').map(s => REV[s]||'?').join('')).join(' ')
      await reply(`📡 *Morse → Texto:* ${text}`)
    } else {
      const morseOut = argStr.toUpperCase().split('').map(c => MAP[c]||'?').join(' ')
      await reply(`📡 *Texto → Morse:*\n\`\`\`${morseOut}\`\`\``)
    }
  }
}

export default [asciiArt, binario, hexCmd, timestampCmd, palindromo, vogais, gerarCmd, anagrama, emojiSearch, morse]
