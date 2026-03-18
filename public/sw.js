const CACHE = 'elyrabot-v1'
const STATIC = ['/', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(()=>{}))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // For API calls, always go to network
  if (e.request.url.includes('/api/') || e.request.url.includes('/socket.io/')) return
  // For everything else, network-first with cache fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
