#!/bin/bash
# ============================================
# Script para configurar secrets no Google Cloud Run
# ============================================
# Este script ajuda a configurar variáveis de ambiente
# de forma segura no Google Cloud Run
#
# Uso:
#   1. Preencha as variáveis abaixo
#   2. Execute: bash scripts/setup-cloud-run-secrets.sh
#   3. Ou configure manualmente via Console
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 Google Cloud Run - Configuração de Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================
# CONFIGURAÇÕES DO PROJETO
# ============================================

# Nome do serviço no Cloud Run
SERVICE_NAME="leman-negocios-imobiliarios"

# Região do Cloud Run
REGION="us-central1"

# ID do projeto no Google Cloud
PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-YOUR_PROJECT_ID_HERE}"

# ============================================
# VALIDAÇÃO
# ============================================

if [ "$PROJECT_ID" = "YOUR_PROJECT_ID_HERE" ]; then
  echo -e "${RED}❌ ERRO: Configure GOOGLE_CLOUD_PROJECT_ID${NC}"
  echo -e "${YELLOW}   Execute: export GOOGLE_CLOUD_PROJECT_ID=seu-projeto-id${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Projeto: $PROJECT_ID${NC}"
echo -e "${GREEN}✅ Serviço: $SERVICE_NAME${NC}"
echo -e "${GREEN}✅ Região: $REGION${NC}"
echo ""

# ============================================
# FUNÇÃO AUXILIAR: Adicionar variável de ambiente
# ============================================

add_env_var() {
  local key=$1
  local value=$2
  local required=$3
  
  if [ -z "$value" ]; then
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ ERRO: $key é obrigatória${NC}"
      exit 1
    else
      echo -e "${YELLOW}⚠️  $key não configurada (opcional)${NC}"
      return
    fi
  fi
  
  echo -e "${BLUE}📝 Configurando $key...${NC}"
  ENV_VARS="$ENV_VARS,$key=$value"
}

# ============================================
# COLETAR VARIÁVEIS DE AMBIENTE
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔴 VARIÁVEIS OBRIGATÓRIAS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# DATABASE_URL (obrigatória)
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}📌 DATABASE_URL não encontrada${NC}"
  echo -e "${BLUE}   Formato: postgresql://postgres.[project-ref]:[password]@...pooler.supabase.com:6543/postgres${NC}"
  read -p "   Digite a DATABASE_URL: " DATABASE_URL
fi

# JWT_SECRET (obrigatória)
if [ -z "$JWT_SECRET" ]; then
  echo -e "${YELLOW}📌 JWT_SECRET não encontrada${NC}"
  echo -e "${BLUE}   Gerar com: openssl rand -base64 32${NC}"
  read -p "   Digite o JWT_SECRET: " JWT_SECRET
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🟡 VARIÁVEIS DE STORAGE (Recomendadas)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

read -p "Configurar Storage? (s/n): " configure_storage

if [ "$configure_storage" = "s" ]; then
  read -p "STORAGE_BUCKET: " STORAGE_BUCKET
  read -p "STORAGE_REGION (ex: us-east-1): " STORAGE_REGION
  read -p "STORAGE_ACCESS_KEY: " STORAGE_ACCESS_KEY
  read -p "STORAGE_SECRET_KEY: " STORAGE_SECRET_KEY
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🟢 VARIÁVEIS DE INTEGRAÇÃO (Opcionais)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

read -p "Configurar N8N? (s/n): " configure_n8n

if [ "$configure_n8n" = "s" ]; then
  read -p "N8N_LEAD_WEBHOOK_URL: " N8N_LEAD_WEBHOOK_URL
  read -p "N8N_WHATSAPP_WEBHOOK_URL: " N8N_WHATSAPP_WEBHOOK_URL
  read -p "N8N_API_KEY: " N8N_API_KEY
fi

# ============================================
# MONTAR STRING DE VARIÁVEIS
# ============================================

ENV_VARS="NODE_ENV=production,PORT=8080,VITE_APP_ID=leman-negocios-imobiliarios"

add_env_var "DATABASE_URL" "$DATABASE_URL" "true"
add_env_var "JWT_SECRET" "$JWT_SECRET" "true"

if [ -n "$STORAGE_BUCKET" ]; then
  add_env_var "STORAGE_BUCKET" "$STORAGE_BUCKET" "false"
  add_env_var "STORAGE_REGION" "$STORAGE_REGION" "false"
  add_env_var "STORAGE_ACCESS_KEY" "$STORAGE_ACCESS_KEY" "false"
  add_env_var "STORAGE_SECRET_KEY" "$STORAGE_SECRET_KEY" "false"
fi

if [ -n "$N8N_LEAD_WEBHOOK_URL" ]; then
  add_env_var "N8N_LEAD_WEBHOOK_URL" "$N8N_LEAD_WEBHOOK_URL" "false"
  add_env_var "N8N_WHATSAPP_WEBHOOK_URL" "$N8N_WHATSAPP_WEBHOOK_URL" "false"
  add_env_var "N8N_API_KEY" "$N8N_API_KEY" "false"
fi

# ============================================
# ATUALIZAR CLOUD RUN
# ============================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Atualizando Cloud Run Service${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

gcloud run services update $SERVICE_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --set-env-vars="$ENV_VARS" \
  --quiet

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Configuração concluída com sucesso!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${BLUE}📋 Próximos passos:${NC}"
  echo -e "   1. Verifique o serviço: gcloud run services describe $SERVICE_NAME --region=$REGION"
  echo -e "   2. Acesse a URL do serviço"
  echo -e "   3. Teste o health check: curl https://[URL]/health"
  echo ""
else
  echo -e "${RED}❌ Erro ao configurar Cloud Run${NC}"
  exit 1
fi
