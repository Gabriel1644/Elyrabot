// ══════════════════════════════════════════════════════════
//  news.js — Notícias, crypto, clima avançado, futebol
// ══════════════════════════════════════════════════════════
import axios from 'axios'

// ── !noticias ─────────────────────────────────────────────
export const noticias = {
  name: 'noticias',
  aliases: ['news', 'novidades', 'headlines'],
  description: 'Notícias recentes do Brasil',
  category: 'info',
  usage: '!noticias [tema]',
  cooldown: 15,
  async execute({ reply, argStr }) {
    try {
      const tema = argStr || 'brasil'
      const r = await axios.get('https://newsapi.org/v2/everything', {
        params: { q: tema, language: 'pt', sortBy: 'publishedAt', pageSize: 5, apiKey: process.env.NEWS_KEY || 'demo' },
        timeout: 10000
      })
      const arts = r.data?.articles?.filter(a => a.title && a.title !== '[Removed]').slice(0, 5)
      if (!arts?.length) return reply(`❌ Nenhuma notícia encontrada para: ${tema}`)
      let txt = `📰 *Notícias — ${tema}*\n\n`
      arts.forEach((a, i) => {
        txt += `*${i+1}.* ${a.title}\n`
        txt += `   _${a.source?.name}_  •  ${new Date(a.publishedAt).toLocaleDateString('pt-BR')}\n\n`
      })
      await reply(txt)
    } catch {
      // Fallback sem API key via RSS
      try {
        const r = await axios.get('https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', { timeout: 8000 })
        const items = r.data.match(/<title>(.*?)<\/title>/g)?.slice(1, 6) || []
        if (!items.length) return reply('❌ Não consegui buscar notícias agora.')
        let txt = `📰 *Folha de S.Paulo — Últimas Notícias*\n\n`
        items.forEach((it, i) => {
          const titulo = it.replace(/<\/?title>/g, '').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
          txt += `*${i+1}.* ${titulo}\n\n`
        })
        await reply(txt)
      } catch { await reply('❌ Não consegui buscar notícias agora.') }
    }
  }
}

// ── !crypto ────────────────────────────────────────────────
export const crypto = {
  name: 'crypto',
  aliases: ['cripto', 'coin', 'btc'],
  description: 'Preços de criptomoedas em tempo real',
  category: 'info',
  usage: '!crypto [btc/eth/...]',
  cooldown: 10,
  async execute({ reply, argStr }) {
    try {
      const moedas = argStr
        ? argStr.toLowerCase().split(/[\s,]+/).slice(0, 5)
        : ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'dogecoin']

      const r = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: moedas.join(','), vs_currencies: 'brl,usd', include_24hr_change: 'true' },
        timeout: 10000
      })
      const d = r.data
      if (!Object.keys(d).length) return reply('❌ Moeda não encontrada!')

      let txt = `💎 *Preços de Criptomoedas*\n\n`
      for (const [id, vals] of Object.entries(d)) {
        const change = vals.usd_24h_change?.toFixed(2)
        const seta   = change >= 0 ? '📈' : '📉'
        const cor    = change >= 0 ? '+' : ''
        txt += `*${id.toUpperCase()}*\n`
        txt += `  💵 $${vals.usd?.toLocaleString('pt-BR') || 'N/A'}\n`
        txt += `  🇧🇷 R$${vals.brl?.toLocaleString('pt-BR') || 'N/A'}\n`
        if (change) txt += `  ${seta} ${cor}${change}% (24h)\n`
        txt += `\n`
      }
      await reply(txt)
    } catch { await reply('❌ Erro ao buscar preços crypto.') }
  }
}

// ── !clima (com previsão 3 dias) ──────────────────────────
export const climaPro = {
  name: 'previsao',
  aliases: ['forecast', 'clima3dias'],
  description: 'Previsão do tempo para 3 dias',
  category: 'info',
  usage: '!previsao <cidade>',
  cooldown: 15,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe uma cidade! Ex: !previsao São Paulo')
    const key = process.env.WEATHER_KEY
    if (!key) return reply('❌ Configure WEATHER_KEY no .env!\nopenweathermap.org (grátis)')
    try {
      const r = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: { q: argStr, appid: key, units: 'metric', lang: 'pt_br', cnt: 24 },
        timeout: 8000
      })
      const list = r.data.list
      const dias = {}
      for (const item of list) {
        const dia = new Date(item.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
        if (!dias[dia]) dias[dia] = []
        dias[dia].push(item)
      }

      let txt = `🌍 *Previsão — ${r.data.city.name}*\n\n`
      for (const [dia, items] of Object.entries(dias).slice(0, 3)) {
        const temps = items.map(i => i.main.temp)
        const min   = Math.min(...temps).toFixed(0)
        const max   = Math.max(...temps).toFixed(0)
        const desc  = items[Math.floor(items.length/2)].weather[0].description
        txt += `📅 *${dia}*\n`
        txt += `   🌡️ ${min}°C – ${max}°C  •  _${desc}_\n\n`
      }
      await reply(txt)
    } catch { await reply('❌ Erro ao buscar previsão.') }
  }
}

