#!/bin/sh
# ============================================
# Script de Inicialização para Produção
# ============================================
# Este script executa migrations e inicia o servidor

set -e

echo "🚀 Iniciando Leman Negócios Imobiliários..."

# Verificar variáveis de ambiente obrigatórias
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: DATABASE_URL não está configurada"
  exit 1
fi

echo "✅ Variáveis de ambiente validadas"

# Executar migrations do banco de dados
echo "📦 Executando migrations do banco de dados..."
pnpm db:migrate

echo "✅ Migrations executadas com sucesso"

# Iniciar servidor
echo "🌐 Iniciando servidor na porta ${PORT:-5000}..."
node dist/server/index.js
