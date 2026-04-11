# Continuidade.md — Guia Completo para Desenvolvimento Futuro
## Kaius Bot (baseado em ElyraBot) — v32

> **Objetivo:** Permitir que qualquer IA ou desenvolvedor continue o projeto sem quebrar o sistema existente.
> Este documento reflete o código **real** atual (v32). Nada aqui é inventado ou genérico.

---

## 1. VISÃO GERAL DO PROJETO

### O que o bot faz

O Kaius é um **bot de WhatsApp** completo com:
- Resposta a comandos com prefixo configurável (padrão `!`, configurável via `.env`)
- Sistema de automações (gatilho → resposta, com suporte a mídia)
- IA conversacional via Groq API (llama-3.3-70b-versatile) e Gemini
- Detector de código JS no chat — instala comandos automaticamente
- Sistema de RPG, jogos, media (figurinhas, imagens, vídeos)
- Gerenciamento de grupos (anti-link, anti-spam, bem-vindo, anti-fake)
- Agendador de mensagens por horário
- Webhooks externos (Event Streamer)
- **Dashboard web moderno (Express + Socket.io + PWA) — completamente reescrito na v31/v32**
- Integração com GitHub (push/pull do bot)
- Sistema de sub-donos, VIPs e permissões granulares
- **Sistema de prioridade de comandos e hooks — adicionado na v31/v32**
- **Bang Panel — painel de ações rápidas (ban/unban/send/exec) — adicionado na v31**

### Stack tecnológica

| Tecnologia | Uso |
|---|---|
| Node.js (ES Modules) | Runtime — todos os arquivos usam `import/export`, NÃO `require` |
| `@whiskeysockets/baileys` | Client WhatsApp (protocolo WA Web) |
| Express + Socket.io | Dashboard web em tempo real |
| JSON puro (classe `JsonDB`) | Banco de dados — arquivos `.json` na pasta `data/` |
| Groq SDK | IA primária (llama-3.3-70b-versatile) |
| axios | HTTP calls (IA Gemini, APIs de comandos) |
| pino | Logger silencioso do Baileys |

### Concept principal

O sistema é **100% modular**:
1. Você cria um arquivo `.js` em `src/commands/CATEGORIA/`
2. O loader carrega automaticamente — sem tocar em handler.js
3. O mesmo arquivo pode exportar **comandos** E **hooks** simultaneamente

---

## 2. ARQUITETURA DO SISTEMA

### Estrutura de arquivos

```
index.js                    ← Entry point. Conecta ao WhatsApp, wira tudo.
src/
  handler.js                ← CÉREBRO. Processa TODA mensagem recebida.
  loader.js                 ← Carrega comandos e hooks de src/commands/
  hooks.js                  ← Sistema de hooks/eventos
  config.js                 ← CONFIG proxy (DB + ENV)
  database.js               ← Classe JsonDB + instâncias singleton
  permissions.js            ← Roles, getRole, isDono, isSubdono, banUser...
  dashboard.js              ← API REST + Socket.io (painel web) — v32
  ai.js                     ← handleAIResponse (Groq)
  codeDetector.js           ← Detecta JS no chat e instala como comando
  github.js                 ← Push/pull seguro (sem stash)
  scheduler.js              ← Agendador de mensagens
  cleaner.js                ← Limpeza de cache a cada 12h
  logger.js                 ← Logs coloridos no terminal + emit para dashboard
  env.js                    ← Carrega .env ANTES de tudo (DEVE ser 1º import)
  manus.js                  ← Agente IA autônomo (Groq tool-calling)
  contributions.js          ← Sistema de contribuições de comandos
  errorTracker.js           ← Captura erros e notifica o dono no WhatsApp
  permissions.js            ← Roles e permissões
  utils.js                  ← Helpers (getMessageText, getMentionedJids...)
  commands/
    admin/                  ← Comandos de moderação de grupo
    core/                   ← Comandos essenciais (menu, ping, ia, info)
    fun/                    ← Entretenimento, jogos (XP passivo REMOVIDO na v32)
    info/                   ← Informações externas (clima, wiki, etc)
    media/                  ← Figurinhas, imagens, vídeos
    owner/                  ← Comandos do dono (hooks, anti-spam, etc)
    rpg/                    ← Sistema de RPG (XP interno do RPG mantido)
public/                     ← Dashboard SPA — completamente reescrito na v31/v32
  index.html                ← Shell HTML (~170 linhas, modular)
  app.js                    ← Lógica principal: router, API, Socket.io, toast, auth
  styles.css                ← CSS completo dark mode
  sw.js                     ← Service Worker v32 (corrigido, Promise.allSettled, SPA)
  manifest.json             ← PWA — start_url: /#dashboard
  offline.html              ← Página offline
  pwa-patch.js              ← Registro do SW com validação HTTPS
  assets/
    icons.js                ← SVGs centralizados
    logo.svg                ← Logo custom
  components/
    Dashboard.js            ← Stats, gráfico 7d, ações rápidas, envio rápido
    Logs.js                 ← Stream Socket.io, filtros, auto-scroll
    Commands.js             ← Grid de cmds + prioridade inline + hooks
    Automations.js          ← Automações, Auto-IA, Agendador, Hooks ativos
    Webhooks.js             ← CRUD webhooks + tester
    Groups.js               ← Grupos, whitelist, banidos, broadcast
    Users.js                ← Minions paginados, sub-donos
    BangPanel.js            ← ⚡ Ações rápidas (bang cmd palette + bans)
    Config.js               ← Geral, IA (com save no .env), mensagens, menu, perms
    System.js               ← Monitor, terminal, GitHub, pairing, plugins
data/                       ← Criada automaticamente. JSON files do DB.
auth/                       ← Sessão do Baileys (NÃO versionar)
```

