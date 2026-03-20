// ══════════════════════════════════════════════════════════
//  diagnostico.js — Diagnóstico completo do bot
// ══════════════════════════════════════════════════════════
import { CONFIG } from '../../config.js'
import { configDB, allowedGroupsDB, cooldownDB } from '../../database.js'
import { commandMap, aliasMap } from '../../loader.js'
import { getUptime } from '../../utils.js'
import { ROLES, getRole } from '../../permissions.js'

export default {
  name: 'diagnostico',
  aliases: ['diag', 'debug', 'status2'],
  description: 'Diagnóstico completo — útil quando bot não responde',
  category: 'owner',
  usage: '.diagnostico',
  cooldown: 5,
  async execute({ reply, userId, isOwner, isSubdono, sock, from, isGrupo }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')

    const restricao  = configDB.get('groupRestriction', false)
    const pausado    = configDB.get('botPaused', false)
    const grupos     = Object.keys(allowedGroupsDB.all())
    const prefixo    = CONFIG.prefixo
    const antiSpam   = CONFIG.antiSpam
    const fuzzy      = CONFIG.fuzzyCommands
    const owner      = CONFIG.owner
    const selfBot    = CONFIG.selfBot
    const totalCmds  = commandMap.size
    const totalAlias = aliasMap.size
    const mem        = process.memoryUsage()
    const mb         = b => (b / 1024 / 1024).toFixed(1)

    const cargo = getRole(userId)
    const isOwnerDetected = cargo === ROLES.DONO

    let msg = `🔍 *DIAGNÓSTICO DO BOT*\n\n`

    // Status crítico
    msg += `━━ *STATUS CRÍTICO* ━━\n`
    msg += `${pausado ? '🔴' : '🟢'} Bot: *${pausado ? 'PAUSADO' : 'ATIVO'}*\n`
    msg += `${restricao ? '🔴' : '🟢'} Restrição de grupos: *${restricao ? 'ATIVA' : 'INATIVA'}*\n`
    if (restricao) {
      msg += `   └ Grupos autorizados: *${grupos.length}*\n`
      if (grupos.length === 0) {
        msg += `   └ ⚠️ *SEM GRUPOS AUTORIZADOS — bot não responde em nenhum grupo!*\n`
        msg += `   └ Fix: *.restricaogrupos off* ou *.allowbot*\n`
      } else if (isGrupo && !grupos.includes(from)) {
        msg += `   └ ⚠️ *Este grupo NÃO está autorizado!*\n`
        msg += `   └ Fix: *.allowbot* neste grupo\n`
      }
    }

    // Configuração
    msg += `\n━━ *CONFIGURAÇÃO* ━━\n`
    msg += `🔑 Prefixo: *"${prefixo}"*\n`
    msg += `👑 Dono configurado: *${owner ? '+' + owner : 'NÃO CONFIGURADO ⚠️'}*\n`
    msg += `${isOwnerDetected ? '✅' : '❌'} Você é reconhecido como dono: *${isOwnerDetected ? 'SIM' : 'NÃO'}*\n`
    if (!isOwnerDetected) {
      msg += `   └ Seu JID: \`${userId}\`\n`
      msg += `   └ Fix: certifique que OWNER_NUMBER no .env = ${userId.split('@')[0]}\n`
    }
    msg += `🤖 Self-bot: *${selfBot ? 'SIM' : 'NÃO'}*\n`
    msg += `🛡️ Anti-spam: *${antiSpam ? 'ATIVO ⚠️' : 'INATIVO'}*\n`
    msg += `🔍 Fuzzy commands: *${fuzzy ? 'ativo' : 'inativo'}*\n`

    // Comandos
    msg += `\n━━ *COMANDOS* ━━\n`
    msg += `📦 Carregados: *${totalCmds}* comandos + *${totalAlias}* aliases\n`
    msg += `⏱️ Uptime: *${getUptime()}*\n`
    msg += `💾 RAM: *${mb(mem.heapUsed)}MB / ${mb(mem.heapTotal)}MB*\n`

    // Ações rápidas
    msg += `\n━━ *FIXES RÁPIDOS* ━━\n`
    msg += `• Bot não responde grupos: *.restricaogrupos off*\n`
    msg += `• Bot pausado: *.boton*\n`
    msg += `• Prefix errado: verifique PREFIX no .env\n`
    msg += `• Anti-spam bloqueando: ANTI_SPAM=false no .env\n`
    msg += `• Recarregar cmds: *.reload*\n`

    await reply(msg)
  }
}
