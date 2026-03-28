import { schedulerDB } from './database.js'
import { logInfo, logOk, logError } from './logger.js'

let _sock = null

export function initScheduler(sock) {
  _sock = sock
  logInfo('Agendador: iniciado')
  
  // Loop de verificação a cada 30 segundos
  setInterval(async () => {
    if (!_sock) return
    
    const now = new Date()
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0')
    
    const tasks = schedulerDB.all()
    for (const id in tasks) {
      const task = tasks[id]
      if (!task.enabled) continue
      
      if (task.time === currentTime) {
        // Evita enviar múltiplas vezes no mesmo minuto
        const lastRunKey = `lastRun_${id}`
        const lastRun = schedulerDB.get(lastRunKey, '')
        const today = now.toISOString().split('T')[0]
        
        if (lastRun !== today) {
          try {
            await _sock.sendMessage(task.jid, { text: task.text })
            logOk(`Agendador: mensagem enviada para ${task.jid}`)
            
            schedulerDB.set(lastRunKey, today)
            
            if (!task.repeat) {
              schedulerDB.delete(id)
              schedulerDB.delete(lastRunKey)
            }
          } catch (e) {
            logError(`Agendador erro: ${e.message}`)
          }
        }
      }
    }
  }, 30000)
}
