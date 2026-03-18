export default {
  name: 'subdono',
  aliases: ['subdonos', 'adms'],
  description: 'Adiciona ou remove um subdono',
  category: 'config',
  usage: '!subdono [add/remove] @usuario',
  cooldown: 5,
  async execute(ctx) {
    try {
      const { sock, msg, from, userId, usuario, isGrupo, nomeGrupo, membros, args, argStr, texto, prefix, reply, isAdmin, isOwner, botJid, gdata, sendText, sendImage, sendSticker, sendAudio, react, mention } = ctx
      if (!isAdmin && !isOwner) return reply('Apenas administradores e donos podem usar este comando.')
      if (args.length < 2) return reply('Use: !subdono [add/remove] @usuario')
      const action = args[0].toLowerCase()
      const mentionado = mention[0]
      if (!mentionado) return reply('Mencione o usuário que deseja adicionar ou remover como subdono.')
      const subdonos = await usersDB.getSubdonos()
      if (action === 'add') {
        if (subdonos.includes(mentionado)) return reply('Este usuário já é subdono.')
        await usersDB.addSubdono(mentionado)
        reply(`@${mentionado} agora é subdono.`)
      } else if (action === 'remove') {
        if (!subdonos.includes(mentionado)) return reply('Este usuário não é subdono.')
        await usersDB.removeSubdono(mentionado)
        reply(`@${mentionado} não é mais subdono.`)
      } else {
        reply('Use: !subdono [add/remove] @usuario')
      }
    } catch (error) {
      console.error(error)
      reply('Ocorreu um erro ao executar o comando.')
    }
  }
}