// ══════════════════════════════════════════════════════════
//  hooks.js — Sistema de Hooks v2 (Declarativo + Auto-load)
//
//  MODO 1 — DECLARATIVO (recomendado):
//  Crie um arquivo .js em src/commands/SUA_PASTA/
//  com a propriedade "hooks" exportada. O loader
//  registra automaticamente ao carregar os comandos.
//
//  MODO 2 — PROGRAMÁTICO:
//  Chame registerHook() de qualquer lugar.
//
// ══════════════════════════════════════════════════════════
import { logInfo, logWarn } from './logger.js'
import { automationsDB }    from './database.js'
import axios                from 'axios'

// ── Registro interno ──────────────────────────────────────
const _hooks = new Map()   // id → hook de mensagem
const _events = new Map()  // event_name → [handlers]

// ── Tipos de evento disponíveis ───────────────────────────
export const EVENTS = {
  MESSAGE:       'message',        // Toda mensagem (antes dos comandos)
  COMMAND:       'command',        // Após executar um comando (ctx + cmdName)
  GROUP_JOIN:    'group.join',     // Membro entrou no grupo
  GROUP_LEAVE:   'group.leave',    // Membro saiu do grupo
  CONNECT:       'bot.connect',    // Bot conectou ao WhatsApp
  DISCONNECT:    'bot.disconnect', // Bot desconectou
  RELOAD:        'cmd.reload',     // Comandos recarregados
}

// ════════════════════════════════════════════════════════════
//  REGISTRO DE HOOKS DE MENSAGEM
//  Interceptam mensagens ANTES dos comandos.
//  Retornar true = parar propagação (comando não roda)
// ════════════════════════════════════════════════════════════

/**
 * Registra um hook de mensagem.
 *
 * @param {object}    hook
 * @param {string}    hook.id         ID único. Duplicatas são substituídas.
 * @param {string}    hook.name       Nome legível (exibido no painel e logs).
 * @param {number}   [hook.priority]  Ordem de execução — menor = primeiro. Padrão: 50.
 * @param {string[]} [hook.groups]    JIDs dos grupos onde o hook roda. Vazio = todos.
 * @param {boolean}  [hook.onlyGroups]  true = só grupos | false (padrão) = grupos + privado
 * @param {boolean}  [hook.onlyPrivate] true = só privado
 * @param {RegExp|string} [hook.match]  Se definido, hook só roda se texto bater.
 * @param {Function} [hook.filter]    (ctx) => boolean — filtro extra avançado.
 * @param {Function}  hook.handle     async (ctx) => boolean|undefined
 *                                    Retorna true para parar propagação.
 */
export function registerHook(hook) {
  if (!hook?.id || typeof hook.handle !== 'function') {
    logWarn('[Hooks] Inválido — precisa de id (string) e handle (function)')
    return false
  }
  const existing = _hooks.has(hook.id)
  _hooks.set(hook.id, {
    id:           hook.id,
    name:         hook.name        || hook.id,
    priority:     hook.priority    ?? 50,
    groups:       hook.groups      || [],        // [] = todos os grupos
    onlyGroups:   hook.onlyGroups  ?? false,
    onlyPrivate:  hook.onlyPrivate ?? false,
    match:        hook.match       || null,
    filter:       hook.filter      || null,
    handle:       hook.handle,
    source:       hook.source      || 'runtime', // 'file' | 'runtime' | 'dashboard'
    createdAt:    hook.createdAt   || Date.now(),
  })
  if (!existing) logInfo(`[Hook] registrado: "${hook.name || hook.id}"`)
  return true
}

export function removeHook(id) {
  const ok = _hooks.delete(id)
  if (ok) logInfo(`[Hook] removido: "${id}"`)
  return ok
}

// Atualiza prioridade sem perder a função handle
export function updateHookPriority(id, priority) {
  const hook = _hooks.get(id)
  if (!hook) return false
  hook.priority = Number(priority)
  _hooks.set(id, hook)
  return true
}

export function listHooks() {
  return [..._hooks.values()].sort((a, b) => a.priority - b.priority)
}