---

## 3. MUDANÇAS v31 → v32

### O que mudou na v32

| Componente | Mudança |
|---|---|
| `src/hooks.js` | Adicionado `updateHookPriority(id, priority)` — atualiza prioridade sem perder `handle` |
| `src/dashboard.js` | Corrigido `hooks/priority` (usava remove+re-add perdendo handle) |
| `src/dashboard.js` | Adicionado `POST /api/config/envkeys` — salva groqKey/geminiKey direto no .env |
| `src/dashboard.js` | Adicionado `const ROOT` e importado `logWarn` (bugs do original) |
| `src/dashboard.js` | Adicionado `setDashSock(sock)` + exportado; chamado em `index.js` |
| `src/database.js` | Adicionado `cmdPriorityDB` |
| `src/loader.js` | Adicionado `getCommandPriority()`, `setCommandPriority()` + sort por prioridade |
| `src/handler.js` | **XP passivo removido** — `import('./commands/fun/xp.js')` eliminado |
| `src/permissions.js` | Adicionado `banUser()`, `unbanUser()`, `listBannedUsers()` |
| `src/index.js` | Adicionado import + chamada de `setDashSock(sock)` |
| `public/sw.js` | **Reescrito** — sem CDN no SHELL_FILES, Promise.allSettled, SPA navigate fallback |
| `public/pwa-patch.js` | **Reescrito** — validação HTTPS/localhost, sync API corrigida |
| `public/manifest.json` | `start_url` corrigido para `/#dashboard` |
| `public/components/Config.js` | Seção IA reescrita — mostra status real das keys, salva no .env |
| `public/components/Commands.js` | Prioridade inline nos cards + aba Hooks & Prioridade com fix de handle |
| `public/components/Automations.js` | Todos os reloads de tabs corrigidos (sem data-loaded stale) |
| Todos os componentes | `confirm()` → `window.confirm()` (fix escopo global) |

### O que mudou na v31

| Componente | Mudança |
|---|---|
| Dashboard (SPA) | **Completamente reescrito** — de um HTML monolítico para arquitetura modular |
| `public/` | Nova estrutura: components/, assets/, sw.js, manifest.json, pwa-patch.js |
| `src/database.js` | Adicionado `cmdPriorityDB` |
| `src/loader.js` | Adicionado `getCommandPriority`, `setCommandPriority`, sort por prioridade |
| `src/handler.js` | XP passivo removido |
| `src/permissions.js` | Adicionado `banUser`, `unbanUser`, `listBannedUsers` |
| Bang Panel | Nova página de ações rápidas com command palette |

