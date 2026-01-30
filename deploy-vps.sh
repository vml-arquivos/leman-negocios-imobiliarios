#!/bin/bash

# ============================================
# LEMAN NEGÓCIOS IMOBILIÁRIOS
# Script de Deploy para VPS (DigitalOcean/GCP)
# ============================================

set -e # Exit on error

echo "🚀 Iniciando deploy do Leman Negócios Imobiliários..."

# ============================================
# Configurações
# ============================================
APP_NAME="leman-imoveis"
APP_DIR="/opt/leman-imoveis"
BACKUP_DIR="/opt/leman-backups"
LOG_FILE="/var/log/leman-deploy.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Funções
# ============================================
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

# ============================================
# Verificar se está rodando como root
# ============================================
if [ "$EUID" -ne 0 ]; then
  error "Este script precisa ser executado como root. Use: sudo ./deploy-vps.sh"
fi

# ============================================
# 1. Atualizar sistema
# ============================================
log "📦 Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq

# ============================================
# 2. Instalar dependências
# ============================================
log "📦 Instalando dependências..."
apt-get install -y -qq \
  curl \
  git \
  wget \
  unzip \
  ca-certificates \
  gnupg \
  lsb-release \
  ufw \
  fail2ban \
  certbot \
  python3-certbot-nginx

# ============================================
# 3. Instalar Docker
# ============================================
if ! command -v docker &> /dev/null; then
  log "🐳 Instalando Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  systemctl enable docker
  systemctl start docker
else
  log "✅ Docker já instalado"
fi

# ============================================
# 4. Instalar Docker Compose
# ============================================
if ! command -v docker-compose &> /dev/null; then
  log "🐳 Instalando Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
else
  log "✅ Docker Compose já instalado"
fi

# ============================================
# 5. Configurar Firewall
# ============================================
log "🔥 Configurando firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw reload

# ============================================
# 6. Criar diretórios
# ============================================
log "📁 Criando diretórios..."
mkdir -p "$APP_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p /var/log/leman
mkdir -p /opt/leman-imoveis/uploads
mkdir -p /opt/leman-imoveis/logs

# ============================================
# 7. Clonar/Atualizar repositório
# ============================================
if [ -d "$APP_DIR/.git" ]; then
  log "🔄 Atualizando repositório..."
  cd "$APP_DIR"
  git pull origin main
else
  log "📥 Clonando repositório..."
  git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git "$APP_DIR"
  cd "$APP_DIR"
fi

# ============================================
# 8. Configurar variáveis de ambiente
# ============================================
if [ ! -f "$APP_DIR/.env" ]; then
  log "⚙️ Configurando variáveis de ambiente..."
  
  # Gerar senhas seguras
  POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
  REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
  JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
  SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
  COOKIE_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
  
  # Criar arquivo .env
  cat > "$APP_DIR/.env" << EOF
# Gerado automaticamente em $(date)
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://leman_user:${POSTGRES_PASSWORD}@postgres:5432/leman_imoveis
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# Security
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

# Application
PUBLIC_URL=https://$(hostname -I | awk '{print $1}')
COMPANY_NAME="Leman Negócios Imobiliários"
COMPANY_PHONE="(61) 99868-7245"
COMPANY_WHATSAPP="5561998687245"
COMPANY_EMAIL="contato@lemanimoveis.com.br"

# N8N (Configure depois)
N8N_BASE_URL=
N8N_API_KEY=

# OpenAI (Configure depois)
OPENAI_API_KEY=

# WhatsApp (Configure depois)
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
EOF

  log "✅ Arquivo .env criado. IMPORTANTE: Configure as integrações!"
  warn "Senhas geradas e salvas em $APP_DIR/.env"
else
  log "✅ Arquivo .env já existe"
fi

# ============================================
# 9. Criar banco de dados PostgreSQL
# ============================================
log "🗄️ Inicializando banco de dados..."
cd "$APP_DIR"

# Parar containers existentes
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Iniciar apenas o PostgreSQL
docker-compose -f docker-compose.production.yml up -d postgres

# Aguardar PostgreSQL ficar pronto
log "⏳ Aguardando PostgreSQL inicializar..."
sleep 15

# Verificar se o schema foi criado
docker-compose -f docker-compose.production.yml exec -T postgres psql -U leman_user -d leman_imoveis -c "\dt" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  log "✅ Banco de dados inicializado"
else
  warn "Aplicando schema manualmente..."
  docker-compose -f docker-compose.production.yml exec -T postgres psql -U leman_user -d leman_imoveis < database/schema-postgresql.sql
fi

# ============================================
# 10. Build e Deploy
# ============================================
log "🏗️ Fazendo build da aplicação..."
docker-compose -f docker-compose.production.yml build --no-cache

log "🚀 Iniciando serviços..."
docker-compose -f docker-compose.production.yml up -d

# ============================================
# 11. Aguardar serviços ficarem prontos
# ============================================
log "⏳ Aguardando serviços iniciarem..."
sleep 30

# Verificar se os serviços estão rodando
if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
  log "✅ Serviços iniciados com sucesso!"
else
  error "Falha ao iniciar serviços. Verifique os logs: docker-compose logs"
fi

# ============================================
# 12. Configurar SSL (Certbot)
# ============================================
read -p "Deseja configurar SSL com Let's Encrypt? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  read -p "Digite o domínio (ex: lemanimoveis.com.br): " DOMAIN
  read -p "Digite o email para notificações: " EMAIL
  
  log "🔒 Configurando SSL para $DOMAIN..."
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect
  
  # Renovação automática
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet") | crontab -
  
  log "✅ SSL configurado com sucesso!"
fi

# ============================================
# 13. Configurar backup automático
# ============================================
log "💾 Configurando backup automático..."
cat > /etc/cron.daily/leman-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/leman-backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec leman-postgres pg_dump -U leman_user leman_imoveis | gzip > "$BACKUP_DIR/leman_$DATE.sql.gz"
# Manter apenas últimos 30 dias
find "$BACKUP_DIR" -name "leman_*.sql.gz" -mtime +30 -delete
EOF
chmod +x /etc/cron.daily/leman-backup

# ============================================
# 14. Informações finais
# ============================================
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo ""
echo "============================================"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "============================================"
echo ""
echo "🌐 Acesse o sistema em:"
echo "   http://$IP_ADDRESS"
echo ""
echo "📊 Dashboard Admin:"
echo "   http://$IP_ADDRESS/admin"
echo "   Email: admin@lemannegocios.com.br"
echo "   Senha: leman@2026"
echo ""
echo "🔐 Senhas geradas:"
echo "   PostgreSQL: Salvo em $APP_DIR/.env"
echo "   Redis: Salvo em $APP_DIR/.env"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure o domínio DNS apontando para $IP_ADDRESS"
echo "   2. Configure SSL com: certbot --nginx"
echo "   3. Configure N8N_BASE_URL e N8N_API_KEY no .env"
echo "   4. Configure OPENAI_API_KEY no .env"
echo "   5. Configure WhatsApp API no .env"
echo "   6. Reinicie: docker-compose -f docker-compose.production.yml restart"
echo ""
echo "🔧 Comandos úteis:"
echo "   Ver logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   Reiniciar: docker-compose -f docker-compose.production.yml restart"
echo "   Parar: docker-compose -f docker-compose.production.yml down"
echo "   Backup manual: docker exec leman-postgres pg_dump -U leman_user leman_imoveis > backup.sql"
echo ""
echo "============================================"

log "🎉 Deploy finalizado!"
