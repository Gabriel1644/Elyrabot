#!/usr/bin/env node
// ══════════════════════════════════════════════════════════
//  ElyraBot — Setup Wizard  (npm run config)
// ══════════════════════════════════════════════════════════
import readline from 'readline'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')
const ENV_PATH  = path.join(ROOT, '.env')

const C = {
  reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m',
  green:'\x1b[92m', cyan:'\x1b[96m', yellow:'\x1b[93m',
  red:'\x1b[91m', magenta:'\x1b[95m', white:'\x1b[97m', gray:'\x1b[90m',
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask     = (q, def='') => new Promise(res =>
  rl.question(`  ${C.cyan}?${C.reset} ${C.white}${q}${C.reset}${def?C.gray+` (${def})`+C.reset:''}: `, a => res(a.trim()||def))
)
const askBool = async (q, def=true) => (await ask(`${q} (s/n)`, def?'s':'n')).toLowerCase().startsWith('s')
const askPass = (q) => new Promise(res => {
  process.stdout.write(`  ${C.cyan}?${C.reset} ${C.white}${q}${C.reset}: `)
  process.stdin.setRawMode?.(true)
  let buf = ''
  const handler = (ch) => {
    ch = ch.toString()
    if (ch === '\r' || ch === '\n') {
      process.stdin.setRawMode?.(false)
      process.stdin.removeListener('data', handler)
      process.stdout.write('\n')
      res(buf)
    } else if (ch === '\x7f') {
      buf = buf.slice(0,-1)
    } else {
      buf += ch
      process.stdout.write('*')
    }
  }
  process.stdin.on('data', handler)
})

function banner() {
  console.clear()
  console.log(`\n${C.green}${C.bold}  ╔══════════════════════════════════════════════╗
  ║   ✦  ElyraBot v2.1 — Assistente de Setup  ✦   ║
  ╚══════════════════════════════════════════════╝${C.reset}
  ${C.gray}Pressione Enter para usar o valor padrão.${C.reset}\n`)
}

function section(t) {
  console.log(`\n  ${C.yellow}${C.bold}── ${t} ${'─'.repeat(Math.max(0, 40-t.length))}${C.reset}\n`)
}

function check(label, ok, detail='') {
  const sym = ok ? `${C.green}✔` : `${C.yellow}⚠`
  console.log(`  ${sym}${C.reset} ${label}${detail ? C.gray+' — '+detail+C.reset : ''}`)
}

// Lê .env atual
let current = {}
if (fs.existsSync(ENV_PATH)) {
  fs.readFileSync(ENV_PATH, 'utf-8').split('\n').forEach(line => {
    const idx = line.indexOf('=')
    if (idx > 0 && !line.startsWith('#')) {
      const k = line.slice(0,idx).trim()
      const v = line.slice(idx+1).trim()
      if (k) current[k] = v
    }
  })
  console.log(`  ${C.gray}✓ .env existente encontrado${C.reset}\n`)
}

async function main() {
  banner()

  // ── WhatsApp ───────────────────────────────────────────
  section('WhatsApp & Bot')
  const owner  = await ask('Seu número (com DDI, sem + ou espaços)', current.OWNER_NUMBER||'')
  const prefix = await ask('Prefixo dos comandos', current.PREFIX||'!')
  const nome   = await ask('Nome do bot', current.BOT_NAME||'Elyra')

  // ── IA ─────────────────────────────────────────────────
  section('Inteligência Artificial (Groq)')
  console.log(`  ${C.gray}  Chave grátis em: https://console.groq.com${C.reset}\n`)
  const groqKey = await ask('Chave Groq API', current.GROQ_API_KEY||'')
  const modelo  = await ask('Modelo IA', current.GROQ_MODEL||'llama-3.3-70b-versatile')
  const personality = await ask('Personalidade (prompt do sistema)',
    current.BOT_PERSONALITY || `Você é ${nome}, uma assistente inteligente e elegante. Responda em português.`)

  // ── Dashboard ──────────────────────────────────────────
  section('Painel Web')
  const dashPort = await ask('Porta do painel', current.DASHBOARD_PORT||'3000')
  const dashPass = await ask('Senha do painel (Enter = sem senha)', current.DASHBOARD_PASS||'')
  const dashAI   = await askBool('Habilitar gerador de comandos IA no painel?', true)

  // ── GitHub ─────────────────────────────────────────────
  section('GitHub (Auto-update & Auto-upload)')
  console.log(`  ${C.gray}  Configure para receber updates automáticos e publicar seus comandos.\n  Deixe em branco para pular.${C.reset}\n`)
  const githubRepo  = await ask('URL do repositório (ex: https://github.com/user/elyrabot.git)', current.GITHUB_REPO||'')
  const githubToken = githubRepo ? await ask('Token GitHub (para push — opcional)', current.GITHUB_TOKEN||'') : ''
  const autoUpdate  = githubRepo ? await askBool('Verificar updates automáticos? (a cada 6h)', true) : false
  const autoUpload  = githubRepo ? await askBool('Publicar novos comandos automaticamente no GitHub?', true) : false

  // ── Detector de código ─────────────────────────────────
  section('Detector de Código Automático')
  console.log(`  ${C.gray}  Detecta código JS enviado no chat e instala como comando automaticamente.${C.reset}\n`)
  const autoCode = await askBool('Ativar detector de código no chat?', true)
  const codeOwnerOnly = await askBool('Só detectar código do dono?', true)

  // ── Clima & APIs extras ────────────────────────────────
  section('APIs Extras (Opcionais)')
  console.log(`  ${C.gray}  openweathermap.org (grátis)${C.reset}\n`)
  const weatherKey  = await ask('Chave OpenWeatherMap (para !clima)', current.WEATHER_KEY||'')
  const newsKey     = await ask('Chave NewsAPI (para !noticias) — newsapi.org', current.NEWS_KEY||'')
  const footballKey = await ask('Chave football-data.org (para !futebol)', current.FOOTBALL_KEY||'')

  // ── Comportamento ──────────────────────────────────────
  section('Comportamento')

  // ── Self-bot ou Multi-usuário ─────────────────────────────
  console.log(`  ${C.gray}Self-bot: você usa o WhatsApp do bot como dono, então não precisa configurar número.${C.reset}`)
  console.log(`  ${C.gray}Multi-usuário: o bot roda em um número separado e você controla de outro.${C.reset}\n`)
  const selfBot = await askBool('É self-bot? (você usa o WhatsApp do bot)', false)

  if (selfBot) {
    console.log(`\n  ${C.green}✔ Self-bot ativado!${C.reset} ${C.gray}O número do dono será detectado automaticamente ao iniciar.${C.reset}\n`)
  }

  const antiSpam  = await askBool('Ativar anti-spam?', true)
  const iaDefault = await askBool('IA ativada em grupos por padrão?', false)

  // ── Gera .env ──────────────────────────────────────────
  const repoWithToken = githubToken && githubRepo
    ? githubRepo.replace('https://', `https://${githubToken}@`)
    : githubRepo

  const env = `# ╔══════════════════════════════════════════╗
# ║       ElyraBot — Configuração            ║
# ║  Gerado por: npm run config              ║
# ╚══════════════════════════════════════════╝

# ── WhatsApp ──────────────────────────────
OWNER_NUMBER=${owner}
PREFIX=${prefix}
BOT_NAME=${nome}

# ── IA (Groq) ─────────────────────────────
# https://console.groq.com
GROQ_API_KEY=${groqKey}
GROQ_MODEL=${modelo}
BOT_PERSONALITY=${personality}

# ── Painel Web ────────────────────────────
DASHBOARD_PORT=${dashPort}
DASHBOARD_PASS=${dashPass}
DASHBOARD_AI=${dashAI}

# ── GitHub ────────────────────────────────
GITHUB_REPO=${githubRepo}
GITHUB_REPO_WITH_TOKEN=${repoWithToken}
GITHUB_TOKEN=${githubToken}
AUTO_UPDATE=${autoUpdate}
AUTO_UPLOAD=${autoUpload}

# ── Detector de Código ────────────────────
AUTO_CODE_DETECT=${autoCode}
CODE_DETECT_OWNER_ONLY=${codeOwnerOnly}

# ── APIs Extras ───────────────────────────
# openweathermap.org
WEATHER_KEY=${weatherKey}
# newsapi.org
NEWS_KEY=${newsKey}
# football-data.org
FOOTBALL_KEY=${footballKey}

# ── Comportamento ─────────────────────────
SELF_BOT=${selfBot}
ANTI_SPAM=${antiSpam}
IA_DEFAULT=${iaDefault}
`

  fs.writeFileSync(ENV_PATH, env)

  // ── Resumo ─────────────────────────────────────────────
  console.log(`\n  ${C.green}${C.bold}╔══════════════════════════════════════╗
  ║      ✔  .env configurado com sucesso!    ║
  ╚══════════════════════════════════════╝${C.reset}\n`)

  check('Bot', !!owner && !!groqKey, !groqKey ? 'configure GROQ_API_KEY para IA funcionar' : nome)
  check('Dashboard', true, `http://localhost:${dashPort}`)
  check('GitHub', !!githubRepo, githubRepo || 'não configurado')
  check('Auto-update', autoUpdate && !!githubRepo, autoUpdate ? 'a cada 6h' : 'desativado')
  check('Detector de código', autoCode, autoCode ? 'ativo' : 'desativado')
  check('Clima', !!weatherKey, weatherKey ? 'ok' : 'configure WEATHER_KEY')

  console.log(`\n  ${C.cyan}Próximos passos:${C.reset}`)
  console.log(`  ${C.gray}  1.${C.reset} npm install`)
  console.log(`  ${C.gray}  2.${C.reset} npm start`)
  console.log(`  ${C.gray}  3.${C.reset} Painel → http://localhost:${dashPort}`)
  if (!groqKey) console.log(`  ${C.red}  ⚠  Adicione sua GROQ_API_KEY no .env antes de iniciar!${C.reset}`)
  if (githubRepo && !githubToken) console.log(`  ${C.yellow}  ⚠  Sem token GitHub — uploads precisarão de autenticação manual${C.reset}`)
  console.log()
  rl.close()
}

main().catch(e => { console.error(e); rl.close(); process.exit(1) })
