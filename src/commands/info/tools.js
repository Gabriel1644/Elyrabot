// ══════════════════════════════════════════════════════════
//  tools.js — Ferramentas úteis
// ══════════════════════════════════════════════════════════
import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createHash } from 'crypto'

const execAsync = promisify(exec)

// ── !ip ───────────────────────────────────────────────────
export const ip = {
  name: 'ip',
  aliases: ['meuip', 'ipinfo'],
  description: 'Mostra o IP público e localização',
  category: 'tools',
  usage: '!ip [endereço]',
  cooldown: 10,
  async execute({ reply, argStr }) {
    try {
      const url = argStr ? `https://ipapi.co/${argStr}/json/` : 'https://ipapi.co/json/'
      const r = await axios.get(url, { timeout: 8000 })
      const d = r.data
      if (d.error) return reply(`❌ ${d.reason || 'IP inválido'}`)
      await reply(
        `🌐 *IP: ${d.ip}*\n\n` +
        `🗺️ País: *${d.country_name} (${d.country_code})*\n` +
        `🏙️ Cidade: *${d.city || 'N/A'}*\n` +
        `📍 Região: *${d.region || 'N/A'}*\n` +
        `🕐 Fuso: *${d.timezone || 'N/A'}*\n` +
        `📡 Provedor: *${d.org || 'N/A'}*\n` +
        `🌍 Coords: ${d.latitude}, ${d.longitude}`
      )
    } catch { await reply('❌ Erro ao buscar IP.') }
  }
}

// ── !qrcode ───────────────────────────────────────────────
export const qrcodeCmd = {
  name: 'qrcode',
  aliases: ['qr', 'gerarqr'],
  description: 'Gera um QR Code de um texto ou URL',
  category: 'tools',
  usage: '!qrcode <texto ou URL>',
  cooldown: 5,
  async execute({ reply, sock, from, msg, argStr }) {
    if (!argStr) return reply('❌ Informe um texto ou URL!')
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(argStr)}&color=000000&bgcolor=ffffff`
      await sock.sendMessage(from, {
        image: { url },
        caption: `📱 *QR Code*\n\n_Conteúdo: ${argStr.substring(0, 100)}_`
      }, { quoted: msg })
    } catch { await reply('❌ Erro ao gerar QR Code.') }
  }
}

// ── !hash ─────────────────────────────────────────────────
export const hashCmd = {
  name: 'hash',
  aliases: ['md5', 'sha256', 'sha1'],
  description: 'Gera hash de um texto',
  category: 'tools',
  usage: '!hash [md5/sha1/sha256] <texto>',
  cooldown: 3,
  async execute({ reply, args, argStr }) {
    let algo = 'sha256'
    let texto = argStr
    if (['md5','sha1','sha256','sha512'].includes(args[0]?.toLowerCase())) {
      algo  = args[0].toLowerCase()
      texto = args.slice(1).join(' ')
    }
    if (!texto) return reply('❌ Informe o texto para gerar hash!')
    const hash = createHash(algo).update(texto).digest('hex')
    await reply(`🔐 *Hash ${algo.toUpperCase()}*\n\nTexto: \`${texto.substring(0, 100)}\`\nHash:\n\`\`\`\n${hash}\n\`\`\``)
  }
}

// ── !encurtar ─────────────────────────────────────────────
export const encurtar = {
  name: 'encurtar',
  aliases: ['shorturl', 'urlcurta'],
  description: 'Encurta uma URL',
  category: 'tools',
  usage: '!encurtar <URL>',
  cooldown: 5,
  async execute({ reply, argStr }) {
    if (!argStr.startsWith('http')) return reply('❌ Informe uma URL válida (com http://)')
    try {
      const r = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(argStr)}`, { timeout: 8000 })
      await reply(`🔗 *URL Encurtada:*\n\n${r.data}`)
    } catch { await reply('❌ Erro ao encurtar URL.') }
  }
}

// ── !traduzir ─────────────────────────────────────────────
export const traduzir = {
  name: 'traduzir',
  aliases: ['translate', 'tr'],
  description: 'Traduz texto para qualquer idioma',
  category: 'tools',
  usage: '!traduzir <idioma>: <texto>  (ex: !traduzir en: Olá mundo)',
  cooldown: 5,
  async execute({ reply, argStr }) {
    const match = argStr.match(/^([a-z]{2}(?:-[A-Z]{2})?)\s*:\s*(.+)/s)
    if (!match) return reply('❌ Formato: !traduzir <idioma>: <texto>\nEx: !traduzir en: Olá mundo')
    const [, lang, texto] = match
    try {
      const r = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: texto, langpair: `pt|${lang}` },
        timeout: 10000
      })
      const t = r.data.responseData?.translatedText
      if (!t) return reply('❌ Tradução não disponível.')
      await reply(`🌐 *Tradução (→ ${lang})*\n\n_Original:_ ${texto}\n\n_Tradução:_ *${t}*`)
    } catch { await reply('❌ Erro ao traduzir.') }
  }
}

// ── !calc ─────────────────────────────────────────────────
export const calc = {
  name: 'calc',
  aliases: ['calcular', 'math'],
  description: 'Calculadora matemática',
  category: 'tools',
  usage: '!calc <expressão>  ex: !calc 2+2*3',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe uma expressão! Ex: !calc 15*3+2')
    try {
      // Sanitize: apenas números, operadores e funções matemáticas básicas
      const safe = argStr.replace(/[^0-9+\-*/().%\s,]/g, '')
      if (!safe) return reply('❌ Expressão inválida!')
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${safe})`)()
      if (!isFinite(result)) return reply('❌ Resultado inválido (divisão por zero?)')
      await reply(`🧮 *Calculadora*\n\n\`${safe}\`\n= *${result}*`)
    } catch { await reply('❌ Erro na expressão matemática.') }
  }
}

