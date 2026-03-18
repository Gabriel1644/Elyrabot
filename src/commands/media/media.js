import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { CONFIG } from '../../config.js'

const execAsync = promisify(exec)

// ────────────────────────────────────────────────
//  HELPERS INTERNOS
// ────────────────────────────────────────────────

function tmpFile(ext) {
  return path.join(os.tmpdir(), `elyrabot_${randomUUID()}.${ext}`)
}

function rmSafe(fp) {
  try { if (fp && fs.existsSync(fp)) fs.unlinkSync(fp) } catch {}
}

async function ytdlpOk() {
  try { await execAsync('yt-dlp --version'); return true } catch { return false }
}

async function ytSearch(query, maxResults = 5) {
  const yts = (await import('yt-search')).default
  const res  = await yts(query)
  return (res.videos || []).slice(0, maxResults)
}

async function baixarAudio(url, reply) {
  if (!(await ytdlpOk())) {
    await reply('❌ *yt-dlp não encontrado!*\n\nInstale no Termux:\n```pkg install yt-dlp ffmpeg```')
    return null
  }
  const dest = tmpFile('mp3')
  try {
    await execAsync(
      `yt-dlp -x --audio-format mp3 --audio-quality 5 --no-playlist --no-warnings -o "${dest}" "${url}"`,
      { timeout: 120_000 }
    )
    if (!fs.existsSync(dest)) throw new Error('Arquivo não gerado')
    const buf = fs.readFileSync(dest)
    rmSafe(dest)
    return buf
  } catch (e) {
    rmSafe(dest)
    throw new Error(`yt-dlp: ${e.message.split('\n')[0]}`)
  }
}

async function baixarVideo(url, reply, qualidade = '360') {
  if (!(await ytdlpOk())) {
    await reply('❌ *yt-dlp não encontrado!*\n\nInstale no Termux:\n```pkg install yt-dlp ffmpeg```')
    return null
  }
  const dest = tmpFile('mp4')
  try {
    await execAsync(
      `yt-dlp -f "bestvideo[height<=${qualidade}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${qualidade}][ext=mp4]/best[height<=${qualidade}]" ` +
      `--merge-output-format mp4 --no-playlist --no-warnings -o "${dest}" "${url}"`,
      { timeout: 180_000 }
    )
    if (!fs.existsSync(dest)) throw new Error('Arquivo não gerado')
    const stat = fs.statSync(dest)
    if (stat.size > 50 * 1024 * 1024) {
      rmSafe(dest)
      throw new Error('Vídeo muito grande (>50 MB). Tente qualidade menor.')
    }
    const buf = fs.readFileSync(dest)
    rmSafe(dest)
    return buf
  } catch (e) {
    rmSafe(dest)
    throw new Error(`yt-dlp: ${e.message.split('\n')[0]}`)
  }
}

