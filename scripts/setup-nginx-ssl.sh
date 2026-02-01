#!/bin/bash
# ============================================
# SCRIPT DE CONFIGURAÇÃO NGINX + SSL
# ============================================
# Leman Negócios Imobiliários
# Configura Nginx como proxy reverso e SSL com Let's Encrypt
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
DOMAIN="leman.casadf.com.br"
EMAIL="contato@lemanimoveis.com.br"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 Configuração Nginx + SSL - Leman${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar sudo
if [ "$EUID" -ne 0 ]; then 
  if ! sudo -n true 2>/dev/null; then
    echo -e "${RED}❌ Este script precisa ser executado com sudo${NC}"
    exit 1
  fi
  SUDO="sudo"
else
  SUDO=""
fi

# Verificar Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx não está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx instalado${NC}"
echo ""

# Verificar DNS
echo -e "${YELLOW}⏳ Verificando DNS...${NC}"
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1 2>/dev/null || echo "")
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "")

echo -e "   DNS: ${BLUE}$DOMAIN_IP${NC}"
echo -e "   Servidor: ${BLUE}$SERVER_IP${NC}"

if [ "$DOMAIN_IP" != "$SERVER_IP" ] && [ -n "$DOMAIN_IP" ]; then
    echo -e "${YELLOW}⚠️  DNS não aponta para este servidor!${NC}"
    read -p "Continuar? (s/n): " continue_anyway
    if [ "$continue_anyway" != "s" ]; then
        exit 1
    fi
fi

# Criar diretório Certbot
$SUDO mkdir -p /var/www/certbot

# Configuração temporária Nginx
echo -e "${YELLOW}⏳ Configurando Nginx temporário...${NC}"

$SUDO tee /etc/nginx/sites-available/leman-temp > /dev/null <<'EOF'
server {
    listen 80;
    server_name leman.casadf.com.br www.leman.casadf.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

$SUDO rm -f /etc/nginx/sites-enabled/default
$SUDO ln -sf /etc/nginx/sites-available/leman-temp /etc/nginx/sites-enabled/
$SUDO nginx -t && $SUDO systemctl reload nginx

echo -e "${GREEN}✅ Nginx configurado${NC}"
echo ""

# Obter certificado SSL
echo -e "${YELLOW}⏳ Obtendo certificado SSL...${NC}"

$SUDO certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --domains $DOMAIN,www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificado SSL obtido!${NC}"
else
    echo -e "${RED}❌ Erro ao obter certificado${NC}"
    exit 1
fi

# Configuração final com SSL
echo -e "${YELLOW}⏳ Aplicando configuração final...${NC}"

$SUDO tee /etc/nginx/sites-available/leman > /dev/null <<'EOF'
server {
    listen 80;
    server_name leman.casadf.com.br www.leman.casadf.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name leman.casadf.com.br www.leman.casadf.com.br;

    ssl_certificate /etc/letsencrypt/live/leman.casadf.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/leman.casadf.com.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF

$SUDO rm -f /etc/nginx/sites-enabled/leman-temp
$SUDO ln -sf /etc/nginx/sites-available/leman /etc/nginx/sites-enabled/
$SUDO nginx -t && $SUDO systemctl reload nginx

# Renovação automática
$SUDO systemctl enable certbot.timer
$SUDO systemctl start certbot.timer

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ NGINX + SSL CONFIGURADO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Domínio: ${GREEN}https://$DOMAIN${NC}"
echo -e "${BLUE}🔒 SSL: ${GREEN}Let's Encrypt${NC}"
echo -e "${BLUE}🔄 Renovação: ${GREEN}Automática${NC}"
echo ""
