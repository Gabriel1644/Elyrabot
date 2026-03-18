// ══════════════════════════════════════════════════════════
//  extras.js — Funcionalidades extra do bot
//  Boas-vindas, tradução, clima, calculadora, QR, etc.
// ══════════════════════════════════════════════════════════
import axios from 'axios'
import { groupsDB } from '../../database.js'
import { CONFIG }   from '../../config.js'

// ── !clima ─────────────────────────────────────────────────
export const clima = {
  name: 'clima',
  aliases: ['tempo', 'weather'],
  description: 'Clima de qualquer cidade',
  category: 'info',
  usage: '!clima <cidade>',
  cooldown: 10,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe a cidade! Ex: !clima São Paulo')
    try {
      // wttr.in — sem API key necessária
      const cidade = encodeURIComponent(argStr)
      const r = await axios.get(
        `https://wttr.in/${cidade}?format=j1&lang=pt`,
        { timeout: 12000, headers: { 'User-Agent': 'ElyraBot/2.1' } }
      )
      const d     = r.data
      const curr  = d.current_condition?.[0]
      const area  = d.nearest_area?.[0]
      const local = `${area?.areaName?.[0]?.value || argStr}, ${area?.country?.[0]?.value || ''}`
      const desc  = curr?.lang_pt?.[0]?.value || curr?.weatherDesc?.[0]?.value || '?'
      const temp  = curr?.temp_C || '?'
      const sens  = curr?.FeelsLikeC || '?'
      const hum   = curr?.humidity || '?'
      const vento = curr?.windspeedKmph || '?'
      const emoji = getClimaEmoji(curr?.weatherCode || '113')

      return reply(
        `${emoji} *Clima em ${local}*\n\n` +
        `🌡️ Temperatura: *${temp}°C* (sensação ${sens}°C)\n` +
        `💧 Umidade: *${hum}%*\n` +
        `💨 Vento: *${vento} km/h*\n` +
        `📋 Condição: _${desc}_`
      )
    } catch (e) {
      return reply(`❌ Não consegui buscar o clima de *${argStr}*.\nTente com o nome em inglês ou verifique a grafia.`)
    }
  }
}

function getClimaEmoji(code) {
  const c = parseInt(code)
  if (c === 113) return '☀️'
  if (c === 116) return '⛅'
  if ([119, 122].includes(c)) return '☁️'
  if ([143, 248, 260].includes(c)) return '🌫️'
  if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(c)) return '🌧️'
  if ([179, 182, 185, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 362, 365, 368, 371, 374, 377].includes(c)) return '🌨️'
  if ([200, 386, 389, 392, 395].includes(c)) return '⛈️'
  return '🌤️'
}

// ── !traduzir ──────────────────────────────────────────────
export const traduzirCmd = {
  name: 'traduzir',
  aliases: ['tr', 'translate', 'trad'],
  description: 'Traduz texto para qualquer idioma',
  category: 'tools',
  usage: '!traduzir [idioma] <texto>  (ex: !tr en olá mundo)',
  cooldown: 8,
  async execute({ reply, args, argStr }) {
    if (!argStr) return reply(
      '❌ Uso: *!traduzir [idioma] <texto>*\n\n' +
      '• !tr en Olá mundo\n• !tr es Bom dia\n• !tr ja Como vai?\n\n' +
      '_Idiomas: pt, en, es, fr, de, it, ja, ko, zh, ar, ru..._'
    )
    // Detecta se o primeiro arg é um código de idioma
    const codigos = ['pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ar', 'ru', 'hi', 'tr', 'nl', 'sv', 'pl']
    let destino = 'pt'
    let texto   = argStr
    if (args[0] && codigos.includes(args[0].toLowerCase())) {
      destino = args[0].toLowerCase()
      texto   = args.slice(1).join(' ')
    }
    if (!texto) return reply('❌ Informe o texto para traduzir!')
    try {
      // MyMemory API — gratuita, sem chave
      const r = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: texto.substring(0, 500), langpair: `auto|${destino}` },
        timeout: 10000
      })
      const traduzido = r.data?.responseData?.translatedText
      if (!traduzido || traduzido === texto) return reply(`❌ Não consegui traduzir. Tente novamente.`)
      return reply(`🌐 *Tradução → ${destino.toUpperCase()}*\n\n${traduzido}`)
    } catch {
      return reply('❌ Erro ao traduzir. Tente novamente.')
    }
  }
}

