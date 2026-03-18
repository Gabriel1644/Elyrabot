import { exec } from 'child_process';
import { promisify } from 'util';

export default {
  name: 'sst',
  aliases: ['transcrever', 'voz2txt', 'ouvir'],
  description: 'Converte fala em texto',
  category: 'util',
  usage: '!sst',
  cooldown: 5,
  enabled: true,

  async execute(ctx) {
    try {
      const { reply } = ctx;

      reply("🎤 Fala aí... (escutando)");

      const execAsync = promisify(exec);

      // chama o microfone do Android
      const { stdout, stderr } = await execAsync("termux-speech-to-text");

      if (stderr) {
        console.log("Erro STT:", stderr);
        return reply("❌ Deu erro ao ouvir tua voz.");
      }

      const texto = stdout.trim();

      if (!texto) {
        return reply("❌ Não entendi nada do que tu falou.");
      }

      await reply(`🧠 Você disse:\n\n"${texto}"`);

    } catch (e) {
      console.log("sst erro:", e.message);
      await ctx.reply("❌ Falha ao usar o microfone.");
    }
  }
};