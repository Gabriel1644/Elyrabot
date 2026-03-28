// ══════════════════════════════════════════════════════════
//  loader.js — Carregador de comandos 100% desbloqueado
// ══════════════════════════════════════════════════════════
import fs      from 'fs'
import path    from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logInfo, logOk, logWarn } from './logger.js'
import { configDB } from './database.js'
import JsonDB from './database.js'
const cmdMetaDB = new JsonDB('cmdmeta')  // metadados editados pelo painel         // ← único import

const execAsync = promisify(exec)
const _fileModTimes = new Map()  // mtime cache para evitar reimport
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CMDS_DIR  = path.join(__dirname, 'commands')
const ROOT_DIR  = path.resolve(__dirname, '..')

export const commandMap = new Map()
export const aliasMap   = new Map()

// ── Carregamento ──────────────────────────────────────────
export async function loadCommands() {
  commandMap.clear()
  aliasMap.clear()
  let total = 0

  // Carrega aliases dinâmicos do banco no mapa
  const dynAliases = configDB.get('dynamicAliases', {})
  for (const [alias, cmd] of Object.entries(dynAliases))
    aliasMap.set(alias, cmd)

  const dirs = fs.readdirSync(CMDS_DIR)
    .filter(d => fs.statSync(path.join(CMDS_DIR, d)).isDirectory())

  for (const dir of dirs) {
    const files = fs.readdirSync(path.join(CMDS_DIR, dir)).filter(f => f.endsWith('.js'))
    for (const file of files) {
      try {
        const fp   = path.join(CMDS_DIR, dir, file)
        // Cache-bust only if file was modified since last load
        const mtime = fs.statSync(fp).mtimeMs
        const cached_mtime = _fileModTimes.get(fp)
        const v = mtime !== cached_mtime ? mtime : (cached_mtime || 0)
        _fileModTimes.set(fp, mtime)
        const mod  = await import(`${fp}?v=${v}`)
        const cmds = Array.isArray(mod.default) ? mod.default : [mod.default]
        for (const cmd of cmds) {
          if (!cmd?.name) { logWarn(`Sem nome: ${file}`); continue }
          // Apply any saved metadata overrides from the dashboard panel
          const meta = cmdMetaDB.get(cmd.name, null)
          if (meta) {
            if (meta.description !== undefined) cmd.description = meta.description
            if (meta.usage       !== undefined) cmd.usage       = meta.usage
            if (meta.cooldown    !== undefined) cmd.cooldown    = meta.cooldown
          }
          commandMap.set(cmd.name, cmd)
          if (cmd.aliases) for (const a of cmd.aliases) aliasMap.set(a, cmd.name)
          total++
        }
      } catch (e) { logWarn(`Erro ao carregar ${file}: ${e.message}`) }
    }
  }

  logOk(`${total} comandos carregados`)
  return total
}

// ── Busca de comando (estático + dinâmico) ────────────────
export function getCommand(name) {
  if (commandMap.has(name)) return commandMap.get(name)
  const real = aliasMap.get(name)
  if (real) return commandMap.get(real)
  return null
}

// ── CRUD de comandos ──────────────────────────────────────
export async function createCommand({ name, code, category = 'misc' }) {
  const dir  = path.join(CMDS_DIR, category)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${name}.js`)
  fs.writeFileSync(file, code, 'utf-8')
  logOk(`Comando '${name}' criado em ${category}/`)
  
  // Auto-upload para o GitHub se configurado
  if (CONFIG.autoUpload || process.env.AUTO_UPLOAD === 'true') {
    import('./github.js').then(m => {
      m.uploadCommand({ name, category, code }).catch(() => {})
    }).catch(() => {})
  }

  await loadCommands()
  return file
}

export async function deleteCommand(name) {
  for (const dir of fs.readdirSync(CMDS_DIR)) {
    const fp = path.join(CMDS_DIR, dir, `${name}.js`)
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp)
      logWarn(`Comando '${name}' deletado`)
      await loadCommands()
      return true
    }
  }
  return false
}

export async function editCommand(name, newCode) {
  for (const dir of fs.readdirSync(CMDS_DIR)) {
    const fp = path.join(CMDS_DIR, dir, `${name}.js`)
    if (fs.existsSync(fp)) {
      fs.writeFileSync(fp, newCode, 'utf-8')
      await loadCommands()
      return true
    }
  }
  return false
}

export function getCommandSource(name) {
  for (const dir of fs.readdirSync(CMDS_DIR)) {
    const fp = path.join(CMDS_DIR, dir, `${name}.js`)
    if (fs.existsSync(fp)) return fs.readFileSync(fp, 'utf-8')
  }
  return null
}

// ── Aliases dinâmicos ─────────────────────────────────────
export function getDynamicAliases() {
  return configDB.get('dynamicAliases', {})
}

export function addDynamicAlias(alias, cmdName) {
  const all = getDynamicAliases()
  all[alias.toLowerCase()] = cmdName.toLowerCase()
  configDB.set('dynamicAliases', all)
  aliasMap.set(alias.toLowerCase(), cmdName.toLowerCase())
}

export function removeDynamicAlias(alias) {
  const all = getDynamicAliases()
  delete all[alias.toLowerCase()]
  configDB.set('dynamicAliases', all)
  aliasMap.delete(alias.toLowerCase())
}

export function listAliasesForCommand(cmdName) {
  const out = []
  const cmd = commandMap.get(cmdName)
  if (cmd?.aliases) out.push(...cmd.aliases.map(a => ({ alias: a, type: 'estático' })))
  const dyn = getDynamicAliases()
  for (const [a, c] of Object.entries(dyn))
    if (c === cmdName) out.push({ alias: a, type: 'dinâmico' })
  return out
}

// ── Estado de comandos ────────────────────────────────────
export function isCommandEnabled(name) {
  const overrides = configDB.get('comandosAtivos', {})
  if (name in overrides) return overrides[name]
  return commandMap.get(name)?.enabled !== false
}

export function toggleCommand(name, state) {
  const overrides = configDB.get('comandosAtivos', {})
  overrides[name] = state
  configDB.set('comandosAtivos', overrides)
}

export function getCommandList() {
  const overrides   = configDB.get('comandosAtivos', {})
  const dynAliases  = getDynamicAliases()
  return Array.from(commandMap.values()).map(cmd => {
    // Merge static aliases with dynamic aliases for this command
    const staticAliases = cmd.aliases || []
    const dynForCmd = Object.entries(dynAliases)
      .filter(([, c]) => c === cmd.name)
      .map(([a]) => a)
    const allAliases = [...new Set([...staticAliases, ...dynForCmd])]
    return {
      name:        cmd.name,
      aliases:     allAliases,
      description: cmd.description || '',
      category:    cmd.category || 'misc',
      usage:       cmd.usage || `!${cmd.name}`,
      enabled:     cmd.name in overrides ? overrides[cmd.name] : (cmd.enabled !== false),
      cooldown:    cmd.cooldown || 0,
    }
  })
}

// ── Shell / npm ───────────────────────────────────────────
export async function execShell(cmd, opts = {}) {
  return execAsync(cmd, { cwd: ROOT_DIR, timeout: 60000, ...opts })
}

export async function installPackage(pkg) {
  logInfo(`Instalando: ${pkg}`)
  const r = await execAsync(`npm install ${pkg} --no-save`, { cwd: ROOT_DIR, timeout: 120000 })
  logOk(`Pacote instalado: ${pkg}`)
  return r
}
