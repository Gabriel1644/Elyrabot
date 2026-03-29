// ══════════════════════════════════════════════════════════
//  dashboard.js — Servidor Express + Socket.io
// ══════════════════════════════════════════════════════════
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import Groq from 'groq-sdk'
import { CONFIG } from './config.js'
import { getLogs, setSocket, logInfo, getLastStatus } from './logger.js'
import { getCommandList, loadCommands, toggleCommand, createCommand, deleteCommand, execShell, installPackage, getCommandSource, addDynamicAlias, removeDynamicAlias, listAliasesForCommand } from './loader.js'
import { configDB, statsDB, groupsDB, rpgDB, cmdPermsDB, menuTargetDB, minionsDB, subdonsDB, automationsDB, allowedGroupsDB, schedulerDB } from './database.js'
import os from 'os'
import JsonDB from './database.js'
const cmdMetaDB = new JsonDB('cmdmeta')  // armazena desc/usage/cooldown editados pelo painel
import { getUptime } from './utils.js'
import { getMinionList, getMinionStats, addSubdono, removeSubdono, listSubdonos, ROLE_NAMES } from './permissions.js'
import { getAllContribs, getContribStats, approveContrib, rejectContrib } from './contributions.js'
import { pullFullBot } from './github.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))


// ── Gemini support ────────────────────────────────────
async function callGemini(prompt, key) {
  const { default: axios } = await import('axios')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
  const { data } = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.25, maxOutputTokens: 3000 }
  }, { timeout: 30000 })
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

const SYSTEM_CMD_GENERATOR = `Você é um especialista em criar comandos para o ElyraBot (WhatsApp bot, @whiskeysockets/baileys, Node.js ES Modules).
Responda APENAS com código JavaScript válido. Sem explicações, sem markdown.

ESTRUTURA OBRIGATÓRIA:
export default {
  name: 'nomecomando',
  aliases: ['alias1'],
  description: 'Descrição',
  category: 'fun',
  usage: '!nomecomando <arg>',
  cooldown: 5,
  async execute(ctx) {
    const { sock, msg, from, userId, usuario, isGrupo, nomeGrupo, membros,
            args, argStr, texto, prefix, reply, isAdmin, isOwner, botJid, gdata,
            sendText, sendImage, sendSticker, sendAudio, react, mention } = ctx
    // código aqui
  }
}

Imports disponíveis (dentro da execute):
import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)
import { promisify } from 'util'
import fs from 'fs'
import { CONFIG } from '../../config.js'
import { configDB, groupsDB, usersDB, statsDB } from '../../database.js'
import { handleAIResponse } from '../../ai.js'

Regras: ES Modules, try/catch sempre, cooldown mínimo 2s para APIs, use import() dinâmico.
Responda APENAS com código JS.`

