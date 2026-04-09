import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../data')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

class JsonDB {
  constructor(name) {
    this.file = path.join(DATA_DIR, `${name}.json`)
    this.data = {}
    this._load()
  }

  _load() {
    try {
      if (fs.existsSync(this.file)) {
        this.data = JSON.parse(fs.readFileSync(this.file, 'utf-8'))
      }
    } catch { this.data = {} }
  }

  save() {
    if (this._timer) clearTimeout(this._timer)
    this._timer = setTimeout(() => {
      try {
        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2))
      } catch (e) { console.error(`[DB ERROR] ${this.file}:`, e.message) }
    }, 2000) // Aguarda 2s de inatividade para salvar (Debounce)
  }

  get(key, def = null) {
    return key in this.data ? this.data[key] : def
  }

  set(key, value) {
    this.data[key] = value
    this.save()
    return value
  }

  delete(key) {
    delete this.data[key]
    this.save()
  }

  // Força o salvamento imediato (ex: ao desligar o bot)
  flush() {
    if (this._timer) clearTimeout(this._timer)
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2))
  }

  has(key) { return key in this.data }

  all() { return { ...this.data } }

  update(key, partialValue, def = {}) {
    const current = this.get(key, def)
    const updated = { ...current, ...partialValue }
    return this.set(key, updated)
  }
}

// Instâncias singleton
export const configDB   = new JsonDB('config')
export const groupsDB   = new JsonDB('groups')
export const rpgDB      = new JsonDB('rpg')
export const statsDB    = new JsonDB('stats')
export const usersDB    = new JsonDB('users')
export const cooldownDB = new JsonDB('cooldowns')

export default JsonDB
export const minionsDB      = new JsonDB('minions')      // todos usuários do bot
export const subdonsDB      = new JsonDB('subdons')      // subdons e permissões
export const contribDB      = new JsonDB('contributions') // comandos para contribuir
export const cmdPermsDB     = new JsonDB('cmdperms')      // permissões por comando (override)
export const menuTargetDB   = new JsonDB('menutargets')    // qual menu cada comando aparece
export const automationsDB  = new JsonDB('automations')    // automações (triggers → respostas)
export const allowedGroupsDB  = new JsonDB('allowedgroups')  // whitelist
export const bannedGroupsDB   = new JsonDB('bannedgroups')   // blacklist — bot bloqueado
export const schedulerDB     = new JsonDB('scheduler')     // agendador de mensagens
export const cmdPriorityDB   = new JsonDB('cmdpriority')   // prioridade de comandos (painel)
