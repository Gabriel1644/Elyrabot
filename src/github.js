// ══════════════════════════════════════════════════════════
//  github.js — Integração com GitHub (PAT via URL)
// ══════════════════════════════════════════════════════════
import { exec } from 'child_process'
import { promisify } from 'util'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logInfo, logOk, logWarn, logError } from './logger.js'
import { CONFIG } from './config.js'

const execAsync = promisify(exec)
const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.resolve(__dirname, '..')

async function git(cmd) {
  return execAsync('git ' + cmd, { cwd: ROOT, timeout: 60000 })
}
async function gitOk() { try { await git('--version'); return true } catch { return false } }
async function isGitRepo() { return fs.existsSync(path.join(ROOT, '.git')) }
async function getRemote() { try { return (await git('remote get-url origin')).stdout.trim() } catch { return null } }
function sanitizeUrl(url = '') { return url.replace(/https:\/\/[^@]*@/, 'https://***@') }

const GITIGNORE = `node_modules/
auth_info_multi/
auth/
data/
.env
*.log
.DS_Store
`

function saveGitEnv(token, baseUrl) {
  try {
    const envPath = path.join(ROOT, '.env')
    let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : ''
    const tokenUrl = token ? baseUrl.replace(/https:\/\/([^@]*@)?/, 'https://' + token + '@') : baseUrl
    const set = (k, v) => {
      const re = new RegExp('^' + k + '=.*$', 'm')
      if (re.test(env)) env = env.replace(re, k + '=' + v)
      else env += '\n' + k + '=' + v
    }
    set('GITHUB_REPO', baseUrl)
    set('GITHUB_REPO_WITH_TOKEN', tokenUrl)
    if (token) set('GITHUB_TOKEN', token)
    fs.writeFileSync(envPath, env.trim() + '\n')
    return true
  } catch { return false }
}

export async function initGit({ repoUrl, userName, userEmail, token }) {
  if (!await gitOk()) return { ok: false, reason: 'git não instalado (pkg install git)' }
  try {
    const giPath = path.join(ROOT, '.gitignore')
    if (!fs.existsSync(giPath)) fs.writeFileSync(giPath, GITIGNORE)
    else {
      let gi = fs.readFileSync(giPath, 'utf-8')
      for (const e of ['auth_info_multi/', '.env', 'node_modules/'])
        if (!gi.includes(e)) gi += '\n' + e
      fs.writeFileSync(giPath, gi)
    }
    if (!await isGitRepo()) {
      try { await git('init -b main') } catch { await git('init') }
    }
    try {
      await git('config user.name "' + (userName || 'ElyraBot') + '"')
      await git('config user.email "' + (userEmail || 'bot@elyra.local') + '"')
      await git('config core.pager ""')
      await git('config push.default current')
    } catch { /* git pode não estar instalado ainda - pkg install git */ }
    const finalUrl = token
      ? repoUrl.replace(/https:\/\/([^@]*@)?/, 'https://' + token + '@')
      : repoUrl
    if (finalUrl) {
      const existing = await getRemote()
      if (!existing) await git('remote add origin "' + finalUrl + '"')
      else await git('remote set-url origin "' + finalUrl + '"')
      logOk('Remote: ' + sanitizeUrl(finalUrl))
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: (e.message || '').split('\n')[0] }
  }
}

export async function pushFullBot() {
  if (!await gitOk()) return { ok: false, reason: 'git não instalado (pkg install git)' }
  if (!await isGitRepo()) return { ok: false, reason: 'Use !git config <url> primeiro.' }
  const remote = await getRemote()
  if (!remote) return { ok: false, reason: 'Remote não configurado. Use !git config <url>' }
  try {
    const giPath = path.join(ROOT, '.gitignore')
    if (!fs.existsSync(giPath)) fs.writeFileSync(giPath, GITIGNORE)
    await git('add -A')
    const { stdout: status } = await git('status --porcelain')
    if (!status.trim()) return { ok: true, message: '✅ Já sincronizado com o GitHub!' }
    const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    await git('commit -m "chore: sync ' + date + '"')
    try { await git('push origin main') }
    catch { await git('push -u origin main --force') }
    logOk('Bot sincronizado no GitHub!')
    return { ok: true, message: '✅ Bot sincronizado no GitHub!' }
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('Authentication') || msg.includes('403') || msg.includes('denied'))
      return { ok: false, reason: '❌ Autenticação falhou!\n\nVerifique o token:\n!git token SEU_TOKEN' }
    if (msg.includes('not found'))
      return { ok: false, reason: '❌ Repositório não encontrado! Verifique a URL.' }
    return { ok: false, reason: msg.split('\n')[0] }
  }
}

