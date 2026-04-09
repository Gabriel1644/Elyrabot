/**
 * app.js — Kaius Dashboard
 * Lógica principal: roteamento SPA, Socket.io, API, toast, auth
 *
 * Endpoints documentados:
 *   GET  /api/status          → status do bot
 *   GET  /api/logs            → histórico de logs
 *   GET  /api/config          → configurações
 *   POST /api/config          → salvar configurações
 *   POST /api/reload          → recarregar comandos
 *   GET  /api/stats/chart     → dados do gráfico (últimos 7 dias)
 *   GET  /api/system/usage    → uso de CPU/RAM
 *   (outros em cada component)
 *
 * Socket.io eventos recebidos:
 *   init   → { logs: [], commands: [] }
 *   status → { online, nome, numero, ... }
 *   log    → { type, msg, time }
 *   reload → { total }
 */

/* ══════════════════════════════════════════════════════════
   STATE GLOBAL
   ══════════════════════════════════════════════════════════ */
const App = {
  token: localStorage.getItem('kaius_token') || '',
  socket: null,
  state: {
    connected: false,
    botOnline: false,
    botNome: 'Kaius',
    botNumero: '',
    logs: [],
    commands: [],
    newLogsCount: 0,
  },
  currentPage: '',
  pages: {},
}

/* ══════════════════════════════════════════════════════════
   API HELPER
   ══════════════════════════════════════════════════════════ */
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (App.token) opts.headers['x-token'] = App.token
  if (body) opts.body = JSON.stringify(body)

  try {
    const res = await fetch(path, opts)

    // Token inválido
    if (res.status === 401) {
      showAuthModal()
      throw new Error('Unauthorized')
    }

    const ct = res.headers.get('content-type') || ''
    const data = ct.includes('json') ? await res.json() : { ok: res.ok, raw: await res.text() }

    if (!res.ok && data.error) throw new Error(data.error)
    return data
  } catch (e) {
    if (e.message !== 'Unauthorized') throw e
    throw e
  }
}

const GET    = (p)       => api('GET', p)
const POST   = (p, b)    => api('POST', p, b)
const PUT    = (p, b)    => api('PUT', p, b)
const DELETE = (p)       => api('DELETE', p)

/* ══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════════ */
function toast(type, title, msg = '', duration = 3500) {
  const container = document.getElementById('toastContainer')
  const iconMap = {
    success: ICONS.check,
    error:   ICONS.x,
    warning: ICONS.warn,
    info:    ICONS.info,
  }

  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.innerHTML = `
    <span class="toast-icon">${iconMap[type] || ICONS.info}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
  `

  container.appendChild(el)

  const remove = () => {
    el.style.animation = 'toastOut 0.2s ease forwards'
    setTimeout(() => el.remove(), 200)
  }

  const timer = setTimeout(remove, duration)
  el.addEventListener('click', () => { clearTimeout(timer); remove() })
}

const toastSuccess = (t, m) => toast('success', t, m)
const toastError   = (t, m) => toast('error',   t, m)
const toastWarning = (t, m) => toast('warning', t, m)
const toastInfo    = (t, m) => toast('info',    t, m)

/* ══════════════════════════════════════════════════════════
   AUTH MODAL
   ══════════════════════════════════════════════════════════ */
function showAuthModal() {
  document.getElementById('authModal').style.display = 'flex'
  document.getElementById('authInput').focus()
}

function hideAuthModal() {
  document.getElementById('authModal').style.display = 'none'
}

document.getElementById('authSubmit').addEventListener('click', async () => {
  const pass = document.getElementById('authInput').value.trim()
  if (!pass) return

  App.token = pass
  localStorage.setItem('kaius_token', pass)

  try {
    await GET('/api/status')
    hideAuthModal()
    toastSuccess('Autenticado', 'Senha aceita!')
    loadPage(App.currentPage || 'dashboard')
  } catch (e) {
    if (e.message === 'Unauthorized') {
      toastError('Senha incorreta', 'Verifique a DASHBOARD_PASS no .env')
      App.token = ''
      localStorage.removeItem('kaius_token')
    }
  }
})

document.getElementById('authInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('authSubmit').click()
})

/* ══════════════════════════════════════════════════════════
   STATUS DO BOT (sidebar)
   ══════════════════════════════════════════════════════════ */
function updateBotStatus({ online, nome, numero } = {}) {
  const dot  = document.getElementById('statusDot')
  const text = document.getElementById('statusText')

  dot.className = `status-dot ${online ? 'online' : 'offline'}`
  text.textContent = nome || (online ? 'Online' : 'Offline')

  App.state.botOnline  = !!online
  App.state.botNome    = nome || App.state.botNome
  App.state.botNumero  = numero || App.state.botNumero

  document.getElementById('sidebarVersion').textContent = `v${window._botVersao || '—'}`
}

