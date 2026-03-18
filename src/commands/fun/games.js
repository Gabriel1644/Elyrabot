// ══════════════════════════════════════════════════════════
//  games.js — Mini-jogos e diversão avançada
// ══════════════════════════════════════════════════════════
import axios from 'axios'
import { usersDB } from '../../database.js'

// ── Sessões de jogo ativa
const jogosAtivos = new Map() // jid → state

// ── !trivia ───────────────────────────────────────────────
export const trivia = {
  name: 'trivia',
  aliases: ['pergunta', 'quiz'],
  description: 'Quiz de perguntas aleatórias',
  category: 'games',
  usage: '!trivia',
  cooldown: 5,
  async execute({ reply, from, sock, msg }) {
    try {
      const r = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&lang=pt_BR', { timeout: 8000 })
      const q = r.data.results?.[0]
      if (!q) return reply('❌ Não consegui buscar pergunta agora.')

      const decode = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#039;/g,"'").replace(/&quot;/g,'"')
      const pergunta    = decode(q.question)
      const corretas    = [decode(q.correct_answer)]
      const incorretas  = q.incorrect_answers.map(decode)
      const todas       = [...corretas, ...incorretas].sort(() => Math.random() - 0.5)
      const letras      = ['A','B','C','D']

      let txt = `🧠 *TRIVIA* — _${decode(q.category)}_\n`
      txt += `🎯 Dificuldade: *${q.difficulty}*\n\n`
      txt += `❓ *${pergunta}*\n\n`
      todas.forEach((op, i) => { txt += `${letras[i]}) ${op}\n` })
      txt += `\n_Responda com A, B, C ou D em 30 segundos_`

      jogosAtivos.set(from, {
        type: 'trivia',
        resposta: letras[todas.indexOf(corretas[0])],
        respostaTexto: corretas[0],
        timeout: setTimeout(() => {
          jogosAtivos.delete(from)
          sock.sendMessage(from, { text: `⏰ Tempo esgotado! A resposta era: *${corretas[0]}*` })
        }, 30000)
      })

      await reply(txt)
    } catch { await reply('❌ Erro ao buscar trivia. Tente novamente.') }
  }
}

export const triviaResposta = {
  name: 'triviaresposta',
  aliases: ['tr'],
  description: 'Interna — processa respostas de trivia',
  category: 'games',
  enabled: false, // não aparece no menu
  async execute({ reply, args, from, usuario }) {
    const jogo = jogosAtivos.get(from)
    if (!jogo || jogo.type !== 'trivia') return
    const r = args[0]?.toUpperCase()
    if (!['A','B','C','D'].includes(r)) return
    clearTimeout(jogo.timeout)
    jogosAtivos.delete(from)
    if (r === jogo.resposta) {
      await reply(`🎉 *CORRETO*, ${usuario}!\nA resposta era *${jogo.respostaTexto}* ✅`)
    } else {
      await reply(`❌ Errou! A resposta correta era *${jogo.respostaTexto}* (${jogo.resposta})`)
    }
  }
}

// ── !forca ────────────────────────────────────────────────
const palavrasForca = [
  'javascript','celular','computador','whatsapp','telefone',
  'inteligencia','programacao','algoritmo','terminal','software',
  'bateria','internet','bluetooth','teclado','monitor'
]

