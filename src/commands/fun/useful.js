// ══════════════════════════════════════════════════════════
//  useful.js — Comandos úteis do dia a dia
// ══════════════════════════════════════════════════════════
import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// ── !lembrete ─────────────────────────────────────────────
const lembretes = new Map()
export const lembrete = {
  name: 'lembrete',
  aliases: ['remind', 'timer', 'alarme'],
  description: 'Cria um lembrete com tempo (ex: 10m, 2h, 1d)',
  category: 'tools',
  usage: '!lembrete <tempo> <mensagem>  (ex: !lembrete 30m reunião)',
  cooldown: 5,
  async execute({ reply, sock, from, msg, args, userId, usuario }) {
    if (!args[0]) return reply('❌ Uso: !lembrete 30m texto\nFormatos: 10s, 5m, 2h, 1d')
    const tempoStr = args[0].toLowerCase()
    const texto    = args.slice(1).join(' ')
    if (!texto) return reply('❌ Informe o texto do lembrete!')

    const match = tempoStr.match(/^(\d+)(s|m|h|d)$/)
    if (!match) return reply('❌ Formato inválido! Use: 30s, 5m, 2h, 1d')

    const [, n, u] = match
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
    const ms   = parseInt(n) * mult[u]
    if (ms > 7 * 86400000) return reply('❌ Máximo: 7 dias!')
    if (ms < 5000)         return reply('❌ Mínimo: 5 segundos!')

    const id = `${userId}_${Date.now()}`
    const timeout = setTimeout(async () => {
      lembretes.delete(id)
      await sock.sendMessage(from, {
        text: `⏰ *Lembrete!*\n\n${texto}\n\n_Definido por ${usuario}_`,
        quoted: msg
      }).catch(() => {})
    }, ms)

    lembretes.set(id, { texto, timeout, userId, from, ts: Date.now() + ms })
    const dispStr = { s: 'segundo', m: 'minuto', h: 'hora', d: 'dia' }
    await reply(`⏰ Lembrete criado!\n\n_"${texto}"_\n\n🕐 Em ${n} ${dispStr[u]}${n > 1 ? 's' : ''}`)
  }
}

// ── !sorteio / !rifa ──────────────────────────────────────
export const sorteio = {
  name: 'sorteio',
  aliases: ['rifa', 'sortear'],
  description: 'Sorteia entre os membros do grupo ou entre opções',
  category: 'fun',
  usage: '!sorteio [opção1, opção2] ou !sorteio (sorteia membro)',
  cooldown: 5,
  async execute({ reply, sock, from, msg, argStr, membros, usuario }) {
    if (argStr) {
      const opts = argStr.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
      if (opts.length < 2) return reply('❌ Dê pelo menos 2 opções separadas por vírgula.')
      const vencedor = opts[Math.floor(Math.random() * opts.length)]
      return reply(`🎲 *SORTEIO*\n\nOpções: ${opts.join(', ')}\n\n🏆 Vencedor: *${vencedor}*!`)
    }
    if (!membros?.length) return reply('❌ Use em um grupo para sortear membros.')
    const humanos = membros.filter(m => !m.id.includes('00000000'))
    const sorteado = humanos[Math.floor(Math.random() * humanos.length)]
    const num = sorteado.id.split('@')[0].split(':')[0]
    await sock.sendMessage(from, {
      text: `🎲 *SORTEIO*\n\n🏆 Parabéns @${num}! Você foi sorteado(a) por *${usuario}*! 🎉`,
      mentions: [sorteado.id],
      quoted: msg
    })
  }
}

