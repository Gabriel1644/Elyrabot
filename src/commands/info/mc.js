import axios from 'axios'

const HOST = 'UspcdDumine.aternos.me'
const PORT = 38404

function cleanMotd(motd) {
  if (!motd) return 'Sem descrição'
  if (Array.isArray(motd.clean)) return motd.clean.join(' ')
  return 'Sem descrição'
}

export default {
  name: 'mc',
  aliases: ['statusmc'],
  category: 'info',
  description: 'Status do servidor fixo',
  cooldown: 5,

  async execute({ reply, react }) {
    await react('⏳')

    try {
      const { data } = await axios.get(
        `https://api.mcsrvstat.us/3/${HOST}:${PORT}`
      )

      if (!data.online) {
        await react('❌')
        return reply(
          `🔴 OFFLINE\n🌐 ${HOST}:${PORT}`
        )
      }

      const players = data.players?.online ?? 0
      const max = data.players?.max ?? 0
      const version = data.version || 'Desconhecida'
      const motd = cleanMotd(data.motd)

      await react('✅')

      return reply(
        `🟢 ONLINE\n` +
        `👥 ${players}/${max}\n` +
        `📦 ${version}\n` +
        `📝 ${motd}\n` +
        `🌐 ${HOST}:${PORT}`
      )

    } catch (e) {
      await react('❌')
      return reply('❌ Deu erro nessa porra, servidor caiu ou API morreu')
    }
  }
}
