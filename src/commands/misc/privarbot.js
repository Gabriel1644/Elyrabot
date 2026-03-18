import { read_file } from '../utils.js';
export default {
  name: 'privarbot',
  aliases: [],
  description: 'Privar o bot de executar comandos ou ler mensagens em um grupo.',
  category: 'owner',
  usage: '!privarbot',
  cooldown: 0,
  async execute({ sock, msg, from, userId, usuario, args, argStr, reply, isAdmin, isOwner }) {
    if (!isOwner) return reply('Apenas o dono pode usar este comando.');
    const gruposPrivados = read_file('gruposPrivados.json');
    if (gruposPrivados.includes(from)) {
      const index = gruposPrivados.indexOf(from);
      gruposPrivados.splice(index, 1);
      write_file(JSON.stringify(gruposPrivados), 'gruposPrivados.json');
      reply('O bot foi reativado neste grupo.');
    } else {
      gruposPrivados.push(from);
      write_file(JSON.stringify(gruposPrivados), 'gruposPrivados.json');
      reply('O bot foi privado neste grupo.');
    }
  }
};