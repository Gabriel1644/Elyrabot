const V = 'k32';
const CACHE = V + '-v1';
const SHELL = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(SHELL.map(u => fetch(u).then(r => r.ok && c.put(u, r))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Nunca intercepta API ou socket
  if (url.pathname.startsWith('/api') || url.pathname.includes('socket.io')) return;
  if (e.request.method !== 'GET') return;
  // Navegação SPA: tenta network, cai no cache de /
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  // Assets externos: stale-while-revalidate
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fresh = fetch(e.request).then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        });
        return cached || fresh;
      })
    );
    return;
  }
  // Assets locais: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