export async function checkForUpdates() {
  if (!await gitOk()) return { updated: false, reason: 'git não instalado' }
  if (!await isGitRepo()) return { updated: false, reason: 'repositório não inicializado' }
  if (!await getRemote()) return { updated: false, reason: 'remote não configurado' }
  try {
    await git('fetch origin main --depth=10')
    const { stdout } = await git('rev-list HEAD..origin/main --count')
    const n = parseInt(stdout.trim()) || 0
    if (n === 0) return { updated: false, reason: 'já na versão mais recente ✅' }
    const coreFiles = [
      'src/config.js','src/loader.js','src/handler.js','src/dashboard.js',
      'src/logger.js','src/database.js','src/ai.js','src/manus.js',
      'src/codeDetector.js','src/errorTracker.js','src/env.js',
      'src/github.js','src/permissions.js','src/contributions.js',
      'src/utils.js','index.js','public/index.html',
      'public/manifest.json','public/sw.js','public/icon.svg',
    ]
    let updated = 0
    for (const f of coreFiles) {
      try { await git('checkout origin/main -- "' + f + '"'); updated++ } catch {}
    }
    try { await git('checkout origin/main -- package.json') } catch {}
    logOk(n + ' commit(s) aplicado(s)')
    return { updated: true, commits: n, files: updated }
  } catch (e) {
    return { updated: false, reason: (e.message || '').split('\n')[0] }
  }
}

export async function uploadCommand({ name, category, code, description }) {
  if (!await gitOk() || !await isGitRepo()) return { ok: false, reason: 'git não configurado' }
  if (!await getRemote()) return { ok: false, reason: 'Configure: !git config <url>' }
  try {
    const filePath = path.join(ROOT, 'src', 'commands', category, name + '.js')
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, code, 'utf-8')
    }
    await git('add "src/commands/' + category + '/' + name + '.js"')
    const { stdout: s } = await git('status --porcelain')
    if (!s.trim()) return { ok: true, message: '!' + name + ' já estava no repositório' }
    await git('commit -m "feat: add !' + name + (description ? ' - ' + description.replace(/"/g, "'") : '') + '"')
    try { await git('push origin main') } catch { await git('push origin main --force') }
    const remote = await getRemote()
    return { ok: true, message: '✅ *!' + name + '* publicado!\n🔗 ' + sanitizeUrl(remote || '') }
  } catch (e) {
    return { ok: false, reason: (e.message || '').split('\n')[0] }
  }
}

export async function setToken(token, repoUrl) {
  const base = (repoUrl || CONFIG['github.repo'] || '').replace(/https:\/\/[^@]+@/, 'https://')
  if (!base) return { ok: false, reason: 'Configure o repo primeiro: !git config <url>' }
  const withToken = 'https://' + token + '@' + base.replace('https://', '')
  saveGitEnv(token, base)
  CONFIG['github.repo'] = withToken
  await initGit({ repoUrl: withToken })
  return { ok: true, url: sanitizeUrl(withToken) }
}

export async function getGitStatus() {
  if (!await gitOk()) return { ok: false, reason: 'git não instalado (pkg install git)' }
  if (!await isGitRepo()) return { ok: false, reason: 'Use !git config <url> para configurar' }
  try {
    const [remote, branch, log, uc] = await Promise.all([
      getRemote(),
      git('branch --show-current').then(r => r.stdout.trim()).catch(() => 'main'),
      git('log --oneline -5').then(r => r.stdout.trim()).catch(() => ''),
      git('status --porcelain').then(r => r.stdout.trim().split('\n').filter(Boolean).length).catch(() => 0),
    ])
    return { ok: true, remote: sanitizeUrl(remote || ''), branch: branch || 'main', recentCommits: log, uncommitted: uc }
  } catch (e) { return { ok: false, reason: e.message } }
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
        logOk('Auto-update: ' + r.commits + ' commit(s)')
      }
    } catch (e) { logWarn('Auto-update error: ' + e.message) }
    setTimeout(tick, ms)
  }, ms)
}