export function startDashboard() {
  const app  = express()
  const http = createServer(app)
  const io   = new Server(http, { cors: { origin: '*' } })

  setSocket(io)
  app.use(express.json({ limit: '5mb' }))
  // Force JSON content-type on all /api routes
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    next()
  })

  function auth(req, res, next) {
    const pass = CONFIG.dashboardPass
    if (!pass) return next()
    const token = req.headers['x-token'] || req.query.token
    if (token !== pass) return res.status(401).json({ error: 'Unauthorized' })
    next()
  }

  // ── Status ──────────────────────────────────────────────
  app.get('/api/status', auth, (req, res) => {
    const stats = statsDB.get('total', {})
    const cmds  = statsDB.get('commands', {})
    res.json({
      nome:      CONFIG.nome,
      versao:    CONFIG.versao,
      uptime:    getUptime(),
      prefixo:   CONFIG.prefixo,
      modelo:    CONFIG.modelo,
      msgs:      stats.msgs || 0,
      cmdsTotal: Object.values(cmds).reduce((a, b) => a + b, 0),
      topCmds:   Object.entries(cmds).sort((a, b) => b[1] - a[1]).slice(0, 5),
      mem:       process.memoryUsage(),
    })
  })

  app.get('/api/logs', auth, (req, res) => res.json(getLogs()))

  // ── Comandos ─────────────────────────────────────────────
  app.get('/api/commands', auth, (req, res) => {
    const list    = getCommandList()
    const targets = menuTargetDB.all()
    const result  = list.map(cmd => ({
      ...cmd,
      menuTargets: targets[cmd.name] || [],
    }))
    res.json(result)
  })

  app.post('/api/commands/:name/aliases', auth, async (req, res) => {
    const { aliases } = req.body
    if (!Array.isArray(aliases)) return res.status(400).json({ error: 'aliases must be array' })
    try {
      // Remove old dynamic aliases for this command
      const old = listAliasesForCommand(req.params.name).filter(a => a.type === 'dinâmico').map(a => a.alias)
      for (const a of old) removeDynamicAlias(a)
      // Add new dynamic aliases
      for (const a of aliases) {
        if (a && a.trim() && a !== req.params.name) addDynamicAlias(a.trim(), req.params.name)
      }
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/commands/:name/toggle', auth, (req, res) => {
    toggleCommand(req.params.name, req.body.enabled)
    res.json({ ok: true })
  })

  app.delete('/api/commands/:name', auth, async (req, res) => {
    const ok = await deleteCommand(req.params.name)
    res.json({ ok })
  })

  app.get('/api/commands/:name/source', auth, (req, res) => {
    const src = getCommandSource(req.params.name)
    if (!src) return res.status(404).json({ error: 'Not found' })
    res.json({ source: src })
  })

  app.post('/api/commands/:name/source', auth, async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      const { source, category, code } = req.body
      const finalSource = source || code
      if (!finalSource) return res.status(400).json({ error: 'Source (código) é obrigatório' })
      const name = req.params.name
      if (!name || name.length < 1) return res.status(400).json({ error: 'Nome inválido' })
      await createCommand({ name, code: finalSource, category: category || 'misc' })
      res.json({ ok: true, name, category: category || 'misc' })
    } catch (e) {
      res.status(500).json({ error: e.message || 'Erro interno' })
    }
  })

  // ── Salvar metadados do comando (desc, usage, cooldown) ──
  app.put('/api/commands/:name/meta', auth, async (req, res) => {
    try {
      const { description, usage, cooldown } = req.body
      const name = req.params.name
      const existing = cmdMetaDB.get(name, {})
      const updated  = { ...existing }
      if (description !== undefined) updated.description = description
      if (usage       !== undefined) updated.usage       = usage
      if (cooldown    !== undefined) updated.cooldown    = parseInt(cooldown) || 0
      cmdMetaDB.set(name, updated)

      // Apply to live command object in memory
      const { commandMap } = await import('./loader.js').catch(() => ({}))
      const cmd = commandMap?.get(name)
      if (cmd) {
        if (description !== undefined) cmd.description = description
        if (usage       !== undefined) cmd.usage       = usage
        if (cooldown    !== undefined) cmd.cooldown    = parseInt(cooldown) || 0
      }
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Config ───────────────────────────────────────────────
  app.get('/api/config', auth, (req, res) => {
    res.json({
      prefixo:       CONFIG.prefixo,
      nome:          CONFIG.nome,
      personalidade: CONFIG.personalidade,
      modelo:        CONFIG.modelo,
      antiSpam:      CONFIG.antiSpam,
      dashboardPort: CONFIG.dashboardPort,
      owner:         CONFIG.owner,
      groqKey:       CONFIG.groqKey ? '***' + CONFIG.groqKey.slice(-4) : '',
      geminiKey:     CONFIG.geminiKey ? '***' + CONFIG.geminiKey.slice(-4) : '',
      aiProvider:    CONFIG.aiProvider || 'auto',
      menu:          CONFIG.menu,
      autoCodeDetect: CONFIG.autoCodeDetect,
      codeOwnerOnly:  CONFIG.codeOwnerOnly,
      iaAtivaPadrao:  CONFIG.iaAtivaPadrao,
      botEmoji:       CONFIG.botEmoji    || '',
      botDescricao:   CONFIG.botDescricao|| '',
      welcomeMsg:     CONFIG.welcomeMsg  || '',
      msgBanido:      CONFIG.msgBanido   || '',
      msgCooldown:    CONFIG.msgCooldown || '',
      msgSemPerm:     CONFIG.msgSemPerm  || '',
    })
  })

  app.post('/api/config', auth, (req, res) => {
    const allowed = ['prefixo', 'nome', 'personalidade', 'modelo', 'antiSpam', 'owner',
      'bannerMenu', 'autoCodeDetect', 'codeOwnerOnly', 'iaAtivaPadrao',
      'botEmoji', 'botDescricao', 'welcomeMsg', 'msgBanido', 'msgCooldown', 'msgSemPerm', 'fuzzyCommands']
    for (const k of allowed) {
      if (k in req.body) CONFIG[k] = req.body[k]
    }
    if (req.body.groqKey && !req.body.groqKey.startsWith('***') && req.body.groqKey !== '(salvo)') {
      CONFIG.groqKey = req.body.groqKey
    }
    if (req.body.geminiKey && !req.body.geminiKey.startsWith('***') && req.body.geminiKey !== '(salvo)') {
      CONFIG.geminiKey = req.body.geminiKey
    }
    res.json({ ok: true })
  })

  app.post('/api/config/menu', auth, (req, res) => {
    const body = req.body
    // menuLines is an array — save as-is
    CONFIG.menu = { ...(CONFIG.menu || {}), ...body }
    res.json({ ok: true, menu: CONFIG.menu })
  })

  // ── Reload ───────────────────────────────────────────────
  app.post('/api/reload', auth, async (req, res) => {
    const total = await loadCommands()
    io.emit('reload', { total })
    res.json({ ok: true, total })
  })

  // ── Stats chart ──────────────────────────────────────────
  app.get('/api/stats/chart', auth, (req, res) => {
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dias.push({ date: key, ...statsDB.get(key, { msgs: 0, cmds: 0 }) })
    }
    res.json(dias)
  })

  app.get('/api/groups', auth, (req, res) => res.json(groupsDB.all()))

  app.get('/api/stats/groups', auth, (req, res) => {
    const groups = statsDB.get('groups', {})
    res.json(Object.entries(groups).map(([jid, data]) => ({ jid, ...data })))
  })

  app.get('/api/rpg/ranking', auth, (req, res) => {
    res.json(Object.values(rpgDB.all()).sort((a, b) => b.nivel - a.nivel).slice(0, 20))
  })

  // ── Agendador ──────────────────────────────────────────
  app.get('/api/scheduler', auth, (req, res) => res.json(schedulerDB.all()))
  app.post('/api/scheduler', auth, (req, res) => {
    const { id, text, jid, time, repeat } = req.body
    if (!text || !jid || !time) return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    const newId = id || Date.now().toString()
    schedulerDB.set(newId, { id: newId, text, jid, time, repeat, enabled: true })
    res.json({ ok: true, id: newId })
  })
  app.delete('/api/scheduler/:id', auth, (req, res) => {
    schedulerDB.delete(req.params.id)
    res.json({ ok: true })
  })

  // ── Gerenciador de Arquivos ─────────────────────────────
  app.get('/api/files', auth, (req, res) => {
    const dir = req.query.path || ''
    const fullPath = path.join(ROOT, dir)
    if (!fullPath.startsWith(ROOT)) return res.status(403).json({ error: 'Acesso negado' })
    try {
      const files = fs.readdirSync(fullPath).map(f => {
        const s = fs.statSync(path.join(fullPath, f))
        return { name: f, isDir: s.isDirectory(), size: s.size, mtime: s.mtime }
      })
      res.json(files)
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.delete('/api/files', auth, (req, res) => {
    const { path: filePath } = req.query
    const fullPath = path.join(ROOT, filePath)
    if (!fullPath.startsWith(ROOT) || filePath === '.env') return res.status(403).json({ error: 'Acesso negado' })
    try {
      if (fs.statSync(fullPath).isDirectory()) fs.rmSync(fullPath, { recursive: true })
      else fs.unlinkSync(fullPath)
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Monitor de Recursos ─────────────────────────────────
  app.get('/api/system/usage', auth, (req, res) => {
    const free = os.freemem(), total = os.totalmem()
    res.json({
      ram: { free, total, used: total - free, percent: ((total - free) / total * 100).toFixed(1) },
      cpu: os.loadavg(),
      uptime: os.uptime(),
      platform: os.platform()
    })
  })

  // ── Controle de Grupos ──────────────────────────────────
  app.post('/api/groups/broadcast', auth, async (req, res) => {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Texto vazio' })
    const groups = Object.keys(groupsDB.all())
    let count = 0
    for (const gid of groups) {
      try {
        await _sock.sendMessage(gid, { text })
        count++
      } catch {}
    }
    res.json({ ok: true, sent: count })
  })

  app.post('/api/groups/leave/:jid', auth, async (req, res) => {
    try {
      await _sock.groupLeave(req.params.jid)
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Pairing ──────────────────────────────────────────────
  app.post('/api/pairing', auth, (req, res) => {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'Phone required' })
    io.emit('request_pairing', { phone })
    res.json({ ok: true })
  })

  // ── Shell ────────────────────────────────────────────────
  app.post('/api/exec', auth, async (req, res) => {
    if (!req.body.cmd) return res.status(400).json({ error: 'cmd required' })
    try {
      const r = await execShell(req.body.cmd)
      res.json({ ok: true, stdout: r.stdout || '', stderr: r.stderr || '' })
    } catch (e) {
      res.json({ ok: false, error: e.message, stdout: e.stdout || '', stderr: e.stderr || '' })
    }
  })

  app.post('/api/npm', auth, async (req, res) => {
    if (!req.body.pkg) return res.status(400).json({ error: 'pkg required' })
    try {
      const r = await installPackage(req.body.pkg)
      res.json({ ok: true, stdout: r.stdout || '' })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // ── AI Command Generator ──────────────────────────────────
  app.post('/api/ai/generate-command', auth, async (req, res) => {
    if (!CONFIG.dashboardAI) return res.status(403).json({ error: 'Gerador IA desativado' })
    const { descricao } = req.body
    if (!descricao) return res.status(400).json({ error: 'Descrição requerida' })
    const key = CONFIG.groqKey || process.env.GROQ_API_KEY
    if (!key) return res.status(400).json({ error: 'GROQ_API_KEY não configurada' })

    const provider = req.body.provider || 'auto'  // auto | manus | groq | gemini
    const geminiKey = CONFIG.geminiKey || process.env.GEMINI_API_KEY || ''

    // Lê o README para passar como contexto ao gerador
    let readmeCtx = ''
    try {
      const readmePath = path.join(__dirname, '../CRIAR_COMANDOS.md')
      if (fs.existsSync(readmePath)) {
        // Pega apenas as primeiras 3000 chars (estrutura e exemplos básicos)
        readmeCtx = '\n\nCONTEXTO DO BOT (estrutura de comandos):\n' + 
          fs.readFileSync(readmePath, 'utf-8').slice(0, 3000)
      }
    } catch {}

    const prompt = `Crie um comando de WhatsApp para: ${descricao}${readmeCtx}`

    // ── Manus (agente autônomo) ──────────────────────────────
    if (provider === 'manus' || provider === 'auto') {
      try {
        const { runAgent } = await import('./manus.js')
        const result = await runAgent(
          `Crie um comando de WhatsApp para o bot Kaius: ${descricao}\nUse a ferramenta create_command. ES Module com export default.`,
          'dashboard_gen', null
        )
        if (result?.commandResult?.code)
          return res.json({ ok: true, code: result.commandResult.code, via: 'manus' })
        if (result?.text) {
          let code = result.text.replace(/^\`\`\`(?:javascript|js)?\n?/gm,'').replace(/\n?\`\`\`/gm,'').trim()
          if (code.includes('export default')) return res.json({ ok: true, code, via: 'manus' })
        }
      } catch (e) {
        logWarn('Manus falhou: ' + e.message)
        if (provider === 'manus') return res.status(500).json({ ok: false, error: 'Manus: ' + e.message })
      }
    }

    // ── Gemini ───────────────────────────────────────────────
    if (provider === 'gemini' || (provider === 'auto' && !key && geminiKey)) {
      if (!geminiKey) return res.status(400).json({ error: 'GEMINI_API_KEY não configurada' })
      try {
        let code = await callGemini(SYSTEM_CMD_GENERATOR + '\n\nUsuário: ' + prompt, geminiKey)
        code = code.replace(/^\`\`\`(?:javascript|js)?\n?/gm,'').replace(/\n?\`\`\`/gm,'').trim()
        if (code.includes('export default')) return res.json({ ok: true, code, via: 'gemini' })
      } catch (e) {
        if (provider === 'gemini') return res.status(500).json({ ok: false, error: 'Gemini: ' + e.message })
      }
    }

    // ── Groq direto (fallback final) ─────────────────────────
    if (!key) return res.status(400).json({ error: 'Nenhuma API key configurada. Configure Groq ou Gemini nas Configurações.' })
    try {
      const groq = new Groq({ apiKey: key })
      const resp = await groq.chat.completions.create({
        model: CONFIG.modelo || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_CMD_GENERATOR },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2500, temperature: 0.25,
      })
      let code = resp.choices[0].message.content.trim()
      code = code.replace(/^\`\`\`(?:javascript|js)?\n?/m,'').replace(/\n?\`\`\`$/m,'').trim()
      res.json({ ok: true, code, via: 'groq' })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  app.post('/api/ai/chat', auth, async (req, res) => {
    const { mensagem } = req.body
    if (!mensagem) return res.status(400).json({ error: 'mensagem requerida' })
    const key = CONFIG.groqKey || process.env.GROQ_API_KEY
    if (!key) return res.status(400).json({ error: 'GROQ_API_KEY não configurada' })
    try {
      const groq = new Groq({ apiKey: key })
      const resp = await groq.chat.completions.create({
        model: CONFIG.modelo,
        messages: [
          { role: 'system', content: CONFIG.personalidade },
          { role: 'user', content: mensagem }
        ],
        max_tokens: 1024,
      })
      res.json({ ok: true, resposta: resp.choices[0].message.content })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // ── Minions ──────────────────────────────────────────────
  app.get('/api/minions', auth, (req, res) => {
    const { filter = 'all', page = 0 } = req.query
    try {
      res.json({ stats: getMinionStats(), ...getMinionList(filter, parseInt(page)) })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  app.get('/api/minions/stats', auth, (req, res) => {
    try { res.json(getMinionStats()) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/minions/:num/ban', auth, (req, res) => {
    try {
      const num = req.params.num
      addSubdono(num, 99, req.body.motivo || 'via painel')
      const m = minionsDB.get(num, {})
      minionsDB.set(num, { ...m, bloqueado: true, role: 99 })
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/minions/:num/unban', auth, (req, res) => {
    try {
      const num = req.params.num
      subdonsDB.delete(num)
      const m = minionsDB.get(num, {})
      minionsDB.set(num, { ...m, bloqueado: false, role: 5 })
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/minions/:num/promote', auth, (req, res) => {
    try {
      addSubdono(req.params.num, parseInt(req.body.role) || 2, req.body.label || '')
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Contribuições ─────────────────────────────────────────
  app.get('/api/contributions', auth, (req, res) => {
    try { res.json({ stats: getContribStats(), items: getAllContribs() }) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/contributions/:name/approve', auth, async (req, res) => {
    try { res.json(await approveContrib(req.params.name)) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/contributions/:name/reject', auth, (req, res) => {
    try {
      rejectContrib(req.params.name, req.body.motivo || '')
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Sub-Donos ─────────────────────────────────────────────
  app.get('/api/subdons', auth, (req, res) => {
    try { res.json({ items: listSubdonos(), roles: ROLE_NAMES }) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/subdons', auth, (req, res) => {
    try {
      addSubdono(req.body.num, parseInt(req.body.role) || 2, req.body.label || '')
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.delete('/api/subdons/:num', auth, (req, res) => {
    try { removeSubdono(req.params.num); res.json({ ok: true }) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Design / Temas ────────────────────────────────────────
  app.post('/api/design/apply', auth, (req, res) => {
    const { tema } = req.body
    const TEMAS = {
      default: { borderTop:'╭', borderBot:'╰', borderSide:'│', separator:'─', itemPrefix:'┣', subPrefix:'┃ └', headerTexto:'MENU DE COMANDOS', negrito:true, italico:false },
      redline: { borderTop:'╭════════════════════╮', borderBot:'╰════════════════════╯', borderSide:'│', separator:'═', itemPrefix:'🛞', subPrefix:'  ✧', headerTexto:'☽ COMANDOS', negrito:true, italico:false },
      neon:    { borderTop:'┌─────────────────────┐', borderBot:'└─────────────────────┘', borderSide:'│', separator:'·', itemPrefix:'⟡', subPrefix:'  ↳', headerTexto:'✦ NEON SYSTEM ✦', negrito:true, italico:true },
      minimal: { borderTop:'▸', borderBot:'◂', borderSide:'›', separator:' ', itemPrefix:'•', subPrefix:'  ·', headerTexto:'COMANDOS', negrito:false, italico:false },
      stars:   { borderTop:'✦═══════════════════✦', borderBot:'✦═══════════════════✦', borderSide:'✦', separator:'═', itemPrefix:'⋆', subPrefix:'  ✩', headerTexto:'★ MENU ESTELAR ★', negrito:true, italico:false },
      sakura:  { borderTop:'╭🌸━━━━━━━━━━━━━━━🌸╮', borderBot:'╰🌸━━━━━━━━━━━━━━━🌸╯', borderSide:'🌸', separator:'━', itemPrefix:'🌺', subPrefix:'  🌹', headerTexto:'✿ MENU SAKURA ✿', negrito:true, italico:true },
      hacker:  { borderTop:'┌[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]┐', borderBot:'└[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓]┘', borderSide:'|', separator:'▓', itemPrefix:'>>', subPrefix:'  |__', headerTexto:'SYS://COMMANDS', negrito:true, italico:false },
      royal:   { borderTop:'┌─꧁𓆩𓆪꧂─────────────┐', borderBot:'└─────────────꧁𓆩𓆪꧂─┘', borderSide:'│', separator:'─', itemPrefix:'◈', subPrefix:'  └◉', headerTexto:'♛ ROYAL COMMANDS ♛', negrito:true, italico:false },
    }
    const t = TEMAS[tema]
    if (!t) return res.status(400).json({ error: 'Tema não encontrado' })
    CONFIG.menu = { ...(CONFIG.menu || {}), ...t }
    res.json({ ok: true, menu: CONFIG.menu })
  })

  // ── Permissões por Comando ────────────────────────────────
  app.get('/api/cmdperms', auth, (req, res) => {
    try { res.json(cmdPermsDB.all()) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/cmdperms/:name', auth, (req, res) => {
    try {
      const { minRole, allowedIn } = req.body
      if (minRole == null && allowedIn == null) {
        cmdPermsDB.delete(req.params.name)
      } else {
        cmdPermsDB.set(req.params.name, {
          minRole:   minRole   ?? null,
          allowedIn: allowedIn ?? 'both',
        })
      }
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.delete('/api/cmdperms/:name', auth, (req, res) => {
    try { cmdPermsDB.delete(req.params.name); res.json({ ok: true }) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Menu Targets ─────────────────────────────────────────
  // Salva em qual(is) menu(s) um comando aparece
  app.get('/api/menutargets', auth, (req, res) => {
    try { res.json(menuTargetDB.all()) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/menutargets/:name', auth, (req, res) => {
    try {
      const { menus } = req.body   // string[] ex: ['menuutils','menuadm']
      if (!menus || !menus.length) {
        menuTargetDB.delete(req.params.name)
      } else {
        menuTargetDB.set(req.params.name, menus)
      }
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.delete('/api/menutargets/:name', auth, (req, res) => {
    try { menuTargetDB.delete(req.params.name); res.json({ ok: true }) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Automações ────────────────────────────────────────────
  app.get('/api/automations', auth, (req, res) => {
    try {
      const all = automationsDB.all()
      res.json(Object.values(all))
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/automations', auth, (req, res) => {
    try {
      const { trigger, response, type, mediaUrl, scope, cooldown, enabled } = req.body
      if (!trigger || !response) return res.status(400).json({ error: 'trigger e response obrigatórios' })
      const id = `auto_${Date.now()}`
      const item = { id, trigger: trigger.toLowerCase().trim(), response, type: type || 'text', mediaUrl: mediaUrl || '', scope: scope || 'both', cooldown: cooldown || 0, enabled: enabled !== false, createdAt: new Date().toISOString() }
      automationsDB.set(id, item)
      res.json({ ok: true, item })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.put('/api/automations/:id', auth, (req, res) => {
    try {
      const existing = automationsDB.get(req.params.id, null)
      if (!existing) return res.status(404).json({ error: 'Não encontrado' })
      const updated = { ...existing, ...req.body }
      automationsDB.set(req.params.id, updated)
      res.json({ ok: true, item: updated })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.delete('/api/automations/:id', auth, (req, res) => {
    try { automationsDB.delete(req.params.id); res.json({ ok: true }) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Grupos Permitidos ─────────────────────────────────────
  app.get('/api/allowedgroups', auth, (req, res) => {
    try {
      const all     = allowedGroupsDB.all()
      const enabled = configDB.get('groupRestriction', false)
      res.json({ enabled, groups: Object.values(all) })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/allowedgroups/toggle', auth, (req, res) => {
    try {
      const val = req.body.enabled !== false
      configDB.set('groupRestriction', val)
      res.json({ ok: true, enabled: val })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/allowedgroups', auth, (req, res) => {
    try {
      const { jid, nome } = req.body
      if (!jid) return res.status(400).json({ error: 'jid obrigatório' })
      allowedGroupsDB.set(jid, { jid, nome: nome || jid, addedAt: new Date().toISOString() })
      res.json({ ok: true })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.delete('/api/allowedgroups/:jid', auth, (req, res) => {
    try { allowedGroupsDB.delete(decodeURIComponent(req.params.jid)); res.json({ ok: true }) }
    catch (e) { res.status(500).json({ error: e.message }) }
  })


  // ── Upload de mídia (áudio mp3→opus, imagem, vídeo) ──────
  app.post('/api/upload', auth, async (req, res) => {
    try {
      const chunks = []
      req.on('data', chunk => chunks.push(chunk))
      req.on('end', async () => {
        const buf      = Buffer.concat(chunks)
        const mime     = req.headers['content-type'] || 'application/octet-stream'
        const filename = decodeURIComponent(req.headers['x-filename'] || 'upload')
        const isAudio  = mime.includes('audio') || filename.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)

        const uploadsDir = path.join(__dirname, '../data/uploads')
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

        if (isAudio) {
          // Converte para opus (formato WhatsApp PTT)
          const inFile  = path.join(uploadsDir, `in_${Date.now()}.tmp`)
          const outFile = path.join(uploadsDir, `audio_${Date.now()}.ogg`)
          fs.writeFileSync(inFile, buf)

          try {
            await new Promise((resolve, reject) => {
              const cmd = `ffmpeg -y -i "${inFile}" -c:a libopus -b:a 64k -ar 48000 "${outFile}" 2>&1`
              execAsync(cmd).then(() => resolve()).catch(e => reject(new Error('ffmpeg: ' + e.message.slice(0, 200))))
            })
            fs.unlinkSync(inFile)
            // Serve the file as static URL
            const relPath = `/data/uploads/${path.basename(outFile)}`
            res.json({ ok: true, url: relPath, type: 'audio', mimetype: 'audio/ogg; codecs=opus', filename: path.basename(outFile) })
          } catch (e) {
            // ffmpeg not available — save as-is
            try { fs.unlinkSync(inFile) } catch {}
            const outRaw = path.join(uploadsDir, filename)
            fs.writeFileSync(outRaw, buf)
            const relPath = `/data/uploads/${filename}`
            res.json({ ok: true, url: relPath, type: 'audio', mimetype: mime, filename, warning: 'ffmpeg indisponível — arquivo salvo sem conversão' })
          }
        } else {
          // Imagem / vídeo / outros
          const outFile = path.join(uploadsDir, `${Date.now()}_${filename}`)
          fs.writeFileSync(outFile, buf)
          const relPath = `/data/uploads/${path.basename(outFile)}`
          const type = mime.startsWith('image') ? 'image' : mime.startsWith('video') ? 'video' : 'other'
          res.json({ ok: true, url: relPath, type, mimetype: mime, filename: path.basename(outFile) })
        }
      })
      req.on('error', e => res.status(500).json({ error: e.message }))
    } catch (e) { res.status(500).json({ error: e.message }) }
  })



  // ── Hooks API ────────────────────────────────────────────
  app.get('/api/hooks', auth, async (req, res) => {
    try {
      const { listHooks } = await import('./hooks.js')
      res.json(listHooks().map(h => ({ id: h.id, name: h.name, priority: h.priority })))
    } catch { res.json([]) }
  })

  app.post('/api/hooks/remove', auth, async (req, res) => {
    try {
      const { removeHook } = await import('./hooks.js')
      const ok = removeHook(req.body.id)
      res.json({ ok })
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Reviver QR / Limpar Auth ──────────────────────────────
  // Limpa arquivos desnecessários da pasta auth sem desconectar
  // Mantém: creds.json (pareamento)
  // Remove: pre-keys antigas, sender-keys, app-state-sync, sessions temporárias
  app.post('/api/clean-auth', auth, async (req, res) => {
    const { mode } = req.body  // 'cache' = limpeza inteligente | 'full' = reset total
    try {
      // Try both folder names (some versions use auth_info_multi, others auth)
      let authDir = path.join(__dirname, '..', 'auth')
      if (!fs.existsSync(authDir)) {
        authDir = path.join(__dirname, '..', 'auth_info_multi')
      }
      if (!fs.existsSync(authDir)) {
        return res.json({ ok: true, removed: 0, message: '⚠️ Pasta auth/ não encontrada. O bot ainda não foi conectado?' })
      }

      const files = fs.readdirSync(authDir)
      let removed = 0
      let removedNames = []

      if (mode === 'full') {
        // Reset completo — apaga tudo incluindo creds.json (vai pedir novo QR)
        for (const f of files) {
          fs.unlinkSync(path.join(authDir, f))
          removed++
        }
        res.json({ ok: true, removed, message: '🔄 Sessão resetada! Reinicie o bot para novo QR.' })
      } else {
        // Limpeza inteligente — remove bloat, mantém creds.json
        const KEEP_PATTERN = /^creds\.json$/
        const REMOVE_PATTERNS = [
          /^app-state-sync-key-/,   // chaves de sync (se regeneram)
          /^sender-key-/,            // chaves de grupo (se regeneram)
          /^session-/,               // sessões temporárias
        ]
        // Pre-keys: manter apenas as últimas 20
        const preKeys = files.filter(f => /^pre-key-\d+\.json$/.test(f))
          .sort((a, b) => {
            const na = parseInt(a.match(/\d+/)?.[0] || 0)
            const nb = parseInt(b.match(/\d+/)?.[0] || 0)
            return na - nb
          })
        const oldPreKeys = preKeys.slice(0, Math.max(0, preKeys.length - 20))

        for (const f of files) {
          if (KEEP_PATTERN.test(f)) continue
          const shouldRemove = REMOVE_PATTERNS.some(p => p.test(f)) || oldPreKeys.includes(f)
          if (shouldRemove) {
            try { fs.unlinkSync(path.join(authDir, f)); removed++; removedNames.push(f) } catch {}
          }
        }
        res.json({ ok: true, removed, kept: files.length - removed, message: `🧹 ${removed} arquivo(s) removido(s). Bot continua conectado.` })
      }
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── GitHub ────────────────────────────────────────────────
  app.get('/api/github/status', auth, async (req, res) => {
    try {
      const { getGitStatus } = await import('./github.js')
      res.json(await getGitStatus())
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/github/pull', auth, async (req, res) => {
    try {
      const r = await pullFullBot()
      if (r.ok) {
        const total = await loadCommands()
        io.emit('reload', { total })
      }
      res.json(r)
    } catch (e) { res.status(500).json({ ok: false, reason: e.message }) }
  })

  app.post('/api/github/push', auth, async (req, res) => {
    try {
      const { pushFullBot } = await import('./github.js')
      res.json(await pushFullBot())
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  app.post('/api/github/update', auth, async (req, res) => {
    try {
      const { checkForUpdates } = await import('./github.js')
      const r = await checkForUpdates()
      if (r.updated) await loadCommands()
      res.json(r)
    } catch (e) { res.status(500).json({ error: e.message }) }
  })

  // ── Socket.io ─────────────────────────────────────────────
  io.on('connection', (socket) => {
    const targets = menuTargetDB.all()
    const cmds    = getCommandList().map(c => ({ ...c, menuTargets: targets[c.name] || [] }))
    socket.emit('init', { logs: getLogs(), commands: cmds })
    // Re-emit current bot status so new clients don't see "Desconectado"
    const lastStatus = getLastStatus()
    if (lastStatus) socket.emit('status', lastStatus)
  })

  // Static files AFTER API routes so APIs always take priority
  app.use('/data/uploads', express.static(path.join(__dirname, '../data/uploads')))
  app.use(express.static(path.join(__dirname, '../public')))

  // SPA fallback — only for non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Route not found: ' + req.path })
    }
    res.sendFile(path.join(__dirname, '../public/index.html'))
  })

  const PORT = CONFIG.dashboardPort || 3000
  // Get LAN IP for display
  let lanIP = 'localhost'
  try {
    const nets = os.networkInterfaces()
    for (const list of Object.values(nets)) {
      for (const iface of list) {
        if (iface.family === 'IPv4' && !iface.internal) { lanIP = iface.address; break }
      }
    }
  } catch {}
  http.listen(PORT, '0.0.0.0', () => {
    logInfo(`Dashboard ativo na porta ${PORT}`)
    logInfo(`Local:      http://localhost:${PORT}`)
    logInfo(`Rede local: http://${lanIP}:${PORT}`)
  })

  return io
}
