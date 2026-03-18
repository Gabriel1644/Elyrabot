const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  name: 'spam',
  aliases: ['spamar'],
  description: 'Marca uma pessoa 15 vezes',
  category: 'fun',
  usage: '!spam @pessoa',
  cooldown: 30,
  async execute(ctx) {
    const { mention, reply, sock, remoteJid } = ctx;

    try {
      if (!mention || mention.length === 0) {
        return await reply('❌ Marque uma pessoa para spamar!');
      }

      const targetJid = mention[0];
      const targetNumber = targetJid.split('@')[0];

      await reply('😈 Iniciando a sessão de spam...');

      for (let i = 0; i < 15; i++) {
        await sock.sendMessage(remoteJid, { 
          text: `@${targetNumber}`, 
          mentions: [targetJid] 
        });

        await delay(2000);
      }
      
    } catch (error) {
      console.error('[Erro no comando SPAM]:', error);
      if (reply) await reply('❌ Ocorreu um erro ao tentar spamar.');
    }
  }
};