// Busca imagem no DuckDuckGo (sem precisar de API key)
async function buscarImagem(query) {
  try {
    const r = await axios.get('https://api.duckduckgo.com/', {
      params: { q: query, format: 'json', no_html: 1, no_redirect: 1, ia: 'images' },
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const icon = r.data?.Image
    if (icon) return icon
    // fallback: picsum ou unsplash source
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`
  } catch {
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`
  }
}

// ── Helper: baixa mídia corretamente (Baileys v7) ────────────
async function downloadMedia(sock, msg, tipo) {
  const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
  // Pega a mensagem de mídia (direto ou quoted)
  const inner = msg.message
  const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage

  let mediaMsg = null
  if (tipo === 'image') {
    mediaMsg = inner?.imageMessage || quoted?.imageMessage
  } else if (tipo === 'sticker') {
    mediaMsg = inner?.stickerMessage || quoted?.stickerMessage
  } else if (tipo === 'video') {
    mediaMsg = inner?.videoMessage || quoted?.videoMessage
  } else if (tipo === 'audio') {
    mediaMsg = inner?.audioMessage || quoted?.audioMessage
  } else if (tipo === 'document') {
    mediaMsg = inner?.documentMessage || quoted?.documentMessage
  }

  if (!mediaMsg) return null

  // Tenta 1: downloadMediaMessage via sock (método mais simples)
  try {
    const msgObj = mediaMsg === inner?.imageMessage ? msg
      : { key: { remoteJid: msg.key.remoteJid, id: 'quoted', fromMe: false }, message: quoted }
    const buf = await sock.downloadMediaMessage(msgObj)
    if (buf && buf.length > 0) return buf
  } catch {}

  // Tenta 2: downloadContentFromMessage (mais compatível)
  try {
    const stream = await downloadContentFromMessage(mediaMsg, tipo)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buf = Buffer.concat(chunks)
    if (buf.length > 0) return buf
  } catch {}

  return null
}

// ── Helper: injeta metadados EXIF na figurinha ────────────
async function injectStickerExif(webpBuf, packName, authorName) {
  try {
    const webpmod = await import('node-webpmux')
    const WebP    = webpmod.default?.Image ? webpmod.default : webpmod
    const img     = new WebP.Image()
    await img.load(webpBuf)

    const exifData = {
      'sticker-pack-id':       `elyrabot-${Date.now()}`,
      'sticker-pack-name':      packName   || CONFIG.nome || 'ElyraBot',
      'sticker-pack-publisher': authorName || 'Bot',
      'emojis': ['🔥'],
    }
    const jsonBuf = Buffer.from(JSON.stringify(exifData), 'utf8')
    const hdr     = Buffer.from([
      0x49,0x49,0x2A,0x00, 0x08,0x00,0x00,0x00,
      0x01,0x00, 0x41,0x57,0x07,0x00,
      0x00,0x00,0x00,0x00,   // ← preenchido abaixo
      0x16,0x00,0x00,0x00,
    ])
    hdr.writeUInt32LE(jsonBuf.length, 14)
    img.exif = Buffer.concat([hdr, jsonBuf])

    const tmpOut = tmpFile('webp')
    await img.save(tmpOut)
    const result = fs.readFileSync(tmpOut)
    rmSafe(tmpOut)
    return result
  } catch {
    return webpBuf   // sem node-webpmux instalado: retorna sem EXIF
  }
}

export const fig = {
  name: 'fig',
  aliases: ['figurinha', 'sticker', 's', 'st', 'stk', 'f'],
  description: 'Cria figurinha de imagem ou vídeo (até 10s)',
  category: 'media',
  usage: '!fig [Pack | Autor]  —  Envie ou responda uma imagem/vídeo',
  cooldown: 5,
  async execute({ sock, msg, from, reply, args, usuario }) {
    const inner  = msg.message
    const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage

    const imgMsg = inner?.imageMessage || quoted?.imageMessage
    const vidMsg = inner?.videoMessage || quoted?.videoMessage

    if (!imgMsg && !vidMsg) {
      return reply(
        '❌ *Envie ou responda* uma imagem ou vídeo (até 10s) com *!fig*\n\n' +
        '_Dica: !fig NomePack | NomeAutor_'
      )
    }

    if (vidMsg && (vidMsg.seconds || 0) > 10) {
      return reply('❌ O vídeo precisa ter no máximo *10 segundos*!')
    }

    // Pack e autor dos args  (ex: !fig MeuBot | @dono)
    const argText   = args.join(' ')
    const partes    = argText.split(/[|/]/).map(p => p.trim())
    const packName  = (partes[0] || CONFIG.nome || 'ElyraBot').substring(0, 80)
    const autorName = (partes[1] || usuario  || 'Bot').substring(0, 30)

    const isVideo = !!vidMsg
    const tipo    = isVideo ? 'video' : 'image'

    try { await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }) } catch {}

    try {
      // ── 1. Download ───────────────────────────────────────
      const rawBuf = await downloadMedia(sock, msg, tipo)
      if (!rawBuf?.length) {
        try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }) } catch {}
        return reply('❌ Não consegui baixar a mídia. Tente novamente.')
      }

      const tmpIn  = tmpFile(isVideo ? 'mp4' : 'jpg')
      const tmpOut = tmpFile('webp')
      fs.writeFileSync(tmpIn, rawBuf)

      // ── 2. Conversão ffmpeg ───────────────────────────────
      const ffCmd = isVideo
        ? `ffmpeg -i "${tmpIn}" -vf "fps=10,scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba" -vcodec libwebp -lossless 0 -qscale 40 -preset default -loop 0 -an -vsync 0 -t 8 -y "${tmpOut}"`
        : `ffmpeg -i "${tmpIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba" -vcodec libwebp -lossless 1 -qscale 75 -preset picture -an -vsync 0 -y "${tmpOut}"`

      try {
        await execAsync(ffCmd, { timeout: 45000 })
      } catch (e) {
        rmSafe(tmpIn)
        try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }) } catch {}
        return reply(
          `❌ *ffmpeg falhou:* ${e.message.split('\n')[0]}\n\n` +
          '_Instale com:_ ```pkg install ffmpeg```'
        )
      }

      rmSafe(tmpIn)

      if (!fs.existsSync(tmpOut) || fs.statSync(tmpOut).size === 0) {
        try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }) } catch {}
        return reply('❌ ffmpeg não gerou o arquivo. Verifique se está instalado.')
      }

      let webpBuf = fs.readFileSync(tmpOut)
      rmSafe(tmpOut)

      // ── 3. Compressão extra se > 1MB (vídeos longos) ──────
      if (isVideo && webpBuf.length > 1_000_000) {
        const tmpSrc   = tmpFile('webp')
        const tmpExtra = tmpFile('webp')
        fs.writeFileSync(tmpSrc, webpBuf)
        try {
          await execAsync(
            `ffmpeg -i "${tmpSrc}" -vcodec libwebp -lossless 0 -qscale 20 -preset default -loop 0 -an -y "${tmpExtra}"`,
            { timeout: 30000 }
          )
          if (fs.existsSync(tmpExtra) && fs.statSync(tmpExtra).size > 0) {
            webpBuf = fs.readFileSync(tmpExtra)
          }
        } catch {}
        rmSafe(tmpSrc); rmSafe(tmpExtra)
      }

      // ── 4. Injetar metadados EXIF ─────────────────────────
      webpBuf = await injectStickerExif(webpBuf, packName, autorName)

      // ── 5. Enviar ─────────────────────────────────────────
      await sock.sendMessage(from, { sticker: webpBuf }, { quoted: msg })
      try { await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }) } catch {}

    } catch (e) {
      try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }) } catch {}
      await reply(`❌ Erro ao criar figurinha: ${e.message}`)
    }
  }
}

