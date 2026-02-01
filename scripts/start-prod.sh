#!/bin/sh
# ============================================
# Script de Inicialização para Cloud Run + Supabase
# ============================================
# Este script sincroniza o schema com Supabase e inicia o servidor

set -e

echo "🚀 Iniciando Leman Negócios Imobiliários (Cloud Run + Supabase)..."

# Verificar variáveis de ambiente obrigatórias
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: DATABASE_URL não está configurada"
  exit 1
fi

echo "✅ Variáveis de ambiente validadas"

# Sincronizar schema com Supabase usando drizzle-kit push
echo "📦 Sincronizando schema com Supabase..."
npx drizzle-kit push --force

echo "✅ Schema sincronizado com sucesso"

# Iniciar servidor
echo "🌐 Iniciando servidor na porta ${PORT:-8080}..."
node dist/server/index.js
