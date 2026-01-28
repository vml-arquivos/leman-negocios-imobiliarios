# 🚀 Guia de Deploy Permanente
## Leman Negócios Imobiliários - Google Cloud VPS

Este guia detalha como fazer o deploy permanente do sistema em uma VPS Ubuntu no Google Cloud com Docker, PostgreSQL, Nginx e SSL.

---

## 📋 Pré-requisitos

- ✅ VPS Ubuntu 22.04 ou superior (Google Cloud, AWS, DigitalOcean, etc.)
- ✅ Mínimo 2GB RAM, 2 vCPUs, 20GB disco
- ✅ Domínio configurado (ex: lemanimoveis.com.br)
- ✅ Acesso SSH à VPS
- ✅ Repositório GitHub configurado

---

## 🔧 Passo 1: Preparar a VPS

### 1.1 Conectar via SSH

```bash
ssh usuario@SEU_IP_DA_VPS
```

### 1.2 Atualizar Sistema

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### 1.3 Instalar Dependências Básicas

```bash
sudo apt-get install -y curl git ufw fail2ban
```

---

## 🐳 Passo 2: Instalar Docker

### 2.1 Instalar Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2.2 Instalar Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2.3 Verificar Instalação

```bash
docker --version
docker-compose --version
```

**Importante:** Faça logout e login novamente para aplicar as permissões do Docker.

---

## 🔥 Passo 3: Configurar Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 📦 Passo 4: Clonar Repositório

### 4.1 Criar Diretório de Deploy

```bash
sudo mkdir -p /opt/leman-imoveis
sudo chown $USER:$USER /opt/leman-imoveis
cd /opt/leman-imoveis
```

### 4.2 Clonar Repositório

```bash
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git .
```

---

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

### 5.1 Copiar Arquivo de Exemplo

```bash
cp .env.production.example .env
```

### 5.2 Gerar Senhas Seguras

```bash
# Gerar senha do banco
echo "DB_PASSWORD=$(openssl rand -base64 32)"

# Gerar senha do Redis
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"

# Gerar session secret
echo "SESSION_SECRET=$(openssl rand -base64 64)"

# Gerar JWT secret
echo "JWT_SECRET=$(openssl rand -base64 64)"
```

### 5.3 Editar .env

```bash
nano .env
```

**Configurações Obrigatórias:**

```env
# Banco de Dados
DATABASE_URL=postgresql://leman_user:SUA_SENHA_AQUI@postgres:5432/leman_imoveis
DB_PASSWORD=SUA_SENHA_AQUI

# Redis
REDIS_PASSWORD=SUA_SENHA_REDIS_AQUI

# Aplicação
BASE_URL=https://lemanimoveis.com.br

# Segurança
SESSION_SECRET=SEU_SESSION_SECRET_AQUI
JWT_SECRET=SEU_JWT_SECRET_AQUI

# N8N (opcional)
N8N_WEBHOOK_URL=https://n8n.lemanimoveis.com.br/webhook/lead
N8N_USER=admin
N8N_PASSWORD=SUA_SENHA_N8N_AQUI
```

---

## 🌐 Passo 6: Configurar DNS

No painel do seu provedor de domínio, crie os seguintes registros:

```
Tipo    Nome    Valor
A       @       SEU_IP_DA_VPS
A       www     SEU_IP_DA_VPS
A       n8n     SEU_IP_DA_VPS (opcional)
```

**Aguarde a propagação DNS (pode levar até 24h, mas geralmente é rápido).**

---

## 🔒 Passo 7: Configurar SSL (HTTPS)

### 7.1 Instalar Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 7.2 Obter Certificado SSL

```bash
sudo certbot certonly --standalone -d lemanimoveis.com.br -d www.lemanimoveis.com.br
```

Siga as instruções e forneça um email válido.

### 7.3 Copiar Certificados

```bash
sudo mkdir -p /opt/leman-imoveis/nginx/ssl
sudo cp /etc/letsencrypt/live/lemanimoveis.com.br/fullchain.pem /opt/leman-imoveis/nginx/ssl/
sudo cp /etc/letsencrypt/live/lemanimoveis.com.br/privkey.pem /opt/leman-imoveis/nginx/ssl/
sudo chown -R $USER:$USER /opt/leman-imoveis/nginx/ssl
```

### 7.4 Configurar Renovação Automática

```bash
sudo crontab -e
```

Adicione a linha:

