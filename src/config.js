import { configDB } from './database.js'

const DEFAULTS = {
  prefixo:        process.env.PREFIX        || '!',
  nome:           process.env.BOT_NAME      || 'Elyra',
  versao:         '2.1.0',
  owner:          process.env.OWNER_NUMBER  || '',
  personalidade:  process.env.BOT_PERSONALITY || 'Você é Elyra, uma assistente inteligente, mística e elegante. Responda sempre em português, com leveza e carisma.',
  modelo:         process.env.GROQ_MODEL    || 'llama-3.3-70b-versatile',
  groqKey:        process.env.GROQ_API_KEY  || '',
  dashboardPort:  parseInt(process.env.DASHBOARD_PORT) || 3000,
  dashboardPass:  process.env.DASHBOARD_PASS || '',
  dashboardAI:    process.env.DASHBOARD_AI !== 'false',
  iaAtivaPadrao:  process.env.IA_DEFAULT === 'true',
  antiSpam:       process.env.ANTI_SPAM !== 'false',
  spamLimite:     5,
  spamJanela:     10000,
  comandosAtivos: {},
  prefixosGrupo:  {},
  autoCodeDetect:  process.env.AUTO_CODE_DETECT !== 'false',
  codeOwnerOnly:   process.env.CODE_DETECT_OWNER_ONLY !== 'false',
  fuzzyCommands:   process.env.FUZZY_COMMANDS !== 'false',
  selfBot:         process.env.SELF_BOT === 'true',  // true = bot é usado só pelo dono
  autoUpdate:      process.env.AUTO_UPDATE === 'true',
  autoUpload:      process.env.AUTO_UPLOAD === 'true',
  'github.repo':   process.env.GITHUB_REPO_WITH_TOKEN || process.env.GITHUB_REPO || '',

  menu: {
    headerTexto:    'MENU DE COMANDOS',
    footerTexto:    'Powered by DevSquad',
    botFoto:        '',
    botNomeDisplay: '',
    // Design padrão: ┏━━━⪩ *BOT* ⪨━━━┓  (deixe vazio para usar o dinâmico)
    borderTop:      '',
    borderBot:      '',
    borderSide:     '│',
    separator:      '━',
    itemPrefix:     '├',
    subPrefix:      '└',
    negrito:        true,
    italico:        false,
    icons: {
      core:'',fun:'',rpg:'',media:'',info:'',
      admin:'',owner:'',misc:'',ia:'',games:'',tools:'',
    },
    nomes: {
      core:'SISTEMA',fun:'DIVERSÃO',rpg:'RPG',media:'MÍDIA',info:'INFORMAÇÃO',
      admin:'ADMINISTRAÇÃO',owner:'DONO',misc:'EXTRAS',ia:'IA',games:'JOGOS',tools:'FERRAMENTAS',
    },
    // Linhas customizáveis do menu principal
    menuLines: [
      { label: '!menuadm' },
      { label: '!menumemb' },
      { label: '!menuutils' },
      { label: '!menufig' },
      { label: '!menudown' },
      { label: '!menualteradores' },
      { label: '!menubn' },
      { label: '!menuia' },
      { label: '!menujogos' },
      { label: '!menudono' },
    ],
    categoriasVisiveis: ['core','fun','games','media','info','rpg','admin'],
    mostrarDescricao: false,
  },
}

function deepMerge(base, override) {
  const result = { ...base }
  for (const k of Object.keys(override || {})) {
    // Arrays are replaced wholesale, not merged
    if (Array.isArray(override[k])) {
      result[k] = override[k]
    } else if (override[k] && typeof override[k] === 'object') {
      result[k] = deepMerge(base[k] || {}, override[k])
    } else {
      result[k] = override[k]
    }
  }
  return result
}

// Keys that should ALWAYS come from env (never stored in DB)
const ENV_ONLY_KEYS = new Set([
  // These ALWAYS come from .env - never stored in DB
  'dashboardPort', 'dashboardPass', 'dashboardAI',
  'groqKey', 'owner', 'prefixo',
  'autoUpdate', 'autoUpload', 'selfBot',
  'github.repo',
  // Behavior flags - must come from .env to respect user's config
  'antiSpam', 'autoCodeDetect', 'codeOwnerOnly', 'fuzzyCommands',
])

function init() {
  for (const [k, v] of Object.entries(DEFAULTS)) {
    // Never store env-only keys in DB
    if (ENV_ONLY_KEYS.has(k)) continue
    if (!configDB.has(k)) configDB.set(k, v)
  }
  const savedMenu = configDB.get('menu', {})
  configDB.set('menu', deepMerge(DEFAULTS.menu, savedMenu))
}
init()

export const CONFIG = new Proxy({}, {
  get(_, prop) {
    // Env-only keys always come from DEFAULTS (which reads from env)
    if (ENV_ONLY_KEYS.has(prop)) return DEFAULTS[prop]
    return configDB.get(prop) ?? DEFAULTS[prop]
  },
  set(_, prop, value) { configDB.set(prop, value); return true }
})

export const C = {
  reset:'\x1b[0m',bold:'\x1b[1m',dim:'\x1b[2m',white:'\x1b[97m',
  gray:'\x1b[90m',silver:'\x1b[37m',cyan:'\x1b[96m',green:'\x1b[92m',
  yellow:'\x1b[93m',red:'\x1b[91m',magenta:'\x1b[95m',blue:'\x1b[94m',
}
