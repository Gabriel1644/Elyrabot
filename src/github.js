// ══════════════════════════════════════════════════════════
//  github.js — Integração completa com GitHub
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
async function remote() { try { return (await git('remote get-url origin')).stdout.trim() } catch { return null } }

const GITIGNORE = `node_modules/
auth_info_multi/
auth/
data/
.env
*.log
.DS_Store
session/
`

function saveEnv(token, baseUrl) {
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

// ── Inicializar repo ─────────────────────────────────────
export async function initGit({ repoUrl, userName, userEmail } = {}) {
  if (!repoUrl) return { ok: false, reason: 'URL não fornecida' }
  if (!await gitOk()) return { ok: false, reason: 'git não instalado. Execute: pkg install git' }

  try {
    const giPath = path.join(ROOT, '.gitignore')
    if (!fs.existsSync(giPath)) fs.writeFileSync(giPath, GITIGNORE)

    if (!await isRepo()) await git('init')
    await git('branch -M main').catch(() => {})

    try { await git('config user.name "' + (userName||'KaiusBot') + '"') } catch {}
    try { await git('config user.email "' + (userEmail||'bot@kaius.local') + '"') } catch {}
    try { await git('config core.pager ""') } catch {}
    try { await git('config push.default current') } catch {}

    await git('remote remove origin').catch(() => {})
    await git('remote add origin "' + repoUrl + '"')
    logOk('GitHub: configurado → ' + repoUrl.replace(/https?:\/\/[^@]+@/, 'https://***@'))
    return { ok: true }
  } catch (e) {
    logWarn('GitHub init: ' + e.message)
    return { ok: false, reason: e.message }
  }
}

// ── Push completo ─────────────────────────────────────────
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
    await git('commit -m "chore: sync ' + date + '"')

    try { await git('push origin main') }
    catch { await git('push -u origin main --force') }

    logOk('Bot sincronizado no GitHub!')
    return { ok: true, message: '✅ Bot sincronizado no GitHub!' }
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('Authentication') || msg.includes('403') || msg.includes('denied'))
      return { ok: false, reason: '❌ Token inválido!\nGere em: github.com/settings/tokens\nPermissão: repo\nUse: .git token SEU_TOKEN' }
    if (msg.includes('not found'))
      return { ok: false, reason: '❌ Repositório não encontrado!' }
    return { ok: false, reason: msg.split('\n')[0] }
  }
}

// ── Pull TUDO do GitHub (sem exceções) ────────────────────
export async function pullFullBot() {
  if (!await gitOk())  return { ok: false, reason: 'git não instalado' }
  if (!await isRepo()) return { ok: false, reason: 'Repo não inicializado' }
  if (!await remote()) return { ok: false, reason: 'Remote não configurado' }

  try {
    // Fetch tudo
    await git('fetch origin main')

    // Stash mudanças locais para não perder nada
    try { await git('stash') } catch {}

    // Reset COMPLETO para o estado do GitHub (puxa absolutamente tudo)
    await git('reset --hard origin/main')

    // Tenta aplicar stash de volta (mudanças locais)
    try { await git('stash pop') } catch {}

    logOk('Bot atualizado do GitHub (pull completo)')
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: (e.message||'').split('\n')[0] }
  }
}

// ── Verificar e aplicar atualizações ─────────────────────
export async function checkForUpdates() {
  if (!await gitOk())  return { updated: false, reason: 'git não instalado' }
  if (!await isRepo()) return { updated: false, reason: 'repo não inicializado' }
  if (!await remote()) return { updated: false, reason: 'remote não configurado' }

  try {
    await git('fetch origin main --depth=20')
    const { stdout } = await git('rev-list HEAD..origin/main --count')
    const n = parseInt(stdout.trim()) || 0
    if (n === 0) return { updated: false, reason: 'já na versão mais recente ✅' }

    logInfo('Auto-update: ' + n + ' commit(s) disponíveis, aplicando...')

    // Puxa TUDO do GitHub (src/, public/, package.json, etc.)
    // Exclui apenas: .env, auth/, data/ (dados locais do usuário)
    try { await git('stash') } catch {}
    await git('reset --hard origin/main')
    try { await git('stash pop') } catch {}

    // Garante que .env não foi sobrescrito
    const envPath = path.join(ROOT, '.env')
    if (!fs.existsSync(envPath)) {
      const envEx = path.join(ROOT, '.env.example')
      if (fs.existsSync(envEx)) fs.copyFileSync(envEx, envPath)
    }

    logOk(n + ' commit(s) aplicado(s) — bot atualizado!')
    return { updated: true, commits: n }
  } catch (e) {
    return { updated: false, reason: (e.message||'').split('\n')[0] }
  }
}

// ── Auto-update scheduler ────────────────────────────────
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
    } catch (e) { logWarn('Auto-update error: ' + e.message) }
    setTimeout(tick, ms)
  }, ms)
}

// ── Status ───────────────────────────────────────────────
export async function getGitStatus() {
  if (!await gitOk())  return { ok: false, reason: 'git não instalado' }
  if (!await isRepo()) return { ok: false, reason: 'repo não inicializado' }
  try {
    const rem = await remote()
    const { stdout: log } = await git('log --oneline -5 2>/dev/null || echo "sem commits"')
    const { stdout: st }  = await git('status --short')
    return { ok: true, remote: rem?.replace(/https?:\/\/[^@]+@/, 'https://'), log: log.trim(), status: st.trim() }
  } catch (e) { return { ok: false, reason: e.message } }
}

// ── Upload de um comando para o GitHub ───────────────────
export async function uploadCommand({ name, category, code, description }) {
  if (!await gitOk() || !await isRepo() || !await remote())
    return { ok: false, reason: 'git não configurado' }
  try {
    const filePath = path.join(ROOT, 'src', 'commands', category, name + '.js')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, code, 'utf-8')
    await git('add "src/commands/' + category + '/' + name + '.js"')
    await git('commit -m "feat: add command ' + name + (description ? ' — ' + description : '') + '"')
    try { await git('push origin main') }
    catch { await git('push -u origin main --force') }
    return { ok: true, message: '✅ Comando ' + name + ' publicado no GitHub!' }
  } catch (e) { return { ok: false, reason: e.message } }
}

// ── Configurar token ─────────────────────────────────────
export async function setToken(token) {
  try {
    const rem = await remote()
    if (!rem) return { ok: false, reason: 'Configure o repo primeiro: .git config <url>' }
    const base = rem.replace(/https?:\/\/[^@]*@/, 'https://')
    const tokenUrl = 'https://' + token + '@' + base.replace('https://', '')
    await git('remote set-url origin "' + tokenUrl + '"')
    saveEnv(token, base)
    return { ok: true, url: tokenUrl.replace(/\/\/[^@]+@/, '//' + '***@') }
  } catch (e) { return { ok: false, reason: e.message } }
}

export { saveEnv as saveGitEnv }