export const figurl = {
  name: 'figurl',
  aliases: ['stickerurl', 'su'],
  description: 'Cria figurinha a partir de uma URL de imagem',
  category: 'media',
  usage: '!figurl <url>',
  cooldown: 5,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr.startsWith('http')) return reply('❌ Informe uma URL de imagem válida!')
    try {
      await reply('🔄 Baixando e convertendo...')
      const r = await axios.get(argStr, { responseType: 'arraybuffer', timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' } })
      const buf = Buffer.from(r.data)
      await sock.sendMessage(from, { sticker: buf }, { quoted: msg })
    } catch (e) { await reply(`❌ Erro: ${e.message}`) }
  }
}

export const imagem = {
  name: 'img',
  aliases: ['imagem', 'image', 'foto'],
  description: 'Busca e envia uma imagem',
  category: 'media',
  usage: '!img <busca>',
  cooldown: 8,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr) return reply('❌ O que deseja buscar?')
    await reply('🔍 Buscando imagem...')
    try {
      const url = await buscarImagem(argStr)
      await sock.sendMessage(from, {
        image: { url },
        caption: `🖼️ *${argStr}*`
      }, { quoted: msg })
    } catch { await reply('❌ Não encontrei nenhuma imagem.') }
  }
}

export const ytinfo = {
  name: 'yt',
  aliases: ['youtube', 'ytinfo', 'ytsearch', 'ytbusca'],
  description: 'Busca vídeos no YouTube via yt-search',
  category: 'media',
  usage: '!yt <termo ou URL>',
  cooldown: 8,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe um termo ou URL!')
    await reply('🔍 Buscando no YouTube...')
    try {
      // URL direta → oEmbed
      const urlMatch = argStr.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (urlMatch) {
        const videoId = urlMatch[1]
        try {
          const oe = await axios.get(
            `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`,
            { timeout: 8000 }
          )
          const d = oe.data
          return reply(
            `🎬 *${d.title}*\n\n` +
            `📺 Canal: *${d.author_name}*\n` +
            `🔗 https://youtu.be/${videoId}\n\n` +
            `_Use !ytmp3 <URL> para baixar o áudio_`
          )
        } catch {}
      }

      // Busca com yt-search
      const videos = await ytSearch(argStr, 5)
      if (!videos.length) return reply('❌ Nenhum vídeo encontrado!')

      let texto = `🎬 *Resultados para:* _${argStr}_\n\n`
      videos.forEach((v, i) => {
        texto += `*${i + 1}.* ${v.title}\n`
        texto += `   📺 ${v.author?.name || ''}  ⏱️ ${v.duration?.timestamp || '??'}\n`
        texto += `   🔗 https://youtu.be/${v.videoId}\n\n`
      })
      texto += `_Use !ytmp3 <URL> para baixar o áudio_`
      await reply(texto)
    } catch (e) {
      await reply(`❌ Erro ao buscar: ${e.message}`)
    }
  }
}