/* ══════════════════════════════════════════════════════════
   SOCKET.IO
   ══════════════════════════════════════════════════════════ */
function initSocket() {
  const connDot = document.querySelector('.conn-dot')

  App.socket = io({ transports: ['websocket', 'polling'] })

  App.socket.on('connect', () => {
    App.state.connected = true
    connDot.classList.remove('disconnected')
  })

  App.socket.on('disconnect', () => {
    App.state.connected = false
    connDot.classList.add('disconnected')
    updateBotStatus({ online: false })
  })

  App.socket.on('init', ({ logs, commands }) => {
    App.state.logs     = logs     || []
    App.state.commands = commands || []
    // Notifica páginas abertas
    if (App.pages[App.currentPage]?.onSocketInit) {
      App.pages[App.currentPage].onSocketInit({ logs, commands })
    }
  })

  App.socket.on('status', (data) => {
    updateBotStatus(data)
    window._botVersao = data.versao || window._botVersao
    document.getElementById('sidebarVersion').textContent = `v${window._botVersao || '—'}`
    if (App.pages[App.currentPage]?.onStatus) {
      App.pages[App.currentPage].onStatus(data)
    }
  })

  App.socket.on('log', (entry) => {
    App.state.logs.push(entry)
    if (App.state.logs.length > 500) App.state.logs.shift()

    // Badge na nav
    if (App.currentPage !== 'logs') {
      App.state.newLogsCount++
      const badge = document.getElementById('logsBadge')
      badge.style.display = 'inline'
      badge.textContent = App.state.newLogsCount > 99 ? '99+' : App.state.newLogsCount
    }

    if (App.pages[App.currentPage]?.onLog) {
      App.pages[App.currentPage].onLog(entry)
    }
  })

  App.socket.on('reload', ({ total }) => {
    toastInfo('Comandos recarregados', `${total} comandos carregados`)
    if (App.pages[App.currentPage]?.onReload) {
      App.pages[App.currentPage].onReload(total)
    }
  })

  App.socket.on('qr', (data) => {
    if (App.pages[App.currentPage]?.onQR) App.pages[App.currentPage].onQR(data)
  })

  App.socket.on('pairing_code', (data) => {
    if (App.pages[App.currentPage]?.onPairingCode) App.pages[App.currentPage].onPairingCode(data)
  })
}

/* ══════════════════════════════════════════════════════════
   ROUTER (SPA simples baseado em hash)
   ══════════════════════════════════════════════════════════ */
const PAGE_TITLES = {
  dashboard:   'Dashboard',
  logs:        'Logs em Tempo Real',
  commands:    'Comandos',
  automations: 'Automações',
  webhooks:    'Webhooks',
  groups:      'Grupos',
  users:       'Usuários',
  bang:        '⚡ Ações Rápidas',
  config:      'Configurações',
  system:      'Sistema',
}

const PAGE_COMPONENTS = {
  dashboard:   typeof PageDashboard   !== 'undefined' ? PageDashboard   : null,
  logs:        typeof PageLogs        !== 'undefined' ? PageLogs        : null,
  commands:    typeof PageCommands    !== 'undefined' ? PageCommands    : null,
  automations: typeof PageAutomations !== 'undefined' ? PageAutomations : null,
  webhooks:    typeof PageWebhooks    !== 'undefined' ? PageWebhooks    : null,
  groups:      typeof PageGroups      !== 'undefined' ? PageGroups      : null,
  users:       typeof PageUsers       !== 'undefined' ? PageUsers       : null,
  bang:        typeof PageBangPanel   !== 'undefined' ? PageBangPanel   : null,
  config:      typeof PageConfig      !== 'undefined' ? PageConfig      : null,
  system:      typeof PageSystem      !== 'undefined' ? PageSystem      : null,
}