export function hookCount() { return _hooks.size }

// ════════════════════════════════════════════════════════════
//  SISTEMA DE EVENTOS GENÉRICO (pub/sub)
//  Para ouvir qualquer evento do bot além de mensagens.
// ════════════════════════════════════════════════════════════

/**
 * Escuta um evento do bot.
 *
 * @param {string}   event    Nome do evento (use EVENTS.xxx)
 * @param {string}   id       ID único para este listener.
 * @param {Function} handler  async (data) => void
 */
export function onEvent(event, id, handler) {
  if (!_events.has(event)) _events.set(event, new Map())
  _events.get(event).set(id, handler)
  logInfo(`[Hook] evento "${event}" registrado: "${id}"`)
}

export function offEvent(event, id) {
  _events.get(event)?.delete(id)
}

/**
 * Emite um evento para todos os listeners.
 * Chamado internamente pelo handler e index.js.
 */
export async function emitEvent(event, data = {}) {
  const listeners = _events.get(event)
  if (!listeners?.size) return
  for (const [id, handler] of listeners) {
    try { await handler(data) }
    catch (e) { logWarn(`[Hook] evento "${event}" handler "${id}": ${e.message}`) }
  }
}

// ════════════════════════════════════════════════════════════
//  RUNNER — chamado pelo handler.js para cada mensagem
// ════════════════════════════════════════════════════════════

export async function runHooks(ctx) {
  // ── 1. Webhooks externos (Super Hooks) ──────────────────
  const webhooks = automationsDB.get('hooks', [])
  if (webhooks.length) {
    const payload = {
      event: 'message', timestamp: Date.now(),
      data: { from: ctx.from, pushName: ctx.usuario, text: ctx.texto,
              isGrupo: ctx.isGrupo, userId: ctx.userId, key: ctx.msg?.key }
    }
    for (const wh of webhooks) {
      if (wh.enabled && wh.url)
        axios.post(wh.url, payload, { timeout: 2000 }).catch(() => {})
    }
  }

  // ── 2. Emite evento MESSAGE para listeners ───────────────
  await emitEvent(EVENTS.MESSAGE, ctx)

  // ── 3. Hooks de mensagem registrados ────────────────────
  const hooks = listHooks()
  for (const hook of hooks) {
    try {
      // Filtro: onlyGroups / onlyPrivate
      if (hook.onlyGroups  && !ctx.isGrupo) continue
      if (hook.onlyPrivate &&  ctx.isGrupo) continue

      // Filtro: grupos específicos
      if (hook.groups.length && ctx.isGrupo && !hook.groups.includes(ctx.from)) continue

      // Filtro: match de texto
      if (hook.match) {
        const m = hook.match instanceof RegExp
          ? hook.match.test(ctx.texto)
          : ctx.texto?.toLowerCase().includes(hook.match.toLowerCase())
        if (!m) continue
      }

      // Filtro: função customizada
      if (hook.filter && !hook.filter(ctx)) continue

      const stopped = await hook.handle(ctx)
      if (stopped === true) return true
    } catch (e) {
      logWarn(`[Hook] "${hook.name}" erro: ${e.message}`)
    }
  }
  return false
}

// ════════════════════════════════════════════════════════════
//  AUTO-LOADER — carregado pelo loader.js após importar cmds
//  Lê a propriedade "hooks" de cada módulo de comando.
// ════════════════════════════════════════════════════════════

/**
 * Registra hooks declarados em um módulo de comando.
 * Chamado pelo loader.js após importar cada arquivo.
 *
 * O módulo pode exportar:
 *   export const hooks = [ { id, name, handle, ... } ]
 *   export const hooks = { id, name, handle, ... }   // hook único
 */
export function loadHooksFromModule(mod, sourcePath) {
  const raw = mod.hooks
  if (!raw) return 0
  const list = Array.isArray(raw) ? raw : [raw]
  let n = 0
  for (const h of list) {
    if (!h?.id || !h?.handle) continue
    registerHook({ ...h, source: 'file', sourceFile: sourcePath })
    n++
  }
  return n
}
