# Configuração HTTPS para o Sistema Leman

## 📋 Pré-requisitos

- Domínio configurado apontando para o IP do servidor (174.138.78.197)
- Acesso SSH ao servidor
- Docker e Docker Compose instalados

## 🔧 Passo a Passo

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env.production` na VPS:

```bash
cd ~/app
nano .env.production
```

Adicione/modifique:

```env
# Base URL com HTTPS
VITE_API_BASE_URL=https://seu-dominio.com.br

# Outras variáveis já existentes...
```

### 2. Configurar NGINX com SSL (Recomendado)

#### Opção A: Usar NGINX como Reverse Proxy

Crie o arquivo `/etc/nginx/sites-available/leman`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy para o Docker
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar o site:

```bash
sudo ln -s /etc/nginx/sites-available/leman /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Opção B: Obter Certificado SSL com Certbot

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br

# Renovação automática
sudo certbot renew --dry-run
```

### 3. Rebuild do Sistema

```bash
cd ~/app
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 4. Testar HTTPS

Acesse: `https://seu-dominio.com.br`

## 🔒 Segurança Adicional

### Headers de Segurança no NGINX

Adicione dentro do bloco `server` SSL:

```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### Firewall

```bash
# Permitir HTTPS
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status
```

## 📝 Notas Importantes

1. **HostGator**: Se o domínio está na HostGator, certifique-se de que:
   - O DNS está apontando para o IP correto (174.138.78.197)
   - Não há proxy/CDN ativo que possa interferir

2. **Renovação Automática**: Certbot configura renovação automática via cron

3. **Backup**: Sempre faça backup antes de modificar configurações

## ✅ Checklist Final

- [ ] Domínio apontando para o IP correto
- [ ] NGINX instalado e configurado
- [ ] Certificado SSL obtido via Certbot
- [ ] `.env.production` atualizado com HTTPS
- [ ] Sistema rebuild e testado
- [ ] Redirecionamento HTTP → HTTPS funcionando
- [ ] Headers de segurança configurados

## 🆘 Troubleshooting

### Erro "Connection Refused"
- Verificar se NGINX está rodando: `sudo systemctl status nginx`
- Verificar logs: `sudo tail -f /var/log/nginx/error.log`

### Certificado SSL não funciona
- Verificar DNS: `nslookup seu-dominio.com.br`
- Verificar certificado: `sudo certbot certificates`

### Docker não inicia
- Verificar logs: `docker logs leman-app`
- Verificar portas: `sudo netstat -tulpn | grep :80`