```cron
0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/lemanimoveis.com.br/fullchain.pem /opt/leman-imoveis/nginx/ssl/ && cp /etc/letsencrypt/live/lemanimoveis.com.br/privkey.pem /opt/leman-imoveis/nginx/ssl/ && cd /opt/leman-imoveis && docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 🚀 Passo 8: Deploy da Aplicação

### 8.1 Executar Script de Deploy

```bash
cd /opt/leman-imoveis
./deploy-production.sh
```

O script irá:
- ✅ Verificar Docker
- ✅ Fazer build das imagens
- ✅ Iniciar containers
- ✅ Executar migrations
- ✅ Popular banco (opcional)

### 8.2 Verificar Containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

Todos os containers devem estar com status "Up" e "healthy".

---

## 🔍 Passo 9: Verificar Funcionamento

### 9.1 Testar Aplicação

```bash
curl http://localhost:5000/api/trpc/system.health
```

Deve retornar: `{"status":"ok"}`

### 9.2 Acessar no Navegador

Acesse: `https://lemanimoveis.com.br`

Você deve ver o site funcionando com SSL ativo (cadeado verde).

---

## 📊 Comandos Úteis

### Ver Logs

```bash
# Todos os containers
docker-compose -f docker-compose.prod.yml logs -f

# Apenas aplicação
docker-compose -f docker-compose.prod.yml logs -f app

# Apenas Nginx
docker-compose -f docker-compose.prod.yml logs -f nginx

# Apenas PostgreSQL
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Gerenciar Containers

```bash
# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Iniciar tudo
docker-compose -f docker-compose.prod.yml up -d

# Reiniciar um serviço
docker-compose -f docker-compose.prod.yml restart app

# Ver status
docker-compose -f docker-compose.prod.yml ps

# Ver uso de recursos
docker stats
```

### Acessar Container

```bash
# Acessar shell do app
docker-compose -f docker-compose.prod.yml exec app sh

# Acessar PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U leman_user -d leman_imoveis
```

---

## 💾 Passo 10: Configurar Backups

### 10.1 Criar Script de Backup

```bash
sudo nano /usr/local/bin/backup-leman.sh
```

Conteúdo:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/leman"
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker-compose -f /opt/leman-imoveis/docker-compose.prod.yml exec -T postgres \
  pg_dump -U leman_user leman_imoveis | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/leman-imoveis/uploads

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup concluído: $DATE"
```

### 10.2 Tornar Executável

```bash
sudo chmod +x /usr/local/bin/backup-leman.sh
```

### 10.3 Agendar Backup Diário

```bash
sudo crontab -e
```

Adicione:

```cron
0 2 * * * /usr/local/bin/backup-leman.sh >> /var/log/backup-leman.log 2>&1
```

---

## 🔄 Passo 11: Atualizar Aplicação

### 11.1 Pull das Atualizações

```bash
cd /opt/leman-imoveis
git pull origin main
```

### 11.2 Rebuild e Restart

```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### 11.3 Executar Migrations (se houver)

```bash
docker-compose -f docker-compose.prod.yml exec app pnpm db:push
```

---

## 🛡️ Segurança Adicional

### Fail2Ban (Proteção contra Brute Force)

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Limitar Acesso SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Configurar:

```
PermitRootLogin no
PasswordAuthentication no
```

Reiniciar SSH:

```bash
sudo systemctl restart sshd
```

---

## 📈 Monitoramento (Opcional)

### Instalar Portainer (Interface Web para Docker)

```bash
docker volume create portainer_data
docker run -d -p 9000:9000 --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce
```

Acesse: `http://SEU_IP:9000`

---

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs app

# Verificar configuração
docker-compose -f docker-compose.prod.yml config
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U leman_user -d leman_imoveis -c "SELECT 1;"
```

### SSL não funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal
```

### Site lento

```bash
# Ver uso de recursos
docker stats

# Aumentar recursos do container (editar docker-compose.prod.yml)
```

---

## 📞 Suporte

Para problemas ou dúvidas:

- **GitHub Issues:** https://github.com/vml-arquivos/leman-negocios-imobiliarios/issues
- **Email:** contato@lemanimoveis.com.br
- **WhatsApp:** (61) 99868-7245

---

## ✅ Checklist Final

- [ ] VPS configurada e atualizada
- [ ] Docker e Docker Compose instalados
- [ ] Firewall configurado
- [ ] Repositório clonado
- [ ] Variáveis de ambiente configuradas
- [ ] DNS apontando para VPS
- [ ] SSL configurado e funcionando
- [ ] Aplicação rodando e acessível
- [ ] Backups configurados
- [ ] Monitoramento configurado (opcional)
- [ ] N8N configurado (opcional)

---

**🎉 Parabéns! Seu site está no ar de forma permanente!**

Acesse: **https://lemanimoveis.com.br**
