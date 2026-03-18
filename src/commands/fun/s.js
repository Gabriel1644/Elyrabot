export default {
  name: 'figurinha',
  aliases: ['sticker'],
  description: 'Crie uma figurinha a partir de uma imagem ou vídeo',
  category: 'fun',
  usage: '!figurinha [resposta ao arquivo de imagem ou vídeo]',
  cooldown: 5,
  async execute(ctx) {
    try {
      const { sock, msg, from, userId, usuario, isGrupo, nomeGrupo, membros, args, argStr, texto, prefix, reply, isAdmin, isOwner, botJid, gdata, sendText, sendImage, sendSticker, sendAudio, react, mention } = ctx
      if (!msg.quoted) return reply('Responda a uma imagem ou vídeo para criar uma figurinha')
      const quotedMsg = msg.quoted
      if (!quotedMsg.message || !quotedMsg.message.imageMessage && !quotedMsg.message.videoMessage) return reply('Responda a uma imagem ou vídeo para criar uma figurinha')
      const media = quotedMsg.message.imageMessage || quotedMsg.message.videoMessage
      if (!media) return reply('Responda a uma imagem ou vídeo para criar uma figurinha')
      const buffer = await media.download()
      const sticker = await import('wa-sticker').then(m => m.default)
      const result = await sticker(buffer, { pack: 'ElyraBot', author: 'Elyra', crop: true, circle: true })
      await sendSticker(from, result, { key: { remoteJid: from } })
    } catch (e) {
      console.error(e)
      reply('❌ Erro ao criar figurinha: ' + e.message)
    }
  }
}