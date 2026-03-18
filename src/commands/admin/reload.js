import { loadCommands } from '../../loader.js'

export default {
  name: 'reload',
  aliases: ['recarregar', 'refresh'],
  description: 'Recarrega todos os comandos do bot',
  category: 'owner',
  usage: '!reload',
  async execute({ reply, isOwner }) {
    if (!isOwner) return reply('❌ Apenas o dono pode usar este comando.')
    
    try {
      await reply('♻️ Recarregando comandos...')
      const total = await loadCommands()
      await reply(`✅ *${total}* comandos recarregados com sucesso!`)
    } catch (e) {
      await reply(`❌ Erro ao recarregar: ${e.message}`)
    }
  }
}
