import { handleAIResponse, clearHistory, getHistorySize } from '../../ai.js'
import { CONFIG } from '../../config.js'
import { groupsDB } from '../../database.js'

export default {
  name: 'ia',
  aliases: ['ai', 'gpt', 'ask', 'elyra'],
  description: 'Faz uma pergunta para a IA',
  category: 'ia',
  usage: '!ia <pergunta>',
  cooldown: 4,
  async execute({ reply, argStr, from, sock, msg, isAdmin }) {
    // !ia on/off
    if (argStr === 'on' || argStr === 'off') {
      if (!isAdmin) return reply('❌ Apenas admins podem ativar/desativar a IA no grupo.')
      const gd = groupsDB.get(from, {})
      gd.iaAtiva = argStr === 'on'
      groupsDB.set(from, gd)
      return reply(`🤖 IA ${argStr === 'on' ? 'ativada' : 'desativada'} neste grupo!\n${argStr === 'on' ? 'Me marque ou use !ia <pergunta>' : ''}`)
    }

    // !ia limpar
    if (argStr === 'limpar' || argStr === 'clear') {
      clearHistory(from)
      return reply('🧹 Histórico de conversa limpo!')
    }

    // !ia memoria
    if (argStr === 'memoria' || argStr === 'memory') {
      return reply(`🧠 Histórico: *${getHistorySize(from)} mensagens* em memória.`)
    }

    if (!argStr) {
      return reply(`Olá! Use *!ia <sua pergunta>* para conversar comigo.\n\nEx: *!ia qual a capital da França?*\n\nComandos extras:\n• *!ia on/off* — ativa/desativa no grupo\n• *!ia limpar* — limpa o histórico`)
    }

    await reply('🤔 Pensando...')
    const resposta = await handleAIResponse(argStr, from)
    await sock.sendMessage(from, {
      text: `✦ *${CONFIG.nome}*\n\n${resposta}`,
      quoted: msg
    })
  }
}
