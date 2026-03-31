# 🐙 GitHub — Configuração Passo a Passo

Integrar o ElyraBot ao GitHub permite:
- **Backup automático** do bot na nuvem
- **Sincronização** entre dispositivos
- **Auto-update** — receber novas versões automaticamente
- **Publicar comandos** criados pela IA diretamente no repositório

---

## 📋 Pré-requisitos

```bash
pkg install git   # No Termux (Android)
```

Verifique:
```bash
git --version
```

---

## 🔑 Parte 1 — Criar o Token de Acesso (PAT)

> O GitHub parou de aceitar senha. Você precisa de um **Personal Access Token (PAT)**.

### Passo 1 — Acesse as configurações
1. Abra [github.com](https://github.com) no navegador
2. Clique na sua foto → **Settings**

### Passo 2 — Vá em Developer Settings
1. Role até o final da barra lateral esquerda
2. Clique em **Developer settings**
3. Clique em **Personal access tokens** → **Tokens (classic)**

### Passo 3 — Gere o token
1. Clique em **Generate new token (classic)**
2. Preencha:
   - **Note:** `elyrabot` (ou qualquer nome)
   - **Expiration:** `No expiration` *(recomendado para bot)*
3. Em **Select scopes**, marque:
   - ✅ `repo` — **Full control of private repositories** *(obrigatório)*
4. Role até o final → clique **Generate token**

### Passo 4 — Copie o token
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
> ⚠️ **ATENÇÃO:** O token aparece apenas UMA VEZ. Copie e guarde!

---

## 📁 Parte 2 — Criar o Repositório

1. Em [github.com](https://github.com), clique em **+** → **New repository**
2. Configure:
   - **Repository name:** `elyrabot` (ou o nome que quiser)
   - **Private** ✅ *(recomendado — protege seu .env e dados)*
   - **Initialize with README:** ❌ NÃO marcar
3. Clique **Create repository**
4. Copie a URL do repositório:
   ```
   https://github.com/SEU_USUARIO/elyrabot.git
   ```

---

## ⚙️ Parte 3 — Configurar no Bot

### Via WhatsApp (recomendado)

**1. Configure o repositório:**
```
!git config https://github.com/SEU_USUARIO/elyrabot.git
```

**2. Configure o token:**
```
!git token ghp_SEU_TOKEN_AQUI
```

**3. Faça o primeiro push:**
```
!git push
```

### Via setup.js (antes de iniciar)

Quando rodar `npm run config`, responda:
```
URL do repositório GitHub: https://github.com/SEU_USUARIO/elyrabot.git
Token de acesso (PAT): ghp_SEU_TOKEN_AQUI
```

Ou edite o `.env` manualmente:
```env
GITHUB_REPO=https://github.com/SEU_USUARIO/elyrabot.git
GITHUB_REPO_WITH_TOKEN=https://ghp_TOKEN@github.com/SEU_USUARIO/elyrabot.git
GITHUB_TOKEN=ghp_TOKEN
AUTO_UPDATE=true
AUTO_UPLOAD=true
```

---

## 📱 Parte 4 — Usando via Dashboard

Na aba **Termux** do painel web:

| Botão | Ação |
|-------|------|
| **Push bot** | Envia todos os arquivos para o GitHub |
| **Verificar updates** | Busca e aplica commits novos |

---

## 🔄 Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `!git status` | Ver status e últimos commits |
| `!git push` | Enviar bot para o GitHub |
| `!git update` | Buscar e aplicar atualizações |
| `!git config <url>` | Configurar repositório |
| `!git token <tok>` | Definir token de acesso |
| `!git upload <cmd>` | Publicar um comando específico |

---

## 🔒 O que é enviado / ignorado

O arquivo `.gitignore` protege automaticamente:

| Ignorado ✅ | Enviado ✅ |
|------------|-----------|
| `.env` (senhas e chaves) | `src/` (código do bot) |
| `auth_info_multi/` (sessão WhatsApp) | `public/` (dashboard) |
| `data/` (banco de dados local) | `package.json` |
| `node_modules/` | `index.js` |
| `*.log` | `scripts/setup.js` |

> ⚠️ **Nunca** remova `.env` e `auth_info_multi/` do `.gitignore`!

---

## 🚀 Auto-Update

Com `AUTO_UPDATE=true` no `.env`, o bot verifica atualizações automaticamente a cada 6 horas.

**Como funciona:**
1. Busca commits novos no `origin/main`
2. Atualiza **apenas os arquivos do núcleo** (src/, index.js, public/)
3. **Nunca toca em** `src/commands/` — seus comandos personalizados estão seguros
4. Recarrega os comandos automaticamente após atualizar

---

## ❓ Problemas Comuns

### `Authentication failed` / `403`
- Token expirado ou sem permissão `repo`
- Use `!git token SEU_NOVO_TOKEN` para atualizar

### `Repository not found`
- URL incorreta ou repositório privado sem token
- Verifique em `!git status`

### `git: command not found`
```bash
pkg install git   # Termux
```

### Push falha na primeira vez
```
!git config https://github.com/SEU_USUARIO/elyrabot.git
!git token ghp_TOKEN
!git push
```

---

## 📞 Referências

- [Criar PAT — Documentação oficial](https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub Mobile](https://github.com/mobile) — Crie repositórios pelo celular
