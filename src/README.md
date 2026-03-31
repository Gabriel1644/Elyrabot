# 🤖 ElyraBot v2.1 — WhatsApp Bot Autônomo

> Bot modular para WhatsApp com IA, agente autônomo, auto-update via GitHub, detector de código e muito mais. Feito para Termux.

---

## ⚡ Instalação Rápida

```bash
# 1. Dependências do sistema
pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg python -y
pip install yt-dlp

# 2. (Opcional) Para comandos Termux (bateria, TTS, etc.)
pkg install termux-api

# 3. Extrai o bot
cd ~ && unzip elyrabot-v6.zip && cd elyrabot

# 4. Instala dependências Node
npm install

# 5. Configura (wizard interativo)
npm run config

# 6. Inicia
npm start
```

---

## ⚙️ Configuração Detalhada

### `npm run config` — Wizard Interativo

Execute antes de iniciar pela primeira vez. Ele pergunta tudo e gera o `.env` automaticamente:

```
✦ ElyraBot — Assistente de Setup

── WhatsApp & Bot ──────────────────────────
? Seu número (com DDI): 5511999999999
? Prefixo dos comandos: !
? Nome do bot: Elyra

── IA (Groq) ─────────────────────────────
? Chave Groq API: gsk_...   ← console.groq.com (grátis)
? Modelo IA: llama-3.3-70b-versatile

── GitHub ───────────────────────────────
? URL do repositório: https://TOKEN@github.com/user/elyrabot.git
? Auto-update automático: s
? Auto-publicar comandos novos: s
```

### Configuração Manual do `.env`

```env
# ── WhatsApp ──────────────────────
OWNER_NUMBER=5511999999999        # Seu número (sem + ou espaços)
PREFIX=!                          # Prefixo dos comandos
BOT_NAME=Elyra                   # Nome do bot

# ── IA (obrigatório) ──────────────
GROQ_API_KEY=gsk_...              # https://console.groq.com (grátis)
GROQ_MODEL=llama-3.3-70b-versatile

# ── Painel Web ────────────────────
DASHBOARD_PORT=3000
DASHBOARD_PASS=                   # senha (deixe vazio = sem senha)
DASHBOARD_AI=true

# ── GitHub (opcional mas recomendado) ──
GITHUB_REPO_WITH_TOKEN=https://SEU_TOKEN@github.com/user/repo.git
AUTO_UPDATE=true                  # verifica updates a cada 6h
AUTO_UPLOAD=true                  # publica novos comandos automaticamente

# ── Detector de código ─────────────
AUTO_CODE_DETECT=true             # detecta código JS no chat
CODE_DETECT_OWNER_ONLY=true       # só para o dono

# ── APIs extras ───────────────────
WEATHER_KEY=                      # openweathermap.org (para !clima)
NEWS_KEY=                         # newsapi.org (para !noticias)
```

---

## 🐙 Como Configurar o GitHub

### Passo 1 — Crie um repositório

