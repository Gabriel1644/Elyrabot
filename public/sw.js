// ══════════════════════════════════════════════════════════
//  Kaius Bot — Service Worker v30
//  Estratégia: Cache-first pra shell, Network-first pra APIs
// ══════════════════════════════════════════════════════════

const VERSION    = 'kaius-v30'
const SHELL_CACHE = VERSION + '-shell'
const API_CACHE   = VERSION + '-api'

// Arquivos do shell — carregam offline
const SHELL_FILES = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600&family=Rajdhani:wght@500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.4/socket.io.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js',
]

// ── Install: pré-cacheia o shell ─────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_FILES.map(url => new Request(url, { mode: 'cors' }))))
      .catch(err => console.warn('[SW] Shell cache parcial:', err.message))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: limpa caches antigos + notifica clientes ───
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== API_CACHE)
          .map(k => {
            console.log('[SW] Removendo cache antigo:', k)
            return caches.delete(k)
          })
      )
    ).then(() => {
      self.clients.claim()
      // Notifica todos os clientes que há uma atualização
      self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: VERSION }))
      })
    })
  )
})

// ── Fetch: estratégia inteligente por tipo de request ────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Socket.io — nunca interceptar (WebSocket/long-poll)
  if (url.pathname.startsWith('/socket.io')) return

  // APIs — Network-first com timeout; se falhar, retorna erro JSON
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirstAPI(e.request))
    return
  }

  // Fontes e CDN — Cache-first (mudam raramente)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com')
  ) {
    e.respondWith(cacheFirst(e.request, SHELL_CACHE))
    return
  }

  // Shell (HTML, ícones, manifest) — Network-first com fallback offline
  e.respondWith(networkFirstShell(e.request))
})

// ── Estratégias ──────────────────────────────────────────

async function networkFirstShell(request) {
  try {
    const response = await fetchWithTimeout(request, 4000)
    // Atualiza o cache com a resposta fresca
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, response.clone()).catch(() => {})
    }
    return response
  } catch {
    // Offline: tenta o cache
    const cached = await caches.match(request)
    if (cached) return cached
    // Fallback para a página offline
    const offline = await caches.match('/offline.html')
    return offline || new Response('Offline', { status: 503 })
  }
}

async function networkFirstAPI(request) {
  try {
    return await fetchWithTimeout(request, 8000)
  } catch {
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Sem conexão com o servidor' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone()).catch(() => {})
    }
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    fetch(request).then(r => { clearTimeout(timer); resolve(r) }, err => { clearTimeout(timer); reject(err) })
  })
}

// ── Background Sync: retenta envios falhos ────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-messages') {
    e.waitUntil(syncPendingMessages())
  }
})

async function syncPendingMessages() {
  // Placeholder para sync de mensagens pendentes
  const clients = await self.clients.matchAll()
  clients.forEach(c => c.postMessage({ type: 'SYNC_COMPLETE' }))
}

// ── Push Notifications ────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'Kaius Bot', body: 'Nova notificação' }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Kaius Bot', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'kaius-notif',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.openWindow(e.notification.data?.url || '/')
  )
})