// ── !calc ──────────────────────────────────────────────────
export const calc = {
  name: 'calc',
  aliases: ['calcular', 'calculo', '='],
  description: 'Calculadora matemática',
  category: 'tools',
  usage: '!calc <expressão>',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe uma expressão! Ex: !calc 2 + 2 * 3')
    try {
      // Remove tudo que não é matemática básica (segurança)
      const expr = argStr
        .replace(/[^0-9+\-*/().,% \^√πe]/g, '')
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/√(\d+)/g, 'Math.sqrt($1)')
        .trim()
      if (!expr) return reply('❌ Expressão inválida!')
      // eslint-disable-next-line no-new-func
      const res = new Function(`"use strict"; return (${expr})`)()
      if (isNaN(res) || !isFinite(res)) return reply('❌ Resultado inválido!')
      return reply(`🧮 *${argStr}*\n\n= *${Number(res.toFixed(10)).toString()}*`)
    } catch {
      return reply('❌ Expressão inválida! Use: +, -, *, /, (), ^')
    }
  }
}

// ── !dado ──────────────────────────────────────────────────
export const dado = {
  name: 'dado',
  aliases: ['dice', 'rolar', 'd20', 'd6'],
  description: 'Rola dados',
  category: 'fun',
  usage: '!dado [NdX]  ex: !dado 2d6, !dado d20',
  cooldown: 3,
  async execute({ reply, argStr, usuario }) {
    let qtd = 1, lados = 6
    const match = (argStr || '1d6').match(/^(\d+)?d(\d+)$/i)
    if (match) {
      qtd   = Math.min(parseInt(match[1] || '1'), 10)
      lados = Math.min(parseInt(match[2]), 1000)
    }
    const resultados = Array.from({ length: qtd }, () => Math.floor(Math.random() * lados) + 1)
    const total = resultados.reduce((a, b) => a + b, 0)
    const emojis = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' }
    const faces = resultados.map(r => lados === 6 ? (emojis[r] || r) : r).join(' + ')
    return reply(
      `🎲 *${usuario} rolou ${qtd}d${lados}*\n\n` +
      `${faces}${qtd > 1 ? `\n\n= *${total}*` : ''}`
    )
  }
}

// ── !moeda ─────────────────────────────────────────────────
export const moeda = {
  name: 'moeda',
  aliases: ['flip', 'cara', 'coroa'],
  description: 'Cara ou coroa',
  category: 'fun',
  usage: '!moeda',
  cooldown: 3,
  async execute({ reply, usuario }) {
    const res = Math.random() < 0.5 ? '🪙 *CARA*' : '🪙 *COROA*'
    return reply(`${usuario} jogou a moeda...\n\n${res}!`)
  }
}

// ── !escolher ──────────────────────────────────────────────
export const escolher = {
  name: 'escolher',
  aliases: ['choose', 'escolha', 'ou'],
  description: 'Escolhe aleatoriamente entre opções',
  category: 'fun',
  usage: '!escolher opção1 | opção2 | opção3',
  cooldown: 3,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Separe as opções com | ou vírgula!\nEx: !escolher pizza | hamburguer | sushi')
    const sep = argStr.includes('|') ? '|' : ','
    const opcoes = argStr.split(sep).map(o => o.trim()).filter(Boolean)
    if (opcoes.length < 2) return reply('❌ Coloque pelo menos 2 opções! Use | para separar.')
    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)]
    return reply(`🎯 *Escolhi:*\n\n*${escolhida}*\n\n_de ${opcoes.length} opções_`)
  }
}

// ── !abrev ────────────────────────────────────────────────
export const abrev = {
  name: 'abrev',
  aliases: ['sigla', 'gíria'],
  description: 'Explica siglas e gírias do WhatsApp',
  category: 'fun',
  usage: '!abrev <sigla>',
  cooldown: 5,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe a sigla! Ex: !abrev kkkk')
    const SIGLAS = {
      'kkk':'Risos', 'kkkk':'Muitos risos', 'haha':'Risos', 'lol':'Laughing out loud (muito engraçado)',
      'rsrs':'Risos', 'hehe':'Risos', 'vc':'Você', 'tb':'Também', 'tbm':'Também',
      'cmg':'Comigo', 'ngm':'Ninguém', 'msg':'Mensagem', 'blz':'Beleza (ok)', 'flw':'Falou (tchau)',
      'vlw':'Valeu', 'obg':'Obrigado', 'pfv':'Por favor', 'dnv':'De novo', 'pq':'Por que/Porque',
      'q':'Que', 'n':'Não', 'sim':'Sim', 'msm':'Mesmo', 'aq':'Aqui', 'ai':'Aí',
      'bjs':'Beijos', 'hj':'Hoje', 'amh':'Amanhã', 'sdv':'Saudade', 'sds':'Saudades',
      'omg':'Oh My God (meu Deus)', 'wtf':'What The F*** (que diabos)', 'brb':'Be Right Back (já volto)',
      'idk':'I Don\'t Know (não sei)', 'imo':'In My Opinion (na minha opinião)', 'irl':'In Real Life (na vida real)',
      'ngl':'Not Gonna Lie (não vou mentir)', 'nfs':'Not For Sale (não está à venda)',
      'smh':'Shaking My Head (balançando a cabeça)', 'tbh':'To Be Honest (sendo honesto)',
    }
    const key = argStr.toLowerCase().trim()
    const res = SIGLAS[key]
    if (!res) return reply(`❓ Não encontrei a sigla *${argStr}*.\n\nConheço: ${Object.keys(SIGLAS).slice(0,15).join(', ')}...`)
    return reply(`📖 *${argStr.toUpperCase()}* = ${res}`)
  }
}

