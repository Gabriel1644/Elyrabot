// ══════════════════════════════════════════════════════════
//  info_extra.js — Mais comandos de informação
// ══════════════════════════════════════════════════════════
import axios from 'axios'
import { groupsDB } from '../../database.js'

// ── .dolar — cotação ao vivo ──────────────────────────────
export const dolar = {
  name: 'dolar',
  aliases: ['cotacao', 'cambio', 'dollar', 'euro', 'btc'],
  description: 'Cotação de moedas ao vivo',
  category: 'info',
  usage: '.dolar | .euro | .btc',
  cooldown: 10,
  async execute({ reply, texto, react }) {
    const cmd = texto.replace(/^\W+/, '').split(' ')[0].toLowerCase()
    const pares = {
      dolar: 'USD-BRL', dollar: 'USD-BRL', euro: 'EUR-BRL',
      btc: 'BTC-BRL', bitcoin: 'BTC-BRL', ethereum: 'ETH-BRL', eth: 'ETH-BRL',
      gbp: 'GBP-BRL', libra: 'GBP-BRL', iene: 'JPY-BRL', ars: 'ARS-BRL',
      cotacao: 'USD-BRL', cambio: 'USD-BRL',
    }
    const par = pares[cmd] || 'USD-BRL'
    await react('⏳')
    try {
      const { data } = await axios.get(`https://economia.awesomeapi.com.br/json/last/${par}`, { timeout: 8000 })
      const coin = Object.values(data)[0]
      const diff = parseFloat(coin.pctChange)
      const emoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️'
      await react('✅')
      await reply(
        `${emoji} *${coin.name}*\n\n` +
        `💰 Compra: *R$ ${parseFloat(coin.bid).toFixed(4)}*\n` +
        `💸 Venda:  *R$ ${parseFloat(coin.ask).toFixed(4)}*\n` +
        `📊 Variação: *${diff > 0 ? '+' : ''}${diff.toFixed(2)}%*\n` +
        `🔝 Máxima: R$ ${parseFloat(coin.high).toFixed(4)}\n` +
        `🔻 Mínima: R$ ${parseFloat(coin.low).toFixed(4)}\n` +
        `_Atualizado: ${new Date(parseInt(coin.timestamp)*1000).toLocaleTimeString('pt-BR')}_`
      )
    } catch {
      await react('❌')
      await reply('❌ Não consegui buscar a cotação. Tente novamente.')
    }
  }
}

// ── .ip — info de um IP ───────────────────────────────────
export const ipInfo = {
  name: 'ip',
  aliases: ['ipinfo', 'meuip', 'geoip'],
  description: 'Informações de um IP ou o seu IP atual',
  category: 'info',
  usage: '.ip [endereço]',
  cooldown: 8,
  async execute({ reply, args, react }) {
    const ip = args[0]?.trim()
    await react('⏳')
    try {
      const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
      const { data } = await axios.get(url, { timeout: 8000 })
      if (data.error) { await react('❌'); return reply('❌ IP inválido ou privado.') }
      await react('✅')
      await reply(
        `🌐 *IP: ${data.ip}*\n\n` +
        `🏳️ País: ${data.country_name} ${data.country} \n` +
        `🏙️ Cidade: ${data.city || '?'}\n` +
        `📍 Região: ${data.region || '?'}\n` +
        `🕐 Timezone: ${data.timezone || '?'}\n` +
        `📡 ISP: ${data.org || '?'}\n` +
        `🗺️ Coord: ${data.latitude}, ${data.longitude}`
      )
    } catch { await react('❌'); await reply('❌ Erro ao buscar informações do IP.') }
  }
}

// ── .encurtador — encurta URL ─────────────────────────────
export const encurtador = {
  name: 'encurtar',
  aliases: ['short', 'encurtarurl', 'shorturl'],
  description: 'Encurta um link longo',
  category: 'info',
  usage: '.encurtar <url>',
  cooldown: 5,
  async execute({ reply, args, react }) {
    let url = args[0]
    if (!url) return reply('❌ Ex: .encurtar https://google.com')
    if (!url.startsWith('http')) url = 'https://' + url
    try { new URL(url) } catch { return reply('❌ URL inválida!') }
    await react('⏳')
    try {
      const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 })
      if (!data.startsWith('http')) throw new Error()
      await react('✅')
      await reply(`🔗 *Link encurtado!*\n\n✨ ${data}\n\n_Original: ${url.slice(0,60)}${url.length > 60 ? '...' : ''}_`)
    } catch { await react('❌'); await reply('❌ Não consegui encurtar. Tente novamente.') }
  }
}

