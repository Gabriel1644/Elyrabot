// ══════════════════════════════════════════════════════════
//  github.js — Integração GitHub segura (sem corrupção)
// ══════════════════════════════════════════════════════════
import { exec }     from 'child_process'
import { promisify } from 'util'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logInfo, logOk, logWarn } from './logger.js'
import { CONFIG } from './config.js'

const execAsync = promisify(exec)
const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.resolve(__dirname, '..')

async function git(cmd) {
  return execAsync('git ' + cmd, { cwd: ROOT, timeout: 120000 })
}
async function gitOk()  { try { await git('--version'); return true } catch { return false } }
async function isRepo() { return fs.existsSync(path.join(ROOT, '.git')) }
async function remote() {
  try { return (await git('remote get-url origin')).stdout.trim() } catch { return null }
}

const GITIGNORE = `node_modules/
auth_info_multi/
auth/
data/
.env
*.log
.DS_Store
session/
`

// Arquivos locais que NUNCA devem ser sobrescritos pelo pull
const LOCAL_FILES = ['.env', 'data/', 'auth/', 'auth_info_multi/', 'session/']

function backupLocalFiles() {
  const backup = {}
  const envPath = path.join(ROOT, '.env')
  if (fs.existsSync(envPath)) {
    backup.env = fs.readFileSync(envPath, 'utf-8')
  }
  return backup
}

function restoreLocalFiles(backup) {
  if (backup.env) {
    const envPath = path.join(ROOT, '.env')
    fs.writeFileSync(envPath, backup.env, 'utf-8')
  }
}

function saveGitConfig(token, baseUrl) {
  try {
    const p = path.join(ROOT, '.env')
    let env = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
    const tokenUrl = token
      ? baseUrl.replace(/https:\/\/([^@]*@)?/, 'https://' + token + '@')
      : baseUrl
    const set = (k, v) => {
      const re = new RegExp('^' + k + '=.*$', 'm')
      env = re.test(env) ? env.replace(re, k + '=' + v) : env + '\n' + k + '=' + v
    }
    set('GITHUB_REPO', baseUrl)
    set('GITHUB_REPO_WITH_TOKEN', tokenUrl)
    if (token) set('GITHUB_TOKEN', token)
    fs.writeFileSync(p, env.trim() + '\n')
    return true
  } catch { return false }
}

export async function initGit({ repoUrl, userName, userEmail } = {}) {
  if (!repoUrl) return { ok: false, reason: 'URL não fornecida' }
  if (!await gitOk()) return { ok: false, reason: 'git não instalado — rode: pkg install git' }
  try {
    const giPath = path.join(ROOT, '.gitignore')
    if (!fs.existsSync(giPath)) fs.writeFileSync(giPath, GITIGNORE)
    if (!await isRepo()) await git('init')
    await git('branch -M main').catch(() => {})
    try { await git('config user.name "' + (userName||'KaiusBot') + '"') } catch {}
    try { await git('config user.email "' + (userEmail||'bot@kaius.local') + '"') } catch {}
    try { await git('config core.pager ""') } catch {}
    try { await git('config push.default current') } catch {}
    try { await git('config pull.rebase false') } catch {}
    await git('remote remove origin').catch(() => {})
    await git('remote add origin "' + repoUrl + '"')
    logOk('GitHub: configurado → ' + repoUrl.replace(/https?:\/\/[^@]+@/, 'https://***@'))
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e.message }
  }
}

export async function pushFullBot() {
  if (!await gitOk())  return { ok: false, reason: 'git não instalado (pkg install git)' }
  if (!await isRepo()) return { ok: false, reason: 'Use .git config <url> primeiro' }
  if (!await remote()) return { ok: false, reason: 'Remote não configurado' }
  try {
    const giPath = path.join(ROOT, '.gitignore')
    if (!fs.existsSync(giPath)) fs.writeFileSync(giPath, GITIGNORE)
    await git('add -A')
    const { stdout: status } = await git('status --porcelain')
    if (!status.trim()) return { ok: true, message: '✅ Já sincronizado com o GitHub!' }
    const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    await git('commit -m "sync: ' + date + '"')
    try { await git('push origin main') }
    catch { await git('push -u origin main --force') }
    logOk('Bot sincronizado no GitHub!')
    return { ok: true, message: '✅ Bot sincronizado no GitHub!' }
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('Authentication') || msg.includes('403'))
      return { ok: false, reason: '❌ Token inválido!\nUse: .git token SEU_TOKEN' }
    return { ok: false, reason: msg.split('\n')[0] }
  }
}

