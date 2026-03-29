import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logInfo, logOk } from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Pastas para limpar periodicamente
const TEMP_DIRS = [
  path.join(ROOT, 'tmp'),
  path.join(ROOT, 'midias/cache'),
  path.join(ROOT, 'auth/baileys_store.json') // Arquivo que cresce muito
]

export function initCleaner(intervalHours = 12) {
  logInfo(`Limpador: ativo (cada ${intervalHours}h)`)
  
  const clean = () => {
    let freed = 0
    TEMP_DIRS.forEach(p => {
      try {
        if (fs.existsSync(p)) {
          const stats = fs.statSync(p)
          if (stats.isDirectory()) {
            const files = fs.readdirSync(p)
            files.forEach(f => {
              const fp = path.join(p, f)
              freed += fs.statSync(fp).size
              fs.unlinkSync(fp)
            })
          } else {
            freed += stats.size
            fs.unlinkSync(p)
          }
        }
      } catch {}
    })
    
    if (freed > 0) {
      const mb = (freed / 1024 / 1024).toFixed(2)
      logOk(`Limpador: ${mb}MB de lixo removidos!`)
    }
    
    // Força o Garbage Collector do Node se disponível
    if (global.gc) {
      global.gc()
      logInfo('Limpador: RAM liberada via GC')
    }
  }

  // Roda agora e depois no intervalo
  clean()
  setInterval(clean, intervalHours * 3600000)
}
