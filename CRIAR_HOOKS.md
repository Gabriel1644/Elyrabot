# 🔌 Kaius Bot — Guia Completo de Hooks e Comandos

## O que é um Hook?

Um **hook** intercepta mensagens e eventos do bot **sem tocar no handler.js**.
Você cria um arquivo `.js` na pasta `src/commands/` e ele é carregado automaticamente.

Diferença de um **comando**:
| | Comando | Hook |
|---|---|---|
| Ativado por | `.ping`, `.xp`, etc. | Qualquer mensagem / evento |
| Retorna resposta | Sim, diretamente | Opcional |
| Pode bloquear o comando | Não | Sim (`return true`) |
| Filtro por grupo | Manual | Nativo (`groups: ['jid']`) |

---

## 📦 Criar um Comando Básico

```js
// src/commands/fun/ola.js
export default {
  name: 'ola',
  aliases: ['hi', 'olá'],
  description: 'Diz olá',
  category: 'fun',
  cooldown: 5,
  usage: '.ola [@alguém]',

  async execute(ctx) {
    const { reply, usuario, args } = ctx
    await reply(`Olá, ${usuario}! 👋`)
  }
}
```

### Contexto disponível (`ctx`)

| Propriedade | Tipo | Descrição |
|---|---|---|
| `sock` | object | Client Baileys (acesso total ao WhatsApp) |
| `msg` | object | Mensagem completa do Baileys |
| `from` | string | JID do chat (grupo ou privado) |
| `userId` | string | JID do remetente |
| `usuario` | string | Nome de exibição do remetente |
| `isGrupo` | boolean | `true` se for grupo |
| `nomeGrupo` | string \| null | Nome do grupo atual |
| `membros` | array | Participantes do grupo |
| `args` | string[] | Argumentos do comando |
| `argStr` | string | Argumentos como string única |
| `texto` | string | Texto completo da mensagem |
| `prefix` | string | Prefixo configurado (ex: `.`) |
| `isAdmin` | boolean | Remetente é admin do grupo |
| `isOwner` | boolean | Remetente é dono do bot |
| `reply(text)` | function | Responde citando a mensagem |
| `sendText(jid, text)` | function | Envia para qualquer JID |
| `react(emoji)` | function | Reage à mensagem |
| `mention(jid, text)` | function | Menciona um usuário |
| `sendImage(url, caption)` | function | Envia imagem |
| `sendAudio(url)` | function | Envia áudio |
| `sendSticker(url)` | function | Envia figurinha |

### Exportar múltiplos comandos

```js
// src/commands/tools/utils.js
export const cmd1 = { name: 'cmd1', ... }
export const cmd2 = { name: 'cmd2', ... }

export default [cmd1, cmd2]
```

---

## 🔌 Criar um Hook de Mensagem

```js
// src/commands/owner/meu_hook.js

export const hooks = [
  {
    id:          'meu-hook-unico',   // ID único obrigatório
    name:        'Meu Hook',         // nome para o painel
    priority:    10,                 // menor = roda antes (padrão: 50)
    onlyGroups:  true,               // só em grupos
    onlyPrivate: false,              // só no privado (não combine com onlyGroups)
    groups:      [],                 // [] = todos os grupos | ['120363xxx@g.us'] = grupos específicos
    match:       'palavra-chave',    // só roda se o texto contiver isso (string ou RegExp)

    handle: async (ctx) => {
      const { sock, msg, from, userId, usuario, texto, isAdmin, reply, react } = ctx

      if (texto.includes('algo')) {
        await react('👀')
        await reply('Detectei!')
        return true   // ← true = PARA a propagação (comando não roda depois)
                      // ← undefined/false = CONTINUA (próximos hooks e comandos rodam)
      }
    }
  }
]

// Se tiver comandos também, exporte normalmente:
export default []
```

### Opções do Hook

| Opção | Tipo | Padrão | Descrição |
|---|---|---|---|
| `id` | string | **obrigatório** | ID único. Duplicata substitui o anterior. |
| `name` | string | id | Nome legível no painel e nos logs. |
| `priority` | number | 50 | Ordem de execução. Menor = roda primeiro. |
| `onlyGroups` | boolean | false | Só executa em grupos. |
| `onlyPrivate` | boolean | false | Só executa no privado. |
| `groups` | string[] | [] | JIDs específicos. Vazio = todos os grupos. |
| `match` | string \| RegExp | null | Filtro de texto. Hook só roda se bater. |
| `filter` | function(ctx) | null | Filtro avançado. Retorne `false` para pular. |
| `handle` | function(ctx) | **obrigatório** | Lógica do hook. |

---

## 📡 Sistema de Eventos

Para reagir a eventos do bot (entrar/sair de grupo, conectar, etc.):