export const meme = {
  name: 'meme',
  aliases: ['memes'],
  description: 'Envia um meme aleatório',
  category: 'media',
  usage: '!meme',
  cooldown: 5,
  async execute({ sock, from, msg, reply }) {
    try {
      const r = await axios.get('https://meme-api.com/gimme/programmerhumor', { timeout: 10000 })
      const d = r.data
      if (!d.url) throw new Error('no url')
      await sock.sendMessage(from, {
        image: { url: d.url },
        caption: `😂 *${d.title}*\n\n👍 ${d.ups} | r/${d.subreddit}`
      }, { quoted: msg })
    } catch { await reply('❌ Não consegui buscar um meme agora.') }
  }
}

// ── Cache de imagens Pinterest ────────────────────────────
export const pinCache = new Map()

export const pinterest = {
  name: 'pinterest',
  aliases: ['pin'],
  description: 'Busca imagens no Pinterest em carrossel com botões',
  category: 'media',
  usage: '!pinterest <tema>',
  cooldown: 8,
  async execute({ sock, from, msg, reply, argStr, prefix }) {
    const react = async (e) => { try { await sock.sendMessage(from, { react: { text: e, key: msg.key } }) } catch {} }

    if (!argStr) {
      await react('⚠️')
      return reply(`❌ Coloque um tema!\n\nExemplo: ${prefix}pinterest gatos fofos`)
    }

    await react('⏳')

    try {
      // API pública do tedzinho
      const { data } = await axios.get(
        `https://tedzinho.com.br/api/pesquisa/pinterest?apikey=J&query=${encodeURIComponent(argStr)}`,
        { timeout: 15000 }
      )

      if (!data?.resultado?.length) {
        await react('❌')
        return reply(`❌ Nenhum resultado para: *${argStr}*`)
      }

      const imagens = data.resultado.slice(0, 10)

      // Tenta enviar carrossel interativo (só funciona em grupos com WhatsApp Business)
      try {
        const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = await import('@whiskeysockets/baileys')

        const cards = []
        for (let i = 0; i < imagens.length; i++) {
          const img   = imagens[i]
          const btnId = `pin_${Date.now()}_${i}`

          pinCache.set(btnId, { url: img.image, nome: img.fullname || argStr })
          setTimeout(() => pinCache.delete(btnId), 15 * 60 * 1000)

          const media = await prepareWAMessageMedia(
            { image: { url: img.image } },
            { upload: sock.waUploadToServer }
          )

          cards.push({
            body: proto.Message.InteractiveMessage.Body.fromObject({
              text: `📌 *Pinterest ${i + 1}/${imagens.length}*\n🔎 ${argStr}\n👤 ${img.fullname || 'Desconhecido'}`,
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
              title: 'Pinterest',
              hasMediaAttachment: true,
              imageMessage: media.imageMessage,
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
              buttons: [
                {
                  name: 'cta_url',
                  buttonParamsJson: JSON.stringify({
                    display_text: '🔗 Abrir no Pinterest',
                    url: img.source || `https://pinterest.com/search/pins/?q=${encodeURIComponent(argStr)}`,
                  }),
                },
                {
                  name: 'quick_reply',
                  buttonParamsJson: JSON.stringify({
                    display_text: '📥 Baixar Imagem',
                    id: btnId,
                  }),
                },
              ],
            }),
          })
        }

        const carouselMsg = generateWAMessageFromContent(from, {
          viewOnceMessage: {
            message: {
              interactiveMessage: {
                body:            { text: `🖼️ Resultados para: *${argStr}*` },
                carouselMessage: { cards },
                footer:          { text: 'Deslize para ver mais ➡️' },
              },
            },
          },
        }, { quoted: msg })

        await sock.relayMessage(from, carouselMsg.message, { messageId: carouselMsg.key.id })
        await react('✅')
        return

      } catch {
        // Fallback: envia imagens uma a uma (sem suporte a carrossel)
        await reply(`📌 *Pinterest — ${argStr}*\n\nEncontrei ${imagens.length} imagens:`)
        for (let i = 0; i < Math.min(imagens.length, 6); i++) {
          const img = imagens[i]
          try {
            await sock.sendMessage(from, {
              image: { url: img.image },
              caption: `📌 *${i + 1}/${Math.min(imagens.length, 6)}* — ${img.fullname || argStr}`,
            })
            await new Promise(r => setTimeout(r, 600))
          } catch {}
        }
        await react('✅')
      }

    } catch (e) {
      await react('❌')
      // Fallback final: busca no Unsplash
      try {
        await sock.sendMessage(from, {
          image: { url: `https://source.unsplash.com/1080x1080/?${encodeURIComponent(argStr)}` },
          caption: `📌 *${argStr}*`,
        }, { quoted: msg })
        await react('✅')
      } catch {
        await reply('❌ Não foi possível buscar imagens agora.')
      }
    }
  }
}