// ── !enquete ──────────────────────────────────────────────
const enquetes = new Map()
export const enquete = {
  name: 'enquete',
  aliases: ['poll', 'votacao'],
  description: 'Cria uma enquete no grupo',
  category: 'fun',
  usage: '!enquete <pergunta> | opção1 | opção2 | ...',
  cooldown: 10,
  async execute({ reply, sock, from, msg, argStr, isAdmin, isOwner }) {
    if (!argStr) return reply('❌ Uso: !enquete Qual melhor pizza? | Calabresa | Frango | Margherita')
    const parts = argStr.split('|').map(s => s.trim()).filter(Boolean)
    if (parts.length < 3) return reply('❌ Forneça a pergunta e pelo menos 2 opções separadas por |')

    const pergunta = parts[0]
    const opcoes   = parts.slice(1, 10)
    const emojis   = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣']
    const votos    = Object.fromEntries(opcoes.map((_, i) => [i, 0]))

    enquetes.set(from, { pergunta, opcoes, votos, criadores: [], encerrada: false })

    let txt = `📊 *ENQUETE*\n\n❓ ${pergunta}\n\n`
    opcoes.forEach((o, i) => { txt += `${emojis[i]} ${o}\n` })
    txt += `\n_Vote respondendo com o número (1-${opcoes.length})_\n_!encerrarenquete para encerrar_`

    await reply(txt)
  }
}

export const votoEnquete = {
  name: 'voto',
  aliases: ['votar', 'v'],
  description: 'Vota em uma enquete ativa',
  category: 'fun',
  usage: '!voto <número>',
  cooldown: 0,
  async execute({ reply, from, userId, args }) {
    const eq = enquetes.get(from)
    if (!eq || eq.encerrada) return reply('❌ Nenhuma enquete ativa.')
    const n = parseInt(args[0]) - 1
    if (isNaN(n) || n < 0 || n >= eq.opcoes.length) return reply(`❌ Vote entre 1 e ${eq.opcoes.length}`)
    if (eq.criadores.includes(userId)) return reply('⚠️ Você já votou!')
    eq.criadores.push(userId)
    eq.votos[n]++
    await reply(`✅ Voto registrado: *${eq.opcoes[n]}*`)
  }
}

export const encerrarEnquete = {
  name: 'encerrarenquete',
  aliases: ['fecharenquete', 'resultadoenquete'],
  description: 'Encerra e mostra resultado da enquete',
  category: 'fun',
  usage: '!encerrarenquete',
  cooldown: 5,
  async execute({ reply, from }) {
    const eq = enquetes.get(from)
    if (!eq) return reply('❌ Nenhuma enquete ativa.')
    eq.encerrada = true
    const total = Object.values(eq.votos).reduce((a, b) => a + b, 0)
    if (!total) return reply('📊 Enquete encerrada sem votos.')
    const sorted = Object.entries(eq.votos)
      .sort((a, b) => b[1] - a[1])
    let txt = `📊 *RESULTADO DA ENQUETE*\n\n❓ ${eq.pergunta}\n\n`
    const emojis = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣']
    sorted.forEach(([idx, votos], i) => {
      const pct = total ? Math.round(votos * 100 / total) : 0
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10))
      txt += `${emojis[i]} *${eq.opcoes[idx]}*\n   [${bar}] ${pct}% (${votos} votos)\n\n`
    })
    txt += `_Total: ${total} votos_`
    await reply(txt)
    enquetes.delete(from)
  }
}

