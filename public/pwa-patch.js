// PWA: registra o Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('[PWA] Service Worker registrado:', reg.scope)

      // Notifica updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nova versão disponível')
          }
        })
      })

      // Sync quando voltar online
      window.addEventListener('online', () => {
        if (reg.sync) reg.sync.register('sync-logs').catch(() => {})
      })
    } catch (e) {
      console.warn('[PWA] Falha ao registrar SW:', e.message)
    }
  })

  // Mensagens do SW
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'SW_UPDATED') {
      console.log('[PWA] SW atualizado para', e.data.version)
    }
  })
}
