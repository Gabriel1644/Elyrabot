# 📱 ElyraBot — Guia de Instalação no Termux

## ✅ Pré-requisitos

### 1. Instalar dependências do sistema
```bash
pkg update && pkg upgrade -y
pkg install nodejs python ffmpeg git -y
pip install yt-dlp
```

### 2. Verificar versões (mínimas recomendadas)
```bash
node -v        # >= 18.x
python --version   # >= 3.10
yt-dlp --version
ffmpeg -version
```

---

## 🚀 Instalação do Bot

```bash
# Entrar na pasta do bot
cd elyrabot

# Instalar dependências Node.js
npm install

# Copiar e configurar o .env
cp .env.example .env
nano .env
```

### Configuração do `.env`
```env
GROQ_API_KEY=sua_chave_groq_aqui   # https://console.groq.com
OWNER_NUMBER=5511999999999          # Seu número com DDI
DASHBOARD_PORT=3000
PREFIX=!
```

---

## ▶️ Iniciar o Bot

```bash
node index.js
```

Acesse o Dashboard em: `http://localhost:3000`
No celular: `http://127.0.0.1:3000`

---

## 🎬 Comandos de Mídia (usando yt-dlp)

| Comando | O que faz |
|---------|-----------|
| `!yt <busca>` | Busca vídeos no YouTube (lista 5 resultados) |
| `!yt <URL>` | Informações de um vídeo específico |
| `!ytmp3 <URL/nome>` | Baixa e envia o áudio (MP3) |
| `!ytmp4 <URL/nome>` | Baixa e envia o vídeo (480p) |
| `!ytinfo <URL>` | Info detalhada de um vídeo |
| `!tiktok <URL>` | Baixa TikTok sem marca d'água |
| `!ig <URL>` | Baixa foto/vídeo do Instagram |
| `!tw <URL>` | Baixa vídeo do Twitter/X |
| `!ytdlp` | Verifica status do yt-dlp e ffmpeg |

> ⚠️ `!ytmp3` e `!ytmp4` requerem `yt-dlp` e `ffmpeg` instalados no sistema.

---

## 🔄 Manter yt-dlp atualizado

O YouTube muda frequentemente. Mantenha o yt-dlp atualizado:

```bash
pip install -U yt-dlp
```

---

## 🛠️ Problemas comuns

**"yt-dlp não encontrado"**
```bash
pip install yt-dlp
# ou
pip3 install yt-dlp
```

**Erro de memória ao baixar vídeo**
- Use `!ytmp3` em vez de `!ytmp4` (áudio usa muito menos memória)
- Vídeos longos (> 10 min) podem falhar no Termux por limite de RAM

**Erro ao criar figurinha / sticker**
```bash
pkg install imagemagick
```

**Bot desconecta frequentemente**
- Normal no Termux; o bot reconecta automaticamente
- Mantenha o Termux ativo (desative sleep do Android para o app)

---

## 🔑 Comandos do Bot

Envie `!menu` no WhatsApp para ver todos os comandos disponíveis.
