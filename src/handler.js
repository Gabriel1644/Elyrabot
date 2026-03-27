// ══════════════════════════════════════════════════════════
//  handler.js — Roteador principal de mensagens
// ══════════════════════════════════════════════════════════
import { CONFIG } from './config.js'
import { logMsg, logWarn, logInfo } from './logger.js'
import { getCommand, isCommandEnabled, commandMap, aliasMap } from './loader.js'
import { handleAIResponse } from './ai.js'
import { getMessageText, getMentionedJids } from './utils.js'
import { groupsDB, cooldownDB, automationsDB, allowedGroupsDB, configDB } from './database.js'
import { capturar, notifyOwner, handleOwnerReply } from './errorTracker.js'
import { isLikelyCode, processCodeInChat } from './codeDetector.js'
import { handleContribReply } from './contributions.js'
import {
  getRole, isDono, isSubdono, isBanido, trackUser,
  hasPermission, getSubdonoPerms, cleanNum, ROLES, ROLE_NAMES
} from './permissions.js'
import { cmdPermsDB } from './database.js'
import { runHooks } from './hooks.js'

export let botJid = null
export function setBotJid(jid) { botJid = jid }
let _sock = null
export function setSock(sock) { _sock = sock }

const spamMap = new Map()
const _groupMetaCache = new Map()  // Cache de metadata de grupo (30s TTL)

// ── Fuzzy matching — distância de Levenshtein ─────────────
function levenshtein(a, b) {
  if (a === b) return 0
  const la = a.length, lb = b.length
  if (!la) return lb; if (!lb) return la
  const row = Array.from({length: lb + 1}, (_, i) => i)
  for (let i = 1; i <= la; i++) {
    let prev = i
    for (let j = 1; j <= lb; j++) {
      const val = a[i-1] === b[j-1] ? row[j-1] : 1 + Math.min(row[j-1], row[j], prev)
      row[j-1] = prev; prev = val
    }
    row[lb] = prev
  }
  return row[lb]
}

function fuzzyMatch(input) {
  if (input.length < 2) return null
  const maxDist = input.length <= 4 ? 1 : 2
  let best = null, bestDist = Infinity
  for (const key of [...commandMap.keys(), ...aliasMap.keys()]) {
    const d = levenshtein(input, key)
    if (d <= maxDist && d < bestDist) { bestDist = d; best = key }
  }
  return best ? getCommand(best) : null
}

function checkSpam(userId) {
  if (!CONFIG.antiSpam) return false
  const now  = Date.now()
  const data = spamMap.get(userId) || { count: 0, last: now }
  if (now - data.last < (CONFIG.spamJanela || 10000)) {
    data.count++
    if (data.count >= (CONFIG.spamLimite || 5)) { spamMap.set(userId, data); return true }
  } else { data.count = 1; data.last = now }
  spamMap.set(userId, data)
  return false
}

function checkCooldown(userId, cmdName, seconds) {
  if (!seconds) return false
  // VIP, subdono e dono nunca têm cooldown
  if (hasPermission(userId, ROLES.VIP)) return false
  const key  = `${cleanNum(userId)}:${cmdName}`
  const last = cooldownDB.get(key, 0)
  const now  = Date.now()
  if (now - last < seconds * 1000) return Math.ceil((seconds * 1000 - (now - last)) / 1000)
  cooldownDB.set(key, now)
  return false
}

function canUseCommand(userId, cmd, isGroupAdmin) {
  const role = getRole(userId)
  if (role === ROLES.BANIDO) return false
  if (cmd.category === 'owner') {
    if (role === ROLES.DONO) return true
    if (role === ROLES.SUBDONO) {
      // Subdono tem acesso por padrão, a menos que explicitamente removido
      const perms = getSubdonoPerms(userId)
      return perms.allOwnerCmds !== false
    }
    return false
  }
  if (cmd.category === 'admin') return isGroupAdmin || role <= ROLES.SUBDONO
  return true
}

