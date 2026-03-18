export const dado = {
  name: 'dado',
  aliases: ['dice', 'd'],
  description: 'Rola um dado (d6, d20, 2d10...)',
  category: 'fun',
  usage: '!dado [NdX]',
  cooldown: 2,
  async execute({ reply, argStr }) {
    let n = 1, lados = 6
    const m = argStr.match(/^(\d+)?d(\d+)$/i)
    if (m) { n = parseInt(m[1] || 1); lados = parseInt(m[2]) }
    if (n > 20 || lados > 1000) return reply('❌ Máximo: 20d1000')
    const resultados = Array.from({ length: n }, () => Math.floor(Math.random() * lados) + 1)
    const soma = resultados.reduce((a, b) => a + b, 0)
    const linha = resultados.map(r => `🎲 ${r}`).join('  ')
    await reply(`${linha}\n\n${n > 1 ? `📊 Soma: *${soma}*` : ''}`)
  }
}

export const moeda = {
  name: 'moeda',
  aliases: ['coin', 'flip'],
  description: 'Cara ou coroa',
  category: 'fun',
  usage: '!moeda',
  cooldown: 2,
  async execute({ reply }) {
    const r = Math.random() < 0.5
    await reply(r ? '🪙 *CARA!*' : '🪙 *COROA!*')
  }
}

export const escolher = {
  name: 'escolher',
  aliases: ['choose', 'sorteio'],
  description: 'Escolhe entre opções separadas por vírgula',
  category: 'fun',
  usage: '!escolher pizza, hamburguer, sushi',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Dê opções separadas por vírgula!\nEx: !escolher pizza, sushi, hambúrguer')
    const ops = argStr.split(',').map(s => s.trim()).filter(Boolean)
    if (ops.length < 2) return reply('❌ Dê pelo menos 2 opções!')
    const escolha = ops[Math.floor(Math.random() * ops.length)]
    await reply(`🎯 A minha escolha é:\n\n✨ *${escolha}* ✨`)
  }
}

export const oito = {
  name: '8ball',
  aliases: ['bola8', 'bola'],
  description: 'A bola 8 mágica responde sua pergunta',
  category: 'fun',
  usage: '!8ball <pergunta>',
  cooldown: 3,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Faça uma pergunta!')
    const respostas = [
      '🟢 Com certeza!', '🟢 Definitivamente sim!', '🟢 Pode apostar que sim!',
      '🟢 Sinais apontam que sim.', '🟡 Tente novamente mais tarde.',
      '🟡 Não posso prever agora.', '🟡 Melhor não te dizer.',
      '🔴 Não conte com isso.', '🔴 Minha resposta é não.', '🔴 Definitivamente não!',
      '🔴 As perspectivas não são boas.', '🟡 Concentre-se e pergunte de novo.'
    ]
    const r = respostas[Math.floor(Math.random() * respostas.length)]
    await reply(`🎱 *Bola 8 Mágica*\n\n❓ ${argStr}\n\n${r}`)
  }
}

export const piada = {
  name: 'piada',
  aliases: ['joke', 'lol'],
  description: 'Conta uma piada aleatória',
  category: 'fun',
  usage: '!piada',
  cooldown: 5,
  async execute({ reply }) {
    const piadas = [
      ['Por que o computador foi ao médico?', 'Porque estava com vírus! 🦠'],
      ['O que o zero disse pro oito?', 'Belo cinto! 🪢'],
      ['Por que o livro de matemática é tão triste?', 'Porque tem muitos problemas! 📚'],
      ['Como chama um peixe sem olho?', 'Pxe! 🐟'],
      ['Por que o espantalho ganhou um prêmio?', 'Porque era excepcional no seu campo! 🌾'],
      ['O que o oceano disse para a praia?', 'Nada, só acenou! 🌊'],
      ['Por que o programador usa óculos?', 'Porque ele não consegue C#! 👓'],
      ['Qual o animal mais antigo?', 'A zebra, porque está em preto e branco! 🦓'],
    ]
    const [p, r] = piadas[Math.floor(Math.random() * piadas.length)]
    await reply(`😂 *Piada do Dia*\n\n${p}\n\n_${r}_`)
  }
}

export const verdadeoudesafio = {
  name: 'vod',
  aliases: ['vdd', 'verdadeoudesafio', 'tod'],
  description: 'Verdade ou desafio aleatório',
  category: 'fun',
  usage: '!vod [verdade|desafio]',
  cooldown: 3,
  async execute({ reply, argStr }) {
    const verdades = [
      'Qual foi a coisa mais estranha que você já comeu?',
      'Você já fingiu estar doente para não ir a algum lugar?',
      'Qual é o seu maior medo que nunca contou pra ninguém?',
      'Você já mandou mensagem para a pessoa errada?',
      'Qual foi o pior presente que você já recebeu?',
    ]
    const desafios = [
      'Imite um animal por 30 segundos com áudio!',
      'Mande uma foto fazendo uma careta engraçada!',
      'Escreva um poema de 4 linhas sobre o grupo agora!',
      'Mande uma mensagem de voz cantando parabéns!',
      'Escreva com os olhos fechados: "Eu amo o grupo"',
    ]

    const tipo = argStr.toLowerCase() === 'desafio' ? 'desafio'
      : argStr.toLowerCase() === 'verdade' ? 'verdade'
      : Math.random() < 0.5 ? 'verdade' : 'desafio'

    if (tipo === 'verdade') {
      const v = verdades[Math.floor(Math.random() * verdades.length)]
      await reply(`🔵 *VERDADE*\n\n❓ ${v}`)
    } else {
      const d = desafios[Math.floor(Math.random() * desafios.length)]
      await reply(`🔴 *DESAFIO*\n\n🎯 ${d}`)
    }
  }
}

export const sortearmembro = {
  name: 'sortear',
  aliases: ['random', 'randomuser'],
  description: 'Sorteia um membro do grupo',
  category: 'fun',
  usage: '!sortear',
  cooldown: 5,
  async execute({ reply, membros, isGrupo, mention, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!membros.length) return reply('❌ Não consegui obter a lista de membros.')
    const m = membros[Math.floor(Math.random() * membros.length)]
    await mention([m.id], `🎰 *Sorteio do grupo!*\n\nO sortudo é: @${m.id.split('@')[0]} 🎉`)
  }
}

export const calcular = {
  name: 'calc',
  aliases: ['calcular', 'math'],
  description: 'Calcula uma expressão matemática',
  category: 'fun',
  usage: '!calc 2+2*5',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Dê uma expressão! Ex: !calc 2+2')
    try {
      const expr = argStr.replace(/[^0-9+\-*/.()%^ ]/g, '')
      // eslint-disable-next-line no-new-func
      const res = Function(`"use strict"; return (${expr})`)()
      if (!isFinite(res)) return reply('❌ Resultado inválido!')
      await reply(`🧮 *${argStr}*\n\n= *${res}*`)
    } catch {
      await reply('❌ Expressão inválida!')
    }
  }
}

export const gerarsenha = {
  name: 'senha',
  aliases: ['password', 'gerarsenha'],
  description: 'Gera uma senha aleatória segura',
  category: 'fun',
  usage: '!senha [tamanho]',
  cooldown: 3,
  async execute({ reply, args }) {
    const tam = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
    const senha = Array.from({ length: tam }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    await reply(`🔐 *Senha Gerada (${tam} caracteres):*\n\n\`${senha}\`\n\n_Não compartilhe esta mensagem!_`)
  }
}

// Default export (todos)
export default [oito, verdadeoudesafio, sortearmembro]