export const gif = {
  name: 'gif',
  aliases: ['giphy'],
  description: 'Busca e envia um GIF',
  category: 'media',
  usage: '!gif <busca>',
  cooldown: 8,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr) return reply('❌ O que deseja buscar?')
    try {
      // Giphy API pública (rating g)
      const r = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: { api_key: 'dc6zaTOxFJmzC', q: argStr, limit: 10, rating: 'g' },
        timeout: 10000
      })
      const gifs = r.data.data
      if (!gifs?.length) return reply('❌ Nenhum GIF encontrado!')
      const gif = gifs[Math.floor(Math.random() * Math.min(gifs.length, 5))]
      const url = gif.images.original.url

      await sock.sendMessage(from, {
        video: { url },
        gifPlayback: true,
        caption: `🎬 ${gif.title}`
      }, { quoted: msg })
    } catch { await reply('❌ Erro ao buscar GIF.') }
  }
}

export const ytmp3 = {
  name: 'ytmp3',
  aliases: ['musica', 'play', 'mp3'],
  description: 'Baixa áudio do YouTube e envia como arquivo de áudio',
  category: 'media',
  usage: '!ytmp3 <URL ou nome da música>',
  cooldown: 20,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr) return reply('❌ Informe a URL ou nome da música!\nEx: !ytmp3 Never Gonna Give You Up')
    await reply('🎵 Buscando música...')
    try {
      let videoId, titulo, canal

      const urlMatch = argStr.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (urlMatch) {
        videoId = urlMatch[1]
        try {
          const oe = await axios.get(
            `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`,
            { timeout: 8000 }
          )
          titulo = oe.data.title
          canal  = oe.data.author_name
        } catch { titulo = 'Sem título'; canal = 'Desconhecido' }
      } else {
        const videos = await ytSearch(argStr, 1)
        if (!videos.length) return reply('❌ Música não encontrada!')
        const v = videos[0]
        videoId = v.videoId
        titulo  = v.title
        canal   = v.author?.name || ''
      }

      await reply(`✅ Encontrado: *${titulo}*\n⏳ Baixando... (pode demorar até 1 min)`)
      const buf = await baixarAudio(`https://youtu.be/${videoId}`, reply)
      if (!buf) return

      await sock.sendMessage(from, {
        audio: buf,
        mimetype: 'audio/mpeg',
        ptt: false,
      }, { quoted: msg })

      await sock.sendMessage(from, {
        text: `✅ *${titulo}*\n📺 ${canal}\n🔗 https://youtu.be/${videoId}`
      }, { quoted: msg })
    } catch (e) {
      await reply(`❌ Erro ao baixar áudio: ${e.message}`)
    }
  }
}

