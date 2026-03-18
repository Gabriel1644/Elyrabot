// ══════════════════════════════════════════════════════════
//  msginfo.js — >>info (info da mensagem) e $ (terminal rápido)
// ══════════════════════════════════════════════════════════
import { execShell, installPackage } from '../../loader.js'
import { CONFIG } from '../../config.js'
import { getRole, ROLES, ROLE_NAMES } from '../../permissions.js'

// ── >>info — info completa da mensagem marcada ────────────
export const msgInfo = {
  name: 'msginfo',
  aliases: ['>>info', 'info>', 'msinfo', 'minfo'],
  description: 'Mostra informações completas de uma mensagem (responda a ela)',
  category: 'owner',
  usage: '>>info — Responda uma mensagem',
  cooldown: 3,
  async execute({ sock, msg, from, reply, userId, isOwner, isSubdono, isGrupo }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')

    const inner  = msg.message
    const ctx    = inner?.extendedTextMessage?.contextInfo
    const quoted = ctx?.quotedMessage

    // Se não tem mensagem respondida, mostra info da própria mensagem
    const targetMsg = quoted ? {
      key: {
        remoteJid: from,
        id:        ctx?.stanzaId || 'unknown',
        fromMe:    ctx?.participant === (await getOwnJid(sock)),
        participant: ctx?.participant,
      },
      message:  quoted,
      pushName: ctx?.pushName || '?',
    } : msg

    const targetInner   = targetMsg.message
    const targetSender  = targetMsg.key?.participant || targetMsg.key?.remoteJid || 'unknown'
    const targetId      = targetMsg.key?.id || '?'
    const targetFromMe  = targetMsg.key?.fromMe
    const targetName    = targetMsg.pushName || ctx?.pushName || '?'
    const targetRole    = getRole(targetSender)
    const targetRoleName = ROLE_NAMES[targetRole] || '👤 Usuário'

    // Tipo da mensagem
    const msgType = Object.keys(targetInner || {}).find(k => k !== 'messageContextInfo') || 'unknown'
    const msgText = targetInner?.conversation
      || targetInner?.extendedTextMessage?.text
      || targetInner?.imageMessage?.caption
      || targetInner?.videoMessage?.caption
      || ''

    // Hora
    const ts = targetMsg.messageTimestamp || targetMsg.key?.timestamp || Math.floor(Date.now() / 1000)
    const dt = new Date((typeof ts === 'object' ? ts.low : ts) * 1000)
    const hora = dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    // Mounts text
    let txt = `╭─── 🔍 *INFO DA MENSAGEM* ───╮\n│\n`
    txt += `│ 🆔 *ID:* \`${targetId.slice(0, 24)}...\`\n`
    txt += `│ 👤 *Sender:* ${targetName}\n`
    txt += `│ 📱 *JID:* \`${targetSender}\`\n`
    txt += `│ 🏅 *Cargo:* ${targetRoleName}\n`
    txt += `│ 📨 *Tipo:* \`${msgType}\`\n`
    txt += `│ 🕐 *Hora:* ${hora}\n`
    txt += `│ 📤 *Meu envio:* ${targetFromMe ? 'Sim' : 'Não'}\n`

    if (msgText) {
      const preview = msgText.length > 60 ? msgText.slice(0, 60) + '…' : msgText
      txt += `│ 💬 *Texto:* _${preview}_\n`
    }

    if (targetInner?.imageMessage) {
      const im = targetInner.imageMessage
      txt += `│ 🖼️ *Dimensões:* ${im.width}×${im.height}\n`
      txt += `│ 📦 *Tamanho:* ${((im.fileLength || 0) / 1024).toFixed(0)}KB\n`
    }
    if (targetInner?.videoMessage) {
      const vm = targetInner.videoMessage
      txt += `│ 🎬 *Duração:* ${vm.seconds}s\n`
    }
    if (targetInner?.audioMessage) {
      const am = targetInner.audioMessage
      txt += `│ 🔊 *Duração:* ${am.seconds}s | PTT: ${am.ptt ? 'Sim' : 'Não'}\n`
    }
    if (targetInner?.stickerMessage) {
      txt += `│ 🎭 *Animado:* ${targetInner.stickerMessage.isAnimated ? 'Sim' : 'Não'}\n`
    }
    if (ctx?.mentionedJid?.length) {
      txt += `│ 📢 *Menções:* ${ctx.mentionedJid.length}\n`
    }
    if (ctx?.expiration) {
      txt += `│ ⏳ *Expira em:* ${ctx.expiration}s\n`
    }

    txt += `│\n╰──────────────────────────────╯`
    await reply(txt)
  }
}

async function getOwnJid(sock) {
  try { return sock.user?.id || '' } catch { return '' }
}

// ── $ terminal — executa comando pelo chat ────────────────
export const shellCmd = {
  name: '$',
  aliases: ['sh', 'bash', 'exec'],
  description: 'Executa comandos de terminal (só dono)',
  category: 'owner',
  usage: '$ <comando>  —  Ex: $ ls, $ npm install axios',
  cooldown: 2,
  async execute({ reply, argStr, isOwner, userId }) {
    if (!isOwner) return reply('❌ Apenas o dono pode usar o terminal.')
    const cmd = argStr.trim()
    if (!cmd) return reply(
      '💻 *Terminal do Bot*\n\n' +
      'Use: `$ <comando>`\n\n' +
      '*Exemplos:*\n' +
      '• `$ npm install axios`\n' +
      '• `$ ls midias/`\n' +
      '• `$ free -h`\n' +
      '• `$ node --version`\n' +
      '• `$ cat package.json`'
    )

    try {
      await reply('⏳ _Executando..._')
      const result = await execShell(cmd, { timeout: 30000 })
      const out = ((result.stdout || '') + (result.stderr || '')).trim()

      if (!out) return reply(`✅ Executado sem saída:\n\`\`\`${cmd}\`\`\``)

      // Limita a 3000 chars para não estourar o WhatsApp
      const truncated = out.length > 2800
        ? out.slice(0, 2800) + '\n\n_[... truncado]_'
        : out

      await reply(`✅ \`\`\`${cmd}\`\`\`\n\n\`\`\`\n${truncated}\n\`\`\``)
    } catch (e) {
      await reply(`❌ Erro:\n\`\`\`${e.message.slice(0, 500)}\`\`\``)
    }
  }
}

// ── $ npm install — atalho especial ──────────────────────
export const npmInstCmd = {
  name: 'npm',
  aliases: ['npmi', 'nodeinstall'],
  description: 'Instala pacote npm (só dono)',
  category: 'owner',
  usage: '$ npm install <pacote>',
  cooldown: 10,
  async execute({ reply, args, isOwner }) {
    if (!isOwner) return reply('❌ Apenas o dono.')
    const pkg = args.filter(a => !['install', 'i', '-g', '--save', '--save-dev'].includes(a)).join(' ').trim()
    if (!pkg) return reply('❌ Informe o pacote!\nEx: `!npm axios`')

    await reply(`📦 _Instalando ${pkg}..._`)
    try {
      const result = await execShell(`npm install ${pkg} --save 2>&1`, { timeout: 60000 })
      const out = (result.stdout || result.stderr || '').trim()
      const ok  = !out.includes('ERR!') && !out.includes('error')
      const msg = out.slice(0, 1000)
      await reply(`${ok ? '✅' : '⚠️'} \`npm install ${pkg}\`\n\n\`\`\`\n${msg}\n\`\`\``)
    } catch (e) {
      await reply(`❌ Falha: ${e.message.slice(0, 300)}`)
    }
  }
}

export default [msgInfo, shellCmd, npmInstCmd]