---

## 4. SISTEMA DE PRIORIDADE (NOVO v31/v32)

### Prioridade de Comandos

- Armazenada em `data/cmdpriority.json` via `cmdPriorityDB`
- **Número maior = prioridade maior = carregado primeiro no loader**
- `getCommandList()` em `loader.js` ordena por prioridade decrescente
- Endpoints: `GET /api/commands/:name/priority` e `POST /api/commands/:name/priority`
- **No painel:** botões `−` e `+` inline em cada card de comando (sem abrir modal)
- **Use case:** você cria um novo `ping.js` que sobrescreve o original → dê prioridade 100 ao novo

### Prioridade de Hooks

- Armazenada em memória no `Map _hooks` do `hooks.js`
- **Número menor = executa PRIMEIRO** (diferente dos comandos!)
- `updateHookPriority(id, priority)` — atualiza sem perder a função `handle`
- Endpoint: `POST /api/hooks/priority { id, priority }`
- **No painel:** aba "Hooks & Prioridade" → botões −5 e +5 por hook

---

## 5. BANG PANEL (NOVO v31)

### O que é

Página de ações rápidas acessível via sidebar ("⚡ Ações Rápidas").

### Command Palette

Digite na barra Bang e pressione Enter:

```
ban 5511999999999 spam repetido     → bane usuário
unban 5511999999999                 → desbane usuário
bangroup 120363xxx@g.us             → bane grupo
unbangroup 120363xxx@g.us           → desbane grupo
send 5511999@s.whatsapp.net Olá!    → envia mensagem
exec 5511999@s.whatsapp.net !ping   → executa comando via bot
```

### Endpoints usados

| Endpoint | Descrição |
|---|---|
| `GET  /api/users/banned` | Lista usuários banidos |
| `POST /api/users/ban` | Bane usuário `{ num, motivo }` |
| `DELETE /api/users/ban/:num` | Desbane usuário |
| `POST /api/send` | Envia mensagem `{ jid, text }` |
| `POST /api/quick/exec` | Executa comando via bot `{ jid, command }` |

---

## 6. API KEYS DE IA (IMPORTANTE)

### Por que as keys não podem ser salvas normalmente

`groqKey` e `geminiKey` estão em `ENV_ONLY_KEYS` no `config.js`. Isso significa:
- Lidas sempre de `process.env.GROQ_API_KEY` e `process.env.GEMINI_API_KEY`
- O Proxy `CONFIG` IGNORA o `configDB` para essas chaves
- Mesmo que o dashboard escreva em `configDB`, na próxima leitura usa o `.env`

### Como salvar keys no painel (v32)

Na aba **Configurações → IA**, o painel usa `POST /api/config/envkeys` que:
1. Lê o arquivo `.env` diretamente via `fs.readFileSync`
2. Substitui (ou adiciona) a linha `GROQ_API_KEY=...`
3. Salva o arquivo de volta
4. **O bot lê o valor novo automaticamente** via `process.env` (o Node já atualiza na próxima chamada `CONFIG.groqKey`)

> ⚠️ **Não requer reinicialização** — `CONFIG.groqKey` lê de `process.env` que é atualizado quando o `.env` é modificado E o processo reiniciado. Para efeito imediato sem reiniciar, use os campos de override temporário.

---

## 7. PWA — COMO FUNCIONA (v32)

### Service Worker (sw.js)

Estratégias por tipo de request:

| Tipo | Estratégia |
|---|---|
| `request.mode === 'navigate'` | Network-first + fallback `/index.html` do cache |
| `/api/*` e `socket.io` | Sempre network (sem cache) |
| CDN externas (fonts, cdnjs) | Stale-while-revalidate lazy (cache cresce com uso) |
| Assets locais (css, js) | Cache-first + cache ao buscar |

### Install (fix v32)

```js
// Usa Promise.allSettled → 1 arquivo faltando NÃO derruba o SW inteiro
Promise.allSettled(SHELL_FILES.map(url => fetch(url).then(res => cache.put(url, res))))
```

