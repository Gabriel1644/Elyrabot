// ══════════════════════════════════════════════════════════
//  hooks.js — Sistema de Hooks/Interceptors de Mensagem
//
//  Permite que QUALQUER COMANDO registre um "ouvinte" de
//  mensagens sem precisar tocar no handler.js.
//
//  COMO USAR no seu comando:
//
//  import { registerHook, removeHook } from '../../hooks.js'
//
//  registerHook({
//    id:       'meu-hook-unico',        // ID único (evita duplicata)
//    name:     'Detector de Palavrão',  // Nome legível
//    priority: 10,                      // Ordem de execução (menor = primeiro)
//    filter: ({ texto, isGrupo, from }) => isGrupo,   // opcional: quando rodar
//    handle: async ({ sock, msg, from, texto, userId, usuario, isGrupo, reply }) => {
//      // Retorne true para PARAR a propagação (não processa o comando depois)
//      // Retorne false/undefined para CONTINUAR (próximos hooks e comandos rodam)
//      if (texto.toLowerCase().includes('palavrão')) {
//        await reply('❌ Linguagem inadequada!')
//        return true  // para aqui
//      }
//    }
//  })
//
//  removeHook('meu-hook-unico')  // Remove quando não precisar mais
//
// ══════════════════════════════════════════════════════════

import { logInfo, logWarn } from './logger.js'
import { automationsDB } from './database.js'
import axios from 'axios'

// Mapa de hooks registrados: id → hook
const _hooks = new Map()

/**
 * Registra um hook de mensagem.
 * @param {Object} hook
 * @param {string}   hook.id        - ID único. Sobrescreve se já existir.
 * @param {string}   hook.name      - Nome legível para logs.
 * @param {number}   hook.priority  - Prioridade (menor = roda primeiro). Padrão: 50.
 * @param {Function} hook.filter    - Função (ctx) => boolean. Se falso, hook é pulado.
 * @param {Function} hook.handle    - Função async (ctx) => boolean|undefined.
 *                                    Retorna true para parar propagação.
 */
export function registerHook(hook) {
  if (!hook?.id || !hook?.handle) {
    logWarn('[Hooks] Hook inválido — precisa de id e handle')
    return false
  }
  const existing = _hooks.has(hook.id)
  _hooks.set(hook.id, {
    id:       hook.id,
    name:     hook.name || hook.id,
    priority: hook.priority ?? 50,
    filter:   hook.filter  || null,
    handle:   hook.handle,
  })
  logInfo(`[Hook] ${existing ? 'atualizado' : 'registrado'}: "${hook.name || hook.id}"`)
  return true
}

/**
 * Remove um hook pelo ID.
 */
export function removeHook(id) {
  const ok = _hooks.delete(id)
  if (ok) logInfo(`[Hook] removido: "${id}"`)
  return ok
}

/**
 * Retorna todos os hooks registrados ordenados por prioridade.
 */
export function listHooks() {
  return [..._hooks.values()].sort((a, b) => a.priority - b.priority)
}

/**
 * Chama todos os hooks em ordem de prioridade.
 * Retorna true se algum hook parou a propagação.
 * Chamado pelo handler.js antes do processamento de comandos.
 */
export async function runHooks(ctx) {
  // ── 1. Super Hooks (Event Streamer / Webhooks) ──────────
  const webhooks = automationsDB.get('hooks', [])
  if (webhooks.length) {
    const payload = {
      event: 'message',
      timestamp: Date.now(),
      data: {
        from: ctx.from,
        pushName: ctx.usuario,
        text: ctx.texto,
        isGrupo: ctx.isGrupo,
        userId: ctx.userId,
        key: ctx.msg.key
      }
    }
    for (const wh of webhooks) {
      if (wh.enabled && wh.url) {
        axios.post(wh.url, payload, { timeout: 2000 }).catch(() => {})
      }
    }
  }

  // ── 2. Hooks Internos (Lógica de Comandos) ──────────────
  const hooks = listHooks()
  for (const hook of hooks) {
    try {
      // Aplica filtro se existir
      if (hook.filter && !hook.filter(ctx)) continue

      const stopped = await hook.handle(ctx)
      if (stopped === true) return true  // propagação parada
    } catch (e) {
      logWarn(`[Hook] "${hook.name}" erro: ${e.message}`)
      // Não para os outros hooks por causa de um erro
    }
  }
  return false
}

export function hookCount() { return _hooks.size }