// ── !sticker animado ──────────────────────────────────────
export const texto2fala = {
  name: 'tts',
  aliases: ['falar', 'speak', 'voz'],
  description: 'Converte texto em áudio de voz',
  category: 'tools',
  usage: '!tts <texto>',
  cooldown: 10,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr) return reply('❌ Informe o texto!')
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(argStr.substring(0,200))}&tl=pt-BR&client=tw-ob`
      await sock.sendMessage(from, {
        audio: { url },
        mimetype: 'audio/mpeg',
        ptt: true
      }, { quoted: msg })
    } catch { await reply('❌ Erro ao gerar áudio.') }
  }
}

// ── !resumo (resume texto com IA) ─────────────────────────
export const resumo = {
  name: 'resumo',
  aliases: ['resumir', 'tldr', 'summary'],
  description: 'Resume um texto longo usando IA',
  category: 'ia',
  usage: '!resumo <texto ou responda uma mensagem>',
  cooldown: 10,
  async execute({ reply, argStr, msg }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const textoParaResumir = argStr || quoted?.conversation || quoted?.extendedTextMessage?.text
    if (!textoParaResumir) return reply('❌ Forneça um texto ou responda uma mensagem!')
    if (textoParaResumir.length < 100) return reply('⚠️ Texto muito curto para resumir!')
    await reply('🤖 _Resumindo..._')
    try {
      const { handleAIResponse } = await import('../../ai.js')
      const resp = await handleAIResponse(
        `Faça um resumo conciso e objetivo do seguinte texto em português:\n\n${textoParaResumir.substring(0, 3000)}`
      )
      await reply(`📝 *Resumo:*\n\n${resp}`)
    } catch (e) { await reply(`❌ Erro: ${e.message}`) }
  }
}

// ── !corrigir (corrige texto com IA) ─────────────────────
export const corrigir = {
  name: 'corrigir',
  aliases: ['grammar', 'ortografia', 'revisar'],
  description: 'Corrige gramática e ortografia com IA',
  category: 'ia',
  usage: '!corrigir <texto>',
  cooldown: 8,
  async execute({ reply, argStr, msg }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const texto  = argStr || quoted?.conversation || quoted?.extendedTextMessage?.text
    if (!texto) return reply('❌ Forneça um texto!')
    try {
      const { handleAIResponse } = await import('../../ai.js')
      const resp = await handleAIResponse(
        `Corrija a gramática e ortografia do texto abaixo. Retorne APENAS o texto corrigido, sem explicações:\n\n${texto.substring(0, 2000)}`
      )
      await reply(`✏️ *Texto Corrigido:*\n\n${resp}`)
    } catch (e) { await reply(`❌ Erro: ${e.message}`) }
  }
}

// ── !tabela (cria tabela formatada) ──────────────────────
export const tabela = {
  name: 'tabela',
  aliases: ['table'],
  description: 'Formata dados em tabela de texto',
  category: 'tools',
  usage: '!tabela Nome,Idade,Cidade | João,25,SP | Maria,30,RJ',
  cooldown: 5,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Uso: !tabela Col1,Col2 | Dado1,Dado2 | Dado3,Dado4')
    const linhas = argStr.split('|').map(l => l.trim().split(',').map(c => c.trim()))
    if (linhas.length < 2) return reply('❌ Forneça ao menos cabeçalho e 1 linha de dados!')
    const cols    = linhas[0].length
    const widths  = Array.from({ length: cols }, (_, i) =>
      Math.max(...linhas.map(l => (l[i] || '').length)) + 2
    )
    const sep = '┼' + widths.map(w => '─'.repeat(w)).join('┼') + '┼'
    const row = (cells, isHead = false) => {
      const txt = '│' + cells.map((c, i) => ` ${(c||'').padEnd(widths[i]-1)} `).join('│') + '│'
      return isHead ? `*${txt}*` : txt
    }
    const lines = ['```', sep.replace(/┼/g, '┬')]
    linhas.forEach((l, i) => {
      lines.push(row(l, i === 0))
      if (i === 0) lines.push(sep)
    })
    lines.push(sep.replace(/┼/g, '┴'), '```')
    await reply(lines.join('\n'))
  }
}

