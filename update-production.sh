#!/bin/bash

echo "=========================================="
echo "🚀 ATUALIZAÇÃO DO SISTEMA EM PRODUÇÃO"
echo "=========================================="
echo ""

# 1. Parar containers
echo "📦 Parando containers..."
docker compose down

# 2. Fazer backup do .env.production atual
echo "💾 Fazendo backup do .env.production..."
if [ -f .env.production ]; then
  cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
fi

# 3. Atualizar código do GitHub
echo "📥 Atualizando código do GitHub..."
git pull origin main

# 4. Atualizar .env.production com HTTPS
echo "🔧 Atualizando variáveis de ambiente..."
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5000
BASE_URL=https://leman.casadf.com.br
VITE_API_URL=https://leman.casadf.com.br

DATABASE_URL=postgresql://leman_user:leman_password@postgres:5432/leman_db

REDIS_URL=redis://redis:6379

SESSION_SECRET=xK9mP2vL8qR5tN3wY7jH4fD6sA1gB0cE9uI8oP7mN6lK5jH4fD3sA2gB1cE0
JWT_SECRET=zM8nQ3wK7rT4pL2vN6yJ9hG5fD1sA0bC8eI7oU6mP5lK4jH3fD2sA1gB0cE9

STORAGE_TYPE=local
LOG_LEVEL=info
EOF

# 5. Reconstruir e iniciar containers
echo "🔨 Reconstruindo containers..."
docker compose up --build -d

# 6. Aguardar 30 segundos
echo "⏳ Aguardando containers iniciarem..."
sleep 30

# 7. Verificar status
echo ""
echo "=========================================="
echo "📊 STATUS DOS CONTAINERS"
echo "=========================================="
docker compose ps

echo ""
echo "=========================================="
echo "📝 LOGS DA APLICAÇÃO (últimas 20 linhas)"
echo "=========================================="
docker compose logs app --tail=20

echo ""
echo "=========================================="
echo "✅ ATUALIZAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "🌐 Acesse: https://leman.casadf.com.br"
echo ""
