// ══════════════════════════════════════════════════════════
//  owner.js — Comandos exclusivos do dono
//  Inclui: exec shell, eval JS, broadcast, Termux API
// ══════════════════════════════════════════════════════════
import { exec } from 'child_process'
import { promisify } from 'util'
import { CONFIG } from '../../config.js'
import { loadCommands, createCommand, deleteCommand, installPackage, getCommandSource } from '../../loader.js'
import { configDB, statsDB } from '../../database.js'

const execAsync = promisify(exec)

// Helper: só dono pode usar
const soODono = async (isOwner, reply) => {
  if (!isOwner) { await reply('❌ Apenas o dono pode usar este comando.'); return true }
  return false
}

// ── !exec ─────────────────────────────────────────────────
export const execCmd = {
  name: 'exec',
  aliases: ['sh', 'shell', 'terminal'],
  description: 'Executa comando no shell do Termux',
  category: 'owner',
  usage: '!exec <comando>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner }) {
    if (await soODono(isOwner, reply)) return
    if (!argStr) return reply('❌ Informe um comando!')
    await reply('⚙️ Executando...')
    try {
      const { stdout, stderr } = await execAsync(argStr, { timeout: 30000 })
      const out = (stdout || '') + (stderr ? `\n⚠️ STDERR:\n${stderr}` : '')
      await reply(`\`\`\`\n${out.substring(0, 3500) || '(sem saída)'}\n\`\`\``)
    } catch (e) {
      await reply(`❌ Erro:\n\`\`\`\n${e.message.substring(0, 2000)}\n\`\`\``)
    }
  }
}

// ── !eval ─────────────────────────────────────────────────
export const evalCmd = {
  name: 'eval',
  aliases: ['js', 'run'],
  description: 'Avalia código JavaScript',
  category: 'owner',
  usage: '!eval <código JS>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner, sock, from, msg }) {
    if (await soODono(isOwner, reply)) return
    if (!argStr) return reply('❌ Informe o código!')
    try {
      // eslint-disable-next-line no-eval
      let result = await eval(`(async () => { ${argStr} })()`)
      if (typeof result === 'object') result = JSON.stringify(result, null, 2)
      await reply(`✅ *Resultado:*\n\`\`\`\n${String(result).substring(0, 3000)}\n\`\`\``)
    } catch (e) {
      await reply(`❌ Erro:\n\`\`\`\n${e.message}\n\`\`\``)
    }
  }
}

// ── !broadcast ────────────────────────────────────────────
export const broadcast = {
  name: 'broadcast',
  aliases: ['bc', 'anuncio'],
  description: 'Envia mensagem para todos os grupos',
  category: 'owner',
  usage: '!broadcast <mensagem>',
  cooldown: 30,
  async execute({ reply, argStr, isOwner, sock }) {
    if (await soODono(isOwner, reply)) return
    if (!argStr) return reply('❌ Informe a mensagem!')
    try {
      const grupos = await sock.groupFetchAllParticipating()
      const jids   = Object.keys(grupos)
      await reply(`📢 Enviando para ${jids.length} grupos...`)
      let ok = 0, err = 0
      for (const jid of jids) {
        try {
          await sock.sendMessage(jid, { text: `📢 *Anúncio:*\n\n${argStr}` })
          ok++
          await new Promise(r => setTimeout(r, 800))
        } catch { err++ }
      }
      await reply(`✅ Enviado: ${ok} grupos | ❌ Erros: ${err}`)
    } catch (e) {
      await reply(`❌ Erro: ${e.message}`)
    }
  }
}

// ── !npminstall ────────────────────────────────────────────
export const npmInstall = {
  name: 'npminstall',
  aliases: ['pkginstall', 'npmi'],
  description: 'Instala um pacote npm no bot',
  category: 'owner',
  usage: '!npminstall <pacote>',
  cooldown: 10,
  async execute({ reply, argStr, isOwner }) {
    if (await soODono(isOwner, reply)) return
    if (!argStr) return reply('❌ Informe o nome do pacote!')
    await reply(`📦 Instalando *${argStr}*...`)
    try {
      const { stdout } = await installPackage(argStr)
      await reply(`✅ *${argStr}* instalado!\n\`\`\`\n${stdout.substring(0, 500)}\n\`\`\``)
    } catch (e) {
      await reply(`❌ Erro: ${e.message.substring(0, 1000)}`)
    }
  }
}

