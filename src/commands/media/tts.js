import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default {
  name: 'voz',
  aliases: ['tts', 'falar'],
  description: 'Converte texto em áudio',
  category: 'fun',
  usage: '!voz <texto>',
  cooldown: 5,
  enabled: true,
  async execute(ctx) {
    try {
      const { args, reply, sendAudio } = ctx;
      const texto = args.join(" ").trim();
      if (!texto) return reply(`🔊 *Como usar:*\n\n!voz olá, tudo bem?\n!voz bom dia a todos`);

      if (texto.length > 500) return reply("❌ Texto muito longo. Máximo 500 caracteres.");

      const VOICERSS_KEY = "50d7a535b4484dcbb153c702a1e0f353";
      const url = `https://api.voicerss.org/?key=${VOICERSS_KEY}&hl=pt-br&src=${encodeURIComponent(texto)}&c=MP3&f=44khz_16bit_stereo`;

      const res = await axios.get(url, { responseType: 'arraybuffer' });
      if (res.status !== 200) return reply("❌ Erro ao gerar áudio.");

      const buffer = Buffer.from(res.data);

      const inicio = buffer.toString("utf8", 0, 50);
      if (inicio.includes("ERROR") || !buffer.length) {
        return reply("❌ Erro na API: " + inicio);
      }

      const tmp = os.tmpdir();
      const inputPath = path.join(tmp, `voz_${Date.now()}.mp3`);
      const outputPath = path.join(tmp, `voz_${Date.now()}_out.ogg`);

      fs.writeFileSync(inputPath, buffer);

      const execAsync = promisify(exec);
      await execAsync(`ffmpeg -i ${inputPath} -c:a libopus -b:a 64k ${outputPath} -y`);

      const audioBuffer = fs.readFileSync(outputPath);

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      await ctx.sock.sendMessage(ctx.from, {
        audio: audioBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      }, { quoted: ctx.msg });

    } catch (e) {
      console.log("voz erro:", e.message);
      await ctx.reply("❌ Erro ao gerar áudio.");
    }
  }
}