// ── Pull seguro — SEM stash, com backup de arquivos locais ──
export async function pullFullBot() {
  if (!await gitOk())  return { ok: false, reason: 'git não instalado' }
  if (!await isRepo()) return { ok: false, reason: 'Repo não inicializado' }
  if (!await remote()) return { ok: false, reason: 'Remote não configurado' }

  // 1. Faz backup dos arquivos locais importantes ANTES de qualquer coisa
  const backup = backupLocalFiles()

  try {
    await git('fetch origin main')
    // Hard reset sem stash — NÃO usa stash (causa corrupção)
    await git('reset --hard origin/main')
    // 2. Restaura os arquivos locais que não devem ser sobrescritos
    restoreLocalFiles(backup)
    // 3. Garante que .gitignore está certo
    const giPath = path.join(ROOT, '.gitignore')
    fs.writeFileSync(giPath, GITIGNORE)
    logOk('Bot atualizado do GitHub (pull seguro)')
    return { ok: true }
  } catch (e) {
    // Em caso de erro, tenta restaurar
    try { restoreLocalFiles(backup) } catch {}
    return { ok: false, reason: (e.message||'').split('\n')[0] }
  }
}

export async function checkForUpdates() {
  if (!await gitOk())  return { updated: false, reason: 'git não instalado' }
  if (!await isRepo()) return { updated: false, reason: 'repo não inicializado' }
  if (!await remote()) return { updated: false, reason: 'remote não configurado' }
  try {
    await git('fetch origin main --depth=20')
    const { stdout } = await git('rev-list HEAD..origin/main --count')
    const n = parseInt(stdout.trim()) || 0
    if (n === 0) return { updated: false, reason: 'já na versão mais recente ✅' }
    logInfo('Auto-update: ' + n + ' commit(s), aplicando com backup...')
    const backup = backupLocalFiles()
    await git('reset --hard origin/main')
    restoreLocalFiles(backup)
    fs.writeFileSync(path.join(ROOT, '.gitignore'), GITIGNORE)
    logOk(n + ' commit(s) aplicados — bot atualizado!')
    return { updated: true, commits: n }
  } catch (e) {
    return { updated: false, reason: (e.message||'').split('\n')[0] }
  }
}

export function startAutoUpdateScheduler(intervalHours = 6) {
  const ms = intervalHours * 3_600_000
  logInfo('Auto-update a cada ' + intervalHours + 'h')
  setTimeout(async function tick() {
    try {
      const r = await checkForUpdates()
      if (r.updated) {
        const { loadCommands } = await import('./loader.js')
        await loadCommands()
        logOk('Auto-update: ' + r.commits + ' commit(s) aplicados')
      }
    } catch (e) { logWarn('Auto-update: ' + e.message) }
    setTimeout(tick, ms)
  }, ms)
}

export async function getGitStatus() {
  if (!await gitOk())  return { ok: false, reason: 'git não instalado' }
  if (!await isRepo()) return { ok: false, reason: 'repo não inicializado' }
  try {
    const rem = await remote()
    const { stdout: log } = await git('log --oneline -5').catch(() => ({ stdout: '' }))
    const { stdout: st }  = await git('status --short').catch(() => ({ stdout: '' }))
    return {
      ok: true,
      remote: rem?.replace(/https?:\/\/[^@]+@/, 'https://'),
      log: log.trim(),
      status: st.trim()
    }
  } catch (e) { return { ok: false, reason: e.message } }
}

export async function uploadCommand({ name, category, code, description }) {
  if (!await gitOk() || !await isRepo() || !await remote())
    return { ok: false, reason: 'git não configurado' }
  try {
    const filePath = path.join(ROOT, 'src', 'commands', category, name + '.js')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, code, 'utf-8')
    await git('add "src/commands/' + category + '/' + name + '.js"')
    await git('commit -m "feat: add command ' + name + '"')
    try { await git('push origin main') }
    catch { await git('push -u origin main --force') }
    return { ok: true, message: '✅ ' + name + ' publicado!' }
  } catch (e) { return { ok: false, reason: e.message } }
}

export async function setToken(token) {
  try {
    const rem = await remote()
    if (!rem) return { ok: false, reason: 'Configure o repo primeiro: .git config <url>' }
    const base = rem.replace(/https?:\/\/[^@]*@/, 'https://')
    const tokenUrl = 'https://' + token + '@' + base.replace('https://', '')
    await git('remote set-url origin "' + tokenUrl + '"')
    saveGitConfig(token, base)
    return { ok: true, url: tokenUrl.replace(/\/\/[^@]+@/, '//' + '***@') }
  } catch (e) { return { ok: false, reason: e.message } }
}

export { saveGitConfig as saveGitEnv }
