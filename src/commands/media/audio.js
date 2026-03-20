import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function downloadMedia(sock, msg, tipo) {
  try {
    const buf = await sock.downloadMediaMessage(msg)
    if (buf?.length > 0) return buf
  } catch {}

  try {
    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
    const inner = msg.message
    const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage

    let mediaMsg = null
    const tipos = { video: ['videoMessage'] }

    for (const key of (tipos[tipo] || [])) {
      mediaMsg = inner?.[key] || quoted?.[key]
      if (mediaMsg) break
    }

    if (!mediaMsg) return null

    const stream = await downloadContentFromMessage(mediaMsg, tipo)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buf = Buffer.concat(chunks)
    return buf.length ? buf : null
  } catch { return null }
}

export default {
  name: 'audio',
  aliases: ['conv', 'opus'],
  description: 'Converte vídeo em áudio Opus (nativo do WhatsApp)',
  category: 'media',
  usage: '.audio',
  cooldown: 5,

  async execute(ctx) {
    const { msg, from, reply, sock, react } = ctx

    const inner = msg.message
    const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasVideo = inner?.videoMessage || quoted?.videoMessage

    if (!hasVideo) {
      return reply('❌ Responda a um vídeo para converter em áudio.')
    }

    try {
      await react('⏳')

      const videoBuffer = await downloadMedia(sock, msg, 'video')
      if (!videoBuffer) {
        await react('❌')
        return reply('❌ Erro ao baixar o vídeo.')
      }

      const tempDir = os.tmpdir()
      const inputPath = path.join(tempDir, `vid_${Date.now()}.mp4`)
      const outputPath = path.join(tempDir, `aud_${Date.now()}.opus`)

      fs.writeFileSync(inputPath, videoBuffer)

      // -c:a libopus: Força o uso do codec Opus
      // -b:a 128k: Define um bitrate sólido para áudio
      await execAsync(`ffmpeg -i "${inputPath}" -c:a libopus -b:a 128k "${outputPath}"`)

      const audioBuffer = fs.readFileSync(outputPath)

      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: false // Mude para true se quiser que ele seja enviado como mensagem de voz gravada
      }, { quoted: msg })

      // Limpeza
      fs.unlinkSync(inputPath)
      fs.unlinkSync(outputPath)

      await react('✅')

    } catch (err) {
      console.error(err)
      await react('❌')
      reply('❌ Erro na conversão para Opus. Verifique se o libopus está disponível no seu ffmpeg.')
    }
  }
}