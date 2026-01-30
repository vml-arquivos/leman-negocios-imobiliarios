#!/bin/bash

# ============================================
# SCRIPT DE LIMPEZA E DEPLOY LIMPO
# Leman Negócios Imobiliários
# ============================================

set -e  # Para em caso de erro

echo "============================================"
echo "🧹 INICIANDO LIMPEZA COMPLETA DO SISTEMA"
echo "============================================"
echo ""

# ============================================
# 1. PARAR CONTAINERS
# ============================================
echo "📦 [1/10] Parando containers Docker..."
docker compose down || true
echo "✅ Containers parados"
echo ""

# ============================================
# 2. LIMPAR DOCKER
# ============================================
echo "🐳 [2/10] Limpando Docker..."

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
echo "📥 [3/10] Atualizando código do GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main
echo "✅ Código atualizado"
echo ""

# ============================================
# 4. LIMPAR NODE_MODULES
# ============================================
echo "📦 [4/10] Removendo node_modules..."
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
echo "✅ node_modules removidos"
echo ""

# ============================================
# 5. LIMPAR CACHE DO PNPM
# ============================================
echo "🗑️  [5/10] Limpando cache do pnpm..."
pnpm store prune || true
echo "✅ Cache do pnpm limpo"
echo ""

# ============================================
# 6. LIMPAR ARQUIVOS DE BUILD
# ============================================
echo "🗑️  [6/10] Removendo arquivos de build antigos..."
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
# 7. LIMPAR LOCKFILES ANTIGOS
# ============================================
echo "🔒 [7/10] Limpando lockfiles..."
rm -f package-lock.json
rm -f yarn.lock
# Manter pnpm-lock.yaml
echo "✅ Lockfiles limpos"
echo ""

# ============================================
# 8. REINSTALAR DEPENDÊNCIAS
# ============================================
echo "📦 [8/10] Reinstalando dependências limpas..."
pnpm install --frozen-lockfile
echo "✅ Dependências instaladas"
echo ""

# ============================================
# 9. BUILD LIMPO
# ============================================
echo "🔨 [9/10] Fazendo build limpo..."
pnpm run build
echo "✅ Build concluído"
echo ""

# ============================================
# 10. SUBIR CONTAINERS LIMPOS
# ============================================
echo "🚀 [10/10] Subindo containers com build limpo..."
docker compose up --build -d
echo "✅ Containers iniciados"
echo ""

# ============================================
# AGUARDAR CONTAINERS INICIAREM
# ============================================
echo "⏳ Aguardando containers iniciarem..."
sleep 10

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
docker compose logs --tail=20
echo ""

# ============================================
# INFORMAÇÕES FINAIS
# ============================================
echo "============================================"
echo "✅ LIMPEZA E DEPLOY CONCLUÍDOS COM SUCESSO!"
echo "============================================"
echo ""
echo "📊 Espaço em disco liberado:"
df -h / | tail -1
echo ""
echo "🐳 Imagens Docker:"
docker images | grep leman || echo "Nenhuma imagem local (usando registry)"
echo ""
echo "📦 Containers rodando:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🌐 Acesse o sistema em:"
echo "   https://leman.casadf.com.br"
echo ""
echo "📝 Para ver os logs em tempo real:"
echo "   docker compose logs -f"
echo ""
echo "============================================"
