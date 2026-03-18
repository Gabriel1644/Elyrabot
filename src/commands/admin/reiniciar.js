export default {
  name: 'reiniciar',
  aliases: ['restart'],
  description: 'Reinicia o bot',
  category: 'owner',
  usage: '!reiniciar',
  cooldown: 0,
  enabled: true,
  async execute(ctx) {
    const { sock, msg, reply, isOwner } = ctx
    if (!isOwner) return reply('Apenas o dono do bot pode usar este comando')
    try {
      await reply('Reiniciando...')
      process.exit(0)
    } catch (e) {
      await reply('Erro ao reiniciar: ' + e.message)
    }
  }
}