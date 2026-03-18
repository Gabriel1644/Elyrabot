import { read_file } from './utils.js';
export default {
  name: 'privarbot',
  aliases: [],
  description: 'Priva o bot de executar comandos ou ler mensagens em um grupo.',
  category: 'admin',
  usage: '!privarbot',
  cooldown: 5,
  async execute({ sock, msg, from, userId, usuario, args, argStr, reply, isAdmin, isOwner }) {
    if (!isOwner) return reply('Apenas o dono pode usar este comando.');
    const gruposPrivados = await read_file('gruposPrivados.json');
    if (gruposPrivados.includes(from)) {
      const index = gruposPrivados.indexOf(from);
      gruposPrivados.splice(index, 1);
      await write_file('gruposPrivados.json', JSON.stringify(gruposPrivados));
      reply('O bot foi reativado neste grupo.');
    } else {
      gruposPrivados.push(from);
      await write_file('gruposPrivados.json', JSON.stringify(gruposPrivados));
      reply('O bot foi privado neste grupo.');
    }
  }
};