export const ytmp4 = {
  name: 'ytmp4',
  aliases: ['video', 'vídeo', 'mp4', 'ytv'],
  description: 'Baixa vídeo do YouTube e envia (máx 50 MB)',
  category: 'media',
  usage: '!ytmp4 <URL ou busca> [144/360/480/720]',
  cooldown: 30,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr) return reply('❌ Informe a URL ou nome do vídeo!\nEx: !ytmp4 Linkin Park Numb 360')

    const qualMatch = argStr.match(/\b(144|240|360|480|720)\b$/)
    const qualidade = qualMatch ? qualMatch[1] : '360'
    const busca     = qualMatch ? argStr.replace(qualMatch[0], '').trim() : argStr

    await reply(`🎬 Buscando vídeo (${qualidade}p)...`)
    try {
      let videoId, titulo, canal

      const urlMatch = busca.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (urlMatch) {
        videoId = urlMatch[1]
        try {
          const oe = await axios.get(
            `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`,
            { timeout: 8000 }
          )
          titulo = oe.data.title
          canal  = oe.data.author_name
        } catch { titulo = 'Sem título'; canal = 'Desconhecido' }
      } else {
        const videos = await ytSearch(busca, 1)
        if (!videos.length) return reply('❌ Vídeo não encontrado!')
        const v = videos[0]
        videoId = v.videoId
        titulo  = v.title
        canal   = v.author?.name || ''
      }

      await reply(`✅ *${titulo}*\n⏳ Baixando ${qualidade}p... (pode demorar)`)
      const buf = await baixarVideo(`https://youtu.be/${videoId}`, reply, qualidade)
      if (!buf) return

      await sock.sendMessage(from, {
        video: buf,
        mimetype: 'video/mp4',
        caption: `🎬 *${titulo}*\n📺 ${canal}\n🔗 https://youtu.be/${videoId}`,
      }, { quoted: msg })
    } catch (e) {
      await reply(`❌ Erro ao baixar vídeo: ${e.message}`)
    }
  }
}

