# 🤖 CRIAR COMANDOS — Guia Completo do Kaius Bot

> **Stack:** Node.js 18+ | ES Modules | @whiskeysockets/baileys | Termux/Linux  
> **Prefixo padrão:** `.` (configurável no .env)  
> **Recarregar sem reiniciar:** `.reload` no WhatsApp ou painel → Comandos → Reload

---

## 📚 Índice

1. [Como o Bot Funciona (Visão Geral)](#1-como-o-bot-funciona-visão-geral)
2. [Estrutura de Arquivos](#2-estrutura-de-arquivos)
3. [Anatomia Completa de um Comando](#3-anatomia-completa-de-um-comando)
4. [O ctx — Todos os Parâmetros Explicados](#4-o-ctx--todos-os-parâmetros-explicados)
5. [Seu Primeiro Comando (Passo a Passo)](#5-seu-primeiro-comando-passo-a-passo)
6. [Enviando Todos os Tipos de Mensagem](#6-enviando-todos-os-tipos-de-mensagem)
7. [Argumentos e Parsing de Texto](#7-argumentos-e-parsing-de-texto)
8. [Sistema de Permissões](#8-sistema-de-permissões)
9. [Cooldown e Anti-Spam](#9-cooldown-e-anti-spam)
10. [Banco de Dados (JsonDB)](#10-banco-de-dados-jsondb)
11. [Mídias — Baixar, Processar e Enviar](#11-mídias--baixar-processar-e-enviar)
12. [Comandos de Administração de Grupo](#12-comandos-de-administração-de-grupo)
13. [APIs Externas e HTTP](#13-apis-externas-e-http)
14. [Integração com IA (Groq)](#14-integração-com-ia-groq)
15. [Formatação Visual no WhatsApp](#15-formatação-visual-no-whatsapp)
16. [Padrões Avançados](#16-padrões-avançados)
17. [Instalação de Dependências](#17-instalação-de-dependências)
18. [Criando via Painel Web e IA](#18-criando-via-painel-web-e-ia)
19. [Depuração e Testes](#19-depuração-e-testes)
20. [30+ Exemplos de Comandos Completos](#20-30-exemplos-de-comandos-completos)
21. [Erros Comuns e Soluções](#21-erros-comuns-e-soluções)
22. [Cheat Sheet — Referência Rápida](#22-cheat-sheet--referência-rápida)

---

## 1. Como o Bot Funciona (Visão Geral)

Quando alguém manda uma mensagem no WhatsApp:

```
┌─────────────────────────────────────────────────────────┐
│  Usuário envia: ".clima São Paulo"                       │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  handler.js recebe a mensagem                           │
│  1. É um grupo com restrição? → ignora se não permitido │
│  2. Usuário está banido? → ignora                       │
│  3. É uma automação? → responde automaticamente         │
│  4. Tem o prefixo "."? → sim, é um comando              │
│  5. Extrai: cmdNome = "clima", args = ["São Paulo"]     │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  loader.js procura o comando "clima"                    │
│  Encontra em src/commands/info/clima.js                 │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Verifica permissão do usuário                          │
│  Verifica cooldown (ex: 8 segundos)                     │
│  Monta o ctx com todos os dados                         │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  cmd.execute(ctx) é chamado                             │
│  O seu código roda aqui!                                │
│  Resultado: bot envia "🌡️ São Paulo: 28°C"             │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de carregamento de comandos

```
npm start
   └─ index.js
       └─ loadCommands()        ← loader.js
           └─ Varre src/commands/
               ├─ core/menu.js  → registra: menu, menubn, menugold...
               ├─ fun/fun.js    → registra: dado, moeda, oito...
               ├─ info/clima.js → registra: clima
               └─ SEU_ARQUIVO.js → registra: seucomando ← aqui!
```

---

## 2. Estrutura de Arquivos

```
bot/
├── .env                        ← Configurações (prefixo, owner, groq, etc.)
├── index.js                    ← Ponto de entrada do bot
├── package.json
│
├── src/
│   ├── commands/               ← SEUS COMANDOS FICAM AQUI
│   │   ├── core/               → Núcleo (menus, ping, info, ia...)
│   │   ├── fun/                → Diversão (dado, piada, social...)
│   │   ├── rpg/                → RPG (ficha, minerar, caçar...)
│   │   ├── media/              → Mídia (fig, youtube, pinterest...)
│   │   ├── info/               → Informação (clima, traduzir, cep...)
│   │   ├── admin/              → Admin de grupo (kick, tagall...)
│   │   └── owner/              → Dono do bot (subdono, bangp...)
│   │
│   ├── handler.js              ← Roteador de mensagens
│   ├── loader.js               ← Carrega todos os comandos
│   ├── database.js             ← Banco de dados JSON
│   ├── config.js               ← Configurações do CONFIG
│   ├── permissions.js          ← Sistema de cargos
│   ├── logger.js               ← Logs e Socket.IO
│   ├── ai.js                   ← Integração Groq/IA
│   └── utils.js                ← Funções auxiliares
│
├── data/                       ← Banco de dados persistente (JSON)
│   ├── config.json
│   ├── groups.json
│   ├── users.json
│   └── ...
│
├── midias/                     ← Fotos/vídeos dos menus
│   └── menu.jpg
│
└── public/                     ← Painel web (dashboard)
    └── index.html
```

### Onde criar seu arquivo

Escolha a pasta pelo tipo de comando:

| Pasta | Use para |
|-------|----------|
| `fun/` | Diversão, jogos, brincadeiras, interações sociais |
| `info/` | Consultas, dados, APIs públicas |
| `media/` | Figurinhas, downloads, vídeo, áudio |
| `admin/` | Comandos de moderação de grupo |
| `owner/` | Controle do bot (só dono/subdono) |
| `rpg/` | Sistema de RPG e economia |

**Você pode criar quantas pastas novas quiser** — o loader carrega tudo automaticamente.

---

## 3. Anatomia Completa de um Comando

```javascript
// src/commands/fun/meucomando.js

// ── Imports opcionais ─────────────────────────────────────
import axios from 'axios'
import JsonDB from '../../database.js'
import { CONFIG } from '../../config.js'

// ── Banco de dados local (opcional) ──────────────────────
const db = new JsonDB('meucomando')  // salvo em data/meucomando.json

// ── O comando ─────────────────────────────────────────────
export default {
  // ── Obrigatórios ────────────────────────────────────────
  name: 'meucomando',   // Nome sem prefixo. Deve ser único no bot.
                        // Será usado como: .meucomando

  // ── Recomendados ────────────────────────────────────────
  aliases: [            // Atalhos alternativos (podem ser acentuados, com emoji etc.)
    'mc',
    'meucmd',
    'minhacoisа'
  ],
  description: 'Descrição curta do que o comando faz',
  category: 'fun',      // Define em qual menu aparece e quem pode usar
  usage: '.meucomando <argumento> [opcional]',
  cooldown: 5,          // Segundos entre usos por usuário (0 = sem limite)

  // ── Função principal ─────────────────────────────────────
  async execute(ctx) {
    // ctx contém TUDO que você precisa
    // Veja a seção 4 para lista completa
    const { reply, argStr, usuario } = ctx
    await reply(`Olá, ${usuario}! Você disse: ${argStr}`)
  }
}
```

### Múltiplos comandos no mesmo arquivo

```javascript
// src/commands/fun/jogos.js

export const dado = {
  name: 'dado',
  category: 'fun',
  cooldown: 2,
  async execute({ reply }) {
    const n = Math.floor(Math.random() * 6) + 1
    await reply(`🎲 Você tirou: *${n}*`)
  }
}

export const moeda = {
  name: 'moeda',
  category: 'fun',
  cooldown: 2,
  async execute({ reply }) {
    await reply(Math.random() < 0.5 ? '🪙 CARA!' : '🪙 COROA!')
  }
}

export const roleta = {
  name: 'roleta',
  category: 'fun',
  cooldown: 5,
  async execute({ reply, membros }) {
    if (!membros?.length) return reply('Use em grupos!')
    const sorteado = membros[Math.floor(Math.random() * membros.length)]
    await reply(`🎯 A roleta parou em: @${sorteado.id.split('@')[0]}`)
  }
}

// Exporta todos em um array — o loader aceita isso
export default [dado, moeda, roleta]
```

---

## 4. O ctx — Todos os Parâmetros Explicados

O `ctx` (contexto) é tudo que seu comando recebe. Você pode desestruturar o que precisar:

```javascript
async execute({
  // ════ CONEXÃO ═══════════════════════════════════════════
  sock,
  // A conexão Baileys completa. Use para operações avançadas.
  // Ex: sock.sendMessage(), sock.groupMetadata(), etc.

  msg,
  // O objeto completo da mensagem recebida do WhatsApp.
  // Contém msg.key, msg.message, msg.pushName, msg.messageTimestamp...

  // ════ IDENTIFICAÇÃO ══════════════════════════════════════
  from,
  // JID do chat onde a mensagem veio.
  // Grupo: "5511999999999-1234567890@g.us"
  // Privado: "5511999999999@s.whatsapp.net"

  userId,
  // JID do usuário que enviou a mensagem.
  // Sempre o remetente (mesmo em grupos).
  // Ex: "5511999999999@s.whatsapp.net"

  usuario,
  // Nome/apelido do usuário (msg.pushName).
  // O nome que aparece no WhatsApp da pessoa.
  // Ex: "João Silva"

  botJid,
  // JID do próprio bot.
  // Útil para filtrar o bot de listas de membros.

  // ════ TEXTO E ARGUMENTOS ═════════════════════════════════
  texto,
  // Texto COMPLETO da mensagem, incluindo o prefixo e comando.
  // Ex: ".clima São Paulo"

  prefix,
  // Prefixo configurado para este grupo (ou global).
  // Ex: "." ou "!" dependendo da configuração.

  args,
  // Array com as palavras APÓS o nome do comando.
  // ".clima São Paulo" → args = ["São", "Paulo"]
  // ".dado 2d20" → args = ["2d20"]
  // ".calcular 10 + 5" → args = ["10", "+", "5"]

  argStr,
  // String COMPLETA após o comando (preserva espaços).
  // ".clima São Paulo" → argStr = "São Paulo"
  // ".frase Olá, tudo bem?" → argStr = "Olá, tudo bem?"

  // ════ FUNÇÕES RÁPIDAS ════════════════════════════════════
  reply,
  // Envia texto como RESPOSTA à mensagem do usuário.
  // Cria aquela citação azul no WhatsApp.
  // await reply("Olá!")

  sendText,
  // Envia texto SEM ser uma resposta (vai solto no chat).
  // await sendText("Mensagem solta")

  sendImage,
  // Envia imagem com legenda opcional.
  // await sendImage("https://url.jpg", "Legenda aqui")
  // await sendImage("https://url.jpg")  ← sem legenda

  sendAudio,
  // Envia áudio como mensagem de voz (PTT).
  // await sendAudio("https://url.mp3")

  sendSticker,
  // Envia figurinha a partir de um Buffer.
  // await sendSticker(buffer)

  react,
  // Coloca um emoji de reação na mensagem do usuário.
  // await react("✅")  → aparece como reação
  // await react("⏳")  → boa para indicar carregamento

  mention,
  // Envia texto mencionando usuários (aparecem em azul).
  // await mention(["jid1", "jid2"], "Olá @jid1 e @jid2!")

  // ════ INFORMAÇÕES DO CHAT ═════════════════════════════════
  isGrupo,
  // Boolean: true se a mensagem veio de um grupo.
  // false se veio de uma conversa privada.

  tipo,
  // String: "GRUPO" ou "PRIVADO"

  nomeGrupo,
  // Nome do grupo (se isGrupo = true).
  // null em conversas privadas.

  membros,
  // Array com todos os participantes do grupo.
  // Cada item: { id: "jid", admin: "admin"|"superadmin"|null }
  // null se não for grupo.

  gdata,
  // Dados do grupo no banco de dados (groupsDB.get(from, {})).
  // Contém configurações salvas: antilink, bemvindo, prefix, etc.

  // ════ PERMISSÕES ══════════════════════════════════════════
  isOwner,
  // Boolean: true se o usuário é o DONO do bot (OWNER_NUMBER do .env).

  isSubdono,
  // Boolean: true se o usuário é SUB-DONO (adicionado via !subdono).

  isAdmin,
  // Boolean: true se o usuário é ADMIN do grupo atual.
  // Sempre false em conversas privadas.

  userRole,
  // Número do cargo: 1=Dono, 2=Sub-Dono, 3=Admin, 4=VIP, 5=Usuário, 99=Banido
  // Quanto MENOR o número, MAIS privilegiado.

}) { /* seu código aqui */ }
```

### Acessando a mensagem citada (quoted)

Quando o usuário *responde* a outra mensagem:

```javascript
async execute({ msg, reply }) {
  const inner = msg.message

  // Contexto da mensagem citada
  const ctx = inner?.extendedTextMessage?.contextInfo

  // A mensagem citada em si
  const quoted = ctx?.quotedMessage

  if (!quoted) return reply('❌ Responda a uma mensagem!')

  // Textos possíveis da mensagem citada
  const textoQuoted =
    quoted.conversation                          ||  // mensagem de texto simples
    quoted.extendedTextMessage?.text             ||  // mensagem longa/formatada
    quoted.imageMessage?.caption                 ||  // legenda de imagem
    quoted.videoMessage?.caption                 ||  // legenda de vídeo
    ''

  // JID de quem enviou a mensagem citada
  const remetenteQuoted = ctx?.participant || ctx?.remoteJid

  // Nome de quem enviou
  const nomeQuoted = ctx?.pushName || 'Desconhecido'

  await reply(
    `📋 Mensagem de *${nomeQuoted}*:\n` +
    `"${textoQuoted}"`
  )
}
```

### Acessando menções (@mentions)

```javascript
async execute({ msg, reply, membros }) {
  // JIDs de quem foi mencionado na mensagem
  const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

  if (!mencionados.length) return reply('❌ Mencione alguém!')

  const nomes = mencionados
    .map(jid => `+${jid.split('@')[0]}`)
    .join(', ')

  await reply(`Você mencionou: ${nomes}`)
}
```

---

## 5. Seu Primeiro Comando (Passo a Passo)

### Passo 1 — Criar o arquivo

```bash
# No Termux, dentro da pasta do bot:
nano src/commands/fun/oi.js
```

### Passo 2 — Escrever o código

```javascript
// src/commands/fun/oi.js
export default {
  name: 'oi',
  aliases: ['olá', 'ola', 'hi', 'hello', 'eai', 'e aí'],
  description: 'Cumprimenta o usuário com carinho',
  category: 'fun',
  usage: '.oi',
  cooldown: 10,

  async execute({ reply, usuario, isGrupo, nomeGrupo }) {
    const saudacao = isGrupo
      ? `Oiê, *${usuario}*! 👋 Bem-vindo ao *${nomeGrupo}*!`
      : `Oiê, *${usuario}*! 👋 Como posso te ajudar?`

    await reply(saudacao)
  }
}
```

### Passo 3 — Recarregar sem reiniciar

No WhatsApp, mande:
```
.reload
```

Ou no painel web → Comandos → Reload.

### Passo 4 — Testar

Mande `.oi` no WhatsApp. Se aparecer a saudação, funcionou!

### Passo 5 — Se não funcionar

Cheque o terminal do Termux. Vai aparecer algo como:
```
⚠ Erro ao carregar oi.js: SyntaxError: Unexpected token '}'
```

Corrija o erro e recarregue.

---

## 6. Enviando Todos os Tipos de Mensagem

### 6.1 — Texto simples

```javascript
// Resposta direta (com citação em azul)
await reply('Olá!')
await reply(`Olá, *${usuario}*! Você tem _${pontos}_ pontos.`)

// Mensagem solta (sem citação)
await sendText('Mensagem sem citação')

// Direto pelo sock
await sock.sendMessage(from, { text: 'Mensagem direta' })
await sock.sendMessage(from, { text: 'Com citação' }, { quoted: msg })
```

### 6.2 — Imagem

```javascript
// Por URL (mais comum)
await sock.sendMessage(from, {
  image: { url: 'https://picsum.photos/800/600' },
  caption: '*Imagem aleatória!*\n_Fonte: Lorem Picsum_'
}, { quoted: msg })

// Por buffer (arquivo local ou baixado)
import fs from 'fs'
const buf = fs.readFileSync('./midias/menu.jpg')
await sock.sendMessage(from, {
  image: buf,
  caption: 'Foto do menu!'
}, { quoted: msg })

// Helper rápido (sem citação)
await sendImage('https://url.com/foto.jpg', 'Legenda aqui')
```

### 6.3 — Vídeo

```javascript
// Vídeo normal
await sock.sendMessage(from, {
  video: { url: 'https://url.com/video.mp4' },
  caption: 'Meu vídeo'
}, { quoted: msg })

// GIF animado (gifPlayback: true)
await sock.sendMessage(from, {
  video: { url: 'https://url.com/animacao.gif' },
  gifPlayback: true,
  mimetype: 'video/mp4',
}, { quoted: msg })
```

### 6.4 — Áudio

```javascript
// Mensagem de voz (onda azul, como PTT)
await sock.sendMessage(from, {
  audio: { url: 'https://url.com/voz.ogg' },
  mimetype: 'audio/ogg; codecs=opus',
  ptt: true
}, { quoted: msg })

// Música/áudio normal (ícone de nota musical)
await sock.sendMessage(from, {
  audio: { url: 'https://url.com/musica.mp3' },
  mimetype: 'audio/mpeg',
  ptt: false
}, { quoted: msg })

// Helper rápido (sempre PTT)
await sendAudio('https://url.com/audio.mp3')
```

### 6.5 — Figurinha (Sticker)

```javascript
// A partir de um buffer WebP
await sock.sendMessage(from, {
  sticker: buffer
}, { quoted: msg })

// A partir de um arquivo local
import fs from 'fs'
const stickerBuf = fs.readFileSync('./midias/figurinha.webp')
await sock.sendMessage(from, { sticker: stickerBuf }, { quoted: msg })

// Helper rápido
await sendSticker(buffer)
```

### 6.6 — Documento/Arquivo

```javascript
await sock.sendMessage(from, {
  document: { url: 'https://url.com/arquivo.pdf' },
  mimetype: 'application/pdf',
  fileName: 'relatorio.pdf',
  caption: 'Aqui está seu arquivo!'
}, { quoted: msg })

// Outros mimetypes comuns:
// 'application/zip'    → .zip
// 'text/plain'         → .txt
// 'application/json'   → .json
// 'audio/mpeg'         → .mp3 como arquivo
```

### 6.7 — Localização

```javascript
await sock.sendMessage(from, {
  location: {
    degreesLatitude: -23.5505,   // São Paulo
    degreesLongitude: -46.6333,
    name: 'São Paulo, SP',
    address: 'Brasil'
  }
}, { quoted: msg })
```

### 6.8 — Reação (Emoji na mensagem)

```javascript
// Reage na mensagem que o usuário enviou
await react('⏳')   // aguardando
await react('✅')   // sucesso
await react('❌')   // erro
await react('🔥')   // qualquer emoji

// Ou diretamente:
await sock.sendMessage(from, {
  react: {
    text: '✅',     // emoji
    key: msg.key    // chave da mensagem original
  }
})
```

### 6.9 — Mencionar usuários

```javascript
// Mencionar um usuário
await sock.sendMessage(from, {
  text: `Olá @${userId.split('@')[0]}!`,
  mentions: [userId]
}, { quoted: msg })

// Mencionar múltiplos (ex: todos do grupo)
const jids = membros.map(m => m.id)
const texto = jids.map(j => `@${j.split('@')[0]}`).join(' ')
await sock.sendMessage(from, {
  text: `📢 Atenção a todos!\n${texto}`,
  mentions: jids
}, { quoted: msg })

// Helper
await mention([jid1, jid2], `Olá @${jid1.split('@')[0]}!`)
```

### 6.10 — Mensagem com link de preview

```javascript
// O WhatsApp gera preview automático de URLs
// Mas você pode forçar um preview customizado:
await sock.sendMessage(from, {
  text: 'Confira: https://github.com/Gabriel1644/Elyrabot',
  // O WhatsApp vai gerar o preview do link automaticamente
})
```

### 6.11 — Mandar mensagem para outro chat/privado

```javascript
// Mandar DM para um número específico
const numeroJid = '5511999999999@s.whatsapp.net'
await sock.sendMessage(numeroJid, { text: 'Oi! Mensagem privada.' })

// Mandar para o dono do bot
const donoJid = `${CONFIG.owner}@s.whatsapp.net`
await sock.sendMessage(donoJid, { text: `Alerta: ${usuario} usou o comando!` })
```

---

## 7. Argumentos e Parsing de Texto

### 7.1 — Básico

```javascript
// ".calcular 10 + 5"
async execute({ args, argStr, prefix, reply }) {
  console.log(args)    // ["10", "+", "5"]
  console.log(argStr)  // "10 + 5"
  console.log(args[0]) // "10"
  console.log(args[1]) // "+"
  console.log(args[2]) // "5"

  if (!argStr) {
    return reply(`❌ Uso: ${prefix}calcular <expressão>`)
  }
}
```

### 7.2 — Números e validação

```javascript
async execute({ args, reply }) {
  // Converter para número
  const n = parseInt(args[0])
  const f = parseFloat(args[0])

  // Validar
  if (isNaN(n)) return reply('❌ Informe um número válido!')
  if (n < 1 || n > 100) return reply('❌ Número deve ser entre 1 e 100!')
  if (!Number.isInteger(f)) return reply('❌ Informe um número inteiro!')
}
```

### 7.3 — Argumentos opcionais com padrão

```javascript
// ".dado" → 1 dado de 6 lados
// ".dado 3" → 3 dados de 6 lados
// ".dado 3 20" → 3 dados de 20 lados
async execute({ args, reply }) {
  const quantidade = parseInt(args[0]) || 1   // padrão: 1
  const lados      = parseInt(args[1]) || 6   // padrão: 6

  if (quantidade > 20) return reply('❌ Máximo 20 dados!')
  if (lados > 1000) return reply('❌ Máximo d1000!')
}
```

### 7.4 — Sub-comandos

```javascript
// ".config on" | ".config off" | ".config status" | ".config definir <valor>"
async execute({ args, argStr, reply, prefix }) {
  const sub   = args[0]?.toLowerCase()
  const valor = args.slice(1).join(' ')

  switch (sub) {
    case 'on':
      return reply('✅ Ativado!')

    case 'off':
      return reply('✅ Desativado!')

    case 'status':
      return reply('📊 Status atual...')

    case 'definir':
    case 'set':
      if (!valor) return reply('❌ Informe o valor!')
      return reply(`✅ Definido para: ${valor}`)

    case 'ajuda':
    case 'help':
    case undefined:
      return reply(
        `📖 *Ajuda — ${prefix}config*\n\n` +
        `• ${prefix}config on — ativa\n` +
        `• ${prefix}config off — desativa\n` +
        `• ${prefix}config status — ver status\n` +
        `• ${prefix}config definir <valor> — definir valor`
      )

    default:
      return reply(`❌ Sub-comando "${sub}" desconhecido.\nUse ${prefix}config ajuda.`)
  }
}
```

### 7.5 — Separar por símbolo

```javascript
// ".escolher pizza | sushi | hambúrguer"
async execute({ argStr, reply }) {
  const opcoes = argStr
    .split(/[|,\/]/)          // divide por | , ou /
    .map(s => s.trim())       // remove espaços extras
    .filter(Boolean)          // remove vazios

  if (opcoes.length < 2) return reply('❌ Dê pelo menos 2 opções!\nEx: .escolher pizza | sushi')

  const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)]
  await reply(`🎯 Escolhi: *${escolhida}*`)
}
```

### 7.6 — Extrair número de telefone

```javascript
async execute({ args, reply }) {
  // Suporta: "11999999999", "5511999999999", "+5511999999999", "011999999999"
  let num = (args[0] || '').replace(/\D/g, '')  // remove não-dígitos

  if (!num || num.length < 8) return reply('❌ Número inválido!')

  // Garante DDI 55 (Brasil)
  if (num.length <= 11 && !num.startsWith('55')) num = '55' + num
  // Remove 0 inicial (011... → 11...)
  if (num.startsWith('550')) num = '55' + num.slice(3)

  const jid = num + '@s.whatsapp.net'
  await reply(`📱 JID: \`${jid}\``)
}
```

### 7.7 — Extrair URL do texto

```javascript
async execute({ argStr, reply }) {
  // Detecta URL em qualquer posição no texto
  const urlRegex = /https?:\/\/[^\s]+/gi
  const urls = argStr.match(urlRegex)

  if (!urls?.length) return reply('❌ Nenhuma URL encontrada!')

  const url = urls[0]  // Primeira URL encontrada
  await reply(`🔗 URL detectada: ${url}`)
}
```

### 7.8 — Parsing avançado (key=value)

```javascript
// ".configurar nome=João cor=azul tamanho=grande"
async execute({ argStr, reply }) {
  const params = {}
  argStr.split(/\s+/).forEach(part => {
    const [key, ...vals] = part.split('=')
    if (key && vals.length) params[key] = vals.join('=')
  })

  const nome    = params.nome    || 'Anônimo'
  const cor     = params.cor     || 'padrão'
  const tamanho = params.tamanho || 'médio'

  await reply(`Nome: ${nome}\nCor: ${cor}\nTamanho: ${tamanho}`)
}
```

---

## 8. Sistema de Permissões

### Hierarquia de cargos

```
1 — 👑 DONO       (OWNER_NUMBER no .env)
2 — 🌟 SUB-DONO   (!subdono adicionar)
3 — ⭐ ADMIN       (admin do grupo WhatsApp)
4 — 💎 VIP        (!subdono adicionar num 4)
5 — 👤 USUÁRIO    (qualquer pessoa)
99 — 🚫 BANIDO    (!banir)
```

**Regra:** Quanto MENOR o número, MAIS privilegiado.

### Verificações no comando

```javascript
async execute({ reply, isOwner, isSubdono, isAdmin, userRole }) {
  // === Verificações individuais ===

  // Só o dono
  if (!isOwner) return reply('❌ Apenas o dono pode usar isto.')

  // Dono ou sub-dono
  if (!isOwner && !isSubdono) return reply('❌ Apenas dono/sub-dono.')

  // Dono, sub-dono ou admin do grupo
  if (!isOwner && !isSubdono && !isAdmin) return reply('❌ Apenas admins e acima.')

  // Verificar cargo específico via número
  // userRole: 1=dono, 2=subdono, 3=admin, 4=vip, 5=usuário, 99=banido
  if (userRole > 4) return reply('❌ Apenas VIPs e acima!')
  if (userRole === 99) return reply('🚫 Você está banido.')
}
```

### Verificando cargo manualmente

```javascript
import { getRole, hasPermission, ROLES, ROLE_NAMES } from '../../permissions.js'

async execute({ userId, reply }) {
  const cargo = getRole(userId)
  const nomeC = ROLE_NAMES[cargo]  // "👑 Dono", "🌟 Sub-dono" etc.

  // hasPermission(userId, minRole) — true se o usuário tem pelo menos aquele cargo
  if (!hasPermission(userId, ROLES.VIP)) {
    return reply(`❌ Você precisa ser pelo menos VIP!\nSeu cargo: ${nomeC}`)
  }
}
```

### Permissão por contexto (grupo vs privado)

```javascript
async execute({ isGrupo, reply }) {
  // Apenas grupos
  if (!isGrupo) return reply('❌ Este comando só funciona em grupos!')

  // Apenas privado
  if (isGrupo) return reply('❌ Me mande mensagem privada para usar este comando!')
}
```

### Verificar se o bot é admin no grupo

```javascript
async execute({ sock, from, reply, isGrupo }) {
  if (!isGrupo) return reply('❌ Use em grupos!')

  const meta = await sock.groupMetadata(from)
  const botNum = sock.user?.id?.split(':')[0]?.split('@')[0]

  const botNoGrupo = meta.participants.find(p => {
    const pNum = p.id.split('@')[0].split(':')[0]
    return pNum === botNum
  })

  if (!botNoGrupo || !['admin','superadmin'].includes(botNoGrupo.admin)) {
    return reply('❌ Preciso ser *admin do grupo* para fazer isso!')
  }

  // Bot é admin, pode executar a ação
}
```

---

## 9. Cooldown e Anti-Spam

### Cooldown automático (padrão)

O bot gerencia o cooldown automaticamente. Só defina o campo no comando:

```javascript
export default {
  name: 'pesado',
  cooldown: 30,   // 30 segundos entre usos por usuário
  async execute({ reply }) {
    await reply('Executado!')
  }
}
```

**Quem ignora cooldown automático:**
- Dono (cargo 1)
- Sub-dono (cargo 2)

### Cooldown manual (dentro do comando)

Útil quando você quer cooldowns diferentes por tipo de ação ou globais (por grupo):

```javascript
import { cooldownDB } from '../../database.js'

async execute({ userId, from, reply }) {
  // Cooldown por usuário
  const keyUser = `minhafunc:user:${userId}`
  const lastUser = cooldownDB.get(keyUser, 0)
  const espera = 60_000  // 60 segundos

  if (Date.now() - lastUser < espera) {
    const falta = Math.ceil((espera - (Date.now() - lastUser)) / 1000)
    return reply(`⏳ Aguarde *${falta}s* para usar novamente.`)
  }

  // Cooldown global (por grupo inteiro)
  const keyGrupo = `minhafunc:grupo:${from}`
  const lastGrupo = cooldownDB.get(keyGrupo, 0)
  const esperaGrupo = 10_000  // 10 segundos entre qualquer uso no grupo

  if (Date.now() - lastGrupo < esperaGrupo) {
    return reply('⏳ Aguarde um momento...')
  }

  // Registra o uso
  cooldownDB.set(keyUser, Date.now())
  cooldownDB.set(keyGrupo, Date.now())

  await reply('✅ Executado!')
}
```

### Limitar número de usos por dia

```javascript
import { cooldownDB } from '../../database.js'

function getUsosHoje(userId, cmdName) {
  const hoje = new Date().toDateString()  // "Wed Jan 01 2025"
  const key = `${cmdName}:${userId}:${hoje}`
  return cooldownDB.get(key, 0)
}

function addUsoHoje(userId, cmdName) {
  const hoje = new Date().toDateString()
  const key = `${cmdName}:${userId}:${hoje}`
  cooldownDB.set(key, getUsosHoje(userId, cmdName) + 1)
}

async execute({ userId, reply }) {
  const MAX_USOS = 5
  const usos = getUsosHoje(userId, 'meucomando')

  if (usos >= MAX_USOS) {
    return reply(`❌ Você já usou este comando *${MAX_USOS}x hoje*!\nVolte amanhã.`)
  }

  addUsoHoje(userId, 'meucomando')
  await reply(`✅ Executado! (${usos + 1}/${MAX_USOS} usos hoje)`)
}
```

---

## 10. Banco de Dados (JsonDB)

### O que é e como funciona

O `JsonDB` é um banco de dados simples que salva tudo em arquivos `.json` na pasta `data/`. É persistente — os dados ficam mesmo depois de reiniciar o bot.

```javascript
import JsonDB from '../../database.js'

// Cria ou abre o banco (arquivo: data/meubanco.json)
const db = new JsonDB('meubanco')
```

### API completa

```javascript
// Salvar
db.set('chave', valor)
db.set('usuario:556799999999', { nome: 'João', pontos: 100, vip: false })
db.set('grupo:123@g.us:antilink', true)

// Ler
const valor  = db.get('chave')                  // undefined se não existir
const valor2 = db.get('chave', 'padrão')        // 'padrão' se não existir
const usuario = db.get('usuario:556799999999')  // { nome: 'João', ... }

// Verificar existência
const existe = db.has('chave')  // true ou false

// Deletar
db.delete('chave')

// Listar tudo
const tudo   = db.all()           // { chave1: val1, chave2: val2, ... }
const valores = Object.values(tudo)
const chaves  = Object.keys(tudo)
const pares   = Object.entries(tudo)
```

### Padrão de chave recomendado

```javascript
// Por usuário
db.set(`user:${userId}`, dados)
db.get(`user:${userId}`)

// Por grupo
db.set(`group:${from}`, dados)
db.get(`group:${from}`)

// Por usuário dentro de um grupo
db.set(`${from}:${userId}`, dados)
db.get(`${from}:${userId}`)

// Com namespace do comando
db.set(`pontos:${userId}`, 0)
db.set(`checkin:${userId}:lastDate`, '2025-01-01')
```

### Padrão para dados de usuário

```javascript
import JsonDB from '../../database.js'
const db = new JsonDB('exemplo')

// Função helper: pegar ou criar usuário
function getUser(userId, nome) {
  const existente = db.get(`user:${userId}`)
  if (existente) return existente

  // Criar novo usuário com valores padrão
  const novo = {
    id: userId,
    nome: nome,
    pontos: 0,
    nivel: 1,
    xp: 0,
    criado: new Date().toISOString(),
    ultimoUso: null,
  }
  db.set(`user:${userId}`, novo)
  return novo
}

// Usar no execute
async execute({ userId, usuario, reply }) {
  const user = getUser(userId, usuario)

  user.pontos += 10
  user.ultimoUso = new Date().toISOString()

  db.set(`user:${userId}`, user)  // ← SEMPRE salvar depois de modificar!
  await reply(`Você tem ${user.pontos} pontos!`)
}
```

### Ranking genérico

```javascript
import JsonDB from '../../database.js'
const db = new JsonDB('pontos')

// Gerar ranking top N por campo
function ranking(campo = 'pontos', top = 10) {
  return Object.values(db.all())
    .filter(u => u[campo] !== undefined)
    .sort((a, b) => b[campo] - a[campo])
    .slice(0, top)
}

// No execute:
async execute({ reply }) {
  const top = ranking('pontos', 10)
  if (!top.length) return reply('Nenhum dado ainda!')

  const emojis = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']
  const linhas = top.map((u, i) =>
    `${emojis[i] || `${i+1}.`} *${u.nome}* — ${u.pontos} pts`
  ).join('\n')

  await reply(`🏆 *RANKING*\n\n${linhas}`)
}
```

### Banco de dados de configuração por grupo

```javascript
import { groupsDB } from '../../database.js'  // banco central de grupos

async execute({ from, reply }) {
  // Ler config do grupo
  const gd = groupsDB.get(from, {})

  // Modificar
  gd.antilink   = true
  gd.bemvindo   = true
  gd.welcomeMsg = 'Olá {nome}! Bem-vindo!'
  gd.prefix     = '!'

  // Salvar
  groupsDB.set(from, gd)
  await reply('✅ Configurações do grupo salvas!')
}
```

### Limpar dados antigos automaticamente

```javascript
// Remove entradas com mais de 30 dias
function limparAntigos(db, campoData = 'ultimoUso', diasMax = 30) {
  const limite = Date.now() - diasMax * 24 * 3600 * 1000
  let removidos = 0

  for (const [key, val] of Object.entries(db.all())) {
    const data = new Date(val[campoData]).getTime()
    if (!isNaN(data) && data < limite) {
      db.delete(key)
      removidos++
    }
  }

  return removidos
}
```

---

## 11. Mídias — Baixar, Processar e Enviar

### 11.1 — Detectar tipo de mídia

```javascript
async execute({ msg, reply }) {
  const inner  = msg.message
  const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage || {}

  // Verificar na própria mensagem ou na citada
  const imagem   = inner?.imageMessage   || quoted?.imageMessage
  const video    = inner?.videoMessage   || quoted?.videoMessage
  const audio    = inner?.audioMessage   || quoted?.audioMessage
  const figurinha = inner?.stickerMessage || quoted?.stickerMessage
  const documento = inner?.documentMessage|| quoted?.documentMessage

  if (!imagem && !video && !audio && !figurinha) {
    return reply('❌ Envie ou responda uma imagem, vídeo ou áudio!')
  }

  if (imagem)    await reply(`📸 Imagem: ${imagem.width}x${imagem.height}px`)
  if (video)     await reply(`🎬 Vídeo: ${video.seconds}s`)
  if (audio)     await reply(`🔊 Áudio: ${audio.seconds}s | Voz: ${audio.ptt ? 'sim' : 'não'}`)
  if (figurinha) await reply(`🎭 Figurinha ${figurinha.isAnimated ? 'animada' : 'estática'}`)
}
```

### 11.2 — Baixar mídia (método completo)

```javascript
// Função utilitária de download — adicione no início do arquivo
async function downloadMedia(sock, msg, tipo) {
  try {
    // Método direto (mais rápido)
    const buf = await sock.downloadMediaMessage(msg)
    if (buf?.length > 0) return buf
  } catch {}

  // Fallback: downloadContentFromMessage
  try {
    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
    const inner  = msg.message
    const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage

    let mediaMsg = null
    const tipos = {
      image: ['imageMessage'],
      video: ['videoMessage'],
      audio: ['audioMessage'],
      sticker: ['stickerMessage'],
      document: ['documentMessage'],
    }

    for (const key of (tipos[tipo] || [])) {
      mediaMsg = inner?.[key] || quoted?.[key]
      if (mediaMsg) break
    }

    if (!mediaMsg) return null

    const stream = await downloadContentFromMessage(mediaMsg, tipo)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buf = Buffer.concat(chunks)
    return buf.length ? buf : null
  } catch { return null }
}

// Usando no comando:
async execute({ sock, msg, reply }) {
  const inner = msg.message
  const quoted = inner?.extendedTextMessage?.contextInfo?.quotedMessage

  if (!inner?.imageMessage && !quoted?.imageMessage) {
    return reply('❌ Envie ou responda uma imagem!')
  }

  await react('⏳')
  const buffer = await downloadMedia(sock, msg, 'image')
  if (!buffer) {
    await react('❌')
    return reply('❌ Não consegui baixar a imagem. Tente novamente.')
  }

  // Agora use o buffer como quiser!
  await react('✅')
  await reply(`✅ Imagem baixada! Tamanho: ${(buffer.length / 1024).toFixed(0)} KB`)
}
```

### 11.3 — Processar imagem com Sharp

```bash
# Instalar
npm install sharp
```

```javascript
import sharp from 'sharp'

async execute({ sock, msg, from, reply, react }) {
  const buf = await downloadMedia(sock, msg, 'image')
  if (!buf) return reply('❌ Responda a uma imagem!')

  await react('⏳')

  // Preto e branco
  const bw = await sharp(buf).grayscale().jpeg({ quality: 85 }).toBuffer()
  await sock.sendMessage(from, { image: bw, caption: '🖤 Preto e branco' }, { quoted: msg })

  // Redimensionar
  const pequena = await sharp(buf).resize(200, 200, { fit: 'cover' }).jpeg().toBuffer()
  await sock.sendMessage(from, { image: pequena, caption: '📐 Redimensionada 200x200' }, { quoted: msg })

  // Rotacionar
  const girada = await sharp(buf).rotate(90).jpeg().toBuffer()
  await sock.sendMessage(from, { image: girada, caption: '🔄 Rotacionada 90°' }, { quoted: msg })

  // Blur / desfoque
  const blur = await sharp(buf).blur(10).jpeg().toBuffer()
  await sock.sendMessage(from, { image: blur, caption: '🌫️ Desfocada' }, { quoted: msg })

  await react('✅')
}
```

### 11.4 — Converter imagem para figurinha

```javascript
import sharp from 'sharp'

async execute({ sock, msg, from, reply, react, args, usuario }) {
  const buf = await downloadMedia(sock, msg, 'image')
  if (!buf) return reply('❌ Envie ou responda uma imagem com .fig')

  await react('⏳')

  try {
    // Converte para WebP quadrado (512x512) — formato padrão de sticker
    const webpBuf = await sharp(buf)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toBuffer()

    await sock.sendMessage(from, { sticker: webpBuf }, { quoted: msg })
    await react('✅')
  } catch (e) {
    await react('❌')
    await reply('❌ Erro ao criar figurinha: ' + e.message)
  }
}
```

### 11.5 — Baixar vídeo do YouTube

```bash
npm install yt-dlp-wrap  # ou use yt-search + ytdl-core
```

```javascript
import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

async execute({ reply, argStr, sock, from, msg, react }) {
  if (!argStr) return reply('❌ Informe o nome ou URL do vídeo!\nEx: .ytmp3 Never Gonna Give You Up')

  await react('⏳')
  await reply('🔍 Buscando vídeo...')

  try {
    // Busca no YouTube
    const { default: yts } = await import('yt-search')
    const resultado = await yts(argStr)
    const video = resultado.videos[0]
    if (!video) return reply('❌ Nenhum vídeo encontrado!')

    await reply(`🎵 Baixando: *${video.title}*\n⏱️ ${video.timestamp}`)

    const tmpFile = path.join('/tmp', `kaius_${Date.now()}.mp3`)

    // Baixa com yt-dlp (precisa estar instalado no sistema)
    await execAsync(
      `yt-dlp -x --audio-format mp3 --audio-quality 5 ` +
      `-o "${tmpFile}" "${video.url}"`,
      { timeout: 120_000 }
    )

    const buf = fs.readFileSync(tmpFile)
    fs.unlinkSync(tmpFile)

    await sock.sendMessage(from, {
      audio: buf,
      mimetype: 'audio/mpeg',
      ptt: false,
    }, { quoted: msg })

    await react('✅')
  } catch (e) {
    await react('❌')
    await reply('❌ Erro ao baixar. Tente outro vídeo.')
  }
}
```

---

## 12. Comandos de Administração de Grupo

### 12.1 — Expulsar membro

```javascript
async execute({ sock, from, msg, membros, isAdmin, isOwner, isGrupo, reply }) {
  if (!isGrupo)             return reply('❌ Use em grupos!')
  if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')

  const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (!mencionados.length)  return reply('❌ Marque quem deseja expulsar!')

  // Filtra para não expulsar admins
  const meta   = await sock.groupMetadata(from)
  const admins = meta.participants.filter(p => p.admin).map(p => p.id)
  const alvo   = mencionados.filter(jid => !admins.includes(jid))

  if (!alvo.length) return reply('❌ Não posso expulsar admins!')

  try {
    await sock.groupParticipantsUpdate(from, alvo, 'remove')
    const nums = alvo.map(j => `+${j.split('@')[0]}`).join(', ')
    await reply(`✅ *${nums}* ${alvo.length > 1 ? 'foram expulsos' : 'foi expulso'}!`)
  } catch {
    await reply('❌ Não tenho permissão. Preciso ser admin!')
  }
}
```

### 12.2 — Promover e rebaixar

```javascript
// Promover para admin
await sock.groupParticipantsUpdate(from, mencionados, 'promote')
await reply(`⬆️ Promovido(s) a admin!`)

// Rebaixar de admin
await sock.groupParticipantsUpdate(from, mencionados, 'demote')
await reply(`⬇️ Rebaixado(s)!`)
```

### 12.3 — Fechar/abrir grupo

```javascript
// Fechar (só admins enviam)
await sock.groupSettingUpdate(from, 'announcement')
await reply('🔒 Grupo fechado! Somente admins podem enviar mensagens.')

// Abrir (todos enviam)
await sock.groupSettingUpdate(from, 'not_announcement')
await reply('🔓 Grupo aberto! Todos podem enviar.')
```

### 12.4 — Alterar nome e descrição

```javascript
// Mudar nome
await sock.groupUpdateSubject(from, 'Novo Nome Épico')
await reply('✅ Nome do grupo alterado!')

// Mudar descrição
await sock.groupUpdateDescription(from, 'Nova descrição do grupo')
await reply('✅ Descrição atualizada!')
```

### 12.5 — Gerar e revogar link

```javascript
// Pegar link atual
const code = await sock.groupInviteCode(from)
await reply(`🔗 Link: https://chat.whatsapp.com/${code}`)

// Revogar e gerar novo
await sock.groupRevokeInvite(from)
await reply('✅ Link revogado! Use .link para gerar um novo.')
```

### 12.6 — Tagall (mencionar todos)

```javascript
async execute({ sock, from, msg, membros, isAdmin, isOwner, isGrupo, argStr, reply }) {
  if (!isGrupo) return reply('❌ Use em grupos!')
  if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
  if (!membros?.length) return reply('❌ Não há membros!')

  const jids     = membros.map(m => m.id)
  const mentions = jids.map(j => `@${j.split('@')[0]}`).join(' ')
  const msg2     = argStr || '📢 Atenção!'

  await sock.sendMessage(from, {
    text: `*${msg2}*\n\n${mentions}`,
    mentions: jids
  }, { quoted: msg })
}
```

### 12.7 — Anti-link (deletar mensagens com link)

```javascript
// Isso fica no HANDLER, mas você pode criar um comando para ativar/desativar:
export default {
  name: 'antilink',
  category: 'admin',
  cooldown: 5,
  async execute({ from, args, groupsDB, isAdmin, isOwner, isGrupo, reply }) {
    if (!isGrupo)             return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')

    const ativar = args[0]?.toLowerCase() === 'on'
    const gd = groupsDB.get(from, {})
    gd.antilink = ativar
    groupsDB.set(from, gd)

    await reply(`${ativar ? '🔒' : '🔓'} Anti-link ${ativar ? 'ativado' : 'desativado'}!`)
  }
}
```

---

## 13. APIs Externas e HTTP

### 13.1 — Padrão de chamada segura

```javascript
import axios from 'axios'

async function chamarAPI(url, params = {}) {
  try {
    const { data } = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'KaiusBot/2.0',
        'Accept': 'application/json',
      },
      timeout: 15_000,   // 15 segundos max
    })
    return { ok: true, data }
  } catch (e) {
    if (e.code === 'ECONNABORTED') return { ok: false, erro: 'timeout' }
    if (e.response?.status === 404) return { ok: false, erro: 'nao_encontrado' }
    if (e.response?.status === 429) return { ok: false, erro: 'rate_limit' }
    if (e.response?.status >= 500)  return { ok: false, erro: 'servidor_fora' }
    return { ok: false, erro: 'desconhecido' }
  }
}

// Usando:
async execute({ reply, argStr, react }) {
  await react('⏳')

  const r = await chamarAPI('https://api.exemplo.com/buscar', { q: argStr })

  if (!r.ok) {
    await react('❌')
    const msgs = {
      timeout: '⏰ API demorou demais. Tente novamente.',
      nao_encontrado: '🔍 Nenhum resultado encontrado.',
      rate_limit: '⚡ Muitas requisições. Tente em 1 minuto.',
      servidor_fora: '🔧 Serviço temporariamente fora. Tente mais tarde.',
      desconhecido: '❌ Erro ao buscar. Tente novamente.',
    }
    return reply(msgs[r.erro] || msgs.desconhecido)
  }

  await react('✅')
  await reply(`✅ Resultado: ${JSON.stringify(r.data).slice(0, 500)}`)
}
```

### 13.2 — APIs gratuitas sem chave

```javascript
// 🌤️ Clima — wttr.in
const clima = await axios.get(`https://wttr.in/${cidade}?format=j1`)

// 📰 Notícias — gnews.io (com chave gratuita)
const news = await axios.get('https://gnews.io/api/v4/top-headlines', {
  params: { lang: 'pt', token: 'SUA_CHAVE_GRATUITA' }
})

// 📚 Wikipedia
const wiki = await axios.get('https://pt.wikipedia.org/api/rest_v1/page/summary/' + termo)

// 💱 Câmbio — ExchangeRate-API (gratuito)
const moeda = await axios.get(`https://open.er-api.com/v6/latest/USD`)

// 😂 Piadas — jokeapi.dev
const piada = await axios.get('https://v2.jokeapi.dev/joke/Any?lang=pt&type=single')

// 🐶 Imagem de cachorro
const dog = await axios.get('https://dog.ceo/api/breeds/image/random')

// 🐱 Imagem de gato
const cat = await axios.get('https://api.thecatapi.com/v1/images/search')

// 🎲 Fato aleatório
const fato = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')

// 🌐 Tradução — MyMemory (sem chave)
const trad = await axios.get('https://api.mymemory.translated.net/get', {
  params: { q: texto, langpair: 'pt|en' }
})

// 📦 CEP brasileiro
const cep = await axios.get(`https://viacep.com.br/ws/${cep}/json/`)

// 💵 Cotação do dólar
const dolar = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL')

// 🔗 Encurtar link
const link = await axios.get(`https://tinyurl.com/api-create.php?url=${url}`)

// 🌡️ Temperatura por IP
const ip = await axios.get('https://ipapi.co/json/')
```

### 13.3 — API com autenticação por chave

```javascript
// Salve a chave no .env:
// MINHA_API_KEY=abc123

const API_KEY = process.env.MINHA_API_KEY

async execute({ reply }) {
  if (!API_KEY) {
    return reply('❌ API não configurada!\nAdicione MINHA_API_KEY no .env')
  }

  const { data } = await axios.get('https://api.exemplo.com/endpoint', {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      // ou: 'X-API-Key': API_KEY
    }
  })
}
```

### 13.4 — Requisição POST (enviar dados)

```javascript
const { data } = await axios.post('https://api.exemplo.com/criar', {
  nome: 'João',
  email: 'joao@email.com',
  mensagem: argStr,
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  },
  timeout: 10_000,
})
```

---

## 14. Integração com IA (Groq)

### 14.1 — Usar a IA dentro do comando

```javascript
import { handleAIResponse } from '../../ai.js'
import { CONFIG } from '../../config.js'

async execute({ reply, argStr, from, sock, msg }) {
  if (!argStr) return reply('❌ Faça uma pergunta!')
  if (!CONFIG.groqKey) return reply('❌ IA não configurada! Adicione GROQ_API_KEY no .env')

  await reply('🤔 Pensando...')

  // handleAIResponse mantém histórico por `from` (grupo ou privado)
  const resposta = await handleAIResponse(argStr, from)

  await sock.sendMessage(from, {
    text: `✦ *${CONFIG.nome}*\n\n${resposta}`,
    quoted: msg,
  })
}
```

### 14.2 — IA com prompt personalizado

```javascript
import Groq from 'groq-sdk'
import { CONFIG } from '../../config.js'

async execute({ reply, argStr }) {
  if (!CONFIG.groqKey) return reply('❌ GROQ_API_KEY não configurada.')

  await reply('🤖 Processando...')

  const groq = new Groq({ apiKey: CONFIG.groqKey })

  const resultado = await groq.chat.completions.create({
    model: CONFIG.modelo || 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Você é um poeta brasileiro. Responda SEMPRE em forma de poema rimado.'
      },
      {
        role: 'user',
        content: argStr,
      }
    ],
    max_tokens: 500,
    temperature: 0.9,
  })

  const poema = resultado.choices[0]?.message?.content || 'Sem inspiração...'
  await reply(`🌸 *Poema gerado*\n\n${poema}`)
}
```

### 14.3 — IA para classificar ou analisar texto

```javascript
import Groq from 'groq-sdk'
import { CONFIG } from '../../config.js'

async execute({ reply, argStr }) {
  const groq = new Groq({ apiKey: CONFIG.groqKey })

  const prompt = `
Analise o seguinte texto e retorne APENAS um JSON com:
- sentimento: "positivo", "negativo" ou "neutro"
- confianca: número de 0 a 100
- resumo: uma frase de no máximo 20 palavras

Texto: "${argStr}"

Retorne APENAS o JSON, sem explicações.
`
  const r = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
  })

  try {
    const json = JSON.parse(r.choices[0].message.content)
    const emoji = json.sentimento === 'positivo' ? '😊' :
                  json.sentimento === 'negativo' ? '😔' : '😐'

    await reply(
      `${emoji} *Análise de Sentimento*\n\n` +
      `Sentimento: *${json.sentimento}*\n` +
      `Confiança: *${json.confianca}%*\n` +
      `Resumo: _${json.resumo}_`
    )
  } catch {
    await reply('❌ Não consegui analisar o texto.')
  }
}
```

---

## 15. Formatação Visual no WhatsApp

### 15.1 — Estilos básicos

```javascript
await reply(
  '*Negrito*\n' +
  '_Itálico_\n' +
  '~Tachado~\n' +
  '```Código monoespaçado```\n' +
  '>Citação em bloco\n' +
  '\n' +
  '*_Negrito + Itálico_*\n' +
  '*~Negrito + Tachado~*\n' +
  '_~Itálico + Tachado~_'
)
```

### 15.2 — Boxes e molduras

```javascript
// Simples
`┌─────────────────┐\n│ Conteúdo aqui   │\n└─────────────────┘`

// Com título
`┏━━━ *TÍTULO* ━━━┓\n┃ Item 1         ┃\n┃ Item 2         ┃\n┗━━━━━━━━━━━━━━━┛`

// Estilo elyra
`╭━━━⪩ *KAIUS* ⪨━━━╮\n│\n│ Conteúdo\n│\n╰━━━━━━━━━━━━━━━━━╯`

// Leve
`▸ Item 1\n▸ Item 2\n▸ Item 3`

// Com hierarquia
`📋 *Seção*\n  ├ Sub-item A\n  ├ Sub-item B\n  └ Sub-item C`
```

### 15.3 — Barras de progresso

```javascript
function barraProgresso(valor, total, tamanho = 10) {
  const pct    = Math.min(1, valor / total)
  const cheios = Math.round(pct * tamanho)
  const vazios = tamanho - cheios
  return '█'.repeat(cheios) + '░'.repeat(vazios)
}

// Usar:
const barra = barraProgresso(75, 100)  // "███████░░░"
await reply(`❤️ Vida: ${barra} 75/100`)
```

### 15.4 — Função de template de menu

```javascript
function menu({ titulo, secoes, footer, prefixo = '.' }) {
  const sep  = '━'.repeat(20)
  let txt = `┏${sep}┓\n┃  ✦ *${titulo.toUpperCase()}* ✦  ┃\n┗${sep}┛\n`

  for (const [nome, cmds] of Object.entries(secoes)) {
    txt += `\n📌 *${nome}*\n`
    cmds.forEach((c, i) => {
      const e = i === cmds.length - 1 ? '└' : '├'
      txt += `  ${e} ${prefixo}${c}\n`
    })
  }

  if (footer) txt += `\n_${footer}_`
  return txt
}

// Usar:
await reply(menu({
  titulo: 'Meu Menu',
  secoes: {
    'Diversão': ['dado', 'moeda', 'sorteio'],
    'Info': ['clima', 'cep', 'traduzir'],
  },
  footer: 'Kaius Bot • DevSquad',
  prefixo: '.',
}))
```

### 15.5 — Tabela simples

```javascript
function tabela(cabecalho, linhas) {
  const cols = cabecalho.length
  const largs = Array.from({ length: cols }, (_, i) => {
    return Math.max(
      cabecalho[i].length,
      ...linhas.map(l => String(l[i] || '').length)
    )
  })

  function linha(cells) {
    return cells.map((c, i) => String(c).padEnd(largs[i])).join(' │ ')
  }

  const sep = largs.map(l => '─'.repeat(l)).join('─┼─')
  const linhasTexto = [
    linha(cabecalho),
    sep,
    ...linhas.map(linha)
  ]
  return '```\n' + linhasTexto.join('\n') + '\n```'
}

// Usar:
await reply(tabela(
  ['Nome', 'Pontos', 'Nível'],
  [
    ['João', '1500', '10'],
    ['Maria', '2300', '15'],
    ['Carlos', '800', '7'],
  ]
))
```

---

## 16. Padrões Avançados

### 16.1 — Comando com estado (stateful)

```javascript
import JsonDB from '../../database.js'
const sessoes = new JsonDB('sessoes_quiz')

// Iniciar quiz
export const quizStart = {
  name: 'quiz',
  category: 'fun',
  cooldown: 5,
  async execute({ userId, reply }) {
    const perguntas = [
      { q: 'Capital do Brasil?', r: 'brasília', a: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'] },
      { q: 'Maior país do mundo?', r: 'rússia', a: ['China', 'EUA', 'Brasil', 'Rússia'] },
    ]

    const sessao = {
      perguntas,
      atual: 0,
      pontos: 0,
      iniciado: Date.now(),
    }
    sessoes.set(userId, sessao)

    const p = perguntas[0]
    const ops = p.a.map((o, i) => `${i + 1}️⃣ ${o}`).join('\n')
    await reply(`🧠 *QUIZ!*\n\n*${p.q}*\n\n${ops}\n\n_Responda com o número_`)
  }
}

// Processar resposta — isso vai no HANDLER antes do processamento de comandos,
// ou você pode fazer uma automação de tipo "contains" no painel.
// Mais simples: criar um comando separado para responder:
export const quizResposta = {
  name: 'r',
  aliases: ['resp', 'responder'],
  category: 'fun',
  cooldown: 0,
  async execute({ userId, args, reply }) {
    const sessao = sessoes.get(userId)
    if (!sessao) return reply('❌ Você não tem um quiz ativo! Use .quiz')

    const idx = parseInt(args[0]) - 1
    if (isNaN(idx) || idx < 0 || idx > 3) return reply('❌ Responda com 1, 2, 3 ou 4.')

    const p = sessao.perguntas[sessao.atual]
    const escolha = p.a[idx]?.toLowerCase()
    const correto = escolha === p.r

    if (correto) sessao.pontos++
    sessao.atual++

    if (sessao.atual >= sessao.perguntas.length) {
      sessoes.delete(userId)
      const total = sessao.perguntas.length
      return reply(
        `${correto ? '✅' : '❌'} ${correto ? 'Correto!' : `Errado! Era: ${p.a.find(a => a.toLowerCase() === p.r)}`}\n\n` +
        `🏁 *FIM DO QUIZ!*\n\n` +
        `Pontuação: *${sessao.pontos}/${total}*\n` +
        (sessao.pontos === total ? '🏆 Perfeito!' : sessao.pontos >= total / 2 ? '👍 Bom!' : '📚 Estude mais!')
      )
    }

    sessoes.set(userId, sessao)
    const proxima = sessao.perguntas[sessao.atual]
    const ops = proxima.a.map((o, i) => `${i + 1}️⃣ ${o}`).join('\n')
    await reply(
      `${correto ? '✅ Correto!' : `❌ Errado! Era: ${p.a.find(a => a.toLowerCase() === p.r)}`}\n\n` +
      `*Pergunta ${sessao.atual + 1}:* ${proxima.q}\n\n${ops}`
    )
  }
}

export default [quizStart, quizResposta]
```

### 16.2 — Factory de comandos (gerar muitos de uma vez)

```javascript
// Como o social.js faz — criar N comandos com o mesmo padrão
const ACOES = {
  abracar: { emoji: '🤗', frase: (a, b) => `${a} deu um abraço em ${b}!` },
  beijar:  { emoji: '💋', frase: (a, b) => `${a} deu um beijo em ${b}!` },
  socar:   { emoji: '👊', frase: (a, b) => `${a} socou ${b}! Au!` },
  chutar:  { emoji: '🦵', frase: (a, b) => `${a} chutou ${b}!` },
  cutucar: { emoji: '👉', frase: (a, b) => `${a} cutucou ${b}!` },
}

function criarAcao(nome, cfg) {
  return {
    name: nome,
    aliases: [cfg.emoji],
    description: `${nome.charAt(0).toUpperCase() + nome.slice(1)} alguém`,
    category: 'fun',
    usage: `.${nome} [@pessoa]`,
    cooldown: 3,
    async execute({ usuario, args, membros, reply }) {
      const num = args[0]?.replace('@', '')

      let alvo
      if (num) {
        alvo = `@${num}`
      } else if (membros?.length) {
        const rand = membros[Math.floor(Math.random() * membros.length)]
        alvo = `@${rand.id.split('@')[0]}`
      } else {
        return reply(`❌ Mencione alguém! Ex: .${nome} @pessoa`)
      }

      await reply(cfg.frase(`*${usuario}*`, `*${alvo}*`))
    }
  }
}

// Gera todos os comandos automaticamente
export default Object.entries(ACOES).map(([nome, cfg]) => criarAcao(nome, cfg))
```

### 16.3 — Caching de resultados de API

```javascript
import JsonDB from '../../database.js'
const cache = new JsonDB('cache_api')

async function comCache(chave, ttlSegundos, buscarFn) {
  const agora = Date.now()
  const cached = cache.get(chave)

  if (cached && (agora - cached.timestamp) < ttlSegundos * 1000) {
    return { dados: cached.dados, doCach: true }
  }

  // Busca atualizado
  const dados = await buscarFn()
  cache.set(chave, { dados, timestamp: agora })
  return { dados, doCach: false }
}

// Usar:
async execute({ reply }) {
  const { dados, doCach } = await comCache(
    'cotacao_dolar',
    300,  // 5 minutos de cache
    async () => {
      const { data } = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL')
      return data.USDBRL
    }
  )

  await reply(
    `💵 *Dólar:* R$ ${parseFloat(dados.bid).toFixed(2)}\n` +
    (doCach ? '_⚡ Cache_' : '_🔄 Atualizado agora_')
  )
}
```

### 16.4 — Paginação de resultados

```javascript
import JsonDB from '../../database.js'
const paginasDb = new JsonDB('paginas_temp')

export const listar = {
  name: 'listar',
  category: 'info',
  cooldown: 3,
  async execute({ userId, args, reply }) {
    const todosItens = ['Item 1','Item 2','Item 3','Item 4','Item 5',
                        'Item 6','Item 7','Item 8','Item 9','Item 10']
    const POR_PAG = 3
    const pagina  = parseInt(args[0]) || 1
    const total   = Math.ceil(todosItens.length / POR_PAG)

    if (pagina < 1 || pagina > total) {
      return reply(`❌ Página inválida! Use entre 1 e ${total}.`)
    }

    const inicio = (pagina - 1) * POR_PAG
    const itens  = todosItens.slice(inicio, inicio + POR_PAG)

    await reply(
      `📋 *Lista — Página ${pagina}/${total}*\n\n` +
      itens.map((item, i) => `${inicio + i + 1}. ${item}`).join('\n') +
      `\n\n_Use .listar ${pagina + 1} para próxima página_`
    )
  }
}
```

---

## 17. Instalação de Dependências

### Pacotes já disponíveis no bot

```javascript
// Esses você pode importar SEM instalar nada:
import axios from 'axios'          // Requisições HTTP
import fs from 'fs'                // Arquivos
import path from 'path'            // Caminhos de arquivo
import { exec } from 'child_process' // Comandos do sistema
import os from 'os'                // Info do sistema
import crypto from 'crypto'        // Criptografia
```

### Instalar novos pacotes

```bash
# Via WhatsApp (no chat com o bot):
.npm sharp           # processa imagens
.npm canvas          # desenhar imagens
.npm cheerio         # web scraping (HTML)
.npm node-cron       # agendador de tarefas
.npm qrcode          # gerar QR codes
.npm jimp            # edição de imagens pura JS
.npm fluent-ffmpeg   # controle do ffmpeg
.npm translate-google # tradução automática

# Via Termux direto:
npm install sharp
pkg install imagemagick  # para operações avançadas
pkg install ffmpeg       # para vídeo/áudio
```

### Instalar no Termux (packages do sistema)

```bash
pkg install git          # Para integração com GitHub
pkg install ffmpeg       # Para vídeo/áudio
pkg install imagemagick  # Para imagens
pkg install yt-dlp       # Para download de vídeos
pkg install python       # Se precisar de scripts Python
```

---

## 18. Criando via Painel Web e IA

### Método 1 — IA no WhatsApp

```
.agente cria um comando .lembrete que guarda uma mensagem de lembrete
e notifica o usuário após X minutos. Ex: .lembrete 30 Tomar remédio
```

```
.agente cria um sistema de loja virtual com .loja, .comprar e .saldo.
Moeda se chama "Kaios", começa com 100 pra todo mundo.
```

```
.agente cria um comando .gif que converte um vídeo citado em GIF animado
usando ffmpeg e manda de volta
```

### Método 2 — Painel web

1. Abra o painel no navegador (`http://IP:3000`)
2. Vá em **Criar Comando** (aba da barra lateral)
3. No campo "Descreva o comando", explique o que quer
4. Escolha a categoria
5. Clique **Gerar com IA**
6. Revise o código no editor
7. Clique **Instalar**
8. Selecione em qual menu vai aparecer

### Método 3 — Editor Manual no painel

1. No painel → **Criar Comando** → seção **Editor Manual**
2. Coloque o nome e categoria
3. Escreva o código diretamente
4. Clique **Salvar & Instalar**

### Método 4 — Editar um comando existente

1. No painel → **Comandos**
2. Clique em qualquer comando da lista
3. O popup de edição abre com abas (Geral, Permissão, Menus, Aliases)
4. Clique no ícone `< >` (código) para editar o JavaScript
5. Salve e o bot recarrega automaticamente

---

## 19. Depuração e Testes

### Ver erros no Termux

```bash
npm start
```

Erros de carregamento aparecem como:
```
⚠ Erro ao carregar meucomando.js: SyntaxError: Unexpected token
```

### Depurar no próprio chat

```javascript
async execute({ reply, args, argStr, userId }) {
  // Teste temporário — envie info para o chat
  await reply(`DEBUG:\nargs: ${JSON.stringify(args)}\nargStr: "${argStr}"\nuserId: ${userId}`)
}
```

### Verificar se o banco está salvando

```javascript
// Adicione temporariamente no execute:
const antes = db.get(userId, null)
console.log('ANTES:', JSON.stringify(antes))
// ... sua lógica ...
const depois = db.get(userId, null)
console.log('DEPOIS:', JSON.stringify(depois))
```

### Recarregar sem reiniciar

```bash
# No WhatsApp:
.reload

# No painel web:
# Comandos → botão Reload
```

### Testar API antes de colocar no bot

```javascript
// Adicione no execute temporariamente para ver o que a API retorna:
const { data } = await axios.get('https://api.exemplo.com/endpoint')
await reply('```\n' + JSON.stringify(data, null, 2).slice(0, 1000) + '\n```')
```

---

## 20. 30+ Exemplos de Comandos Completos

### Ex. 1 — Calculadora

```javascript
// src/commands/info/calc.js
export default {
  name: 'calc',
  aliases: ['calcular', '='],
  description: 'Calcula expressões matemáticas',
  category: 'info',
  usage: '.calc <expressão>',
  cooldown: 2,
  async execute({ reply, argStr }) {
    if (!argStr) return reply('❌ Informe uma expressão!\nEx: .calc 10 * 3 + 5')

    try {
      // Sanitiza — permite apenas caracteres matemáticos
      const sanitizado = argStr.replace(/[^0-9+\-*/.()%\s]/g, '').trim()
      if (!sanitizado) return reply('❌ Expressão inválida!')

      // eslint-disable-next-line no-eval
      const resultado = Function(`'use strict'; return (${sanitizado})`)()

      if (!isFinite(resultado)) return reply('❌ Resultado inválido (divisão por zero?)')
      if (typeof resultado !== 'number') return reply('❌ Resultado não é um número')

      const res = Number.isInteger(resultado) ? resultado : resultado.toFixed(6).replace(/\.?0+$/, '')
      await reply(`🧮 *${sanitizado}*\n\n= *${res}*`)
    } catch {
      await reply('❌ Expressão inválida! Use: +, -, *, /, (, )')
    }
  }
}
```

### Ex. 2 — Gerador de Senhas

```javascript
// src/commands/info/senha.js
export default {
  name: 'senha',
  aliases: ['gerarsenha', 'password'],
  description: 'Gera uma senha segura',
  category: 'info',
  usage: '.senha [tamanho] [nível: básica|média|forte]',
  cooldown: 3,
  async execute({ reply, args }) {
    const tamanho = Math.min(Math.max(parseInt(args[0]) || 16, 4), 64)
    const nivel   = args[1]?.toLowerCase() || 'forte'

    const chars = {
      basica:  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      media:   'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%',
      forte:   'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    }

    const pool = chars[nivel] || chars.forte
    let senha = ''
    for (let i = 0; i < tamanho; i++) {
      senha += pool[Math.floor(Math.random() * pool.length)]
    }

    await reply(
      `🔐 *Senha Gerada*\n\n` +
      `\`\`\`${senha}\`\`\`\n\n` +
      `📏 Tamanho: ${tamanho} caracteres\n` +
      `🛡️ Nível: ${nivel}\n\n` +
      `_Esta mensagem vai desaparecer em 30 segundos!_`
    )
  }
}
```

### Ex. 3 — Ship de Casal

```javascript
// src/commands/fun/ship.js
export default {
  name: 'ship',
  aliases: ['casal', 'amor'],
  description: 'Calcula a compatibilidade entre duas pessoas',
  category: 'fun',
  usage: '.ship @pessoa1 @pessoa2',
  cooldown: 3,
  async execute({ msg, reply, args, usuario, userId }) {
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    let p1nome, p2nome
    if (mencionados.length >= 2) {
      p1nome = mencionados[0].split('@')[0]
      p2nome = mencionados[1].split('@')[0]
    } else if (mencionados.length === 1) {
      p1nome = userId.split('@')[0]
      p2nome = mencionados[0].split('@')[0]
    } else if (args[0] && args[1]) {
      p1nome = args[0].replace('@', '')
      p2nome = args[1].replace('@', '')
    } else {
      return reply('❌ Informe dois nomes ou marque duas pessoas!\nEx: .ship @joao @maria')
    }

    // Seed determinístico para resultado consistente
    const seed = (p1nome + p2nome).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const pct  = ((seed * 137) % 101)

    const emoji = pct >= 90 ? '💞' : pct >= 70 ? '❤️' : pct >= 50 ? '💛' :
                  pct >= 30 ? '💙' : '💔'
    const barra = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10))
    const frase = pct >= 90 ? 'Almas gêmeas! 🥰' : pct >= 70 ? 'Combinam muito!' :
                  pct >= 50 ? 'Podem se dar bem!' : pct >= 30 ? 'É complicado...' : 'Não rola...'

    await reply(
      `${emoji} *SHIP*\n\n` +
      `💕 +${p1nome} & +${p2nome}\n\n` +
      `${barra} *${pct}%*\n\n` +
      `_${frase}_`
    )
  }
}
```

### Ex. 4 — Previsão do Tempo Completa

```javascript
// src/commands/info/tempo.js
import axios from 'axios'

export default {
  name: 'tempo',
  aliases: ['clima', 'weather', 'previsao'],
  description: 'Previsão do tempo detalhada',
  category: 'info',
  usage: '.tempo <cidade>',
  cooldown: 10,
  async execute({ reply, argStr, react }) {
    if (!argStr) return reply(
      '❌ Informe a cidade!\n\n_Exemplos:_\n• .tempo São Paulo\n• .tempo Rio de Janeiro\n• .tempo Lisboa'
    )

    await react('⏳')

    try {
      const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(argStr)}`, {
        params: { format: 'j1' },
        timeout: 12000,
      })

      const c    = data.current_condition[0]
      const area = data.nearest_area[0]
      const fore = data.weather

      const cidade = `${area.areaName[0].value}, ${area.country[0].value}`
      const temp   = c.temp_C
      const feels  = c.FeelsLikeC
      const umid   = c.humidity
      const vento  = c.windspeedKmph
      const visPKm = c.visibility
      const descPT = c.lang_pt?.[0]?.value || c.weatherDesc[0].value

      const emojiTempo = {
        '113': '☀️', '116': '⛅', '119': '☁️', '122': '☁️',
        '176': '🌦️', '200': '⛈️', '266': '🌧️', '302': '🌧️'
      }[c.weatherCode] || '🌡️'

      // Previsão dos próximos 3 dias
      const proxDias = fore.slice(0, 3).map(d => {
        const data = d.date
        const max  = d.maxtempC
        const min  = d.mintempC
        const desc = d.hourly[4]?.lang_pt?.[0]?.value || ''
        return `• ${data}: ${min}°↓ ${max}°↑ _${desc}_`
      }).join('\n')

      await react('✅')
      await reply(
        `${emojiTempo} *${cidade}*\n\n` +
        `🌡️ Temperatura: *${temp}°C* (sensação ${feels}°C)\n` +
        `💧 Umidade: *${umid}%*\n` +
        `💨 Vento: *${vento} km/h*\n` +
        `👁️ Visibilidade: *${visPKm} km*\n` +
        `☁️ Condição: _${descPT}_\n\n` +
        `📅 *Próximos 3 dias:*\n${proxDias}`
      )
    } catch (e) {
      await react('❌')
      if (e.code === 'ECONNABORTED') return reply('⏰ Tempo esgotado. Tente novamente.')
      await reply('❌ Cidade não encontrada ou erro no serviço.')
    }
  }
}
```

### Ex. 5 — Sistema de Economia Completo

```javascript
// src/commands/fun/economia.js
import JsonDB from '../../database.js'

const econDB = new JsonDB('economia')
const MOEDA  = 'Kaios 💎'

function getUser(userId, nome) {
  return econDB.get(userId, {
    nome, saldo: 100, totalGanho: 0, totalGasto: 0,
    ultimoTrabalho: 0, ultimoRoubo: 0, criado: Date.now()
  })
}

export const saldo = {
  name: 'saldo',
  aliases: ['bal', 'carteira', 'banco'],
  description: 'Ver seu saldo',
  category: 'fun',
  cooldown: 3,
  async execute({ userId, usuario, reply }) {
    const u = getUser(userId, usuario)
    await reply(
      `💼 *Carteira de ${u.nome}*\n\n` +
      `💎 Saldo: *${u.saldo} ${MOEDA}*\n` +
      `📈 Total ganho: ${u.totalGanho}\n` +
      `📉 Total gasto: ${u.totalGasto}`
    )
  }
}

export const trabalhar = {
  name: 'trabalhar',
  aliases: ['work', 'trabalho'],
  description: 'Trabalhe para ganhar Kaios',
  category: 'fun',
  cooldown: 0,
  async execute({ userId, usuario, reply }) {
    const u = getUser(userId, usuario)
    const agora = Date.now()
    const CD = 3600_000  // 1 hora

    if (agora - u.ultimoTrabalho < CD) {
      const falta = Math.ceil((CD - (agora - u.ultimoTrabalho)) / 60000)
      return reply(`⏳ Você está cansado!\nDescanse mais *${falta} minutos*.`)
    }

    const ganho = Math.floor(Math.random() * 200) + 50
    const trabalhos = [
      'entregou pizzas', 'consertou computadores', 'fez freelas',
      'vendeu brigadeiros', 'ensinou aulas particulares', 'trabalhou na loja'
    ]
    const trab = trabalhos[Math.floor(Math.random() * trabalhos.length)]

    u.saldo += ganho
    u.totalGanho += ganho
    u.ultimoTrabalho = agora
    econDB.set(userId, u)

    await reply(
      `💼 *${usuario}* ${trab} e ganhou *${ganho} ${MOEDA}*!\n\n` +
      `💎 Saldo atual: *${u.saldo}*`
    )
  }
}

export const transferir = {
  name: 'transferir',
  aliases: ['pagar', 'pay', 'send'],
  description: 'Transfere Kaios para alguém',
  category: 'fun',
  usage: '.transferir @pessoa <valor>',
  cooldown: 10,
  async execute({ userId, usuario, msg, args, reply }) {
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const alvoJid = mencionados[0] || (args[0]?.replace('@','')+'@s.whatsapp.net')

    if (!alvoJid || alvoJid === userId) return reply('❌ Mencione alguém para transferir!')

    const valor = parseInt(args[mencionados.length > 0 ? 0 : 1])
    if (!valor || valor < 1) return reply('❌ Informe o valor!\nEx: .transferir @pessoa 50')

    const remetente = getUser(userId, usuario)
    if (remetente.saldo < valor) {
      return reply(`❌ Saldo insuficiente!\nVocê tem: *${remetente.saldo} ${MOEDA}*`)
    }

    const destinatario = getUser(alvoJid, `+${alvoJid.split('@')[0]}`)

    remetente.saldo -= valor
    remetente.totalGasto += valor
    destinatario.saldo += valor
    destinatario.totalGanho += valor

    econDB.set(userId, remetente)
    econDB.set(alvoJid, destinatario)

    await reply(
      `✅ *Transferência realizada!*\n\n` +
      `De: *${usuario}*\n` +
      `Para: *${destinatario.nome}*\n` +
      `Valor: *${valor} ${MOEDA}*\n\n` +
      `Seu saldo: *${remetente.saldo}*`
    )
  }
}

export const rankingEcon = {
  name: 'ricos',
  aliases: ['ranking', 'top10'],
  description: 'Os mais ricos',
  category: 'fun',
  cooldown: 15,
  async execute({ reply }) {
    const top = Object.values(econDB.all())
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 10)

    if (!top.length) return reply('Nenhum usuário ainda!')
    const emojis = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']
    const lista = top.map((u, i) => `${emojis[i]} *${u.nome}* — ${u.saldo} ${MOEDA}`).join('\n')
    await reply(`💰 *TOP RICOS*\n\n${lista}`)
  }
}

export default [saldo, trabalhar, transferir, rankingEcon]
```

### Ex. 6 — Sorteio Completo

```javascript
// src/commands/fun/sorteio.js
import JsonDB from '../../database.js'

const db = new JsonDB('sorteios')

export const criarSorteio = {
  name: 'criarsorteio',
  aliases: ['novosorteio', 'rafflestart'],
  description: 'Cria um novo sorteio no grupo',
  category: 'admin',
  cooldown: 10,
  async execute({ from, isAdmin, isOwner, args, argStr, reply, isGrupo }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')

    const premio = argStr || '🎁 Prêmio surpresa!'
    const id     = `sorteio:${from}`

    if (db.has(id)) return reply('❌ Já existe um sorteio ativo!\nUse .encerrarsorteio primeiro.')

    db.set(id, { premio, participantes: [], criado: Date.now(), grupo: from })
    await reply(
      `🎉 *SORTEIO CRIADO!*\n\n` +
      `🎁 Prêmio: *${premio}*\n\n` +
      `Para participar: *.entrar*\n` +
      `Para encerrar: *.encerrarsorteio*`
    )
  }
}

export const entrarSorteio = {
  name: 'entrar',
  aliases: ['participar', 'join'],
  description: 'Entra no sorteio ativo',
  category: 'fun',
  cooldown: 0,
  async execute({ from, userId, usuario, isGrupo, reply }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    const id = `sorteio:${from}`
    const sorteio = db.get(id)
    if (!sorteio) return reply('❌ Não há sorteio ativo! Um admin precisa criar com .criarsorteio')

    if (sorteio.participantes.includes(userId)) {
      return reply(`⚠️ *${usuario}*, você já está participando!\nTotal: ${sorteio.participantes.length} pessoas`)
    }

    sorteio.participantes.push(userId)
    db.set(id, sorteio)
    await reply(`✅ *${usuario}* entrou no sorteio!\n👥 Total: ${sorteio.participantes.length} participantes`)
  }
}

export const encerrarSorteio = {
  name: 'encerrarsorteio',
  aliases: ['sorteiar', 'raffleend'],
  description: 'Encerra e realiza o sorteio',
  category: 'admin',
  cooldown: 5,
  async execute({ from, sock, msg, isAdmin, isOwner, isGrupo, reply }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')

    const id      = `sorteio:${from}`
    const sorteio = db.get(id)
    if (!sorteio) return reply('❌ Não há sorteio ativo!')
    if (!sorteio.participantes.length) {
      db.delete(id)
      return reply('❌ Nenhum participante. Sorteio encerrado.')
    }

    const vencedorJid = sorteio.participantes[Math.floor(Math.random() * sorteio.participantes.length)]
    const vencNum = vencedorJid.split('@')[0]
    db.delete(id)

    await sock.sendMessage(from, {
      text: `🎊 *SORTEIO ENCERRADO!*\n\n` +
            `🎁 Prêmio: *${sorteio.premio}*\n` +
            `👥 Participantes: ${sorteio.participantes.length}\n\n` +
            `🏆 *VENCEDOR(A):* @${vencNum}\n\n` +
            `Parabéns! 🎉🥳`,
      mentions: [vencedorJid]
    }, { quoted: msg })
  }
}

export default [criarSorteio, entrarSorteio, encerrarSorteio]
```

### Ex. 7 — Consulta de CEP

```javascript
// src/commands/info/cep.js
import axios from 'axios'

export default {
  name: 'cep',
  aliases: ['buscacep', 'endereco'],
  description: 'Consulta informações de um CEP',
  category: 'info',
  usage: '.cep 01310100',
  cooldown: 5,
  async execute({ reply, args, react }) {
    const cep = (args[0] || '').replace(/\D/g, '')
    if (!cep || cep.length !== 8) {
      return reply('❌ CEP inválido! Informe 8 dígitos.\nEx: .cep 01310100')
    }

    await react('⏳')

    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`, { timeout: 8000 })

      if (data.erro) {
        await react('❌')
        return reply('❌ CEP não encontrado!')
      }

      await react('✅')
      await reply(
        `📮 *CEP ${cep}*\n\n` +
        `📍 Logradouro: *${data.logradouro || '—'}*\n` +
        `🏘️ Bairro: *${data.bairro || '—'}*\n` +
        `🏙️ Cidade: *${data.localidade}*\n` +
        `🗺️ Estado: *${data.uf}* (${data.ibge})\n` +
        `📡 DDD: *${data.ddd}*`
      )
    } catch {
      await react('❌')
      await reply('❌ Erro ao consultar CEP. Tente novamente.')
    }
  }
}
```

### Ex. 8 — Comando de Memória/Lembrete

```javascript
// src/commands/info/lembrete.js
import JsonDB from '../../database.js'

const db = new JsonDB('lembretes')

export const lembrete = {
  name: 'lembrete',
  aliases: ['remind', 'lembrar'],
  description: 'Define um lembrete por tempo',
  category: 'info',
  usage: '.lembrete <minutos> <mensagem>',
  cooldown: 5,
  async execute({ userId, usuario, args, argStr, reply, sock, from, msg }) {
    const mins = parseInt(args[0])
    if (isNaN(mins) || mins < 1) return reply('❌ Informe os minutos!\nEx: .lembrete 30 Tomar remédio')
    if (mins > 1440) return reply('❌ Máximo de 24 horas (1440 minutos)!')

    const mensagem = args.slice(1).join(' ')
    if (!mensagem) return reply('❌ Informe a mensagem do lembrete!')

    const id      = `${userId}:${Date.now()}`
    const dispara = Date.now() + mins * 60_000

    db.set(id, { userId, usuario, mensagem, dispara, from, criado: Date.now() })

    await reply(`⏰ Lembrete definido!\n\nEm *${mins} minuto${mins !== 1 ? 's' : ''}* vou te avisar:\n_"${mensagem}"_`)

    // Agendar
    setTimeout(async () => {
      try {
        const jid = userId.endsWith('@g.us') ? userId : `${userId.split('@')[0]}@s.whatsapp.net`
        await sock.sendMessage(from, {
          text: `⏰ *LEMBRETE!*\n\n📌 _${mensagem}_\n\n_Definido há ${mins} minuto${mins !== 1 ? 's' : ''}_`,
          mentions: [userId]
        })
      } catch {}
      db.delete(id)
    }, mins * 60_000)
  }
}

export default lembrete
```

### Ex. 9 — Verificar Usuário Online / Perfil

```javascript
// src/commands/info/perfil.js
export default {
  name: 'perfil',
  aliases: ['profile', 'card'],
  description: 'Mostra o perfil de um usuário',
  category: 'fun',
  usage: '.perfil [@alguem]',
  cooldown: 5,
  async execute({ sock, from, msg, args, userId, usuario, isGrupo, membros, reply }) {
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const alvo = mencionados[0] || userId
    const numAlvo = alvo.split('@')[0]

    try {
      // Foto de perfil
      let fotoUrl = null
      try { fotoUrl = await sock.profilePictureUrl(alvo, 'image') } catch {}

      // Status/Bio
      let status = null
      try { status = await sock.fetchStatus(alvo) } catch {}

      // Nome (se for do grupo)
      const nomeAlvo = mencionados.length > 0
        ? (membros?.find(m => m.id === alvo)?.id ? `@${numAlvo}` : `@${numAlvo}`)
        : usuario

      const statusTxt = status?.status ? `📝 _${status.status}_` : ''
      const texto = (
        `👤 *Perfil de @${numAlvo}*\n\n` +
        `📱 Número: +${numAlvo}\n` +
        statusTxt
      )

      if (fotoUrl) {
        await sock.sendMessage(from, {
          image: { url: fotoUrl },
          caption: texto,
          mentions: [alvo],
        }, { quoted: msg })
      } else {
        await reply(texto + '\n\n_Sem foto de perfil ou privado._')
      }
    } catch {
      await reply(`❌ Não consegui buscar o perfil de @${numAlvo}.`)
    }
  }
}
```

### Ex. 10 — Comando de Ajuda Dinâmica

```javascript
// src/commands/core/ajuda.js
import { commandMap } from '../../loader.js'
import { CONFIG } from '../../config.js'

export default {
  name: 'ajuda',
  aliases: ['help', '?', 'comandos'],
  description: 'Mostra ajuda sobre um comando',
  category: 'core',
  usage: '.ajuda [comando]',
  cooldown: 3,
  async execute({ reply, args, prefix: p }) {
    const busca = args[0]?.toLowerCase()

    if (!busca) {
      // Listar categorias
      const cats = {}
      for (const [nome, cmd] of commandMap) {
        if (!cats[cmd.category]) cats[cmd.category] = []
        cats[cmd.category].push(nome)
      }

      const emojis = { core:'⚙️', fun:'🎉', rpg:'⚔️', media:'🎬', info:'🔍', admin:'🛡️', owner:'👑', misc:'✨' }
      let txt = `📖 *Comandos do ${CONFIG.nome}*\n\n`
      for (const [cat, cmds] of Object.entries(cats)) {
        txt += `${emojis[cat] || '📦'} *${cat.toUpperCase()}* (${cmds.length})\n`
        txt += cmds.slice(0, 5).map(c => `  ${p}${c}`).join('\n')
        if (cmds.length > 5) txt += `\n  _...e mais ${cmds.length - 5}_`
        txt += '\n\n'
      }
      txt += `_Use ${p}ajuda <comando> para detalhes_`
      return reply(txt)
    }

    // Buscar comando específico
    const cmd = commandMap.get(busca) || [...commandMap.values()].find(c => c.aliases?.includes(busca))
    if (!cmd) return reply(`❌ Comando *${busca}* não encontrado!`)

    await reply(
      `📋 *${p}${cmd.name}*\n\n` +
      `📝 ${cmd.description || 'Sem descrição'}\n\n` +
      `💡 Uso: \`${cmd.usage || p + cmd.name}\`\n` +
      (cmd.aliases?.length ? `🔗 Aliases: ${cmd.aliases.map(a => p + a).join(', ')}\n` : '') +
      `⏱️ Cooldown: ${cmd.cooldown || 0}s\n` +
      `📦 Categoria: ${cmd.category}`
    )
  }
}
```

---

## 21. Erros Comuns e Soluções

### ❌ `Cannot find module`

```javascript
// ❌ Caminho errado
import { configDB } from '../database.js'     // de src/commands/fun/ (falta um ../)

// ✅ Correto (de src/commands/categoria/)
import { configDB } from '../../database.js'

// ✅ Correto (de src/commands/categoria/sub/)
import { configDB } from '../../../database.js'
```

### ❌ `SyntaxError: Cannot use import statement`

```javascript
// ❌ CommonJS (não funciona)
const { algo } = require('./database')
module.exports = { name: 'cmd', execute: () => {} }

// ✅ ES Modules (correto)
import { algo } from '../../database.js'
export default { name: 'cmd', async execute(ctx) {} }
```

### ❌ Comando não carrega após `.reload`

```javascript
// Causa 1: name ausente
export default {
  // ← FALTOU name!
  async execute({ reply }) { await reply('ok') }
}

// Causa 2: export padrão ausente
const meuCmd = { name: 'cmd', ... }
// ← FALTOU export default meuCmd

// Causa 3: erro de sintaxe (vírgula, parêntese)
export default {
  name: 'cmd'     // ← falta vírgula aqui!
  cooldown: 5,
  async execute({ reply }) { await reply('ok') }
}
```

### ❌ `reply is not a function`

```javascript
// ❌ Desestruturação incorreta
async execute(ctx) {
  ctx.reply('ok')     // funciona assim
  reply('ok')         // ← não foi desestruturado
}

// ✅ Desestruturar no parâmetro
async execute({ reply }) {
  await reply('ok')   // ✅
}

// ✅ Ou acessar via ctx
async execute(ctx) {
  await ctx.reply('ok')  // ✅
}
```

### ❌ Banco não salva

```javascript
// ❌ Modifica mas não salva
const user = db.get(userId, { pontos: 0 })
user.pontos += 10
// Esqueceu de salvar!

// ✅ Sempre chamar .set() depois
const user = db.get(userId, { pontos: 0 })
user.pontos += 10
db.set(userId, user)  // ← essencial!
```

### ❌ API retorna undefined

```javascript
// ❌ Acessa sem verificar
const nome = data.resultado.nome  // TypeError se resultado for null

// ✅ Optional chaining
const nome = data?.resultado?.nome || 'Desconhecido'

// ✅ Ou verificação explícita
if (!data?.resultado) return reply('❌ Sem resultado')
const nome = data.resultado.nome
```

### ❌ Bot não responde nada

Verifique em ordem:
1. O prefixo está correto? (`.` vs `!`)
2. O arquivo está em `src/commands/<pasta>/`?
3. O `name` é único? (não conflita com outro comando)
4. Há erro de sintaxe? (cheque o terminal)
5. Rodou `.reload` depois de criar?
6. A categoria bate com as permissões do usuário?

### ❌ `await` em lugar errado

```javascript
// ❌ await fora de async
function minha() {
  await reply('ok')  // SyntaxError!
}

// ✅ sempre async
async function minha() {
  await reply('ok')
}

// ✅ execute sempre é async
async execute({ reply }) {
  await reply('ok')
}
```

### ❌ Encoding de caracteres

```javascript
// ❌ Strings mal escapadas em template literals
await reply(`Olá ${usuario}! Bem\-vindo.`)  // o \ pode causar problema

// ✅ Use caracteres diretos
await reply(`Olá ${usuario}! Bem-vindo.`)
await reply('Usar \n para quebra de linha')
```

---

## 22. Cheat Sheet — Referência Rápida

### Estrutura mínima

```javascript
export default {
  name: 'cmd',
  category: 'fun',
  cooldown: 5,
  async execute({ reply }) { await reply('ok') }
}
```

### ctx — o que usar em cada situação

```javascript
// Responder texto
await reply('mensagem')

// Enviar imagem com legenda
await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg })

// Reagir
await react('✅')

// Verificar permissão
if (!isOwner) return reply('sem perm')
if (!isAdmin) return reply('precisa ser admin')
if (!isGrupo) return reply('grupo apenas')

// Banco de dados
const db = new JsonDB('nome')
const val = db.get('key', padrão)
db.set('key', valor)
db.has('key')
db.delete('key')
Object.values(db.all())

// Mensagem citada
const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
const textoQ = quoted?.conversation || quoted?.extendedTextMessage?.text || ''

// Mencionados
const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

// Membros do grupo
const jids = membros?.map(m => m.id) || []

// Cooldown manual
const key = `cmd:${userId}`
const last = cooldownDB.get(key, 0)
if (Date.now() - last < 60_000) return reply('espere')
cooldownDB.set(key, Date.now())
```

### Operações de grupo

```javascript
await sock.groupParticipantsUpdate(from, [jid], 'remove')   // expulsar
await sock.groupParticipantsUpdate(from, [jid], 'promote')  // promover
await sock.groupParticipantsUpdate(from, [jid], 'demote')   // rebaixar
await sock.groupSettingUpdate(from, 'announcement')          // fechar
await sock.groupSettingUpdate(from, 'not_announcement')      // abrir
await sock.groupUpdateSubject(from, 'Nome')                  // renomear
await sock.groupUpdateDescription(from, 'Desc')              // descrever
const code = await sock.groupInviteCode(from)               // link
```

### Formatação rápida

```javascript
`*negrito*`   `_itálico_`   `~tachado~`   ` ```mono``` `
'> citação'

// Barra de progresso
'█'.repeat(pct/10) + '░'.repeat(10 - pct/10)

// Box
`┏${'━'.repeat(20)}┓\n┃  Conteúdo  ┃\n┗${'━'.repeat(20)}┛`
```

### API externa (padrão)

```javascript
try {
  await react('⏳')
  const { data } = await axios.get(url, { params, timeout: 10000 })
  if (!data?.campo) { await react('❌'); return reply('❌ Sem resultado') }
  await react('✅')
  await reply(`✅ ${data.campo}`)
} catch { await react('❌'); await reply('❌ Erro. Tente novamente.') }
```

---

*Kaius Bot — DevSquad © 2025 | Documentação v2.x*  
*Comandos: `src/commands/` | Banco: `data/` | Config: `.env`*
