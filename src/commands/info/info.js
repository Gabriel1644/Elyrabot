import axios from 'axios'

export const clima = {
  name: 'clima',
  aliases: ['weather', 'tempo'],
  description: 'Previsão do tempo de uma cidade',
  category: 'info',
  usage: '!clima <cidade>',
  cooldown: 10,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe uma cidade! Ex: !clima São Paulo')
    const key = process.env.WEATHER_KEY
    if (!key) return reply('❌ Configure WEATHER_KEY no .env!\nCrie conta grátis em: openweathermap.org')
    try {
      const r = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { q: argStr, appid: key, units: 'metric', lang: 'pt_br' },
        timeout: 8000
      })
      const d = r.data
      const emojis = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️' }
      const e = emojis[d.weather[0].main] || '🌡️'
      await reply(
`${e} *Clima em ${d.name}, ${d.sys.country}*

🌡️ Temperatura: *${d.main.temp.toFixed(1)}°C*
🤔 Sensação: ${d.main.feels_like.toFixed(1)}°C
💧 Umidade: ${d.main.humidity}%
🌬️ Vento: ${(d.wind.speed * 3.6).toFixed(1)} km/h
📋 ${d.weather[0].description}
⬆️ Max: ${d.main.temp_max.toFixed(1)}°C | ⬇️ Min: ${d.main.temp_min.toFixed(1)}°C`)
    } catch (e) {
      await reply(e.response?.status === 404 ? '❌ Cidade não encontrada!' : '❌ Erro ao buscar clima.')
    }
  }
}

export const cep = {
  name: 'cep',
  aliases: ['endereco'],
  description: 'Busca informações de um CEP',
  category: 'info',
  usage: '!cep 01310100',
  cooldown: 5,
  async execute({ reply, argStr }) {
    const num = argStr.replace(/\D/g, '')
    if (num.length !== 8) return reply('❌ CEP inválido! Use 8 dígitos. Ex: !cep 01310100')
    try {
      const r = await axios.get(`https://viacep.com.br/ws/${num}/json/`, { timeout: 8000 })
      if (r.data.erro) return reply('❌ CEP não encontrado!')
      const d = r.data
      await reply(
`📮 *CEP: ${d.cep}*

🏙️ Cidade: *${d.localidade} — ${d.uf}*
🏘️ Bairro: ${d.bairro || 'N/A'}
🛣️ Logradouro: ${d.logradouro || 'N/A'}
🗺️ Região: ${d.regiao || 'N/A'}
📡 IBGE: ${d.ibge}`)
    } catch { await reply('❌ Erro ao buscar CEP.') }
  }
}

export const wiki = {
  name: 'wiki',
  aliases: ['wikipedia', 'pesquisar'],
  description: 'Busca resumo no Wikipedia',
  category: 'info',
  usage: '!wiki <termo>',
  cooldown: 8,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ O que deseja pesquisar?')
    try {
      const search = await axios.get('https://pt.wikipedia.org/w/api.php', {
        params: { action: 'search', list: 'search', srsearch: argStr, format: 'json', utf8: 1 },
        timeout: 8000
      })
      const results = search.data?.query?.search
      if (!results?.length) return reply(`❌ Nenhum resultado para: *${argStr}*`)

      const title = results[0].title
      const extract = await axios.get('https://pt.wikipedia.org/w/api.php', {
        params: { action: 'query', prop: 'extracts', exintro: 1, explaintext: 1, titles: title, format: 'json' },
        timeout: 8000
      })
      const pages = extract.data?.query?.pages
      const page  = Object.values(pages)[0]
      const texto = (page?.extract || 'Sem resumo disponível.').substring(0, 600)

      await reply(`📚 *${page.title}*\n\n${texto}...\n\n🔗 https://pt.wikipedia.org/wiki/${encodeURIComponent(title)}`)
    } catch { await reply('❌ Erro ao buscar na Wikipedia.') }
  }
}

export const traduzir = {
  name: 'traduzir',
  aliases: ['translate', 'trad'],
  description: 'Traduz um texto (usa IA)',
  category: 'info',
  usage: '!traduzir en: Hello World',
  cooldown: 5,
  async execute({ reply, argStr, sock, msg, from }) {
    if (!argStr) return reply('❌ Use: !traduzir en: texto\nIdiomas: en pt es fr de it ja ko zh')
    const match = argStr.match(/^([a-z]{2}):\s*(.+)/i)
    const idioma = match ? match[1].toLowerCase() : 'en'
    const texto  = match ? match[2] : argStr

    const nomes = { en: 'Inglês', pt: 'Português', es: 'Espanhol', fr: 'Francês', de: 'Alemão', it: 'Italiano', ja: 'Japonês', ko: 'Coreano', zh: 'Chinês' }

    const { handleAIResponse } = await import('../../ai.js')
    await reply('🌐 Traduzindo...')
    const resposta = await handleAIResponse(
      `Traduza o seguinte texto para ${nomes[idioma] || idioma}. Responda APENAS com a tradução, sem explicações:\n\n${texto}`
    )
    await sock.sendMessage(from, {
      text: `🌐 *Tradução para ${nomes[idioma] || idioma}:*\n\n${resposta}`,
      quoted: msg
    })
  }
}

export const encurtarUrl = {
  name: 'encurtar',
  aliases: ['url', 'short'],
  description: 'Encurta uma URL',
  category: 'info',
  usage: '!encurtar <url>',
  cooldown: 5,
  async execute({ reply, argStr }) {
    if (!argStr || !argStr.startsWith('http')) return reply('❌ Informe uma URL válida!')
    try {
      const r = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(argStr)}`, { timeout: 8000 })
      await reply(`🔗 *URL Encurtada:*\n\n${r.data}`)
    } catch { await reply('❌ Erro ao encurtar URL.') }
  }
}

export const moeda_conv = {
  name: 'moeda',
  aliases: ['converter', 'cambio'],
  description: 'Converte moedas (USD, EUR, BRL...)',
  category: 'info',
  usage: '!moeda 100 USD BRL',
  cooldown: 10,
  async execute({ reply, args }) {
    const [valor, de, para] = args
    if (!valor || !de || !para) return reply('❌ Use: !moeda 100 USD BRL')
    try {
      const r = await axios.get(`https://api.exchangerate-api.com/v4/latest/${de.toUpperCase()}`, { timeout: 8000 })
      const rate = r.data.rates[para.toUpperCase()]
      if (!rate) return reply('❌ Moeda não encontrada!')
      const resultado = (parseFloat(valor) * rate).toFixed(2)
      await reply(`💱 *Conversão de Moeda*\n\n${valor} ${de.toUpperCase()} = *${resultado} ${para.toUpperCase()}*`)
    } catch { await reply('❌ Erro ao converter moeda.') }
  }
}

export default [clima, cep, wiki]
