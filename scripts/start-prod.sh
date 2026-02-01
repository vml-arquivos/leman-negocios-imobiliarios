#!/bin/sh
# ============================================
# Script de Inicialização para Produção
# ============================================
# Supabase Transaction Pooler - Porta 6543

set -e

echo "🚀 Iniciando Leman Negócios Imobiliários..."

# Verificar variáveis de ambiente obrigatórias
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: DATABASE_URL não está configurada"
  exit 1
fi

echo "✅ Variáveis de ambiente validadas"
echo "📦 Conectando ao Supabase via Transaction Pooler (Porta 6543)..."

# Iniciar servidor
echo "🌐 Iniciando servidor na porta ${PORT:-8080}..."
node dist/server/index.js