async function loadPage(name) {
  if (!PAGE_COMPONENTS[name]) name = 'dashboard'

  // Cleanup anterior
  if (App.pages[App.currentPage]?.cleanup) {
    App.pages[App.currentPage].cleanup()
  }

  App.currentPage = name

  // Atualiza nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === name)
  })

  // Título
  document.getElementById('pageTitle').textContent = PAGE_TITLES[name] || name
  document.title = `${PAGE_TITLES[name] || name} · Kaius`

  // Atualiza hash sem recarregar
  history.replaceState(null, '', `#${name}`)

  // Reset badge de logs
  if (name === 'logs') {
    App.state.newLogsCount = 0
    document.getElementById('logsBadge').style.display = 'none'
  }

  // Renderiza
  const container = document.getElementById('pageContent')
  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`

  const component = PAGE_COMPONENTS[name]
  if (component) {
    App.pages[name] = component
    await component.render(container)
  }
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR TOGGLE (mobile)
   ══════════════════════════════════════════════════════════ */
function setupSidebar() {
  const sidebar  = document.getElementById('sidebar')
  const overlay  = document.getElementById('sidebarOverlay')
  const menuBtn  = document.getElementById('menuBtn')
  const closeBtn = document.getElementById('sidebarToggle')

  const open  = () => { sidebar.classList.add('open'); overlay.classList.add('open') }
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('open') }

  menuBtn.addEventListener('click', open)
  closeBtn.addEventListener('click', close)
  overlay.addEventListener('click', close)

  // Fecha ao navegar no mobile
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      if (window.innerWidth <= 768) close()
    })
  })
}

/* ══════════════════════════════════════════════════════════
   NAV CLICK
   ══════════════════════════════════════════════════════════ */
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault()
      loadPage(el.dataset.page)
    })
  })
}

/* ══════════════════════════════════════════════════════════
   RELOAD BUTTON
   ══════════════════════════════════════════════════════════ */
document.getElementById('reloadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('reloadBtn')
  btn.disabled = true
  try {
    const data = await POST('/api/reload')
    toastSuccess('Recarregado', `${data.total} comandos`)
  } catch (e) {
    toastError('Erro', e.message)
  } finally {
    btn.disabled = false
  }
})

/* ══════════════════════════════════════════════════════════
   UTILITIES GLOBAIS
   ══════════════════════════════════════════════════════════ */

/** Cria um modal dinâmico */
function createModal({ title, body, footer = '', icon = ICONS.info, maxWidth = '560px' }) {
  const id = `modal_${Date.now()}`
  const el = document.createElement('div')
  el.className = 'modal-backdrop'
  el.id = id
  el.innerHTML = `
    <div class="modal" style="max-width:${maxWidth}">
      <div class="modal-header">
        <span style="color:var(--accent);width:22px;height:22px">${icon}</span>
        <h2>${title}</h2>
        <button class="btn-icon modal-close" data-close="${id}" style="margin-left:auto">
          ${ICONS.x}
        </button>
      </div>
      <hr class="divider">
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `
  document.body.appendChild(el)

  // Fechar
  const close = () => el.remove()
  el.querySelector('[data-close]').addEventListener('click', close)
  el.addEventListener('click', (e) => { if (e.target === el) close() })

  return { el, close, id }
}

/** Formata bytes */
function fmtBytes(b) {
  if (b < 1024) return `${b}B`
  if (b < 1024**2) return `${(b/1024).toFixed(1)}KB`
  if (b < 1024**3) return `${(b/1024**2).toFixed(1)}MB`
  return `${(b/1024**3).toFixed(1)}GB`
}

/** Formata timestamp */
function fmtTime(ts) {
  if (!ts) return '--:--'
  const d = new Date(ts)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** Formata data curta */
function fmtDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Cria barra de progresso */
function progressBar(percent, cls = '') {
  return `<div class="progress"><div class="progress-fill ${cls}" style="width:${Math.min(100,percent)}%"></div></div>`
}

/** Badge de categoria de comando */
function cmdCategoryBadge(cat) {
  const map = {
    core:  'blue',
    fun:   'purple',
    games: 'purple',
    info:  'blue',
    media: 'orange',
    rpg:   'yellow',
    admin: 'orange',
    owner: 'red',
    misc:  'gray',
  }
  return `<span class="badge badge-${map[cat] || 'gray'}">${cat}</span>`
}

/** Escapa HTML */
function escHtml(s = '') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
}

/** Confirma ação destrutiva */
function confirm(msg) {
  return window.confirm(msg)
}

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
async function init() {
  setupSidebar()
  setupNav()
  initSocket()

  // Testa auth
  try {
    const status = await GET('/api/status')
    updateBotStatus({ online: true, nome: status.nome, numero: status.numero })
    window._botVersao = status.versao
    document.getElementById('sidebarVersion').textContent = `v${status.versao || '—'}`
  } catch (e) {
    if (e.message !== 'Unauthorized') {
      updateBotStatus({ online: false })
    }
    // Se unauthorized, showAuthModal já foi chamado dentro de api()
  }

  // Rota inicial
  const hash = location.hash.replace('#', '') || 'dashboard'
  loadPage(hash)
}

window.addEventListener('load', init)

// Expõe utilitários globalmente para os components
window.App        = App
window.api        = api
window.GET        = GET
window.POST       = POST
window.PUT        = PUT
window.DELETE     = DELETE
window.toast      = toast
window.toastSuccess = toastSuccess
window.toastError   = toastError
window.toastWarning = toastWarning
window.toastInfo    = toastInfo
window.createModal  = createModal
window.fmtBytes     = fmtBytes
window.fmtTime      = fmtTime
window.fmtDate      = fmtDate
window.progressBar  = progressBar
window.cmdCategoryBadge = cmdCategoryBadge
window.escHtml      = escHtml