export const tiktok = {
  name: 'tiktok',
  aliases: ['tt', 'tk'],
  description: 'Baixa vídeo do TikTok sem marca d\'água',
  category: 'media',
  usage: '!tiktok <URL>',
  cooldown: 15,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr.includes('tiktok.com') && !argStr.includes('vm.tiktok'))
      return reply('❌ Informe uma URL válida do TikTok!')
    await reply('⏳ Baixando TikTok...')
    try {
      // Tenta yt-dlp primeiro
      if (await ytdlpOk()) {
        const dest = tmpFile('mp4')
        try {
          await execAsync(`yt-dlp --no-warnings -o "${dest}" "${argStr}"`, { timeout: 60_000 })
          if (fs.existsSync(dest)) {
            const buf = fs.readFileSync(dest)
            rmSafe(dest)
            return await sock.sendMessage(from, {
              video: buf, mimetype: 'video/mp4', caption: '🎬 *TikTok*'
            }, { quoted: msg })
          }
          rmSafe(dest)
        } catch { rmSafe(dest) }
      }
      // Fallback: tikwm
      const r = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(argStr)}`, { timeout: 15000 })
      const d = r.data?.data
      if (!d?.play) return reply('❌ Não consegui baixar. Verifique o link.')
      await sock.sendMessage(from, {
        video: { url: d.play },
        caption: `🎬 *${d.title || 'TikTok'}*\n👤 ${d.author?.nickname || ''}`
      }, { quoted: msg })
    } catch (e) {
      await reply(`❌ Erro ao baixar TikTok: ${e.message}`)
    }
  }
}

export const instagram = {
  name: 'instagram',
  aliases: ['ig', 'reels'],
  description: 'Baixa Reels/fotos do Instagram via yt-dlp',
  category: 'media',
  usage: '!ig <URL do post/reel>',
  cooldown: 15,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr.includes('instagram.com')) return reply('❌ Informe uma URL válida do Instagram!')
    await reply('📸 Baixando do Instagram...')
    try {
      if (!(await ytdlpOk()))
        return reply('❌ yt-dlp não encontrado!\nInstale: ```pkg install yt-dlp```')
      const dest = tmpFile('mp4')
      await execAsync(`yt-dlp --no-warnings -o "${dest}" "${argStr}"`, { timeout: 60_000 })
      if (!fs.existsSync(dest)) throw new Error('Arquivo não gerado')
      const buf = fs.readFileSync(dest)
      rmSafe(dest)
      await sock.sendMessage(from, {
        video: buf, mimetype: 'video/mp4', caption: '📸 *Instagram*'
      }, { quoted: msg })
    } catch (e) {
      await reply(
        `❌ Não consegui baixar (Instagram bloqueia servidores com frequência).\n` +
        `🔗 Tente: https://saveig.app/pt?url=${encodeURIComponent(argStr)}`
      )
    }
  }
}

export const twitter = {
  name: 'twitter',
  aliases: ['tw', 'x'],
  description: 'Baixa vídeos do Twitter/X via yt-dlp',
  category: 'media',
  usage: '!tw <URL>',
  cooldown: 15,
  async execute({ sock, from, msg, reply, argStr }) {
    if (!argStr.includes('twitter.com') && !argStr.includes('x.com'))
      return reply('❌ Informe uma URL válida do Twitter/X!')
    await reply('🐦 Baixando vídeo...')
    try {
      if (!(await ytdlpOk()))
        return reply('❌ yt-dlp não encontrado!\nInstale: ```pkg install yt-dlp```')
      const dest = tmpFile('mp4')
      await execAsync(`yt-dlp --no-warnings -o "${dest}" "${argStr}"`, { timeout: 60_000 })
      if (!fs.existsSync(dest)) throw new Error('Arquivo não gerado')
      const buf = fs.readFileSync(dest)
      rmSafe(dest)
      await sock.sendMessage(from, {
        video: buf, mimetype: 'video/mp4', caption: '🐦 *Twitter/X*'
      }, { quoted: msg })
    } catch {
      await reply(
        `❌ Não consegui baixar.\n` +
        `🔗 Tente: https://twitsave.com/info?url=${encodeURIComponent(argStr)}`
      )
    }
  }
}

export const letra = {
  name: 'letra',
  aliases: ['lyrics'],
  description: 'Busca a letra de uma música',
  category: 'media',
  usage: '!letra <nome da música>',
  cooldown: 10,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Qual música você deseja buscar?')
    await reply('🔍 Buscando letra...')
    try {
      // Usando API do Vagalume ou similar
      const r = await axios.get(`https://api.vagalume.com.br/search.php?art=${encodeURIComponent(argStr)}&mus=${encodeURIComponent(argStr)}`)
      const d = r.data
      if (!d.mus) return reply('❌ Letra não encontrada!')
      
      const mus = d.mus[0]
      await reply(`🎼 *${mus.name}* — _${d.art.name}_\n\n${mus.text.substring(0, 2000)}${mus.text.length > 2000 ? '...' : ''}`)
    } catch {
      await reply('❌ Erro ao buscar letra da música.')
    }
  }
}

