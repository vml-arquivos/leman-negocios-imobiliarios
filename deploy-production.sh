#!/bin/bash

# ==================================
# SCRIPT DE DEPLOY PERMANENTE
# Leman Negócios Imobiliários
# Google Cloud VPS - Ubuntu
# ==================================

set -e  # Exit on error

echo "🚀 Deploy Permanente - Leman Negócios Imobiliários"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "Arquivo docker-compose.prod.yml não encontrado!"
    log_error "Execute este script no diretório raiz do projeto"
    exit 1
fi

# ==================================
# 1. VERIFICAR DOCKER
# ==================================
log_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado!"
    log_warn "Instale com: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não está instalado!"
    exit 1
fi

# ==================================
# 2. VERIFICAR .ENV
# ==================================
if [ ! -f ".env" ]; then
    log_warn "Arquivo .env não encontrado. Criando..."
    cp .env.example .env
    
    # Gerar senhas seguras
    DB_PASS=$(openssl rand -base64 24)
    REDIS_PASS=$(openssl rand -base64 24)
    SESSION_SECRET=$(openssl rand -base64 48)
    JWT_SECRET=$(openssl rand -base64 48)
    
    # Atualizar .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
    sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASS/" .env
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    
    log_warn "Configure o domínio e outras variáveis no .env antes de continuar!"
    log_warn "Arquivo: $(pwd)/.env"
    exit 1
fi

log_info "Arquivo .env encontrado"

# ==================================
# 3. PARAR CONTAINERS ANTIGOS
# ==================================
log_info "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# ==================================
# 4. LIMPAR RECURSOS ANTIGOS
# ==================================
read -p "Limpar imagens antigas? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    log_info "Limpando imagens antigas..."
    docker system prune -af --volumes
fi

# ==================================
# 5. BUILD DAS IMAGENS
# ==================================
log_info "Fazendo build das imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# ==================================
# 6. INICIAR CONTAINERS
# ==================================
log_info "Iniciando containers em modo produção..."
docker-compose -f docker-compose.prod.yml up -d

# ==================================
# 7. AGUARDAR SERVIÇOS
# ==================================
log_info "Aguardando serviços iniciarem..."
sleep 15

# ==================================
# 8. EXECUTAR MIGRATIONS
# ==================================
log_info "Executando migrations do banco de dados..."
docker-compose -f docker-compose.prod.yml exec -T app pnpm db:push

# ==================================
# 9. SEED (OPCIONAL)
# ==================================
read -p "Popular banco com dados de exemplo? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    log_info "Populando banco de dados..."
    docker-compose -f docker-compose.prod.yml exec -T app npx tsx scripts/seed-leman-demo.ts
fi

# ==================================
# 10. VERIFICAR STATUS
# ==================================
log_info "Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

# ==================================
# 11. TESTAR APLICAÇÃO
# ==================================
log_info "Testando aplicação..."
sleep 5

if curl -f http://localhost:5000/api/trpc/system.health > /dev/null 2>&1; then
    log_info "Aplicação está respondendo!"
else
    log_warn "Aplicação pode não estar respondendo ainda. Aguarde alguns segundos."
fi

# ==================================
# FINALIZAÇÃO
# ==================================
echo ""
echo "=========================================="
log_info "Deploy Permanente Concluído!"
echo "=========================================="
echo ""
log_info "Aplicação rodando em: http://$(hostname -I | awk '{print $1}'):5000"
log_info "Nginx rodando em: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📝 Comandos Úteis:"
echo "   Ver logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo "   Ver logs app:  docker-compose -f docker-compose.prod.yml logs -f app"
echo "   Parar tudo:    docker-compose -f docker-compose.prod.yml down"
echo "   Reiniciar:     docker-compose -f docker-compose.prod.yml restart"
echo "   Status:        docker-compose -f docker-compose.prod.yml ps"
echo ""
log_warn "⚠️  Próximos Passos:"
echo "   1. Configure o DNS do domínio para apontar para este servidor"
echo "   2. Configure SSL com: sudo certbot --nginx -d seudominio.com"
echo "   3. Ajuste variáveis de produção no .env"
echo "   4. Configure backups do banco de dados"
echo "   5. Configure monitoramento (opcional)"
echo ""