// ── !senha ────────────────────────────────────────────────
export const senha = {
  name: 'senha',
  aliases: ['password', 'gerarsenha'],
  description: 'Gera uma senha segura aleatória',
  category: 'tools',
  usage: '!senha [tamanho] [simples]',
  cooldown: 3,
  async execute({ reply, args }) {
    const tam   = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64)
    const simples = args.includes('simples') || args.includes('simple')
    const chars = simples
      ? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    const pass = Array.from({ length: tam }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    await reply(`🔑 *Senha Gerada (${tam} chars):*\n\n\`\`\`\n${pass}\n\`\`\`\n\n_Guarde em local seguro!_`)
  }
}

// ── !moeda (conversão) ────────────────────────────────────
export const moeda = {
  name: 'moeda',
  aliases: ['cotacao', 'cambio'],
  description: 'Converte valores entre moedas',
  category: 'tools',
  usage: '!moeda 100 USD BRL',
  cooldown: 8,
  async execute({ reply, args }) {
    if (args.length < 3) return reply('❌ Uso: !moeda <valor> <de> <para>\nEx: !moeda 100 USD BRL')
    const [valor, de, para] = [parseFloat(args[0]), args[1].toUpperCase(), args[2].toUpperCase()]
    if (isNaN(valor)) return reply('❌ Valor inválido!')
    try {
      const r = await axios.get(`https://api.exchangerate-api.com/v4/latest/${de}`, { timeout: 8000 })
      const rate = r.data.rates?.[para]
      if (!rate) return reply(`❌ Moeda *${para}* não encontrada!`)
      const resultado = (valor * rate).toFixed(2)
      await reply(`💱 *Conversão de Moeda*\n\n${valor} ${de} = *${resultado} ${para}*\n\n_Taxa: 1 ${de} = ${rate.toFixed(4)} ${para}_`)
    } catch { await reply('❌ Erro ao buscar cotação.') }
  }
}

// ── !ping (internet) ──────────────────────────────────────
export const pingNet = {
  name: 'ping',
  aliases: ['latencia', 'latency'],
  description: 'Mede a latência com um host',
  category: 'tools',
  usage: '!ping [host]',
  cooldown: 10,
  async execute({ reply, argStr }) {
    const host = argStr || 'google.com'
    try {
      const inicio = Date.now()
      await axios.get(`https://${host}`, { timeout: 8000 })
      const ms = Date.now() - inicio
      const emoji = ms < 200 ? '🟢' : ms < 500 ? '🟡' : '🔴'
      await reply(`${emoji} *Ping: ${ms}ms*\nHost: ${host}`)
    } catch (e) {
      await reply(`❌ Host inacessível: ${host}`)
    }
  }
}

// ── !clima ────────────────────────────────────────────────
export const hora = {
  name: 'hora',
  aliases: ['data', 'time'],
  description: 'Mostra hora e data atual de uma cidade/fuso',
  category: 'tools',
  usage: '!hora [cidade/fuso]',
  cooldown: 5,
  async execute({ reply, argStr }) {
    try {
      let tz = 'America/Sao_Paulo'
      if (argStr) {
        const r = await axios.get(`https://timeapi.io/api/TimeZone/zone?timeZone=${encodeURIComponent(argStr)}`, { timeout: 6000 })
        if (r.data?.timeZone) tz = r.data.timeZone
      }
      const agora = new Date().toLocaleString('pt-BR', { timeZone: tz, dateStyle: 'full', timeStyle: 'medium' })
      await reply(`🕐 *Data e Hora*\n\n${agora}\n🌍 Fuso: _${tz}_`)
    } catch {
      const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'medium' })
      await reply(`🕐 *Data e Hora (BR)*\n\n${agora}`)
    }
  }
}

// ── !base64 ───────────────────────────────────────────────
export const base64Cmd = {
  name: 'base64',
  aliases: ['b64'],
  description: 'Codifica ou decodifica base64',
  category: 'tools',
  usage: '!base64 encode/decode <texto>',
  cooldown: 3,
  async execute({ reply, args, argStr }) {
    const op    = args[0]?.toLowerCase()
    const texto = args.slice(1).join(' ')
    if (!op || !texto) return reply('❌ Uso: !base64 encode <texto> ou !base64 decode <texto>')
    if (op === 'encode' || op === 'enc') {
      return reply(`🔒 *Base64 Encoded:*\n\`\`\`\n${Buffer.from(texto).toString('base64')}\n\`\`\``)
    }
    if (op === 'decode' || op === 'dec') {
      try {
        return reply(`🔓 *Base64 Decoded:*\n\`\`\`\n${Buffer.from(texto, 'base64').toString('utf-8')}\n\`\`\``)
      } catch { return reply('❌ Base64 inválido!') }
    }
    await reply('❌ Use "encode" ou "decode"')
  }
}

export default [ip, qrcodeCmd, hashCmd, pingNet, hora, base64Cmd]
