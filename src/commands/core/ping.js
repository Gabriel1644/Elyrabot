export default {
  name: 'ping',
  aliases: ['p'],
  description: 'Testa latência do bot',
  category: 'core',
  usage: '!ping',
  cooldown: 3,
  async execute({ sock, from, msg, reply }) {
    const t = Date.now()
    const sent = await reply('🏓 Calculando...')
    const lat  = Date.now() - t
    await sock.sendMessage(from, {
      text: `🏓 *Pong!*\n⚡ Latência: *${lat}ms*`,
      edit: sent.key
    })
  }
}