// ── !futebol ───────────────────────────────────────────────
export const futebol = {
  name: 'futebol',
  aliases: ['football', 'placar', 'tabela'],
  description: 'Resultados e tabela do futebol brasileiro',
  category: 'info',
  usage: '!futebol',
  cooldown: 20,
  async execute({ reply, argStr }) {
    try {
      // API pública de futebol
      const r = await axios.get('https://api.football-data.org/v4/competitions/BSA/matches', {
        params: { status: 'FINISHED', limit: 5 },
        headers: { 'X-Auth-Token': process.env.FOOTBALL_KEY || '' },
        timeout: 8000
      })
      const matches = r.data?.matches?.slice(0, 5)
      if (!matches?.length) throw new Error('no matches')
      let txt = `⚽ *Últimos Jogos — Brasileirão*\n\n`
      matches.forEach(m => {
        txt += `${m.homeTeam.shortName} *${m.score.fullTime.home}* × *${m.score.fullTime.away}* ${m.awayTeam.shortName}\n`
      })
      await reply(txt)
    } catch {
      await reply(
        `⚽ *Futebol*\n\n` +
        `Para resultados ao vivo, acesse:\n` +
        `• ge.globo.com\n• sofascore.com\n\n` +
        `_Configure FOOTBALL_KEY para integração direta._`
      )
    }
  }
}

// ── !dolar ─────────────────────────────────────────────────
export const dolar = {
  name: 'dolar',
  aliases: ['dollar', 'câmbio', 'euro', 'cotacao'],
  description: 'Cotações do dólar, euro e outras moedas',
  category: 'info',
  usage: '!dolar',
  cooldown: 10,
  async execute({ reply }) {
    try {
      const r = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,ARS-BRL', { timeout: 8000 })
      const d = r.data
      const fmt = (v) => parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      let txt = `💱 *Cotações em Tempo Real*\n\n`
      if (d.USDBRL) txt += `🇺🇸 Dólar:  *R$ ${fmt(d.USDBRL.ask)}*\n`
      if (d.EURBRL) txt += `🇪🇺 Euro:   *R$ ${fmt(d.EURBRL.ask)}*\n`
      if (d.GBPBRL) txt += `🇬🇧 Libra:  *R$ ${fmt(d.GBPBRL.ask)}*\n`
      if (d.BTCBRL) txt += `₿  Bitcoin: *R$ ${fmt(d.BTCBRL.ask)}*\n`
      if (d.ARSBRL) txt += `🇦🇷 Peso:   *R$ ${fmt(d.ARSBRL.ask)}*\n`
      txt += `\n_Atualizado agora_`
      await reply(txt)
    } catch { await reply('❌ Erro ao buscar cotações.') }
  }
}

// ── !bula ─────────────────────────────────────────────────
export const bula = {
  name: 'bula',
  aliases: ['remedio', 'medicamento'],
  description: 'Busca informações sobre um medicamento',
  category: 'info',
  usage: '!bula <nome do remédio>',
  cooldown: 10,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe o nome do medicamento!')
    try {
      const r = await axios.get(`https://bula.fda.gov.br/api/consulta/bulario?nome=${encodeURIComponent(argStr)}&pagina=1`, { timeout: 10000 })
      const items = r.data?.data?.slice(0, 3)
      if (!items?.length) return reply(`❌ Medicamento *${argStr}* não encontrado.`)
      let txt = `💊 *Medicamentos encontrados:*\n\n`
      items.forEach((item, i) => {
        txt += `*${i+1}.* ${item.nomeProduto}\n`
        txt += `   📦 ${item.nomeEmpresa || 'N/A'}\n\n`
      })
      txt += `_Consulte sempre um médico antes de usar._`
      await reply(txt)
    } catch {
      await reply(`💊 *${argStr}*\n\n_Para informações detalhadas sobre medicamentos, consulte:_\n• bulario.anvisa.gov.br\n• medline.com.br`)
    }
  }
}

export default [noticias, crypto, climaPro, futebol, dolar, bula]