### Requisitos para funcionar

- **HTTPS ou localhost** — o pwa-patch.js valida isso antes de registrar
- Express servindo os arquivos corretamente (já configurado)
- Ícones `icon-192.png` e `icon-512.png` existindo em `public/`

### Não funciona em

- `file://` — sem workaround possível
- HTTP puro em domínio diferente de localhost

---

## 8. SISTEMA DE COMANDOS

### Estrutura de um comando

```js
export default {
  name: 'ping',           // OBRIGATÓRIO. Único. Sem espaços. Lowercase.
  aliases: ['p', 'test'], // Opcional.
  description: 'Testa o bot',
  category: 'core',       // Define permissão padrão.
  usage: '!ping',
  cooldown: 5,
  enabled: true,
  async execute(ctx) {
    await ctx.reply('Pong! 🏓')
  }
}
```

### Objeto `ctx` — tudo disponível dentro de `execute`

| Campo | Tipo | Descrição |
|---|---|---|
| `sock` | object | Client Baileys completo |
| `msg` | object | Mensagem Baileys crua |
| `from` | string | JID do chat |
| `userId` | string | JID de quem enviou |
| `usuario` | string | `msg.pushName` |
| `isGrupo` | boolean | Se é grupo |
| `args` | string[] | Palavras após o comando |
| `argStr` | string | `args.join(' ')` |
| `prefix` | string | Prefixo efetivo |
| `isAdmin` | boolean | Admin do grupo |
| `isOwner` | boolean | É o dono do bot |
| `reply(text)` | function | Responde citando |
| `sendText(text)` | function | Envia sem citar |
| `sendImage(url, caption)` | function | Envia imagem |
| `react(emoji)` | function | Reage à mensagem |

---

## 9. BANCO DE DADOS

### Instâncias singleton exportadas de `database.js`

| Variável | Arquivo JSON | Uso |
|---|---|---|
| `configDB` | `config.json` | Configurações via CONFIG proxy |
| `groupsDB` | `groups.json` | Dados por grupo |
| `statsDB` | `stats.json` | Estatísticas de msgs/comandos |
| `usersDB` | `users.json` | Dados de usuários |
| `cooldownDB` | `cooldowns.json` | Cooldowns ativos |
| `minionsDB` | `minions.json` | Todos os usuários que interagiram |
| `subdonsDB` | `subdons.json` | Sub-donos, VIPs e banidos (role 99) |
| `cmdPermsDB` | `cmdperms.json` | Permissões por comando |
| `menuTargetDB` | `menutargets.json` | Qual menu cada comando aparece |
| `automationsDB` | `automations.json` | Automações + webhooks + auto_ia |
| `allowedGroupsDB` | `allowedgroups.json` | Whitelist de grupos |
| `bannedGroupsDB` | `bannedgroups.json` | Blacklist de grupos (bot ignora) |
| `schedulerDB` | `scheduler.json` | Tarefas agendadas |
| `rpgDB` | `rpg.json` | Dados do RPG |
| `contribDB` | `contributions.json` | Contribuições de comandos |
| `cmdPriorityDB` | `cmdpriority.json` | **NOVO v31** Prioridade de comandos |

---

## 10. ENDPOINTS DO DASHBOARD (v32 completo)

### Status e Logs
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/status` | Status do bot: nome, versão, uptime, prefixo, stats |
| GET | `/api/logs` | Histórico de logs |
| GET | `/api/stats/chart` | Dados do gráfico (7 dias) |

### Comandos
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/commands` | Lista todos (ordenado por prioridade desc) |
| POST | `/api/commands/:name/toggle` | Ativar/desativar |
| GET | `/api/commands/:name/source` | Código fonte |
| POST | `/api/commands/:name/source` | Criar/salvar código |
| DELETE | `/api/commands/:name` | Deletar |
| PUT | `/api/commands/:name/meta` | Editar desc/usage/cooldown |
| POST | `/api/commands/:name/aliases` | Aliases dinâmicos |
| GET | `/api/commands/:name/priority` | Ver prioridade |
| POST | `/api/commands/:name/priority` | Definir prioridade |