// ── !delcmd ────────────────────────────────────────────────
export const delCmd = {
  name: 'delcmd',
  aliases: ['rmcmd', 'deletarcmd'],
  description: 'Deleta um comando do bot',
  category: 'owner',
  usage: '!delcmd <nome>',
  cooldown: 5,
  async execute({ reply, args, isOwner }) {
    if (await soODono(isOwner, reply)) return
    if (!args[0]) return reply('❌ Informe o nome do comando!')
    const ok = await deleteCommand(args[0])
    await reply(ok ? `✅ Comando *${args[0]}* deletado e recarregado!` : `❌ Comando *${args[0]}* não encontrado.`)
  }
}

// ── !cmdcode ───────────────────────────────────────────────
export const cmdCode = {
  name: 'cmdcode',
  aliases: ['sourcecmd', 'codigocmd'],
  description: 'Mostra o código-fonte de um comando',
  category: 'owner',
  usage: '!cmdcode <nome>',
  cooldown: 5,
  async execute({ reply, args, isOwner }) {
    if (await soODono(isOwner, reply)) return
    if (!args[0]) return reply('❌ Informe o nome do comando!')
    const src = getCommandSource(args[0])
    if (!src) return reply(`❌ Comando *${args[0]}* não encontrado.`)
    await reply(`\`\`\`javascript\n${src.substring(0, 3500)}\n\`\`\``)
  }
}

// ── Termux API ────────────────────────────────────────────

async function termuxRun(cmd, reply) {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 10000 })
    return stdout.trim()
  } catch (e) {
    await reply(`❌ Termux API falhou: ${e.message}\n_Instale: pkg install termux-api_`)
    return null
  }
}

export const bateria = {
  name: 'bateria',
  aliases: ['battery', 'bat'],
  description: 'Mostra o status da bateria do dispositivo',
  category: 'owner',
  usage: '!bateria',
  cooldown: 5,
  async execute({ reply, isOwner }) {
    if (await soODono(isOwner, reply)) return
    const out = await termuxRun('termux-battery-status', reply)
    if (!out) return
    try {
      const d = JSON.parse(out)
      await reply(
        `🔋 *Bateria do Dispositivo*\n\n` +
        `⚡ Nível: *${d.percentage}%*\n` +
        `🔌 Status: *${d.status}*\n` +
        `🌡️ Temperatura: *${d.temperature}°C*\n` +
        `⚙️ Saúde: *${d.health}*`
      )
    } catch { await reply(`🔋 *Bateria:*\n${out}`) }
  }
}

export const notif = {
  name: 'notif',
  aliases: ['notificacao', 'notification'],
  description: 'Envia uma notificação no dispositivo',
  category: 'owner',
  usage: '!notif <mensagem>',
  cooldown: 5,
  async execute({ reply, argStr, isOwner }) {
    if (await soODono(isOwner, reply)) return
    if (!argStr) return reply('❌ Informe o texto da notificação!')
    await termuxRun(`termux-notification --title "ElyraBot" --content "${argStr.replace(/"/g, "'")}"`, reply)
    await reply(`📳 Notificação enviada!`)
  }
}

export const tts = {
  name: 'tts',
  aliases: ['falar', 'speak'],
  description: 'Faz o dispositivo falar um texto (TTS)',
  category: 'owner',
  usage: '!tts <texto>',
  cooldown: 5,
  async execute({ reply, argStr, isOwner }) {
    if (await soODono(isOwner, reply)) return
    if (!argStr) return reply('❌ Informe o texto!')
    await termuxRun(`termux-tts-speak "${argStr.replace(/"/g, "'")}"`, reply)
    await reply(`🔊 Falando!`)
  }
}

export const clipboard = {
  name: 'clipboard',
  aliases: ['copiar', 'clip'],
  description: 'Copia texto para a área de transferência',
  category: 'owner',
  usage: '!clipboard <texto>',
  cooldown: 3,
  async execute({ reply, argStr, isOwner }) {
    if (await soODono(isOwner, reply)) return
    if (!argStr) return reply('❌ Informe o texto!')
    await termuxRun(`echo "${argStr.replace(/"/g, "'")}" | termux-clipboard-set`, reply)
    await reply(`📋 Copiado para área de transferência!`)
  }
}

