#!/bin/bash
# ============================================
# SCRIPT DE DEPLOY - GOOGLE CLOUD RUN
# ============================================
# Leman Negócios Imobiliários
# Deploy automatizado para Cloud Run + Supabase
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Leman Negócios Imobiliários - Deploy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================
# CONFIGURAÇÕES
# ============================================

PROJECT_ID="project-5eb7e336-d45d-4f1a-99c"
SERVICE_NAME="leman-negocios-imobiliarios"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Variáveis de ambiente (lidas do .env.production)
DATABASE_URL="postgresql://postgres.mzirdgwsqsovvulqlktw:Leman@2026imob@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
JWT_SECRET="Eilxbxl5CLI/xlkb/q10nD++uE3KusI0JHH04nLF7PawsVYVjpsOVeVM/UcPOEBpY6IbCDA6b5EV0swudJQLNw=="

echo -e "${GREEN}✅ Projeto: $PROJECT_ID${NC}"
echo -e "${GREEN}✅ Serviço: $SERVICE_NAME${NC}"
echo -e "${GREEN}✅ Região: $REGION${NC}"
echo ""

# ============================================
# VALIDAÇÕES
# ============================================

echo -e "${YELLOW}🔍 Validando ambiente...${NC}"

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ ERRO: gcloud CLI não está instalado${NC}"
    echo -e "${YELLOW}   Instale em: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Verificar autenticação
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ ERRO: Você não está autenticado no gcloud${NC}"
    echo -e "${YELLOW}   Execute: gcloud auth login${NC}"
    exit 1
fi

# Configurar projeto
echo -e "${BLUE}📝 Configurando projeto...${NC}"
gcloud config set project $PROJECT_ID

echo -e "${GREEN}✅ Validações concluídas${NC}"
echo ""

# ============================================
# BUILD DA IMAGEM DOCKER
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🐳 Etapa 1: Build da Imagem Docker${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏳ Fazendo build da imagem (isso pode levar 5-10 minutos)...${NC}"

gcloud builds submit --tag $IMAGE_NAME \
  --project=$PROJECT_ID \
  --timeout=20m

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
else
  echo -e "${RED}❌ Erro no build da imagem${NC}"
  exit 1
fi

echo ""

# ============================================
# DEPLOY NO CLOUD RUN
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}☁️  Etapa 2: Deploy no Cloud Run${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏳ Fazendo deploy do serviço...${NC}"

gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=8080,VITE_APP_ID=leman-negocios-imobiliarios,DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0 \
  --concurrency=80

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # Obter URL do serviço
  SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
  
  echo -e "${BLUE}📋 Informações do Deploy:${NC}"
  echo -e "   🌐 URL do Serviço: ${GREEN}$SERVICE_URL${NC}"
  echo -e "   🏥 Health Check: ${GREEN}$SERVICE_URL/health${NC}"
  echo -e "   📊 Console: ${BLUE}https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME${NC}"
  echo ""
  
  echo -e "${YELLOW}🧪 Testando health check...${NC}"
  sleep 5
  
  if curl -s "$SERVICE_URL/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passou! Sistema está online!${NC}"
  else
    echo -e "${YELLOW}⚠️  Health check falhou. Verifique os logs.${NC}"
  fi
  
  echo ""
  echo -e "${BLUE}📝 Próximos passos:${NC}"
  echo -e "   1. Acesse: $SERVICE_URL"
  echo -e "   2. Configure domínio customizado (opcional)"
  echo -e "   3. Configure Storage para upload de imagens"
  echo -e "   4. Configure N8N para WhatsApp (opcional)"
  echo ""
  
else
  echo -e "${RED}❌ Erro no deploy${NC}"
  echo -e "${YELLOW}   Verifique os logs: gcloud run services logs read $SERVICE_NAME --region=$REGION${NC}"
  exit 1
fi