### Hooks
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/hooks` | Lista hooks ativos com prioridade |
| POST | `/api/hooks/remove` | Remove hook por ID |
| POST | `/api/hooks/priority` | Altera prioridade (usa `updateHookPriority`) |

### Configurações
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/config` | Ler configurações |
| POST | `/api/config` | Salvar configurações |
| POST | `/api/config/menu` | Salvar config do menu |
| POST | `/api/config/envkeys` | **NOVO v32** — Salva groqKey/geminiKey no .env |
| POST | `/api/design/apply` | Aplicar tema de menu |

### Grupos
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/groups` | Todos os grupos |
| GET | `/api/groups/banned` | Grupos banidos |
| POST | `/api/groups/ban` | Banir grupo `{ jid, nome }` |
| DELETE | `/api/groups/ban/:jid` | Desbanir grupo |
| GET | `/api/allowedgroups` | Whitelist |
| POST | `/api/allowedgroups/toggle` | Toggle groupRestriction |
| POST | `/api/allowedgroups` | Adicionar à whitelist |
| DELETE | `/api/allowedgroups/:jid` | Remover da whitelist |
| POST | `/api/groups/broadcast` | Broadcast para todos os grupos |

### Usuários / Bang Panel
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/minions` | Lista usuários paginada |
| GET | `/api/minions/stats` | Stats de usuários |
| POST | `/api/minions/:num/ban` | Banir usuário |
| POST | `/api/minions/:num/unban` | Desbanir usuário |
| POST | `/api/minions/:num/promote` | Promover usuário |
| GET | `/api/users/banned` | **NOVO v31** Lista banidos via Bang |
| POST | `/api/users/ban` | **NOVO v31** Banir `{ num, motivo }` |
| DELETE | `/api/users/ban/:num` | **NOVO v31** Desbanir |
| GET | `/api/subdons` | Sub-donos e VIPs |
| POST | `/api/subdons` | Adicionar sub-dono |
| DELETE | `/api/subdons/:num` | Remover sub-dono |

### Ações Rápidas
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/send` | Enviar mensagem `{ jid, text }` |
| POST | `/api/quick/exec` | **NOVO v31** Executar comando via bot `{ jid, command }` |
| POST | `/api/reload` | Recarregar todos os comandos |

### Automações
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/automations` | Lista automações |
| POST | `/api/automations` | Criar automação |
| PUT | `/api/automations/:id` | Editar automação |
| DELETE | `/api/automations/:id` | Deletar automação |
| GET | `/api/auto-ia` | Regras Auto-IA |
| POST | `/api/auto-ia` | Criar regra |
| DELETE | `/api/auto-ia/:id` | Deletar regra |

### Webhooks
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/webhooks` | Lista webhooks |
| POST | `/api/webhooks` | Criar webhook |
| DELETE | `/api/webhooks/:id` | Deletar webhook |
| POST | `/api/webhooks/test` | Testar webhook |

### Sistema
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/system/usage` | CPU/RAM |
| POST | `/api/exec` | Shell command |
| POST | `/api/npm` | Instalar pacote npm |
| GET | `/api/github/status` | Status do git |
| POST | `/api/github/pull` | Git pull |
| POST | `/api/github/push` | Git push |
| POST | `/api/pairing` | Solicitar pairing code |
| POST | `/api/clean-auth` | Limpar sessão |
| POST | `/api/plugins/install` | Instalar plugin via URL |
| POST | `/api/ai/generate-command` | Gerar comando com IA |
| POST | `/api/ai/chat` | Chat com IA |