export const forca = {
  name: 'forca',
  aliases: ['hangman'],
  description: 'Jogo da forca',
  category: 'games',
  usage: '!forca (start) ou !forca <letra>',
  cooldown: 3,
  async execute({ reply, from, args, usuario, sock }) {
    const arg = args[0]?.toLowerCase()

    if (!arg || arg === 'start' || arg === 'novo') {
      const palavra = palavrasForca[Math.floor(Math.random() * palavrasForca.length)]
      const estado = {
        type:    'forca',
        palavra,
        erros:   0,
        maxErros: 6,
        acertos: new Set(),
        erradas: new Set(),
      }
      jogosAtivos.set(from, estado)
      return reply(`🎮 *JOGO DA FORCA*\n\n${renderForca(estado)}\n\n_Use !forca <letra> para tentar_`)
    }

    const jogo = jogosAtivos.get(from)
    if (!jogo || jogo.type !== 'forca') return reply('❌ Nenhuma partida ativa! Use !forca start')

    if (arg.length !== 1 || !/[a-záéíóúâêîôûãõç]/.test(arg)) return reply('❌ Envie apenas uma letra!')
    if (jogo.erradas.has(arg) || jogo.acertos.has(arg)) return reply('⚠️ Letra já tentada!')

    if (jogo.palavra.includes(arg)) {
      jogo.acertos.add(arg)
    } else {
      jogo.erros++
      jogo.erradas.add(arg)
    }

    const palavraMostrada = jogo.palavra.split('').map(l => jogo.acertos.has(l) ? l : '_').join(' ')
    const ganhou = !jogo.palavra.split('').some(l => !jogo.acertos.has(l))
    const perdeu = jogo.erros >= jogo.maxErros

    if (ganhou) {
      jogosAtivos.delete(from)
      return reply(`🎉 *GANHOU!* A palavra era: *${jogo.palavra}*`)
    }
    if (perdeu) {
      jogosAtivos.delete(from)
      return reply(`💀 *PERDEU!* A palavra era: *${jogo.palavra}*`)
    }

    await reply(`🎮 *FORCA*\n\n${renderForca(jogo)}\n\n📝 Palavra: \`${palavraMostrada}\`\n❌ Erradas: ${[...jogo.erradas].join(' ')}`)
  }
}

function renderForca(j) {
  const figs = [
    '  ╔═══╗\n  ║   ║\n  ║\n  ║\n  ╚═════',
    '  ╔═══╗\n  ║   ║\n  ║   😶\n  ║\n  ╚═════',
    '  ╔═══╗\n  ║   ║\n  ║   😶\n  ║   |\n  ╚═════',
    '  ╔═══╗\n  ║   ║\n  ║   😶\n  ║  /|\n  ╚═════',
    '  ╔═══╗\n  ║   ║\n  ║   😶\n  ║  /|\\\n  ╚═════',
    '  ╔═══╗\n  ║   ║\n  ║   😶\n  ║  /|\\\n  ╚══/══',
    '  ╔═══╗\n  ║   ║\n  ║   😵\n  ║  /|\\\n  ╚══/ \\',
  ]
  return figs[Math.min(j.erros, 6)] + `\n\n❤️ Vidas: ${j.maxErros - j.erros}/${j.maxErros}`
}

// ── !roulette ─────────────────────────────────────────────
export const roleta = {
  name: 'roleta',
  aliases: ['roulette', 'russianroulette'],
  description: 'Roleta russa — perde quem cair',
  category: 'games',
  usage: '!roleta',
  cooldown: 10,
  async execute({ reply, usuario, sock, from, userId, msg }) {
    const balaEm = Math.floor(Math.random() * 6) + 1
    const tiro   = Math.floor(Math.random() * 6) + 1
    await reply(`🔫 *${usuario}* gira o tambor...\n_clique... clique... clique..._`)
    await new Promise(r => setTimeout(r, 2000))
    if (tiro === balaEm) {
      await reply(`💥 *BANG!* ${usuario} foi eliminado! 😵`)
    } else {
      await reply(`✅ *CLICK!* ${usuario} sobreviveu! (${tiro}/${balaEm}) 😅`)
    }
  }
}