export async function handleMessage(sock, msg) {
  if (!msg?.message) return

  const isMe    = msg.key.fromMe
  const from    = msg.key.remoteJid
  if (!from) return

  const isGrupo = from.endsWith('@g.us')
  const tipo    = isGrupo ? 'GRUPO' : 'PRIVADO'
  const texto   = getMessageText(msg) || ''
  const p       = CONFIG.prefixosGrupo?.[from] || CONFIG.prefixo || '!'

  // Declarar cedo — usados em automações e hooks antes do metadata fetch
  let nomeGrupo = null
  let membros   = []

  // ── Handler de botões interativos (carrossel, quick_reply) ─
  const nativeFlow = msg.message?.nativeFlowResponseMessage
  const btnReply   = msg.message?.buttonsResponseMessage
  const btnId      = nativeFlow?.paramsJson
    ? (() => { try { return JSON.parse(nativeFlow.paramsJson).id } catch { return null } })()
    : btnReply?.selectedButtonId

  if (btnId?.startsWith('pin_')) {
    try {
      const { pinCache } = await import('./commands/media/media.js')
      const cached = pinCache.get(btnId)
      if (cached) {
        await sock.sendMessage(from, {
          image: { url: cached.url },
          caption: `📥 *Download — Pinterest*\n🔎 ${cached.nome}`,
        }, { quoted: msg })
        pinCache.delete(btnId)
      } else {
        await sock.sendMessage(from, { text: '❌ Link expirado. Faça a busca novamente.' }, { quoted: msg })
      }
    } catch {}
    return
  }

  if (!texto.trim()) return
  // Mensagens próprias (bot enviou) só processam se começam com prefixo
  if (isMe && !texto.trim().startsWith(p)) return

  // userId: em grupo usa participant; em privado usa o JID da conversa (quem mandou)
  const usuario = msg.pushName || (isMe ? CONFIG.nome : 'Desconhecido')
  const userId  = isMe
    ? (botJid || from)
    : (isGrupo ? (msg.key.participant || from) : from)

  // ── Restrição de grupos ────────────────────────────────
  if (isGrupo && configDB.get('groupRestriction', false)) {
    const allowed = allowedGroupsDB.has(from)
    if (!allowed) {
      // Log once every 30s per group so it shows in dashboard
      const logKey = `restr_log:${from}`
      const lastLog = cooldownDB.get(logKey, 0)
      if (Date.now() - lastLog > 30000) {
        cooldownDB.set(logKey, Date.now())
        logInfo(`🔒 Grupo bloqueado (restrição ativa): ${from.split('@')[0]}`)
      }
      return
    }
  }

  // ── Tracking (assíncrono — não bloqueia o processamento) ──
  if (!isMe) {
    // Não bloqueia: tracking roda em background
    const _trackAsync = async () => {
      let grupoNome = null
      if (isGrupo) {
        try { const m = await sock.groupMetadata(from); grupoNome = m.subject } catch {}
      }
      trackUser({ userId, usuario, isGrupo, grupo: grupoNome, from })
    }
    _trackAsync().catch(() => {})
  }

  // ── Banido ─────────────────────────────────────────────
  if (isBanido(userId)) {
    if (texto.trim().startsWith(p)) {
      const msg2 = CONFIG.msgBanido || '🚫 Você foi banido do bot.'
      try { await sock.sendMessage(from, { text: msg2, quoted: msg }) } catch {}
    }
    return
  }

  // ── Anti-link ──────────────────────────────────────────
  if (isGrupo) {
    const gd = groupsDB.get(from, {})
    if (gd.antilink && /https?:\/\//i.test(texto) && !await isGroupAdmin(sock, from, userId)) {
      try { await sock.sendMessage(from, { delete: msg.key }) } catch {}
      await sock.sendMessage(from, { text: `⛔ @${userId.split('@')[0]} Links não permitidos!`, mentions: [userId] })
      return
    }
  }

  if (checkSpam(userId)) return

  // ── Engine de Automações ──────────────────────────────
  if (!isMe) {
    const textoLower = texto.toLowerCase().trim()
    const autos = Object.values(automationsDB.all()).filter(a => a.enabled !== false)
    for (const auto of autos) {
      if (!auto.trigger) continue
      // Verifica escopo
      if (auto.scope === 'group' && !isGrupo) continue
      if (auto.scope === 'private' && isGrupo) continue
      // Verifica cooldown
      if (auto.cooldown > 0) {
        const ck = `auto_cd:${auto.id}:${userId}`
        const last = cooldownDB.get(ck, 0)
        if (Date.now() - last < auto.cooldown * 1000) continue
        cooldownDB.set(ck, Date.now())
      }
      // Matching: exato, contém ou regex
      const t = auto.trigger.toLowerCase().trim()
      const matched = auto.matchType === 'contains'
        ? textoLower.includes(t)
        : auto.matchType === 'regex'
          ? (() => { try { return new RegExp(t, 'i').test(textoLower) } catch { return false } })()
          : textoLower === t  // padrão: exato
      if (!matched) continue

      // Monta resposta
      // Substitui variáveis na resposta
      const hora = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
      const data = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      const textoCapturado = texto.trim()

      // Respostas aleatórias: separe opções com | usando matchType "random"
      let respRaw = auto.response || ''
      if (auto.multiResponse && respRaw.includes('|')) {
        const opcoes = respRaw.split('|').map(s => s.trim()).filter(Boolean)
        respRaw = opcoes[Math.floor(Math.random() * opcoes.length)]
      }

      const resp = respRaw
        .replace(/\{nome\}/gi, usuario)
        .replace(/\{grupo\}/gi, nomeGrupo || 'grupo')
        .replace(/\{hora\}/gi, hora)
        .replace(/\{data\}/gi, data)
        .replace(/\{texto\}/gi, textoCapturado)
        .replace(/\{prefix\}/gi, p)

      try {
        // Reação antes de responder (se configurada)
        if (auto.reactEmoji) {
          await sock.sendMessage(from, { react: { text: auto.reactEmoji, key: msg.key } })
        }

        // Deletar a mensagem do usuário (se configurado)
        if (auto.deleteMessage) {
          try { await sock.sendMessage(from, { delete: msg.key }) } catch {}
        }

        // Enviar resposta de acordo com o tipo
        if (auto.type === 'audio' && auto.mediaUrl) {
          // Detecta se é opus/ogg (PTT) ou mp3 (música)
          const isOpus = auto.mediaUrl.includes('.ogg') || auto.mimetype?.includes('opus')
          await sock.sendMessage(from, {
            audio: { url: auto.mediaUrl },
            mimetype: isOpus ? 'audio/ogg; codecs=opus' : 'audio/mpeg',
            ptt: isOpus,
          }, { quoted: auto.noQuote ? undefined : msg })
          if (resp) await sock.sendMessage(from, { text: resp }, { quoted: msg })

        } else if (auto.type === 'image' && auto.mediaUrl) {
          await sock.sendMessage(from, { image: { url: auto.mediaUrl }, caption: resp }, { quoted: msg })

        } else if (auto.type === 'video' && auto.mediaUrl) {
          await sock.sendMessage(from, { video: { url: auto.mediaUrl }, caption: resp }, { quoted: msg })

        } else if (auto.type === 'sticker' && auto.mediaUrl) {
          await sock.sendMessage(from, { sticker: { url: auto.mediaUrl } }, { quoted: msg })
          if (resp) await sock.sendMessage(from, { text: resp }, { quoted: msg })

        } else if (auto.type === 'mention' && resp) {
          // Menciona o usuário na resposta
          await sock.sendMessage(from, {
            text: resp,
            mentions: [userId],
          }, { quoted: msg })

        } else if (resp) {
          await sock.sendMessage(from, { text: resp }, { quoted: msg })
        }
      } catch (e) {
        logWarn(`Automação "${auto.trigger}" erro: ${e.message}`)
      }
      if (auto.stopPropagation !== false) return  // não processa comandos após automação
    }
  }

  // ── Intercepta respostas especiais do dono no privado ──
  // ANTES do gate de prefixo para que o dono possa responder 1/2/3 sem prefixo
  if (!isGrupo && !isMe) {
    const isOwnerUser = isDono(userId)
    if (isOwnerUser) {
      // Error tracker (1/2/3)
      if (/^[123]$/.test(texto.trim())) {
        const handled = handleOwnerReply(userId, texto, sock)
        if (handled) return
      }
      // Contribution reply (sim/não)
      if (handleContribReply(userId, texto, sock)) return
    }
  }


  // ── Detector de código (grupo E privado) ───────────────
  const codeDetectOn  = CONFIG.autoCodeDetect !== false
  const codeOwnerOnly = CONFIG.codeOwnerOnly  !== false

  if (codeDetectOn && !isMe && !texto.trim().startsWith(p) && isLikelyCode(texto)) {
    // Quem pode ativar o detector:
    // - codeOwnerOnly=true: só o dono
    // - codeOwnerOnly=false: dono + subdono
    const canDetect = codeOwnerOnly ? isDono(userId) : isSubdono(userId)
    if (canDetect) {
      logInfo(`📥 Código detectado de ${usuario} (${isGrupo ? 'grupo' : 'privado'})`)
      try {
        await sock.sendMessage(from, { text: `🔍 _Código detectado! Verificando segurança..._`, quoted: msg })
        const result = await processCodeInChat({ code: texto, userId, sock, from, msg, usuario })

        if (!result.ok) {
          await sock.sendMessage(from, { text: result.reason, quoted: msg })
          return
        }

        if (result.commandResult) {
          const cr = result.commandResult
          let r = `✅ *!${cr.name} instalado!*\n📦 _${cr.category}_\n${cr.description || ''}\n\n_Use: ${p}${cr.name}_`
          // Auto-upload GitHub
          if (CONFIG['github.repo']) {
            try {
              const { uploadCommand } = await import('./github.js')
              const up = await uploadCommand({ name: cr.name, category: cr.category, code: cr.code, description: cr.description })
              r += up.ok ? `\n🐙 _GitHub: publicado!_` : `\n⚠️ _GitHub: ${up.reason}_`
            } catch {}
          }
          await sock.sendMessage(from, { text: r, quoted: msg })
        } else {
          await sock.sendMessage(from, { text: result.text || '✅ Processado!', quoted: msg })
        }
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Detector: ${e.message}`, quoted: msg })
      }
      return
    }
  }

  // ── Hooks de mensagem (registrados por comandos) ──────────
  if (!isMe) {
    const hookCtx = {
      sock, msg, from, userId, usuario, texto, isGrupo,
      nomeGrupo: null,  // será preenchido se precisar
      reply: (text) => sock.sendMessage(from, { text, quoted: msg }),
      react: (e)    => sock.sendMessage(from, { react: { text: e, key: msg.key } }),
    }
    const stopped = await runHooks(hookCtx)
    if (stopped) return  // Hook parou a propagação
  }

  // ── Prefix check — suporta "! menu", " !menu", ">>" e "$" ─
  const textoClean = texto.trim()

  // Extra prefixes que sempre funcionam independente do prefixo configurado
  const EXTRA_PREFIXES = ['>>', '$']
  let effectivePrefix = p
  let matchedExtra    = false

  for (const ep of EXTRA_PREFIXES) {
    if (textoClean.startsWith(ep)) {
      effectivePrefix = ep
      matchedExtra    = true
      break
    }
  }

  if (!matchedExtra && !textoClean.startsWith(p)) return

  // ── Bot pausado ─────────────────────────────────────────
  if (configDB.get('botPaused', false)) {
    const userRoleCheck = getRole(userId)
    if (userRoleCheck > ROLES.SUBDONO) return
  }

  // Parse do comando
  // ">>info"    → effectivePrefix=">>" textoNorm="info" cmdNome=">>info" (tenta alias composto)
  // "$ ls"      → effectivePrefix="$"  textoNorm="ls"   cmdNome="$" args=["ls"]
  // ".menu"     → effectivePrefix="."  textoNorm="menu" cmdNome="menu"
  const textoNorm = textoClean.slice(effectivePrefix.length).trim()
  const partes    = textoNorm.split(/\s+/)
  let   cmdNome   = partes[0]?.toLowerCase()
  const args      = partes.slice(1)
  const argStr    = args.join(' ')

  if (matchedExtra) {
    // Para extras (>> e $): se não tem texto após, o próprio prefixo é o comando
    if (!cmdNome) {
      cmdNome = effectivePrefix.toLowerCase()
    } else {
      // Tenta ">>info" como alias composto primeiro
      const composto = (effectivePrefix + cmdNome).toLowerCase()
      if (getCommand(composto) || [...aliasMap.keys()].includes(composto)) {
        cmdNome = composto
      }
      // Senão usa cmdNome normal (ex: "info" → busca por alias ou fuzzy)
    }
  }
  if (!cmdNome) return

  // Tenta comando exato primeiro
  let cmd = getCommand(cmdNome)

  // ── Fuzzy matching — typos leves ─────────────────────────
  if (!cmd && CONFIG.fuzzyCommands !== false) {
    cmd = fuzzyMatch(cmdNome)
  }

  if (!cmd) return

  if (!isCommandEnabled(cmd.name)) {
    await sock.sendMessage(from, { text: `❌ *${p}${cmd.name}* está desativado.`, quoted: msg })
    return
  }

  // Metadata do grupo (cache 30s por grupo para evitar requests desnecessários)
  // (nomeGrupo e membros já declarados no topo da função)
  if (isGrupo) {
    const cacheKey = `gmeta:${from}`
    const cached = _groupMetaCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < 30000) {
      nomeGrupo = cached.subject; membros = cached.participants
    } else {
      try {
        const m = await sock.groupMetadata(from)
        nomeGrupo = m.subject; membros = m.participants
        _groupMetaCache.set(cacheKey, { subject: m.subject, participants: m.participants, ts: Date.now() })
      } catch {}
    }
  }

  const isAdminUser   = await isGroupAdmin(sock, from, userId)
  const userRole      = getRole(userId)
  const isOwner       = userRole === ROLES.DONO
  const isSubdonoUser = isSubdono(userId)

  // ── Mensagens de erro personalizadas ──────────────────
  const msgSemPerm = CONFIG.msgSemPerm || '❌ *{cmd}* requer: _{cargo}_'
  const msgCooldown = CONFIG.msgCooldown || '⏳ Aguarde *{tempo}s* para usar *{cmd}*.'
  const msgBanido = CONFIG.msgBanido || '🚫 Você foi banido do bot.'

  function fmtSemPerm(cmdName, cargo) {
    return msgSemPerm.replace('{cmd}', p + cmdName).replace('{cargo}', cargo).replace('{nome}', usuario)
  }
  function fmtCooldown(cmdName, tempo) {
    return msgCooldown.replace('{cmd}', p + cmdName).replace('{tempo}', tempo).replace('{nome}', usuario)
  }

  logMsg({ usuario, grupo: nomeGrupo, conteudo: texto, tipo, comando: cmdNome, userId })

  // ── Permissão: override por comando > padrão por categoria ──
  const cmdPerm = cmdPermsDB.get(cmd.name, null)
  if (cmdPerm) {
    if (cmdPerm.allowedIn === 'private' && isGrupo) {
      await sock.sendMessage(from, { text: `❌ *${p}${cmd.name}* só pode ser usado em privado.`, quoted: msg })
      return
    }
    if (cmdPerm.allowedIn === 'group' && !isGrupo) {
      await sock.sendMessage(from, { text: `❌ *${p}${cmd.name}* só pode ser usado em grupos.`, quoted: msg })
      return
    }
    if (cmdPerm.minRole && !hasPermission(userId, Number(cmdPerm.minRole))) {
      const roleNeeded = ROLE_NAMES[cmdPerm.minRole] || 'Sem permissão'
      await sock.sendMessage(from, { text: fmtSemPerm(cmd.name, roleNeeded), quoted: msg })
      return
    }
  } else {
    if (!canUseCommand(userId, cmd, isAdminUser)) {
      const needed = cmd.category === 'owner' ? 'Dono/Sub-dono' : 'Admin'
      await sock.sendMessage(from, { text: fmtSemPerm(cmd.name, needed), quoted: msg })
      return
    }
  }

  const cd = checkCooldown(userId, cmd.name, cmd.cooldown)
  if (cd) {
    await sock.sendMessage(from, { text: fmtCooldown(cmd.name, cd), quoted: msg })
    return
  }

  const reply = (text) => sock.sendMessage(from, { text, quoted: msg })

  const ctx = {
    sock, msg, from, userId, isGrupo, tipo,
    usuario, nomeGrupo, membros, args, argStr,
    texto, prefix: p, reply,
    isAdmin:   isAdminUser,
    isOwner,
    isSubdono: isSubdonoUser,
    userRole,
    botJid,
    gdata: groupsDB.get(from, {}),
    sendText:    (t)       => sock.sendMessage(from, { text: t }),
    sendImage:   (url, c='') => sock.sendMessage(from, { image: { url }, caption: c }, { quoted: msg }),
    sendSticker: (buf)     => sock.sendMessage(from, { sticker: buf }, { quoted: msg }),
    sendAudio:   (url)     => sock.sendMessage(from, { audio: { url }, mimetype: 'audio/mpeg', ptt: false }),
    react:       (e)       => sock.sendMessage(from, { react: { text: e, key: msg.key } }),
    mention:     (jids, t) => sock.sendMessage(from, { text: t, mentions: jids }),
  }

  try {
    await cmd.execute(ctx)
  } catch (e) {
    logWarn(`Erro em !${cmd.name}: ${e.message}`)
    capturar(`Erro no comando !${cmd.name}`, e, `commands/${cmd.category}/${cmd.name}`)
    notifyOwner(sock, `!${cmd.name}`, e)
    await reply(`❌ Erro em *!${cmd.name}*: ${e.message}`)
  }
}

async function isGroupAdmin(sock, groupId, userId) {
  if (!groupId?.endsWith('@g.us')) return false
  try {
    const meta = await sock.groupMetadata(groupId)
    const num  = cleanNum(userId)
    return meta.participants.some(p => cleanNum(p.id) === num && ['admin', 'superadmin'].includes(p.admin))
  } catch { return false }
}
