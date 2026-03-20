#!/bin/bash
# ╔══════════════════════════════════════════╗
# ║   Kaius Bot — Upload para GitHub         ║
# ║   Uso: bash upar.sh                      ║
# ╚══════════════════════════════════════════╝

# Cores
G='\033[92m'; Y='\033[93m'; R='\033[91m'; W='\033[0m'; B='\033[94m'

echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${W}"
echo -e "${G}  🤖 Kaius Bot — Upload GitHub${W}"
echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${W}"

# Vai para a pasta do script (mesmo se chamado de outro lugar)
cd "$(dirname "$0")"

# Verifica se git está instalado
if ! command -v git &>/dev/null; then
  echo -e "${R}✗ Git não instalado. Rode: pkg install git${W}"
  exit 1
fi

# Lê o .env para pegar o token/repo
if [ ! -f ".env" ]; then
  echo -e "${R}✗ Arquivo .env não encontrado!${W}"
  exit 1
fi

REPO_URL=$(grep "GITHUB_REPO_WITH_TOKEN=" .env | cut -d'=' -f2-)
if [ -z "$REPO_URL" ]; then
  REPO_URL=$(grep "GITHUB_REPO=" .env | cut -d'=' -f2-)
fi

if [ -z "$REPO_URL" ]; then
  echo -e "${R}✗ GITHUB_REPO não configurado no .env${W}"
  exit 1
fi

echo -e "${Y}▸ Repositório: ${REPO_URL//*@/}${W}"  # esconde o token no log

# Inicia o git se necessário
if [ ! -d ".git" ]; then
  echo -e "${Y}▸ Inicializando repositório...${W}"
  git init
  git branch -M main
fi

# Configura o remote
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"

# Configura nome/email (ignora erro se git config falhar)
git config user.name  "KaiusBot"  2>/dev/null || true
git config user.email "bot@kaius.local" 2>/dev/null || true

# Cria .gitignore se não existir
if [ ! -f ".gitignore" ]; then
  cat > .gitignore << 'EOF'
node_modules/
auth/
auth_info_multi/
data/
session/
*.log
.env
EOF
  echo -e "${Y}▸ .gitignore criado${W}"
fi

# Adiciona tudo e commita
echo -e "${Y}▸ Adicionando arquivos...${W}"
git add -A

# Verifica se tem algo para commitar
if git diff --cached --quiet; then
  echo -e "${G}✓ Nenhuma mudança nova. Já está atualizado!${W}"
else
  MSG="${1:-🤖 Update $(date '+%d/%m/%Y %H:%M')}"
  git commit -m "$MSG"
  echo -e "${Y}▸ Commit: ${MSG}${W}"
fi

# Faz o push
echo -e "${Y}▸ Enviando para o GitHub...${W}"
if git push -u origin main --force 2>&1; then
  echo ""
  echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${W}"
  echo -e "${G}  ✓ Bot enviado com sucesso!${W}"
  echo -e "${G}  🔗 ${REPO_URL//*@/https:\/\/github.com\/}${W}"
  echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${W}"
else
  echo ""
  echo -e "${R}  ✗ Falha no push!${W}"
  echo -e "${Y}  Dicas:${W}"
  echo -e "  • Verifique GITHUB_REPO_WITH_TOKEN no .env"
  echo -e "  • Token precisa ter permissão 'repo'"
  echo -e "  • Gere em: github.com/settings/tokens"
  exit 1
fi