// ── !adivinhar ────────────────────────────────────────────
export const adivinhar = {
  name: 'adivinhar',
  aliases: ['numgame', 'guess'],
  description: 'Adivinhe o número (1-100)',
  category: 'games',
  usage: '!adivinhar (start) ou !adivinhar <número>',
  cooldown: 3,
  async execute({ reply, from, args }) {
    const arg = parseInt(args[0])

    if (isNaN(arg) || args[0] === 'start' || args[0] === 'novo' || !args[0]) {
      const num = Math.floor(Math.random() * 100) + 1
      jogosAtivos.set(from, { type: 'guess', numero: num, tentativas: 0 })
      return reply(`🎲 *Jogo de Adivinhação!*\n\nPensei em um número de *1 a 100*.\nUse !adivinhar <número> para tentar!\n_Máximo: 7 tentativas_`)
    }

    const jogo = jogosAtivos.get(from)
    if (!jogo || jogo.type !== 'guess') return reply('❌ Nenhuma partida ativa! Use !adivinhar start')

    if (arg < 1 || arg > 100) return reply('❌ Número deve ser entre 1 e 100!')
    jogo.tentativas++

    if (arg === jogo.numero) {
      jogosAtivos.delete(from)
      return reply(`🎉 *ACERTOU!* O número era *${jogo.numero}*!\nTentativas: *${jogo.tentativas}*`)
    }

    if (jogo.tentativas >= 7) {
      jogosAtivos.delete(from)
      return reply(`❌ Acabaram as tentativas! O número era *${jogo.numero}*`)
    }

    const hint = arg < jogo.numero ? '📈 Maior' : '📉 Menor'
    await reply(`${hint}! (Tentativa ${jogo.tentativas}/7)`)
  }
}

// ── !verdade ──────────────────────────────────────────────
const verdades = [
  'Qual é sua maior vergonha?', 'Você já mentiu para um amigo próximo?',
  'Qual é o crush secreto do grupo?', 'Qual foi a pior coisa que você já fez?',
  'Você já fez algo ilegal? O quê?', 'Qual é seu maior medo?',
  'Você já tirou foto de alguém sem permissão?', 'Qual é sua maior insegurança?',
  'Já leu o diário ou conversas de alguém sem permissão?', 'Qual é a mentira mais absurda que contou?',
]
const desafios = [
  'Imite o animal favorito do membro mais quieto do grupo!',
  'Mande uma selfie com uma cara feia agora!',
  'Escreva um poema de amor para o bot!',
  'Fique 10 minutos sem usar o celular!',
  'Mande um áudio cantando uma música!',
  'Escreva uma mensagem usando só emojis!',
  'Chame alguém do grupo de "rei/rainha" por 5 mensagens seguidas!',
  'Conte uma piada que você inventou agora!',
  'Mande uma foto do seu quarto neste momento!',
  'Imite a voz do dono do bot numa mensagem de áudio!',
]

export const vod = {
  name: 'vod',
  aliases: ['verdadeoudesafio', 'vd'],
  description: 'Verdade ou Desafio aleatório',
  category: 'games',
  usage: '!vod [verdade/desafio]',
  cooldown: 5,
  async execute({ reply, args, usuario }) {
    const escolha = args[0]?.toLowerCase()
    let tipo, item
    if (escolha === 'verdade' || escolha === 'v') {
      tipo = '🔮 VERDADE'
      item = verdades[Math.floor(Math.random() * verdades.length)]
    } else if (escolha === 'desafio' || escolha === 'd') {
      tipo = '🎯 DESAFIO'
      item = desafios[Math.floor(Math.random() * desafios.length)]
    } else {
      const isV = Math.random() < 0.5
      tipo = isV ? '🔮 VERDADE' : '🎯 DESAFIO'
      item = isV
        ? verdades[Math.floor(Math.random() * verdades.length)]
        : desafios[Math.floor(Math.random() * desafios.length)]
    }
    await reply(`${tipo} para *${usuario}*:\n\n_${item}_`)
  }
}

// ── !contador ─────────────────────────────────────────────
const contadores = new Map()
export const contador = {
  name: 'contador',
  aliases: ['count', 'contar'],
  description: 'Contador compartilhado no grupo',
  category: 'games',
  usage: '!contador [+/-/reset/ver]',
  cooldown: 2,
  async execute({ reply, from, args }) {
    const op  = args[0] || '+'
    const cur = contadores.get(from) || 0
    let novo = cur
    if (op === '+' || op === 'mais') novo++
    else if (op === '-' || op === 'menos') novo = Math.max(0, cur - 1)
    else if (op === 'reset' || op === 'zerar') novo = 0
    contadores.set(from, novo)
    await reply(`🔢 Contador: *${novo}*`)
  }
}

export default [trivia, forca, roleta, adivinhar, vod, contador]