// ── !dados (busca de CEP, CNPJ, CPF) ─────────────────────
export const cnpj = {
  name: 'cnpj',
  aliases: ['empresa'],
  description: 'Consulta informações de um CNPJ',
  category: 'info',
  usage: '!cnpj <número>',
  cooldown: 8,
  async execute({ reply, argStr }) {
    const num = (argStr || '').replace(/\D/g, '')
    if (num.length !== 14) return reply('❌ CNPJ deve ter 14 dígitos!')
    try {
      const r = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${num}`, { timeout: 8000 })
      const d = r.data
      await reply(
        `🏢 *${d.razao_social}*\n\n` +
        `📛 Fantasia: ${d.nome_fantasia || 'N/A'}\n` +
        `📍 ${d.municipio} — ${d.uf}\n` +
        `📬 ${d.logradouro || ''}, ${d.numero || ''}\n` +
        `📞 ${d.ddd_telefone_1 || 'N/A'}\n` +
        `📅 Fundado: ${d.data_inicio_atividade || 'N/A'}\n` +
        `✅ Situação: *${d.descricao_situacao_cadastral || 'N/A'}*`
      )
    } catch { await reply('❌ CNPJ não encontrado.') }
  }
}

export const feriados = {
  name: 'feriados',
  aliases: ['feriado', 'holiday'],
  description: 'Lista feriados nacionais do ano',
  category: 'info',
  usage: '!feriados [ano]',
  cooldown: 10,
  async execute({ reply, args }) {
    const ano = args[0] || new Date().getFullYear()
    try {
      const r = await axios.get(`https://brasilapi.com.br/api/feriados/v1/${ano}`, { timeout: 8000 })
      const hoje = new Date()
      const proximos = r.data
        .filter(f => new Date(f.date) >= hoje)
        .slice(0, 8)
      if (!proximos.length) return reply(`📅 Nenhum feriado encontrado para ${ano}.`)
      let txt = `🎉 *Próximos Feriados ${ano}*\n\n`
      proximos.forEach(f => {
        const d = new Date(f.date + 'T00:00:00')
        txt += `📅 ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} — *${f.name}*\n`
      })
      await reply(txt)
    } catch { await reply('❌ Erro ao buscar feriados.') }
  }
}

export const sinonimos = {
  name: 'sinonimos',
  aliases: ['sinonimo', 'antonimo', 'dicio'],
  description: 'Busca sinônimos e definições de palavras',
  category: 'info',
  usage: '!sinonimos <palavra>',
  cooldown: 8,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe uma palavra!')
    try {
      const r = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/pt/${encodeURIComponent(argStr)}`, { timeout: 8000 })
      const d = r.data[0]
      let txt = `📖 *${d.word}*\n\n`
      d.meanings?.slice(0, 3).forEach(m => {
        txt += `_${m.partOfSpeech}_\n`
        m.definitions?.slice(0, 2).forEach(def => {
          txt += `• ${def.definition}\n`
        })
        if (m.synonyms?.length) txt += `Sinônimos: ${m.synonyms.slice(0, 5).join(', ')}\n`
        txt += '\n'
      })
      await reply(txt)
    } catch {
      // Fallback com IA
      try {
        const { handleAIResponse } = await import('../../ai.js')
        const resp = await handleAIResponse(`Defina brevemente a palavra "${argStr}" em português e dê 3 sinônimos.`)
        await reply(`📖 *${argStr}*\n\n${resp}`)
      } catch { await reply('❌ Palavra não encontrada.') }
    }
  }
}

export const aniversario = {
  name: 'aniversario',
  aliases: ['bd', 'birthday', 'parabens'],
  description: 'Manda mensagem de aniversário para alguém',
  category: 'fun',
  usage: '!aniversario @pessoa',
  cooldown: 10,
  async execute({ sock, from, msg, reply, args, usuario, membros }) {
    let alvo = (args[0] || '').replace(/[^0-9]/g, '')
    if (!alvo && membros?.length) {
      const outros = membros.filter(m => !m.id.includes('bot'))
      alvo = outros[Math.floor(Math.random() * outros.length)]?.id?.split('@')[0] || ''
    }
    if (!alvo) return reply('❌ Mencione alguém!')
    const jid = `${alvo}@s.whatsapp.net`
    const msgs = [
      `🎂 *FELIZ ANIVERSÁRIO @${alvo}!* 🎉\n\nQue este novo ciclo seja repleto de alegrias, saúde e realizações! 🥳🎊`,
      `🎈 *Parabéns @${alvo}!* 🎂\n\nQue todos os seus sonhos se realizem neste novo ano de vida! 🌟`,
      `🥳 *Happy Birthday @${alvo}!* 🎁\n\nMuitas felicidades, saúde e sucesso! De ${usuario} com carinho! ❤️`,
    ]
    const txt = msgs[Math.floor(Math.random() * msgs.length)]
    await sock.sendMessage(from, { text: txt, mentions: [jid], quoted: msg })
  }
}

export default [
  lembrete, sorteio, enquete, votoEnquete, encerrarEnquete,
  texto2fala, resumo, corrigir, tabela, cnpj, feriados,
  sinonimos, aniversario
]