```js
// src/commands/owner/meu_evento.js
import { onEvent, EVENTS } from '../../hooks.js'

// Roda quando alguém ENTRA em qualquer grupo
onEvent(EVENTS.GROUP_JOIN, 'bemvindo-geral', async ({ jid, groupJid, sock }) => {
  await sock.sendMessage(groupJid, {
    text: `👋 Bem-vindo(a) @${jid.split('@')[0]}!`,
    mentions: [jid]
  })
})

// Roda quando alguém SAI
onEvent(EVENTS.GROUP_LEAVE, 'adeus-geral', async ({ jid, groupJid, sock }) => {
  await sock.sendMessage(groupJid, {
    text: `😢 @${jid.split('@')[0]} saiu do grupo.`,
    mentions: [jid]
  })
})

// Roda quando o bot conecta ao WhatsApp
onEvent(EVENTS.CONNECT, 'startup-log', async ({ jid }) => {
  console.log('Bot conectado como', jid)
})

// Roda após cada comando ser executado
onEvent(EVENTS.COMMAND, 'cmd-logger', async ({ cmd, ctx }) => {
  console.log(`[CMD] .${cmd} usado por ${ctx.usuario}`)
})

export default []  // sem comandos neste arquivo
```

### Eventos disponíveis

| Evento | Constante | Dados recebidos |
|---|---|---|
| Mensagem | `EVENTS.MESSAGE` | ctx completo |
| Após comando | `EVENTS.COMMAND` | `{ cmd, ctx }` |
| Entrou no grupo | `EVENTS.GROUP_JOIN` | `{ jid, groupJid, sock }` |
| Saiu do grupo | `EVENTS.GROUP_LEAVE` | `{ jid, groupJid, sock }` |
| Bot conectou | `EVENTS.CONNECT` | `{ jid }` |
| Bot desconectou | `EVENTS.DISCONNECT` | `{}` |
| Cmds recarregados | `EVENTS.RELOAD` | `{}` |

---

## 🎯 Exemplos Prontos

### Hook com grupo específico

```js
// Só roda no grupo 120363XXXXXX@g.us
export const hooks = [{
  id: 'aviso-grupo-vip',
  name: 'Aviso Grupo VIP',
  priority: 20,
  onlyGroups: true,
  groups: ['120363XXXXXXXXX@g.us'],
  handle: async ({ texto, reply }) => {
    if (texto.toLowerCase() === 'regras') {
      await reply('📋 Regras do grupo:\n1. Sem spam\n2. Respeito mútuo')
      return true
    }
  }
}]
export default []
```

### Hook com regex

```js
export const hooks = [{
  id: 'detector-cpf',
  name: 'Detector de CPF',
  priority: 5,
  onlyGroups: true,
  match: /\d{3}\.\d{3}\.\d{3}-\d{2}/,  // regex de CPF
  handle: async ({ sock, msg, from, react }) => {
    await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
    await react('🚫')
    return true
  }
}]
export default []
```

### Comando que registra hooks dinamicamente

```js
// O hook é criado/removido via comando
export default {
  name: 'recordargrupo',
  category: 'owner',
  async execute({ from, args, reply }) {
    const { registerHook, removeHook } = await import('../../hooks.js')

    if (args[0] === 'on') {
      registerHook({
        id: `recorder-${from}`,
        name: 'Gravador de mensagens',
        groups: [from],
        handle: async ({ texto, userId }) => {
          console.log(`${userId}: ${texto}`)
        }
      })
      return reply('✅ Gravando mensagens deste grupo')
    }

    removeHook(`recorder-${from}`)
    reply('🔕 Gravação desativada')
  }
}
```

---

## 🛠️ Comandos de Gerenciamento

| Comando | Descrição |
|---|---|
| `.hooks` | Lista todos os hooks ativos com ID e prioridade |
| `.hookoff <id>` | Remove um hook pelo ID |
| `.antipalavrao on/off/add/lista` | Moderação de palavrões |
| `.autoreact on <emoji> <palavra>` | Auto-reação por palavra-chave |
| `.antispam on [msgs] [seg]` | Anti-flood por grupo |
| `.reload` | Recarrega todos os comandos e hooks |

---

## 📂 Estrutura de Pasta

```
src/commands/
├── core/          → comandos principais (.menu, .ping, .ia)
├── fun/           → entretenimento (.xp, .ranking, jogos)
├── info/          → informações (.clima, .wiki)
├── media/         → mídia (.fig, .play, .yt)
├── admin/         → moderação (.ban, .kick, .mute)
├── owner/         → dono do bot
│   ├── exemplo_hooks.js   ← exemplos de hooks
│   ├── antipalavrao.js    ← hook de moderação
│   ├── autoreact.js       ← reação automática
│   ├── antispam.js        ← anti-flood
│   └── hooks_cmd.js       ← .hooks e .hookoff
└── misc/          → outros
```

Crie sua pasta se quiser organizar melhor. O loader carrega **qualquer subpasta**.

---

## ⚡ Fluxo de Execução

```
Mensagem chega
    ↓
runHooks() — hooks em ordem de prioridade
    ↓ (se algum retornar true, para aqui)
Verifica prefixo (.comando)
    ↓
Verifica permissão do usuário
    ↓
Executa cmd.execute(ctx)
    ↓
emitEvent(EVENTS.COMMAND)
```

---

*Kaius Bot — feito com 💚*