// ── !gerarsenha ───────────────────────────────────────────
export const gerarSenha = {
  name: 'gerarsenha',
  aliases: ['senha', 'password', 'generatepass'],
  description: 'Gera senha aleatória segura',
  category: 'tools',
  usage: '!gerarsenha [tamanho]',
  cooldown: 5,
  async execute({ reply, args }) {
    const tam = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64)
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-='
    let senha = ''
    for (let i = 0; i < tam; i++) senha += chars[Math.floor(Math.random() * chars.length)]
    return reply(`🔐 *Senha Gerada (${tam} chars):*\n\n\`\`\`${senha}\`\`\`\n\n_Salve em um lugar seguro!_`)
  }
}

// ── !status ────────────────────────────────────────────────
export const statusBot = {
  name: 'status',
  aliases: ['botstatus', 'botinfo2', 'stats'],
  description: 'Estatísticas detalhadas do bot',
  category: 'info',
  usage: '!status',
  cooldown: 10,
  async execute({ reply, sock, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    const { statsDB } = await import('../../database.js')
    const { getUptime } = await import('../../utils.js')
    const mem  = process.memoryUsage()
    const stats = statsDB.get('total', {})
    const toMB = (b) => (b / 1024 / 1024).toFixed(1)
    return reply(
      `📊 *Status do Bot*\n\n` +
      `⏱️ Uptime: *${getUptime()}*\n` +
      `💬 Mensagens: *${stats.msgs || 0}*\n` +
      `⚡ Cmds usados: *${Object.values(statsDB.get('commands', {})).reduce((a, b) => a + b, 0)}*\n\n` +
      `💾 Memória:\n` +
      `  RSS: *${toMB(mem.rss)} MB*\n` +
      `  Heap: *${toMB(mem.heapUsed)} / ${toMB(mem.heapTotal)} MB*\n\n` +
      `🤖 Bot: *${CONFIG.nome}* v${CONFIG.versao}\n` +
      `🧠 Modelo IA: *${CONFIG.modelo || 'não configurado'}*`
    )
  }
}

// ── !encurtar ──────────────────────────────────────────────
export const encurtar = {
  name: 'encurtar',
  aliases: ['shorturl', 'link', 'url'],
  description: 'Encurta um link',
  category: 'tools',
  usage: '!encurtar <url>',
  cooldown: 8,
  async execute({ reply, argStr }) {
    if (!argStr || !argStr.startsWith('http')) return reply('❌ Informe uma URL válida!')
    try {
      const r = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(argStr)}`,
        { timeout: 10000 })
      return reply(`🔗 *Link encurtado:*\n${r.data}`)
    } catch {
      return reply('❌ Não foi possível encurtar o link.')
    }
  }
}

// ── !ip ────────────────────────────────────────────────────
export const ipInfo = {
  name: 'ip',
  aliases: ['ipinfo', 'geoip'],
  description: 'Informações de um IP ou domínio',
  category: 'info',
  usage: '!ip <ip ou domínio>',
  cooldown: 10,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe um IP ou domínio!')
    try {
      const r = await axios.get(`http://ip-api.com/json/${encodeURIComponent(argStr)}?lang=pt-BR`,
        { timeout: 10000 })
      const d = r.data
      if (d.status !== 'success') return reply(`❌ IP/domínio inválido ou não encontrado.`)
      return reply(
        `🌍 *Info do IP: ${d.query}*\n\n` +
        `📍 País: ${d.country}\n` +
        `🏙️ Cidade: ${d.city} — ${d.regionName}\n` +
        `🌐 ISP: ${d.isp}\n` +
        `📮 CEP: ${d.zip || '?'}\n` +
        `🗺️ Coords: ${d.lat}, ${d.lon}\n` +
        `🕐 Fuso: ${d.timezone}`
      )
    } catch {
      return reply('❌ Não foi possível buscar informações do IP.')
    }
  }
}

export default [clima, traduzirCmd, calc, dado, moeda, escolher, abrev, gerarSenha, statusBot, encurtar, ipInfo]
