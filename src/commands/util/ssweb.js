export default {
  name: 'ssweb',
  aliases: [],
  description: 'Diagnóstico IA',
  category: 'info',
  usage: '!ssweb',
  cooldown: 5,
  async execute({ sock, msg, from, userId, usuario, args, argStr, reply }) {
    try {
      // código aqui
      reply('Diagnóstico IA: O erro "reply is not defined" ocorre porque a variável "reply" não foi declarada ou inicializada no escopo do código que está sendo executado.')
    } catch (error) {
      console.error(error)
    }
  }
}