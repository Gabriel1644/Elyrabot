import { CONFIG } from '../../config.js'
import { getUptime } from '../../utils.js'
import { statsDB } from '../../database.js'
import { commandMap } from '../../loader.js'

export default {
  name: 'info',
  aliases: ['botinfo', 'status'],
  description: 'Informações sobre o bot',
  category: 'core',
  usage: '!info',
  cooldown: 10,
  async execute({ reply }) {
    const stats = statsDB.get('total', {})
    const mem   = process.memoryUsage()
    const mb    = (b) => (b / 1024 / 1024).toFixed(1)

    await reply(
`╭─── 🤖 *${CONFIG.nome}* ───╮
│
│ 📦 Versão: *${CONFIG.versao}*
│ ⏱️ Uptime: *${getUptime()}*
│ 📊 Msgs processadas: *${stats.msgs || 0}*
│ 🔧 Comandos carregados: *${commandMap.size}*
│
│ ─── 💾 Memória ───
│ Heap: *${mb(mem.heapUsed)}MB / ${mb(mem.heapTotal)}MB*
│ RSS:  *${mb(mem.rss)}MB*
│
│ 🔑 Prefixo: *${CONFIG.prefixo}*
│ 🧠 Modelo IA: *${CONFIG.modelo}*
│ 📡 Dashboard: *localhost:${CONFIG.dashboardPort}*
│
╰──────────────────────╯`
    )
  }
}
