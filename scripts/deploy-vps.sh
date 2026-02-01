#!/bin/bash
# ============================================
# SCRIPT DE DEPLOY COMPLETO - VPS
# ============================================
# Leman Negócios Imobiliários
# Deploy automatizado na VPS com Docker
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Deploy Leman Negócios Imobiliários${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

# Verificar .env.production
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Arquivo .env.production não encontrado${NC}"
    echo -e "${YELLOW}   Crie o arquivo com as credenciais necessárias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pré-requisitos verificados${NC}"
echo ""

# ============================================
# ETAPA 1: PARAR CONTAINERS ANTIGOS
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🛑 Etapa 1: Parar Containers Antigos${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if docker ps -a | grep -q leman-app; then
    echo -e "${YELLOW}⏳ Parando containers...${NC}"
    docker compose down || true
    echo -e "${GREEN}✅ Containers parados${NC}"
else
    echo -e "${YELLOW}⚠️  Nenhum container em execução${NC}"
fi

echo ""

# ============================================
# ETAPA 2: LIMPAR IMAGENS ANTIGAS
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧹 Etapa 2: Limpar Imagens Antigas${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏳ Removendo imagens antigas...${NC}"
docker system prune -f
echo -e "${GREEN}✅ Limpeza concluída${NC}"

echo ""

# ============================================
# ETAPA 3: BUILD DA IMAGEM
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🐳 Etapa 3: Build da Imagem Docker${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏳ Fazendo build (isso pode levar 5-10 minutos)...${NC}"
docker compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build concluído${NC}"
else
    echo -e "${RED}❌ Erro no build${NC}"
    exit 1
fi

echo ""

# ============================================
# ETAPA 4: INICIAR APLICAÇÃO
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Etapa 4: Iniciar Aplicação${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏳ Iniciando containers...${NC}"
docker compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Aplicação iniciada${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar aplicação${NC}"
    exit 1
fi

echo ""

# ============================================
# ETAPA 5: VERIFICAR SAÚDE
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏥 Etapa 5: Verificar Saúde da Aplicação${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏳ Aguardando aplicação iniciar (30s)...${NC}"
sleep 30

echo -e "${YELLOW}⏳ Testando health check...${NC}"
if curl -s http://localhost:5000/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passou!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check falhou. Verificando logs...${NC}"
    docker compose logs --tail=50 app
fi

echo ""

# ============================================
# RESUMO FINAL
# ============================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📋 Status dos Containers:${NC}"
docker compose ps

echo ""
echo -e "${BLUE}📝 Comandos úteis:${NC}"
echo -e "   • Ver logs: ${GREEN}docker compose logs -f app${NC}"
echo -e "   • Parar: ${GREEN}docker compose down${NC}"
echo -e "   • Reiniciar: ${GREEN}docker compose restart${NC}"
echo -e "   • Health check: ${GREEN}curl http://localhost:5000/health${NC}"
echo ""

echo -e "${BLUE}🌐 Acesso:${NC}"
echo -e "   • Local: ${GREEN}http://localhost:5000${NC}"
echo -e "   • Domínio: ${GREEN}https://leman.casadf.com.br${NC}"
echo ""

echo -e "${GREEN}🎉 Sistema está online!${NC}"
