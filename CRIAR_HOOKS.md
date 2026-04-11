# 🔌 Kaius Bot — Guia Completo de Hooks, Comandos e Eventos
## Versão 32 — Documento de Referência

> **Leia isto antes de criar qualquer hook.**  
> Um hook mal escrito pode silenciosamente bloquear todos os comandos do bot.  
> Este guia cobre desde exemplos básicos até padrões avançados de produção.

---

## Índice

1. [O que é um Hook?](#1-o-que-é-um-hook)
2. [Criar um Comando](#2-criar-um-comando)
3. [Criar um Hook de Mensagem](#3-criar-um-hook-de-mensagem)
4. [Sistema de Eventos (onEvent)](#4-sistema-de-eventos-onevent)
5. [Prioridade de Execução](#5-prioridade-de-execução)
6. [Painel Web — Gerenciar Hooks](#6-painel-web--gerenciar-hooks)
7. [Exemplos Práticos Completos](#7-exemplos-práticos-completos)
8. [Padrões Avançados](#8-padrões-avançados)
9. [Erros Comuns e Como Evitar](#9-erros-comuns-e-como-evitar)
10. [Referência Rápida](#10-referência-rápida)

---

## 1. O que é um Hook?

Um **hook** é uma função que **intercepta mensagens e eventos antes (ou durante) o processamento normal** do bot. Ao contrário de comandos (ativados por prefixo), hooks ouvem **todas as mensagens** e podem:

- Agir silenciosamente (logging, moderação)
- Modificar o comportamento do bot (bloquear mensagens, redirecionar)
- Responder a palavras-chave sem prefixo
- Disparar ações em eventos do sistema (entrar no grupo, conectar)

### Diferença entre Comando e Hook

| Aspecto | Comando | Hook |
|---|---|---|
| **Ativação** | Prefixo + nome (`.ping`) | Toda mensagem ou filtro configurado |
| **Pode bloquear o fluxo** | ❌ Não | ✅ Sim — retornar `true` para tudo |
| **Acesso a isAdmin** | ✅ Disponível | ⚠️ Não direto — precisa buscar |
| **Persiste entre reloads** | ✅ Sim (arquivo existe) | ✅ Sim (se declarado em arquivo) |
| **Registrado em** | `commandMap` via loader | `_hooks` Map via `registerHook()` |
| **Visível no painel** | ✅ Aba Comandos | ✅ Aba Hooks & Prioridade |

### Posição no Fluxo de Mensagem

```
1. Mensagem chega pelo WhatsApp
2. Handler verifica JID, prefixo, spam, automações
3. ─── runHooks() ← HOOKS RODAM AQUI (em ordem de prioridade) ───
      Se algum hook retornar true → para tudo, comando não roda
4. Verifica prefixo (. ! $)
5. Verifica permissão do usuário
6. Verifica cooldown
7. Execute(ctx) do comando
8. emitEvent(EVENTS.COMMAND)
```

> ⚠️ **Atenção:** hooks correm **antes** da verificação de prefixo. Ou seja, recebem TODA mensagem, inclusive as sem prefixo.

---

## 2. Criar um Comando

### Estrutura mínima

```js
// src/commands/fun/ola.js
export default {
  name: 'ola',           // único, lowercase, sem espaços
  description: 'Diz olá para o usuário',
  category: 'fun',       // define permissão padrão
  cooldown: 5,           // segundos (0 = sem cooldown)
  usage: '.ola [@alguém]',

  async execute(ctx) {
    const { reply, usuario } = ctx
    await reply(`Olá, ${usuario}! 👋`)
  }
}
```

### Estrutura completa com todos os recursos

```js
// src/commands/info/pesquisa.js
export default {
  name: 'pesquisa',
  aliases: ['search', 'busca'],   // outros nomes que ativam o comando
  description: 'Pesquisa algo na web',
  category: 'info',
  usage: '.pesquisa <termo>',
  cooldown: 10,
  enabled: true,          // false = desativado por padrão (pode ligar no painel)

  async execute(ctx) {
    const {
      // Identificação
      sock, msg, from, userId, usuario,
      // Contexto
      isGrupo, nomeGrupo, membros,
      // Input
      args, argStr, texto, prefix,
      // Permissões
      isAdmin, isOwner, isSubdono, userRole,
      // Funções de resposta
      reply, sendText, sendImage, sendSticker, sendAudio, react, mention,
      // Dados do grupo
      gdata, botJid,
    } = ctx

    // Validar argumentos
    if (!argStr) {
      return reply(`❌ Uso: ${prefix}pesquisa <termo>`)
    }

    await react('🔍')

    try {
      const { default: axios } = await import('axios')
      const { data } = await axios.get(`https://api.exemplo.com/search?q=${encodeURIComponent(argStr)}`)
      await reply(`📋 Resultado: ${data.resultado}`)
    } catch (e) {
      await reply(`❌ Erro na pesquisa: ${e.message}`)
    }
  }
}
```

### Múltiplos comandos no mesmo arquivo

```js
// src/commands/fun/jogos.js
export const dado = {
  name: 'dado',
  description: 'Rola um dado',
  category: 'fun',
  cooldown: 2,
  async execute({ reply, args }) {
    const lados = parseInt(args[0]) || 6
    const resultado = Math.floor(Math.random() * lados) + 1
    await reply(`🎲 Você rolou um d${lados}: *${resultado}*`)
  }
}

export const moeda = {
  name: 'moeda',
  description: 'Cara ou coroa',
  category: 'fun',
  cooldown: 2,
  async execute({ reply }) {
    await reply(Math.random() > 0.5 ? '🪙 Cara!' : '🔘 Coroa!')
  }
}

// OBRIGATÓRIO: export default array
export default [dado, moeda]
```

### Permissões por categoria

| Categoria | Quem pode usar |
|---|---|
| `core` | Todos |
| `fun` | Todos |
| `info` | Todos |
| `media` | Todos |
| `games` | Todos |
| `rpg` | Todos |
| `admin` | Admin do grupo + Sub-dono + Dono |
| `owner` | Só Dono e Sub-dono (com permissão) |
| `misc` | Todos (pasta customizada) |

> ℹ️ Permissões podem ser **sobrescritas individualmente** no painel (Configurações → Permissões por Comando).

---

## 3. Criar um Hook de Mensagem

### Estrutura básica

```js
// src/commands/owner/meu_hook.js
export const hooks = [
  {
    id:   'meu-hook-unico-id',  // OBRIGATÓRIO — string única global
    name: 'Descrição no Painel', // aparece no painel e nos logs
    priority: 50,               // 1-100, menor = roda ANTES (padrão: 50)

    handle: async (ctx) => {
      const { texto, reply, from, userId } = ctx

      if (texto.includes('palavra')) {
        await reply('Detectei a palavra! 👀')
        return true   // PARA propagação — comando não roda depois
                      // omitir ou retornar undefined = continua normalmente
      }
    }
  }
]

export default [] // sem comandos neste arquivo
```

### Todas as opções de filtro

```js
export const hooks = [
  {
    // ─── Identificação ────────────────────────────────────
    id:   'hook-completo',       // OBRIGATÓRIO. Deve ser único no sistema inteiro.
    name: 'Hook Completo',       // Nome legível para o painel.

    // ─── Ordem de execução ────────────────────────────────
    priority: 20,                // Menor = roda antes. Padrão: 50.
                                 // Use 1-10 para moderação crítica.
                                 // Use 50-90 para logging e extras.

    // ─── Filtros de escopo ────────────────────────────────
    onlyGroups:  true,           // true = ignora privado. Padrão: false.
    onlyPrivate: false,          // true = ignora grupos. Não combine com onlyGroups.
    groups: ['120363xxx@g.us'],  // JIDs específicos. [] = todos os grupos.

    // ─── Filtros de texto ─────────────────────────────────
    match: 'palavra-chave',      // String: texto.includes(match).
    // match: /regex/i,          // RegExp: match.test(texto).
    // match: null,              // null = toda mensagem passa.

    // ─── Filtro avançado ──────────────────────────────────
    filter: (ctx) => {
      // Retorne false para PULAR este hook (como se não existisse)
      // Retorne true para PROCESSAR
      return ctx.userId !== '5511111111111@s.whatsapp.net' // ignora usuário específico
    },

    // ─── Lógica principal ─────────────────────────────────
    handle: async (ctx) => {
      // Retornar true = BLOQUEIA (hook seguintes e comandos não rodam)
      // Retornar nada (undefined) = CONTINUA normalmente
    }
  }
]
```

### Contexto disponível nos hooks (`ctx`)

```js
handle: async (ctx) => {
  const {
    // ── Conexão ──────────────────────────────────
    sock,          // Client Baileys — acesso total ao WhatsApp
    msg,           // Mensagem completa (msg.key, msg.message, msg.pushName)

    // ── Identificação ────────────────────────────
    from,          // JID do chat: '120363xxx@g.us' ou '5511xxx@s.whatsapp.net'
    userId,        // JID de quem enviou: em grupo = msg.key.participant
    usuario,       // Nome de exibição (pushName)
    isGrupo,       // boolean

    // ── Texto ────────────────────────────────────
    texto,         // Texto completo da mensagem
    p,             // Prefixo atual (., !, $, etc)
    args,          // texto.split(' ').slice(1)

    // ── Grupo (pode estar vazio nos hooks!) ──────
    nomeGrupo,     // null se não buscado ainda
    membros,       // [] se não buscado ainda

    // ── Funções de resposta ──────────────────────
    reply,         // reply(text) — responde citando a mensagem
    react,         // react(emoji) — reage à mensagem
    sendText,      // sendText(jid, text) — envia para qualquer JID
    mention,       // mention(jid, text) — menciona usuário

  } = ctx

  // ⚠️ isAdmin NÃO está disponível diretamente nos hooks!
  // Para checar admin manualmente:
  const meta = await sock.groupMetadata(from).catch(() => null)
  const isAdmin = meta?.participants
    ?.find(p => p.id === userId)
    ?.admin === 'admin' || false
}
```

---

## 4. Sistema de Eventos (onEvent)

Para reagir a **eventos do sistema** (entrar/sair de grupos, conectar, comandos executados):

### Eventos disponíveis

```js
import { onEvent, offEvent, EVENTS } from '../../hooks.js'

export const EVENTS = {
  MESSAGE:     'message',      // Toda mensagem — ctx completo do hookCtx
  COMMAND:     'command',      // Após executar: { cmd: 'nome', ctx }
  GROUP_JOIN:  'group.join',   // { jid, groupJid, sock }
  GROUP_LEAVE: 'group.leave',  // { jid, groupJid, sock }
  CONNECT:     'bot.connect',  // { jid }
  DISCONNECT:  'bot.disconnect', // {}
  RELOAD:      'cmd.reload',   // {} (definido, emissão futura)
}
```

### Exemplos de uso

```js
// src/commands/owner/eventos.js
import { onEvent, offEvent, EVENTS } from '../../hooks.js'

// ── Boas-vindas automático ────────────────────────────────
onEvent(EVENTS.GROUP_JOIN, 'bemvindo-grupos', async ({ jid, groupJid, sock }) => {
  const meta = await sock.groupMetadata(groupJid).catch(() => null)
  const nome = meta?.subject || 'o grupo'
  await sock.sendMessage(groupJid, {
    text: `👋 Bem-vindo(a) ao *${nome}*, @${jid.split('@')[0]}!\nLeia as regras antes de participar.`,
    mentions: [jid]
  })
})

// ── Notificar saída ──────────────────────────────────────
onEvent(EVENTS.GROUP_LEAVE, 'saida-grupos', async ({ jid, groupJid, sock }) => {
  await sock.sendMessage(groupJid, {
    text: `😢 @${jid.split('@')[0]} saiu do grupo.`,
    mentions: [jid]
  })
})

// ── Log quando bot conecta ───────────────────────────────
onEvent(EVENTS.CONNECT, 'log-conexao', async ({ jid }) => {
  console.log(`[Sistema] Bot conectado como ${jid}`)
})

// ── Monitorar comandos executados ────────────────────────
onEvent(EVENTS.COMMAND, 'auditoria-cmds', async ({ cmd, ctx }) => {
  if (ctx.isOwner) return // ignora dono
  console.log(`[Audit] ${ctx.usuario} usou .${cmd} em ${ctx.from}`)
})

export default []

// Para remover um evento:
// offEvent(EVENTS.GROUP_JOIN, 'bemvindo-grupos')
```

---

## 5. Prioridade de Execução

### Como funciona

Hooks com **menor número** executam **primeiro**.

```
priority: 5   ← executa antes (moderação crítica)
priority: 10  ← executa segundo (anti-spam)
priority: 20  ← executa terceiro (moderação normal)
priority: 50  ← padrão (a maioria dos hooks)
priority: 80  ← executa quase por último (logging, extras)
priority: 100 ← executa por último
```

### Recomendações por tipo de hook

| Prioridade | Tipo de Hook |
|---|---|
| 1-5 | Anti-spam crítico, proteção contra ban, emergência |
| 6-15 | Anti-link, anti-palavrão, moderação ativa |
| 16-30 | Respostas automáticas prioritárias |
| 31-50 | Hooks normais (padrão) |
| 51-70 | Logging, rastreamento |
| 71-100 | Notificações opcionais, extras |

### Alterar prioridade pelo painel (sem tocar em arquivos)

1. Acesse o painel → **Comandos** → aba **Hooks & Prioridade**
2. Veja todos os hooks ativos ordenados pela ordem de execução
3. Use os botões **−5** e **+5** para ajustar a prioridade em tempo real
4. A mudança é imediata (sem reload)

### Alterar prioridade de comandos

Comandos com **maior número** têm **maior prioridade** e vencem conflitos de nome:

```
priority: 0   ← padrão (sem prioridade especial)
priority: 10  ← prioridade baixa
priority: 50  ← prioridade média
priority: 100 ← vence qualquer conflito de nome/alias
```

**Caso de uso:** Você cria um novo `ping.js` que substitui o original sem deletar o arquivo antigo → dê prioridade 100 ao novo no painel.

---

## 6. Painel Web — Gerenciar Hooks

### Aba Hooks & Prioridade

Acesse em: **Comandos → aba "Hooks & Prioridade"**

- **Lista ordenada** de todos os hooks registrados
- **Botões −5/+5** para alterar prioridade sem reiniciar
- **Botão Remover** para desativar um hook em tempo real
- **Ranking de comandos** com prioridade personalizada

### Aba Automações → Hooks

Para ver hooks de sistema mais simples e o agendador.

### Comandos de gerenciamento via WhatsApp

```
.hooks              → Lista todos os hooks ativos com ID e prioridade
.hookoff <id>       → Remove um hook pelo ID em tempo real
.reload             → Recarrega todos os comandos e hooks dos arquivos
```

### Endpoint da API (para automação)

```http
GET  /api/hooks                    → lista todos os hooks
POST /api/hooks/priority           → alterar prioridade
     Body: { "id": "meu-hook", "priority": 20 }
POST /api/hooks/remove             → remover hook
     Body: { "id": "meu-hook" }
```

---

## 7. Exemplos Práticos Completos

### 7.1 Anti-link avançado com whitelist

```js
// src/commands/owner/antilink.js
import { configDB, groupsDB } from '../../database.js'

export const hooks = [
  {
    id:         'antilink-grupos',
    name:       'Anti-Link Avançado',
    priority:   8,
    onlyGroups: true,

    handle: async ({ sock, msg, from, userId, texto, isGrupo, react }) => {
      // Verificar se o grupo tem antilink ativado
      const gdata = groupsDB.get(from, {})
      if (!gdata.antilink) return

      // Whitelist de domínios permitidos
      const whitelist = gdata.antilinkWhitelist || []

      // Detectar qualquer URL ou link do WhatsApp
      const linkRegex = /https?:\/\/[^\s]+|wa\.me\/|chat\.whatsapp\.com\//i
      if (!linkRegex.test(texto)) return

      // Verificar se está na whitelist
      const urlMatch = texto.match(/https?:\/\/([^\s/]+)/i)
      if (urlMatch && whitelist.some(d => urlMatch[1].includes(d))) return

      // Admin e dono passam
      const meta = await sock.groupMetadata(from).catch(() => null)
      const part = meta?.participants?.find(p => p.id === userId)
      if (part?.admin) return

      // Deletar mensagem e avisar
      await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
      await react('🚫')
      await sock.sendMessage(from, {
        text: `⚠️ @${userId.split('@')[0]}, links não são permitidos neste grupo!`,
        mentions: [userId]
      })
      return true  // bloquear qualquer processamento adicional
    }
  }
]

export default []
```

### 7.2 Logger de mensagens apagadas

```js
// src/commands/owner/delete_logger.js
export const hooks = [
  {
    id:         'logger-deletes',
    name:       'Logger de Mensagens Apagadas',
    priority:   70,
    onlyGroups: true,

    handle: async ({ sock, msg, from }) => {
      // Detectar protocol message de delete
      const proto = msg.message?.protocolMessage
      if (proto?.type !== 0) return // type 0 = REVOKE (apagar)

      const deletedKey = proto.key
      const author = deletedKey?.participant || deletedKey?.remoteJid

      // Notificar no grupo que mensagem foi apagada
      await sock.sendMessage(from, {
        text: `🗑️ @${author?.split('@')[0] || '???'} apagou uma mensagem.`,
        mentions: author ? [author] : []
      }).catch(() => {})

      // Não retorna true — continua o processamento
    }
  }
]

export default []
```

### 7.3 Sistema de pontos passivos (substituto do XP removido)

```js
// src/commands/fun/pontos.js
import JsonDB from '../../database.js'
const pontosDB = new JsonDB('pontos')

// Intervalo mínimo entre pontos (ms)
const COOLDOWN_PONTOS = 60 * 1000  // 1 minuto
const PONTOS_POR_MSG  = 5
const _cache = new Map()

export const hooks = [
  {
    id:         'pontos-passivos',
    name:       'Sistema de Pontos',
    priority:   80,
    onlyGroups: true,

    handle: async ({ userId, usuario, from, sock, msg }) => {
      const agora = Date.now()
      const key   = `${userId}:${from}`
      const ultimo = _cache.get(key) || 0

      if (agora - ultimo < COOLDOWN_PONTOS) return

      _cache.set(key, agora)
      const atual = pontosDB.get(userId, { pontos: 0, nome: usuario, msgs: 0 })
      const novoPontos = atual.pontos + PONTOS_POR_MSG
      pontosDB.set(userId, { ...atual, pontos: novoPontos, nome: usuario, msgs: atual.msgs + 1 })

      // Sem return true = deixa o processamento continuar
    }
  }
]

export const ranking = {
  name: 'ranking',
  description: 'Top 10 pontos do grupo',
  category: 'fun',
  cooldown: 10,
  async execute({ reply }) {
    const todos = Object.values(pontosDB.all())
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 10)

    if (!todos.length) return reply('Nenhum ponto registrado ainda!')

    const lista = todos.map((u, i) => `${i + 1}. ${u.nome}: *${u.pontos}* pts`).join('\n')
    await reply(`🏆 *Ranking de Pontos*\n\n${lista}`)
  }
}

export const meuspontos = {
  name: 'meuspontos',
  aliases: ['pts'],
  description: 'Ver seus pontos',
  category: 'fun',
  cooldown: 5,
  async execute({ reply, userId, usuario }) {
    const dados = pontosDB.get(userId, { pontos: 0 })
    await reply(`💎 ${usuario}, você tem *${dados.pontos}* pontos!`)
  }
}

export default [ranking, meuspontos]
```

### 7.4 Auto-resposta inteligente com IA

```js
// src/commands/owner/ai_resposta.js
import { handleAIResponse } from '../../ai.js'
import { automationsDB } from '../../database.js'

export const hooks = [
  {
    id:         'auto-ia-palavras',
    name:       'Auto-resposta IA por Palavra-chave',
    priority:   40,

    handle: async ({ sock, msg, from, userId, texto, reply }) => {
      const regras = automationsDB.get('auto_ia', [])
      if (!regras.length) return

      const textLower = texto.toLowerCase()
      const regra = regras.find(r => r.enabled && textLower.includes(r.keyword.toLowerCase()))
      if (!regra) return

      // Gerar resposta com IA baseada na instrução
      const prompt = `Responda de forma natural a esta mensagem seguindo a instrução: "${regra.response}"\nMensagem: "${texto}"`
      const resposta = await handleAIResponse(prompt, userId).catch(() => null)
      if (!resposta) return

      await sock.sendMessage(from, { text: resposta }, { quoted: msg })
      return true  // não processar mais nada
    }
  }
]

export default []
```

### 7.5 Moderação de palavrões com escalada

```js
// src/commands/owner/palavrao.js
import JsonDB from '../../database.js'
const warnDB = new JsonDB('avisos')

const PALAVROES = ['palavrão1', 'palavrão2'] // sua lista aqui
const MAX_AVISOS = 3

export const hooks = [
  {
    id:         'moderacao-palavrao',
    name:       'Moderação de Palavrões',
    priority:   12,
    onlyGroups: true,
    match:      null, // checaremos manualmente

    handle: async ({ sock, msg, from, userId, usuario, texto, react }) => {
      const textLower = texto.toLowerCase()
      if (!PALAVROES.some(p => textLower.includes(p))) return

      // Admin passa
      const meta = await sock.groupMetadata(from).catch(() => null)
      const part = meta?.participants?.find(p => p.id === userId)
      if (part?.admin) return

      // Apagar mensagem
      await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
      await react('🚫')

      // Escala de avisos
      const key    = `${from}:${userId}`
      const avisos = (warnDB.get(key, 0)) + 1
      warnDB.set(key, avisos)

      if (avisos >= MAX_AVISOS) {
        // Tentar remover do grupo
        warnDB.set(key, 0)
        await sock.groupParticipantsUpdate(from, [userId], 'remove').catch(async () => {
          await sock.sendMessage(from, {
            text: `⛔ @${usuario} removido por uso repetido de palavrões (${avisos} avisos).`,
            mentions: [userId]
          })
        })
        await sock.sendMessage(from, {
          text: `⛔ @${usuario} foi removido por uso repetido de palavrões.`,
          mentions: [userId]
        }).catch(() => {})
      } else {
        await sock.sendMessage(from, {
          text: `⚠️ @${usuario}, evite palavrões. Aviso ${avisos}/${MAX_AVISOS}.`,
          mentions: [userId]
        })
      }

      return true
    }
  }
]

export const resetavisos = {
  name:     'resetavisos',
  category: 'admin',
  usage:    '.resetavisos @usuario',
  description: 'Reseta os avisos de palavrão de um usuário',
  async execute({ from, args, membros, reply }) {
    const alvo = args[0]?.replace('@', '') + '@s.whatsapp.net'
    if (!alvo) return reply('Mencione um usuário.')
    warnDB.set(`${from}:${alvo}`, 0)
    await reply(`✅ Avisos de ${alvo.split('@')[0]} resetados.`)
  }
}

export default [resetavisos]
```

### 7.6 Hook dinâmico ativado por comando

```js
// src/commands/owner/modo_silencio.js
import { registerHook, removeHook } from '../../hooks.js'
import JsonDB from '../../database.js'
const silencioActive = new Map()

export default {
  name: 'silencio',
  aliases: ['mudo'],
  description: 'Ativa/desativa modo silêncio no grupo (bot apaga todas as mensagens)',
  category: 'admin',
  usage: '.silencio on/off',

  async execute({ from, args, reply, isAdmin, isOwner }) {
    if (!isAdmin && !isOwner) return reply('❌ Só admins podem usar isso.')

    const hookId = `silencio-${from}`

    if (args[0] === 'on') {
      if (silencioActive.has(from)) return reply('ℹ️ Modo silêncio já está ativo.')

      registerHook({
        id:         hookId,
        name:       `Silêncio: ${from.split('@')[0]}`,
        priority:   3,   // prioridade ALTA — roda antes de quase tudo
        onlyGroups: true,
        groups:     [from], // só neste grupo específico

        handle: async ({ sock, msg, userId }) => {
          // Não deletar mensagens de admins
          const meta = await sock.groupMetadata(from).catch(() => null)
          const part = meta?.participants?.find(p => p.id === userId)
          if (part?.admin) return

          await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
          return true  // bloquear tudo
        }
      })

      silencioActive.set(from, true)
      await reply('🔇 Modo silêncio ativado! Apenas admins podem falar.')

    } else if (args[0] === 'off') {
      removeHook(hookId)
      silencioActive.delete(from)
      await reply('🔊 Modo silêncio desativado!')

    } else {
      const status = silencioActive.has(from) ? 'Ativo 🔇' : 'Inativo 🔊'
      await reply(`ℹ️ Modo silêncio: ${status}\nUse \`.silencio on\` ou \`.silencio off\``)
    }
  }
}
```

---

## 8. Padrões Avançados

### 8.1 Hook com estado persistente

```js
// src/commands/owner/contador.js
import JsonDB from '../../database.js'
const contDB = new JsonDB('contagem')

export const hooks = [
  {
    id:       'contador-msgs',
    name:     'Contador de Mensagens por Grupo',
    priority: 90, // baixa prioridade — só loga
    onlyGroups: true,

    handle: async ({ from, userId }) => {
      const key = `${from}:total`
      contDB.set(key, (contDB.get(key, 0)) + 1)
      // Sem return = continua normalmente
    }
  }
]

export default []
```

### 8.2 Hook com filtro de horário

```js
export const hooks = [
  {
    id:       'aviso-horario',
    name:     'Aviso fora do horário',
    priority: 25,
    onlyGroups: true,
    groups:   ['120363xxx@g.us'],

    handle: async ({ sock, msg, from, userId, react }) => {
      const hora = new Date().getHours()
      const estaNorario = hora >= 8 && hora < 22  // 08:00 - 22:00

      if (estaNorario) return  // dentro do horário, normal

      // Verificar se é admin
      const meta = await sock.groupMetadata(from).catch(() => null)
      const part = meta?.participants?.find(p => p.id === userId)
      if (part?.admin) return

      await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
      await react('⏰')
      await sock.sendMessage(from, {
        text: `⏰ @${userId.split('@')[0]}, este grupo está em silêncio entre 22h e 8h.`,
        mentions: [userId]
      })
      return true
    }
  }
]
export default []
```

### 8.3 Hook que envia para webhook externo

```js
import { automationsDB } from '../../database.js'

export const hooks = [
  {
    id:       'webhook-broadcaster',
    name:     'Broadcast para Webhooks',
    priority: 85,

    handle: async ({ from, userId, usuario, texto, isGrupo, msg }) => {
      const webhooks = automationsDB.get('hooks', [])
        .filter(h => h.enabled)

      if (!webhooks.length) return

      const payload = {
        event:     'message',
        timestamp: Date.now(),
        from, userId, usuario, texto, isGrupo,
        msgId: msg.key?.id,
      }

      // Fire-and-forget para não bloquear o processamento
      Promise.allSettled(
        webhooks.map(w =>
          fetch(w.url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
            signal:  AbortSignal.timeout(5000),
          }).catch(() => {})
        )
      )

      // Sem return = continua normalmente
    }
  }
]
export default []
```

---

## 9. Erros Comuns e Como Evitar

### ❌ Erro 1: Hook sem ID único

```js
// ERRADO — ID baseado em variável mutável
hooks = [{ id: `hook-${Date.now()}`, ... }]
// Cada reload cria um ID diferente → duplicatas se acumulam

// CERTO — ID estático e único
hooks = [{ id: 'antilink-grupo-principal', ... }]
```

### ❌ Erro 2: `return true` acidental global

```js
// ERRADO — retorna true para TODA mensagem
handle: async ({ texto }) => {
  if (texto) {  // toda mensagem tem texto!
    await doSomething()
    return true  // bloqueia TUDO — nenhum comando funciona mais
  }
}

// CERTO — filtro específico
handle: async ({ texto }) => {
  if (!texto.includes('palavra-especifica')) return  // sai sem bloquear
  await doSomething()
  return true  // só bloqueia quando detectar a palavra
}
```

### ❌ Erro 3: Hook global sem filtro de performance

```js
// ERRADO — faz await pesado em TODA mensagem de TODOS os grupos
handle: async ({ sock, from }) => {
  const meta = await sock.groupMetadata(from)  // chamada de rede a cada msg!
  // ...
}

// CERTO — cache próprio
const _metaCache = new Map()
handle: async ({ sock, from }) => {
  if (!_metaCache.has(from) || Date.now() - _metaCache.get(from).ts > 60000) {
    const meta = await sock.groupMetadata(from).catch(() => null)
    _metaCache.set(from, { meta, ts: Date.now() })
  }
  const { meta } = _metaCache.get(from) || {}
  // ...
}
```

### ❌ Erro 4: Conflito de IDs ao recarregar

```js
// ERRADO — hooks com ID dinâmico baseado em from (JID do grupo)
// são re-registrados a cada loadCommands() duplicando
registerHook({ id: `bemvindo-${from}`, ... })  // dentro de execute()

// CERTO — registrar fora do execute, com ID estático
export const hooks = [{ id: 'bemvindo-todos', ... }]  // declarativo no módulo
```

### ❌ Erro 5: Tentar acessar isAdmin no hook

```js
// ERRADO — isAdmin não existe no ctx dos hooks
handle: async ({ isAdmin }) => {
  if (isAdmin) return  // isAdmin é undefined aqui!
}

// CERTO — buscar manualmente
handle: async ({ sock, from, userId }) => {
  const meta = await sock.groupMetadata(from).catch(() => null)
  const part = meta?.participants?.find(p => p.id === userId)
  const isAdmin = part?.admin === 'admin' || part?.admin === 'superadmin'
  if (isAdmin) return
}
```

### ❌ Erro 6: Atualizar prioridade com remove + re-add

```js
// ERRADO — remove e re-registra perde a função handle
removeHook('meu-hook')
registerHook({ id: 'meu-hook', priority: 20 })  // handle = undefined!

// CERTO — usar updateHookPriority
import { updateHookPriority } from '../../hooks.js'
updateHookPriority('meu-hook', 20)  // preserva o handle

// OU: usar o painel (sem código)
```

---

## 10. Referência Rápida

### Estrutura mínima de arquivo com hook + comando

```js
// src/commands/CATEGORIA/meu_arquivo.js
export const hooks = [
  {
    id:       'id-unico-estavel',
    name:     'Nome no Painel',
    priority: 50,

    handle: async (ctx) => {
      // lógica aqui
      // return true para bloquear, omitir para continuar
    }
  }
]

export default {
  name: 'meucomando',
  description: 'Descrição',
  category: 'fun',
  cooldown: 5,
  async execute(ctx) {
    await ctx.reply('Olá!')
  }
}
```

### Recarregar após mudanças

```bash
# Via WhatsApp:
.reload

# Via painel web:
# Sidebar → botão ↺ Recarregar

# Via API:
curl -X POST http://localhost:3000/api/reload -H "x-token: SUA_SENHA"
```

### Verificar hooks ativos

```bash
# Via WhatsApp:
.hooks

# Via painel:
# Comandos → Hooks & Prioridade

# Via API:
curl http://localhost:3000/api/hooks -H "x-token: SUA_SENHA"
```

### Remover hook em emergência

```bash
# Via WhatsApp (mais rápido):
.hookoff id-do-hook-problemático

# Via painel:
# Comandos → Hooks & Prioridade → Remover

# Via API:
curl -X POST http://localhost:3000/api/hooks/remove \
  -H "Content-Type: application/json" \
  -H "x-token: SUA_SENHA" \
  -d '{"id":"id-do-hook"}'
```

### Funções utilitárias do hooks.js

```js
import {
  registerHook,       // (hook) → boolean
  removeHook,         // (id) → boolean
  updateHookPriority, // (id, priority) → boolean — preserva handle
  listHooks,          // () → Hook[]
  hookCount,          // () → number
  onEvent,            // (event, id, handler) → void
  offEvent,           // (event, id) → void
  emitEvent,          // (event, data) → void
  EVENTS,             // { MESSAGE, COMMAND, GROUP_JOIN, GROUP_LEAVE, CONNECT, DISCONNECT }
} from '../../hooks.js'
```

---

## 📅 Roadmap de Features Futuras

### Planejadas

- **`EVENTS.RELOAD`** — emissão real quando `.reload` é executado (definido mas não emitido ainda)
- **Hooks persistentes no DB** — hooks criados pelo painel que sobrevivem ao reinício
- **Filtro por tipo de mídia** — `onlyText`, `onlyImage`, `onlyAudio` etc.
- **Hook com resposta template** — respostas com variáveis `{usuario}`, `{grupo}`, `{hora}`
- **Rate limiting por hook** — `maxPerMinute: 5` para evitar spam de notificações
- **Debug mode para hooks** — log detalhado de cada hook que é checado

### Como contribuir

Crie um arquivo em `src/commands/` seguindo os padrões deste guia e use `.reload` para testar.  
Se quiser compartilhar, use o sistema de contribuições do painel (Usuarios → Contribuições).

---

*Kaius Bot v32 — Documento atualizado e baseado no código real.*  
*Última revisão: v32 — inclui sistema de prioridade, Bang Panel e correções do painel web.*
