export default {
  name: 'ssweb',
  aliases: ['printsite'],
  description: 'Pega uma screenshot de um site',
  category: 'util',
  usage: '!ssweb <link>',
  cooldown: 5,
  async execute(ctx) {
    try {
      const { sendImage, reply, args, msg } = ctx
      if (!args[0]) return reply('Cade o link?')
      const link = args.join(' ')
      await sendImage({
        url: `https://image.thum.io/get/fullpage/${link}`,
      }, { quoted: msg })
    } catch (e) {
      console.error(e)
      reply('❌ Ocorreu um erro interno. Tente novamente em alguns minutos.')
    }
  }
}