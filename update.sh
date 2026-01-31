#!/bin/bash

# ============================================
# SCRIPT DE ATUALIZAÇÃO RÁPIDA
# Leman Negócios Imobiliários
# ============================================

echo "🚀 ATUALIZAÇÃO RÁPIDA - LEMAN NEGÓCIOS IMOBILIÁRIOS"
echo "====================================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Git Pull
echo -e "${YELLOW}📦 1. Atualizando código...${NC}"
git pull origin main
echo -e "${GREEN}✅ Código atualizado${NC}"
echo ""

# 2. Migration do banco
echo -e "${YELLOW}🗄️  2. Aplicando migration...${NC}"
docker exec leman-postgres psql -U leman_user -d leman_db -c "ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'geladeira';" 2>/dev/null || echo "Migration já aplicada ou erro"
echo -e "${GREEN}✅ Migration verificada${NC}"
echo ""

# 3. Rebuild
echo -e "${YELLOW}🔨 3. Rebuilding...${NC}"
docker compose down
docker compose build --no-cache
docker compose up -d
echo -e "${GREEN}✅ Containers reiniciados${NC}"
echo ""

# 4. Status
echo -e "${YELLOW}📊 4. Status:${NC}"
docker compose ps
echo ""

echo -e "${GREEN}✅ ATUALIZAÇÃO CONCLUÍDA!${NC}"
echo "🌐 http://174.138.78.197"
echo ""