1. Acesse [github.com](https://github.com) e crie um repositório (pode ser privado)
2. Nome sugerido: `elyrabot` ou `meubot`

### Passo 2 — Crie um Personal Access Token

1. GitHub → Settings → Developer Settings → **Personal access tokens → Tokens (classic)**
2. Clique **Generate new token**
3. Marque as permissões: `repo` (todas)
4. Copie o token gerado (começa com `ghp_...`)

### Passo 3 — Configure no bot

**Opção A — via `npm run config`:**
```
? URL do repositório: https://ghp_SEU_TOKEN@github.com/SEU_USER/SEU_REPO.git
```

**Opção B — via `.env`:**
```env
GITHUB_REPO_WITH_TOKEN=https://ghp_SEU_TOKEN@github.com/SEU_USER/SEU_REPO.git
AUTO_UPDATE=true
AUTO_UPLOAD=true
```

**Opção C — via WhatsApp (depois de iniciar):**
```
!git config https://ghp_SEU_TOKEN@github.com/SEU_USER/SEU_REPO.git
```

### O que acontece automaticamente

- ✅ **Na inicialização** — o bot faz push de todos os arquivos para o GitHub
- ✅ **A cada 6h** — verifica e aplica updates do repo oficial (apenas arquivos de núcleo)
- ✅ **Quando cria comando** — faz upload do novo comando automaticamente
- ✅ **Detector de código** — quando detecta código no chat, instala e faz upload

### Comandos GitHub no WhatsApp

```
!git status          → Status do repositório
!git update          → Verifica e aplica updates
!git config <url>    → Configura repositório
!git upload <cmd>    → Publica um comando específico
```

---

## 📱 Conectar ao WhatsApp

### Pairing Code (recomendado)

Ao iniciar, o bot pergunta se deseja conectar via Pairing Code:

```
📱 Conectar via Pairing Code? (s/n): s
📱 Número (ex: 5511999999999): 5511999999999

  ╔══════════════════════╗
  ║  CÓDIGO: ABC-12345   ║
  ╚══════════════════════╝
```

No WhatsApp: **Dispositivos Vinculados → Vincular com número de telefone**

### Via Painel Web

1. Acesse `http://localhost:3000`
2. Clique em **Conectar** na barra lateral
3. Informe seu número e clique **Gerar Código**

---

## 🌟 Sistema de Permissões

| Cargo | Acesso |
|-------|--------|
| 👑 Dono | Tudo — definido pelo `OWNER_NUMBER` no `.env` |
| 🌟 Sub-dono | Todos os comandos de dono |
| 💎 VIP | Sem cooldown + comandos extras |
| 👤 Usuário | Comandos normais |
| 🚫 Banido | Bloqueado completamente |

```
!subdono add 5511999999999        → Adicionar sub-dono
!subdono add 5511999999999 vip    → Adicionar VIP
!subdono remove 5511999999999     → Remover
!banir 5511999999999              → Banir
!desbanir 5511999999999           → Desbanir
```

---

## 🤖 Agente Manus

Agente autônomo que executa tarefas complexas usando ferramentas reais:

```
!agente pesquise o preço do Bitcoin agora
!agente qual é minha versão do Node?
!agente crie um comando que mostra piadas de programação
!agente corrija o erro no comando !ytmp3
!agente liste os arquivos na pasta src/commands
```

Ferramentas: web_search, http_get, exec_shell, read_file, write_file, create_command, fix_command

---

## 🔍 Detector de Código Automático

Quando o dono envia código JS no chat, o bot:

1. **Escaneia por malware** (regex + IA)
2. **Processa com Groq** → extrai nome, categoria, corrige se necessário
3. **Instala automaticamente** como comando
4. **Publica no GitHub** (se configurado)

```javascript
// Exemplo: envie isso no privado com o bot
export default {
  name: 'ola',
  aliases: ['hi'],
  description: 'Diz olá',
  category: 'fun',
  cooldown: 3,
  async execute({ reply, usuario }) {
    await reply(`Olá, ${usuario}! 👋`)
  }
}
```

---

## 📋 Todos os Comandos

### ⚙️ Core
`!menu`, `!ping`, `!info`, `!set`, `!alias`

### 🎉 Diversão
`!dado`, `!moeda`, `!escolher`, `!8ball`, `!piada`, `!sortear`, `!calc`, `!senha`, `!lembrete`, `!sorteio`, `!enquete`, `!vod`, `!aniversario`

### 🎮 Jogos
`!trivia`, `!forca`, `!roleta`, `!adivinhar`, `!contador`

### 🎬 Mídia
`!fig`, `!figurl`, `!toimg`, `!img`, `!gif`, `!meme`, `!pinterest`, `!yt`, `!ytmp3`, `!ytmp4`, `!tiktok`, `!ig`, `!tw`, `!letra`

### 🔍 Info
`!clima`, `!cep`, `!wiki`, `!traduzir`, `!ip`, `!qrcode`, `!hash`, `!encurtar`, `!calc`, `!senha`, `!moeda`, `!hora`, `!base64`, `!cnpj`, `!feriados`, `!noticias`, `!crypto`, `!dolar`, `!previsao`, `!sinonimos`

### 🤖 IA
`!ia`, `!resumo`, `!corrigir`, `!tts`

### 🛡️ Admin
`!tagall`, `!fechar`, `!abrir`, `!kick`, `!promover`, `!rebaixar`, `!nomegrupo`, `!admins`

### 👑 Dono/Sub-dono
`!agente` (Manus), `!git`, `!subdono`, `!banir`, `!desbanir`, `!minions`, `!verminion`, `!dm`, `!bcast`, `!exec`, `!eval`, `!npminstall`, `!delcmd`, `!recarregar`, `!stats`, `!bateria`, `!notif`, `!tts`, `!sysinfo`

---

## 🌐 Painel Web

Acesse `http://localhost:3000` (ou `http://IP:PORTA` da rede local)

**Abas:**
- **Dashboard** — estatísticas, top comandos, status
- **Comandos** — ativar/desativar, deletar, filtrar por categoria
- **Configurações** — nome, prefixo, chave Groq, personalidade da IA
- **Menu do Bot** — customiza bordas, ícones, emojis, foto, negrito/itálico
- **Criar Cmd IA** — descreve e a IA gera o código, ou edita manualmente
- **Minions** — todos usuários do bot, ban/unban, promover
- **Sub-Donos** — gerencia sub-donos e VIPs
- **Contribuições** — comandos criados para publicar no GitHub
- **Logs** — logs ao vivo filtráveis
- **Termux** — terminal web, ações rápidas, npm install, git push/update
- **Conectar** — Pairing Code via painel

---

## 🔧 Estrutura do Projeto

```
elyrabot/
├── index.js                 # Entrada principal
├── scripts/setup.js         # Wizard de configuração
├── .env                     # Suas credenciais (não comitar!)
├── .gitignore               # node_modules, auth/, data/, .env
├── data/                    # Banco de dados JSON (auto-criado)
│   ├── config.json
│   ├── erros-ia.txt         # Log de erros com análise da IA
│   └── ...
├── auth/                    # Sessão WhatsApp (não comitar!)
├── public/index.html        # Painel web
└── src/
    ├── env.js               # Carrega .env ANTES de tudo
    ├── config.js            # Configurações dinâmicas
    ├── handler.js           # Roteador de mensagens
    ├── loader.js            # Carregador de comandos
    ├── permissions.js       # Sistema de roles (dono/subdono/vip)
    ├── manus.js             # Agente autônomo com tool-calling
    ├── codeDetector.js      # Detecta código no chat
    ├── contributions.js     # Sistema de contribuições
    ├── github.js            # Auto-update e upload
    ├── errorTracker.js      # Detector de erros com IA
    ├── ai.js                # Integração Groq
    ├── dashboard.js         # Servidor web
    ├── database.js          # JSON DB
    └── commands/
        ├── core/            # menu, ping, info, set, alias
        ├── fun/             # dado, piada, jogos, social
        ├── games/           # trivia, forca, adivinhar
        ├── media/           # ytmp3, tiktok, instagram
        ├── info/            # clima, cep, crypto, noticias
        ├── admin/           # tagall, kick, promover
        └── owner/           # agente, git, subdono, exec
```

---

## ❓ Solução de Problemas

**Bot não identifica que sou o dono:**
```bash
# Verifique o OWNER_NUMBER no .env — use apenas dígitos, sem + ou espaços
echo $OWNER_NUMBER  # deve ser: 5511999999999
```

**EADDRINUSE (porta em uso):**
```bash
# Mata processo usando a porta
fuser -k 3000/tcp
# Ou mude a porta no .env: DASHBOARD_PORT=3001
```

**yt-dlp não encontrado:**
```bash
pip install yt-dlp
# Ou: pkg install yt-dlp
```

**GitHub: autenticação falhou:**
```bash
# Use URL com token:
# https://ghp_SEU_TOKEN@github.com/user/repo.git
# NÃO use: https://github.com/user/repo.git (sem token = sem push)
```

**Erro ao iniciar (module not found):**
```bash
npm install
```
