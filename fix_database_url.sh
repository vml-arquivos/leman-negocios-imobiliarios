#!/bin/bash
# ============================================
# SCRIPT DE CORREÇÃO AUTOMÁTICA DE DATABASE_URL
# ============================================
# Corrige:
# 1. Senha com @ → %40 (URL encoding)
# 2. Porta 5432 → 6543 (Supabase Transaction Pooler)
# ============================================

set -e

echo "🔧 Iniciando correção automática de DATABASE_URL..."

# Arquivos a serem corrigidos
FILES=(
  ".env"
  ".env.production"
  ".env.production.example"
  ".env.production.fixed"
  ".env.production.template"
  ".env.example"
  ".env.supabase.example"
  "docker-compose.yml"
)

# Backup
echo "📦 Criando backup..."
mkdir -p .backup_$(date +%Y%m%d_%H%M%S)
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" ".backup_$(date +%Y%m%d_%H%M%S)/$file" 2>/dev/null || true
  fi
done

# Função de correção
fix_database_url() {
  local file=$1
  
  if [ ! -f "$file" ]; then
    echo "⏭️  Arquivo não existe: $file"
    return
  fi
  
  echo "🔍 Processando: $file"
  
  # 1. URL encode @ na senha (entre : e @host)
  # Padrão: postgresql://user:senha@host → postgresql://user:senha%40host
  sed -i.bak -E 's|(postgresql://[^:]+:)([^@]+)@([^@]+@)|\1\2%40\3|g' "$file"
  
  # 2. Substituir porta 5432 por 6543
  sed -i.bak 's/:5432\//:6543\//g' "$file"
  
  # 3. Adicionar ?pgbouncer=true se porta 6543 e não tiver
  sed -i.bak -E 's|:6543/([^?]+)$|:6543/\1?pgbouncer=true|g' "$file"
  sed -i.bak -E 's|:6543/([^?]+)\?([^p])|:6543/\1?pgbouncer=true\&\2|g' "$file"
  
  rm -f "$file.bak"
  echo "✅ Corrigido: $file"
}

# Aplicar correções
for file in "${FILES[@]}"; do
  fix_database_url "$file"
done

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique o arquivo .env:"
echo "   cat .env | grep DATABASE_URL"
echo ""
echo "2. Reinicie o Docker:"
echo "   docker compose down && docker compose up -d"
echo ""
echo "3. Teste o health check:"
echo "   curl http://localhost:5000/health"
