import { exec } from 'child_process';
export default {
  name: 'videoToAudio',
  aliases: ['v2a'],
  description: 'Converte vídeo para áudio no formato Opus',
  category: 'media',
  usage: '!videoToAudio <url_do_vídeo>',
  cooldown: 10,
  async execute({ sock, msg, from, userId, usuario, args, argStr, reply, isAdmin, isOwner }) {
    try {
      const url = args[0];
      const comando = `ffmpeg -i ${url} -c:a libopus output.opus`;
      exec(comando, (error, stdout, stderr) => {
        if (error) {
          reply('Erro ao converter vídeo para áudio');
        } else {
          reply('Vídeo convertido com sucesso');
        }
      });
    } catch (error) {
      reply('Erro ao converter vídeo para áudio');
    }
  }
};