export const vibrarcmd = {
  name: 'vibrar',
  aliases: ['vibrate', 'vib'],
  description: 'Vibra o dispositivo',
  category: 'owner',
  usage: '!vibrar [ms]',
  cooldown: 5,
  async execute({ reply, args, isOwner }) {
    if (await soODono(isOwner, reply)) return
    const ms = parseInt(args[0]) || 500
    await termuxRun(`termux-vibrate -d ${Math.min(ms, 5000)}`, reply)
    await reply(`📳 Vibrando por ${ms}ms!`)
  }
}

export const lanterna = {
  name: 'lanterna',
  aliases: ['torch', 'flashlight'],
  description: 'Liga/desliga a lanterna',
  category: 'owner',
  usage: '!lanterna on/off',
  cooldown: 3,
  async execute({ reply, args, isOwner }) {
    if (await soODono(isOwner, reply)) return
    const estado = args[0]?.toLowerCase() === 'on' ? 'on' : 'off'
    await termuxRun(`termux-torch --${estado}`, reply)
    await reply(`🔦 Lanterna ${estado === 'on' ? '✅ ligada' : '❌ desligada'}!`)
  }
}

export const sysinfo = {
  name: 'sysinfo',
  aliases: ['dispositivo', 'device'],
  description: 'Informações do dispositivo Termux',
  category: 'owner',
  usage: '!sysinfo',
  cooldown: 10,
  async execute({ reply, isOwner }) {
    if (await soODono(isOwner, reply)) return
    try {
      const [cpu, mem, disk, uname] = await Promise.all([
        execAsync('cat /proc/loadavg').then(r => r.stdout.trim()).catch(() => 'N/A'),
        execAsync('free -h 2>/dev/null | head -3').then(r => r.stdout.trim()).catch(() => 'N/A'),
        execAsync('df -h $HOME 2>/dev/null | tail -1').then(r => r.stdout.trim()).catch(() => 'N/A'),
        execAsync('uname -a').then(r => r.stdout.trim()).catch(() => 'N/A'),
      ])
      await reply(
        `📱 *Informações do Dispositivo*\n\n` +
        `🖥️ CPU Load: ${cpu}\n\n` +
        `💾 Memória:\n${mem}\n\n` +
        `💿 Disco:\n${disk}\n\n` +
        `🐧 Kernel: ${uname.substring(0, 100)}\n\n` +
        `⏱️ Uptime bot: ${process.uptime().toFixed(0)}s`
      )
    } catch (e) {
      await reply(`❌ Erro: ${e.message}`)
    }
  }
}

export const recarregar = {
  name: 'recarregar',
  aliases: ['reload', 'rl'],
  description: 'Recarrega todos os comandos',
  category: 'owner',
  usage: '!recarregar',
  cooldown: 5,
  async execute({ reply, isOwner }) {
    if (await soODono(isOwner, reply)) return
    const total = await loadCommands()
    await reply(`♻️ *${total} comandos recarregados com sucesso!*`)
  }
}

export const stats = {
  name: 'stats',
  aliases: ['estatisticas', 'estat'],
  description: 'Estatísticas completas do bot',
  category: 'owner',
  usage: '!stats',
  cooldown: 10,
  async execute({ reply, isOwner }) {
    if (await soODono(isOwner, reply)) return
    const total   = statsDB.get('total', {})
    const cmds    = statsDB.get('commands', {})
    const top     = Object.entries(cmds).sort((a,b) => b[1]-a[1]).slice(0,5)
    const mem     = process.memoryUsage()
    const mb      = b => (b/1024/1024).toFixed(1)
    let txt = `📊 *Estatísticas ElyraBot*\n\n`
    txt += `💬 Mensagens: *${total.msgs || 0}*\n`
    txt += `⚡ Comandos executados: *${Object.values(cmds).reduce((a,b)=>a+b,0)}*\n\n`
    txt += `🏆 *Top Comandos:*\n`
    top.forEach(([n, c], i) => { txt += `  ${i+1}. ${n}: ${c}x\n` })
    txt += `\n💾 Heap: ${mb(mem.heapUsed)}/${mb(mem.heapTotal)} MB\n`
    txt += `⏱️ Uptime: ${Math.floor(process.uptime()/60)}min`
    await reply(txt)
  }
}

export default [
  execCmd, evalCmd, broadcast, npmInstall,
  delCmd, cmdCode, recarregar, stats,
  bateria, notif, tts, clipboard, vibrarcmd, lanterna, sysinfo
]