export const toimg = {
  name: 'toimg',
  description: 'Transforma figurinha em imagem',
  category: 'media',
  usage: '!toimg (responda uma figurinha)',
  cooldown: 5,
  async execute({ sock, from, msg, reply }) {
    const inner   = msg.message
    const quoted  = inner?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasStik = inner?.stickerMessage || quoted?.stickerMessage
    if (!hasStik) return reply('❌ Responda uma figurinha com *!toimg*')
    try {
      await reply('🔄 Convertendo figurinha...')
      const buffer = await downloadMedia(sock, msg, 'sticker')
      if (!buffer) return reply('❌ Não consegui baixar a figurinha.')
      await sock.sendMessage(from, { image: buffer, caption: '✅ Convertida!' }, { quoted: msg })
    } catch (e) {
      await reply(`❌ Erro: ${e.message}`)
    }
  }
}

export const figanimatada = {
  name: 'figanimatada',
  aliases: ['gifsticker', 'animsticker', 'figvid', 'fgif'],
  description: 'Cria figurinha animada de vídeo/gif (até 6s)',
  category: 'media',
  usage: '!figanimatada [Pack | Autor] — Responda um vídeo ou gif',
  cooldown: 15,
  async execute({ sock, msg, from, reply, args, usuario }) {
    const inner  = msg.message
    const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasVid = inner?.videoMessage || quoted?.videoMessage
    const hasGif = inner?.imageMessage?.gifPlayback || quoted?.imageMessage?.gifPlayback

    if (!hasVid && !hasGif) return reply(
      '❌ Responda um *vídeo curto* ou *GIF* com !figanimatada\n_Máximo 6 segundos_'
    )

    const argText   = args.join(' ')
    const partes    = argText.split(/[|/]/).map(p => p.trim())
    const packName  = (partes[0] || CONFIG.nome || 'ElyraBot').substring(0, 80)
    const autorName = (partes[1] || usuario  || 'Bot').substring(0, 30)

    try { await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }) } catch {}

    try {
      const tipo   = hasGif ? 'image' : 'video'
      const buffer = await downloadMedia(sock, msg, tipo)
      if (!buffer?.length) return reply('❌ Não consegui baixar a mídia.')

      const ext    = hasGif ? 'gif' : 'mp4'
      const tmpIn  = tmpFile(ext)
      const tmpOut = tmpFile('webp')
      fs.writeFileSync(tmpIn, buffer)

      try {
        await execAsync(
          `ffmpeg -i "${tmpIn}" ` +
          `-vf "fps=10,scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba" ` +
          `-vcodec libwebp -lossless 0 -qscale 40 -preset default -loop 0 -an -vsync 0 -t 6 -y "${tmpOut}"`,
          { timeout: 45000 }
        )
      } catch (e) {
        rmSafe(tmpIn)
        try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }) } catch {}
        return reply(`❌ ffmpeg falhou.\n\`\`\`pkg install ffmpeg\`\`\``)
      }

      rmSafe(tmpIn)
      if (!fs.existsSync(tmpOut) || fs.statSync(tmpOut).size === 0) {
        return reply('❌ ffmpeg não gerou o arquivo. Instale com `pkg install ffmpeg`')
      }

      let webpBuf = fs.readFileSync(tmpOut)
      rmSafe(tmpOut)

      // Compressão extra se > 1MB
      if (webpBuf.length > 1_000_000) {
        const tmpS = tmpFile('webp'), tmpE = tmpFile('webp')
        fs.writeFileSync(tmpS, webpBuf)
        try {
          await execAsync(`ffmpeg -i "${tmpS}" -vcodec libwebp -lossless 0 -qscale 20 -preset default -loop 0 -an -y "${tmpE}"`, { timeout: 30000 })
          if (fs.existsSync(tmpE) && fs.statSync(tmpE).size > 0) webpBuf = fs.readFileSync(tmpE)
        } catch {}
        rmSafe(tmpS); rmSafe(tmpE)
      }

      webpBuf = await injectStickerExif(webpBuf, packName, autorName)
      await sock.sendMessage(from, { sticker: webpBuf }, { quoted: msg })
      try { await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }) } catch {}
    } catch (e) {
      try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }) } catch {}
      reply(`❌ Erro: ${e.message}`)
    }
  }
}

export default [fig, figurl, figanimatada, toimg, imagem, ytinfo, ytmp3, ytmp4, meme, pinterest, gif, tiktok, instagram, twitter, letra]