### Agendador
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/scheduler` | Lista agendamentos |
| POST | `/api/scheduler` | Criar agendamento |
| DELETE | `/api/scheduler/:id` | Deletar agendamento |

---

## 11. SOCKET.IO — EVENTOS

### Servidor → Cliente

| Evento | Payload | Quando |
|---|---|---|
| `init` | `{ logs: [], commands: [] }` | Na conexão inicial |
| `status` | `{ online, nome, numero, versao, uptime, ... }` | Mudança de status |
| `log` | `{ type, msg, time }` | Novo log |
| `reload` | `{ total }` | Após `.reload` ou `/api/reload` |
| `pairing_code` | `{ code }` | Código de pareamento gerado |

### Cliente → Servidor (via Socket.io)

| Evento | Descrição |
|---|---|
| `request_pairing` | Solicita pairing code `{ phone }` |

---

## 12. REGRAS PARA FUTURAS IAs

### Regras absolutas

1. **NÃO reescreva `handler.js` inteiro.** Modifique cirurgicamente.

2. **NÃO mude a estrutura de comandos** (`name, aliases, category, execute`). O loader, o dashboard e o menu dependem dessas propriedades.

3. **NÃO mude a assinatura de `execute(ctx)`** — quebraria todos os comandos existentes.

4. **NÃO adicione `import` em `env.js`** — ele deve ser o menor e mais simples possível.

5. **NÃO use `require()`** em nenhum arquivo — o projeto usa ES Modules.

6. **NÃO esqueça `export default`** ao criar arquivo de comando.

7. **NÃO mova a posição de `ENV_ONLY_KEYS`** em config.js — groqKey, geminiKey e outros são sempre lidos do `.env`, nunca do banco.

8. **NÃO tente salvar groqKey via `CONFIG.groqKey = x`** — ENV_ONLY bloqueia o SET. Use `POST /api/config/envkeys` para persistir no `.env`.

9. **Para prioridade de hooks:** use `updateHookPriority(id, priority)` — NÃO use `removeHook + registerHook`, pois a função `handle` é perdida na serialização JSON.

10. **NÃO adicione URLs de CDN ao SHELL_FILES do sw.js** — quebrará o install do Service Worker se a CDN estiver offline.

### Regras de boas práticas

- Ao adicionar campo novo ao `CONFIG`, adicione em `DEFAULTS` e decida se é `ENV_ONLY` ou não.
- Ao criar nova instância de `JsonDB` em `database.js`, também exporte ela.
- Ao adicionar endpoint `/api/algo` no dashboard, documente na seção de endpoints deste arquivo.
- Hooks que dependem de estado externo (DB) DEVEM ter ID único baseado em algo estável.

---

## 13. COMO EXECUTAR O PROJETO

### Dependências do sistema

- **Node.js ≥ 18** (ES Modules nativos)
- **npm**
- **ffmpeg** — para conversão de áudio (mp3 → opus)
- **git** — para push/pull GitHub (opcional)

### Setup inicial

```bash
npm install
cp .env.example .env
# Editar: OWNER_NUMBER, BOT_NAME, GROQ_API_KEY, PREFIX, DASHBOARD_PORT
npm start
```

### Variáveis de ambiente críticas

```env
OWNER_NUMBER=5511999999999   # número do dono SEM @s.whatsapp.net
BOT_NAME=Kaius
PREFIX=.
GROQ_API_KEY=gsk_...
DASHBOARD_PORT=3000
DASHBOARD_PASS=               # senha do painel (vazio = sem senha)
GEMINI_API_KEY=AIza...         # opcional
GITHUB_REPO_WITH_TOKEN=https://TOKEN@github.com/usuario/repo
AUTO_UPDATE=false
SELF_BOT=false
```

### Dashboard

Acesse: `http://SEU-IP:DASHBOARD_PORT`

Para PWA funcionar: use `http://localhost:PORT` ou HTTPS em produção.

---

## 14. BUGS CONHECIDOS HERDADOS (não corrigidos ainda)

| Bug | Localização | Impacto |
|---|---|---|
| Dois `bannedGroupsDB` com nomes diferentes | `database.js` vs `permissions.js` | Bans via painel podem não funcionar via `isGroupAllowed()` |
| `EVENTS.RELOAD` nunca emitido | `hooks.js` | Evento definido mas não disparado |
| `loadHooksFromModule` re-registra a cada `loadCommands` | `loader.js` | Hooks com `onEvent` podem disparar 2x ao recarregar |
| Auto-IA usa `userId` antes de ser declarado | `handler.js` ~linha 100 | Pode dar ReferenceError em edge cases |

---

*Última atualização: v32 — baseado em análise do código real. Inclui todos os fixes das versões v31 e v32.*