// ── .ping de site ─────────────────────────────────────────
export const pingNet = {
  name: 'pingsite',
  aliases: ['checksite', 'isup', 'site'],
  description: 'Verifica se um site está online',
  category: 'info',
  usage: '.pingsite <url>',
  cooldown: 10,
  async execute({ reply, args, react }) {
    let url = args[0]
    if (!url) return reply('❌ Ex: .pingsite google.com')
    if (!url.startsWith('http')) url = 'https://' + url
    await react('⏳')
    const t0 = Date.now()
    try {
      const { status } = await axios.get(url, { timeout: 10000, validateStatus: () => true })
      const lat = Date.now() - t0
      const online = status < 500
      await react(online ? '✅' : '❌')
      await reply(
        `${online ? '🟢' : '🔴'} *${url}*\n\n` +
        `Status: *${status}*\n` +
        `Latência: *${lat}ms*\n` +
        `Estado: *${online ? 'ONLINE' : 'OFFLINE/ERRO'}*`
      )
    } catch (e) {
      const lat = Date.now() - t0
      await react('❌')
      await reply(`🔴 *${url}*\n\nEstado: *OFFLINE* ou inacessível\n⏱️ ${lat}ms\n_${e.message}_`)
    }
  }
}

// ── .wiki — busca rápida Wikipedia ───────────────────────
export const wiki = {
  name: 'wiki',
  aliases: ['wikipedia', 'pesquisar'],
  description: 'Busca resumo no Wikipedia',
  category: 'info',
  usage: '.wiki <termo>',
  cooldown: 8,
  async execute({ reply, argStr, react }) {
    if (!argStr) return reply('❌ Ex: .wiki Inteligência Artificial')
    await react('⏳')
    try {
      const { data } = await axios.get(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(argStr)}`,
        { timeout: 10000 }
      )
      if (data.type === 'disambiguation') {
        await react('✅')
        return reply(`📖 *${data.title}*\n\n_Termo ambíguo — seja mais específico._\n${data.description || ''}`)
      }
      await react('✅')
      const resumo = data.extract?.slice(0, 600) || 'Sem resumo.'
      await reply(
        `📖 *${data.title}*\n\n${resumo}${data.extract?.length > 600 ? '...' : ''}\n\n` +
        `🔗 ${data.content_urls?.mobile?.page || ''}`
      )
    } catch { await react('❌'); await reply('❌ Nenhum resultado encontrado.') }
  }
}

// ── .tempo — previsão do tempo ───────────────────────────
export const tempo = {
  name: 'tempo',
  aliases: ['clima', 'weather', 'previsao'],
  description: 'Previsão do tempo de qualquer cidade',
  category: 'info',
  usage: '.tempo <cidade>',
  cooldown: 10,
  async execute({ reply, argStr, react }) {
    if (!argStr) return reply('❌ Ex: .tempo São Paulo')
    await react('⏳')
    try {
      const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(argStr)}`, {
        params: { format: 'j1' }, timeout: 12000
      })
      const c    = data.current_condition[0]
      const area = data.nearest_area[0]
      const fore = data.weather

      const cidade = `${area.areaName[0].value}, ${area.country[0].value}`
      const desc   = c.lang_pt?.[0]?.value || c.weatherDesc[0].value
      const weatherEmoji = {'113':'☀️','116':'⛅','119':'☁️','122':'☁️','176':'🌦️','200':'⛈️','266':'🌧️','302':'🌧️'}[c.weatherCode] || '🌡️'

      const dias = fore.slice(0, 3).map(d => {
        const dayDesc = d.hourly[4]?.lang_pt?.[0]?.value || d.hourly[4]?.weatherDesc[0].value || ''
        const dayEmoji = d.maxtempC >= 30 ? '🌞' : d.maxtempC >= 20 ? '⛅' : '❄️'
        return `${dayEmoji} ${d.date}: *${d.mintempC}°↑${d.maxtempC}°* _${dayDesc}_`
      }).join('\n')

      await react('✅')
      await reply(
        `${weatherEmoji} *${cidade}*\n\n` +
        `🌡️ Temp: *${c.temp_C}°C* (sensação ${c.FeelsLikeC}°C)\n` +
        `💧 Umidade: *${c.humidity}%*\n` +
        `💨 Vento: *${c.windspeedKmph}km/h*\n` +
        `☁️ ${desc}\n\n` +
        `📅 *Próximos dias:*\n${dias}`
      )
    } catch { await react('❌'); await reply('❌ Cidade não encontrada ou erro no serviço.') }
  }
}

export default [dolar, ipInfo, encurtador, pingNet, wiki, tempo]
