import { CONFIG } from '../../config.js'
import { configDB } from '../../database.js'

export default {
  name: 'sugestao',
  aliases: ['sugestão'],
  description: 'Envie uma sugestão para a equipe do bot',
  category: 'info',
  usage: '!sugestao <sugestão>',
  cooldown: 5,
  enabled: true,
  
  async execute(ctx) {
    try {
      const { sock, msg, from, userId, usuario, isGrupo, args, prefix, reply, sendText, react } = ctx

      const sugestao = args.join(' ').trim()

      if (!sugestao) {
        return reply(`💡 Digite sua sugestão!\n\nExemplo: *${prefix}sugestao comando de modificar áudio*`)
      }

      // Busca apenas o nome do bot
      const data = await configDB.get('data', {})
      const nomeBot = data.NomeBot || 'FAATAL MD'

      // JID fixo do grupo que vai receber as sugestões
      const jidDestino = '120363423212175192@g.us'

      const nomeUsuario = usuario?.pushName || 'Desconhecido'
      const numeroUsuario = userId.split('@')[0]
      
      // Tratamento seguro para pegar o nome do grupo de origem
      let origemNome = 'Privado'
      if (isGrupo) {
        const metadata = await sock.groupMetadata(from).catch(() => null)
        origemNome = metadata?.subject || 'Grupo Desconhecido'
      }

      const mensagem =
        `╭━━━〔 💡 NOVA SUGESTÃO 〕━━━╮
┃
┃ 👤 Usuário » ${nomeUsuario}
┃ 📱 Contato » wa.me/${numeroUsuario}
┃ 👥 Origem » ${origemNome}
┃
┃ 💬 Sugestão enviada:
┃ ${sugestao}
┃
╰━━━━━━━━━━━━━━━━━━━━╯
> ${nomeBot}`

      // Dispara a mensagem para o grupo de sugestões
      await sock.sendMessage(jidDestino, { text: mensagem })

      // Retorno para o usuário que enviou
      await sendText('✅ Sugestão enviada com sucesso!\n\n💡 Obrigado pela sua contribuição!', { quoted: msg })
      await react('💡')

    } catch (e) {
      console.error('Erro no comando sugestao:', e)
      ctx.reply('❌ Erro ao enviar sugestão. Tente novamente!')
    }
  }
}
