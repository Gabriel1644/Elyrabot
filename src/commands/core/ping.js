import { getUptime } from '../../utils.js'

export default {
  name: 'ping',
  aliases: ['p', 'pong', 'latencia', 'status'],
  description: 'Testa latência e status do bot',
  category: 'core',
  usage: '.ping',
  cooldown: 5,
  async execute({ sock, from, msg, reply }) {
    const t0 = Date.now()
    const m  = process.memoryUsage()
    const mb = (b) => (b / 1024 / 1024).toFixed(1)

    // Mede latência do envio
    await reply('🏓 _calculando..._')
    const lat = Date.now() - t0

    const emoji = lat < 300 ? '🟢' : lat < 700 ? '🟡' : '🔴'

    await sock.sendMessage(from, {
      text:
        `🏓 *Pong!*\n\n` +
        `${emoji} Latência: *${lat}ms*\n` +
        `⏱️ Uptime: *${getUptime()}*\n` +
        `💾 RAM: *${mb(m.heapUsed)}MB / ${mb(m.heapTotal)}MB*\n` +
        `📡 RSS: *${mb(m.rss)}MB*`,
      quoted: msg,
    })
  }
}
