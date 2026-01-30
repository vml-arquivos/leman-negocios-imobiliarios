#!/bin/bash

# ============================================
# SCRIPT DE LIMPEZA RÁPIDA
# Leman Negócios Imobiliários
# ============================================

set -e

echo "============================================"
echo "🧹 LIMPEZA RÁPIDA + DEPLOY"
echo "============================================"
echo ""

# Parar containers
echo "📦 Parando containers..."
docker compose down

# Limpar cache do Docker
echo "🐳 Limpando cache do Docker..."
docker builder prune -f

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Build e subir
echo "🚀 Fazendo build e subindo containers..."
docker compose up --build -d

# Aguardar
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Status
echo ""
echo "✅ Deploy concluído!"
docker compose ps

echo ""
echo "🌐 Acesse: https://leman.casadf.com.br"
