// ══════════════════════════════════════════════════════════
//  Kaius Bot — Service Worker v31
//  Estratégia: Cache-first para shell, Network-first para APIs
// ══════════════════════════════════════════════════════════

const VERSION     = 'kaius-v31'
const SHELL_CACHE = VERSION + '-shell'
const API_CACHE   = VERSION + '-api'

// Arquivos essenciais do shell (carregam offline)
const SHELL_FILES = [
  '/',
  '/styles.css',
  '/app.js',
  '/assets/icons.js',
  '/assets/logo.svg',
  '/components/Dashboard.js',
  '/components/Logs.js',
  '/components/Commands.js',
  '/components/Automations.js',
  '/components/Webhooks.js',
  '/components/Groups.js',
  '/components/Users.js',
  '/components/Config.js',
  '/components/System.js',
  '/manifest.json',
  '/offline.html',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.4/socket.io.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js',
]

// ── Install: pré-cacheia o shell ──────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(
        SHELL_FILES.map(url => new Request(url, { mode: 'cors' }))
      ))
      .catch(err => console.warn('[SW] Cache parcial:', err.message))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: limpa caches antigos ───────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== API_CACHE)
          .map(k => {
            console.log('[SW] Removendo cache:', k)
            return caches.delete(k)
          })
      )
    ).then(() => {
      self.clients.claim()
      self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: VERSION }))
      )
    })
  )
})

// ── Fetch: estratégia por tipo ────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // APIs: sempre network (sem cache)
  if (url.pathname.startsWith('/api') || url.pathname.includes('socket.io')) {
    return // deixa o browser buscar normalmente
  }

  // GET somente
  if (request.method !== 'GET') return

  // Fonts do Google: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(request, SHELL_CACHE))
    return
  }

  // CDN estático: cache-first
  if (url.hostname.includes('cloudflare') || url.hostname.includes('cdnjs')) {
    e.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // Shell local: cache-first com fallback para offline.html
  if (url.origin === location.origin) {
    e.respondWith(
      cacheFirst(request, SHELL_CACHE).catch(() =>
        caches.match('/offline.html')
      )
    )
  }
})

// ── Estratégias ───────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(cacheName).then(c => c.put(request, response.clone()))
    }
    return response
  }).catch(() => cached)

  return cached || fetchPromise
}

// ── Push Notifications ────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'Kaius Bot', {
      body:  data.body  || '',
      icon:  '/assets/logo.svg',
      badge: '/assets/logo.svg',
      data:  data,
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/'))
})

// ── Background Sync ───────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-logs') {
    // Placeholder para sync futuro
    console.log('[SW] Background sync:', e.tag)
  }
})
