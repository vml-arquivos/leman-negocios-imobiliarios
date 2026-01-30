#!/bin/bash

# ============================================
# SCRIPT DE LIMPEZA E DEPLOY LIMPO - DOCKER
# Leman Negócios Imobiliários
# Versão para VPS com Docker (sem pnpm)
# ============================================

set -e  # Para em caso de erro

echo "============================================"
echo "🧹 INICIANDO LIMPEZA COMPLETA DO SISTEMA"
echo "============================================"
echo ""

# ============================================
# 1. PARAR CONTAINERS
# ============================================
echo "📦 [1/8] Parando containers Docker..."
docker compose down || true
echo "✅ Containers parados"
echo ""

# ============================================
# 2. LIMPAR DOCKER
# ============================================
echo "🐳 [2/8] Limpando Docker..."

# Remover containers parados
echo "  - Removendo containers parados..."
docker container prune -f || true

# Remover imagens não usadas
echo "  - Removendo imagens não usadas..."
docker image prune -a -f || true

# Remover volumes não usados
echo "  - Removendo volumes não usados..."
docker volume prune -f || true

# Remover redes não usadas
echo "  - Removendo redes não usadas..."
docker network prune -f || true

# Limpar cache de build
echo "  - Limpando cache de build..."
docker builder prune -a -f || true

echo "✅ Docker limpo"
echo ""

# ============================================
# 3. ATUALIZAR CÓDIGO DO GITHUB
# ============================================
echo "📥 [3/8] Atualizando código do GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main
echo "✅ Código atualizado"
echo ""

# ============================================
# 4. LIMPAR ARQUIVOS DE BUILD LOCAIS
# ============================================
echo "🗑️  [4/8] Removendo arquivos de build antigos..."
rm -rf dist
rm -rf .next
rm -rf .turbo
rm -rf client/dist
rm -rf server/dist
rm -rf .vite
rm -rf client/.vite
echo "✅ Arquivos de build removidos"
echo ""

# ============================================
# 5. VERIFICAR ESPAÇO EM DISCO
# ============================================
echo "💾 [5/8] Verificando espaço em disco..."
df -h / | tail -1
echo ""

# ============================================
# 6. LIMPAR LOGS ANTIGOS (opcional)
# ============================================
echo "📋 [6/8] Limpando logs antigos..."
find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
echo "✅ Logs antigos removidos"
echo ""

# ============================================
# 7. BUILD LIMPO COM DOCKER
# ============================================
echo "🔨 [7/8] Fazendo build limpo com Docker..."
docker compose build --no-cache
echo "✅ Build concluído"
echo ""

# ============================================
# 8. SUBIR CONTAINERS
# ============================================
echo "🚀 [8/8] Subindo containers..."
docker compose up -d
echo "✅ Containers iniciados"
echo ""

# ============================================
# AGUARDAR CONTAINERS INICIAREM
# ============================================
echo "⏳ Aguardando containers iniciarem..."
sleep 15

# ============================================
# VERIFICAR STATUS
# ============================================
echo ""
echo "============================================"
echo "📊 STATUS DOS CONTAINERS"
echo "============================================"
docker compose ps
echo ""

# ============================================
# VERIFICAR LOGS
# ============================================
echo "============================================"
echo "📋 ÚLTIMAS LINHAS DOS LOGS"
echo "============================================"
docker compose logs --tail=30
echo ""

# ============================================
# INFORMAÇÕES FINAIS
# ============================================
echo "============================================"
echo "✅ LIMPEZA E DEPLOY CONCLUÍDOS COM SUCESSO!"
echo "============================================"
echo ""
echo "📊 Espaço em disco:"
df -h / | tail -1
echo ""
echo "🐳 Containers rodando:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🌐 Acesse o sistema em:"
echo "   https://leman.casadf.com.br"
echo ""
echo "📝 Para ver os logs em tempo real:"
echo "   docker compose logs -f"
echo ""
echo "🔄 Para reiniciar um serviço:"
echo "   docker compose restart app"
echo ""
echo "============================================"
