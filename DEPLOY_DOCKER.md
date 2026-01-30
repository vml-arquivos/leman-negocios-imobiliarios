# 🐳 Deploy com Docker - Leman Negócios Imobiliários

## 🚀 Deploy Rápido (3 comandos)

```bash
# 1. Clonar repositório
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git
cd leman-negocios-imobiliarios

# 2. Configurar variáveis de ambiente
cp .env.supabase.example .env
nano .env  # Editar com suas configurações

# 3. Iniciar com Docker
docker-compose -f docker-compose.production.yml up -d
```

**Pronto! Sistema rodando em:** http://localhost

---

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- 50GB disco

---

## 🔧 Configuração Detalhada

### 1. Clonar Repositório

```bash
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git
cd leman-negocios-imobiliarios
```

### 2. Configurar .env

```bash
# Copiar exemplo
cp .env.supabase.example .env

# Gerar senhas seguras
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Editar .env
nano .env
```

**Configurações mínimas obrigatórias:**
```env
# Database
DATABASE_URL=postgresql://leman_user:${POSTGRES_PASSWORD}@postgres:5432/leman_imoveis
POSTGRES_PASSWORD=sua_senha_segura

# Redis
REDIS_PASSWORD=sua_senha_redis

# Security
JWT_SECRET=sua_chave_jwt_min_64_caracteres
SESSION_SECRET=sua_chave_session_min_64_caracteres
COOKIE_SECRET=sua_chave_cookie_min_64_caracteres

# Application
PUBLIC_URL=http://seu-dominio.com.br
```

### 3. Iniciar Serviços

```bash
# Build e start
docker-compose -f docker-compose.production.yml up -d

# Ver logs
docker-compose -f docker-compose.production.yml logs -f

# Verificar status
docker-compose -f docker-compose.production.yml ps
```

### 4. Acessar Sistema

- **Site:** http://localhost
- **Dashboard:** http://localhost/admin
- **Credenciais:** admin@lemannegocios.com.br / leman@2026

---

## 🗄️ Banco de Dados

### Opção 1: PostgreSQL Local (Docker)

O `docker-compose.production.yml` já inclui PostgreSQL. O schema é aplicado automaticamente na primeira inicialização.

```bash
# Verificar se schema foi aplicado
docker-compose -f docker-compose.production.yml exec postgres psql -U leman_user -d leman_imoveis -c "\dt"

# Se necessário, aplicar manualmente
docker-compose -f docker-compose.production.yml exec -T postgres psql -U leman_user -d leman_imoveis < database/schema-postgresql.sql
```

### Opção 2: Supabase (Recomendado para Produção)

```bash
# 1. Criar projeto no Supabase
# 2. Executar SQL do arquivo: database/schema-postgresql.sql
# 3. Configurar .env
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 4. Remover PostgreSQL do docker-compose
# Editar docker-compose.production.yml e comentar serviço 'postgres'

# 5. Iniciar apenas app, redis e nginx
docker-compose -f docker-compose.production.yml up -d app redis nginx
```

---

## 🔄 Comandos Úteis

### Gerenciamento

```bash
# Iniciar
docker-compose -f docker-compose.production.yml up -d

# Parar
docker-compose -f docker-compose.production.yml down

# Reiniciar
docker-compose -f docker-compose.production.yml restart

# Ver logs
docker-compose -f docker-compose.production.yml logs -f

# Ver logs de um serviço específico
docker-compose -f docker-compose.production.yml logs -f app

# Status dos containers
docker-compose -f docker-compose.production.yml ps

# Rebuild
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Banco de Dados

```bash
# Acessar PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres psql -U leman_user -d leman_imoveis

# Backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U leman_user leman_imoveis > backup.sql

# Restore
docker-compose -f docker-compose.production.yml exec -T postgres psql -U leman_user -d leman_imoveis < backup.sql

# Ver tabelas
docker-compose -f docker-compose.production.yml exec postgres psql -U leman_user -d leman_imoveis -c "\dt"
```

### Limpeza

```bash
# Parar e remover containers
docker-compose -f docker-compose.production.yml down

# Remover volumes (CUIDADO: apaga dados!)
docker-compose -f docker-compose.production.yml down -v

# Limpar imagens não utilizadas
docker system prune -a
```

---

## 🌐 Deploy em VPS

### DigitalOcean

```bash
# 1. Criar Droplet Ubuntu 22.04
# 2. Conectar via SSH
ssh root@SEU_IP

# 3. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Clonar e configurar
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git /opt/leman-imoveis
cd /opt/leman-imoveis
cp .env.supabase.example .env
nano .env

# 6. Iniciar
docker-compose -f docker-compose.production.yml up -d

# 7. Configurar firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Google Cloud

```bash
# 1. Criar VM Ubuntu 22.04
# 2. Conectar via SSH
gcloud compute ssh NOME_DA_VM

# 3. Seguir mesmos passos do DigitalOcean acima

# 4. Configurar firewall no GCP Console
# Liberar portas 80 e 443
```

### AWS (Lightsail/EC2)

```bash
# 1. Criar instância Ubuntu 22.04
# 2. Conectar via SSH
ssh -i sua-chave.pem ubuntu@SEU_IP

# 3. Seguir mesmos passos do DigitalOcean acima

# 4. Configurar Security Group
# Liberar portas 80 e 443
```

---

## 🔒 SSL/HTTPS (Certbot)

```bash
# 1. Instalar Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Obter certificado
sudo certbot --nginx -d lemanimoveis.com.br -d www.lemanimoveis.com.br

# 3. Renovação automática
sudo crontab -e
# Adicionar: 0 3 * * * certbot renew --quiet

# 4. Reiniciar Nginx
docker-compose -f docker-compose.production.yml restart nginx
```

---

## 🤖 Configurar Agentes de IA (Opcional)

### Iniciar N8N

```bash
# Iniciar com N8N
docker-compose --profile with-n8n -f docker-compose.production.yml up -d

# Acessar N8N
# http://SEU_IP:5678
# Usuário: admin (configurar no .env)
# Senha: (configurar no .env)
```

### Configurar Webhooks

```bash
# Editar .env
N8N_BASE_URL=https://seu-n8n.com
N8N_API_KEY=sua_api_key
N8N_WHATSAPP_INCOMING_WEBHOOK=${N8N_BASE_URL}/webhook/whatsapp-incoming
N8N_LEAD_QUALIFICATION_WEBHOOK=${N8N_BASE_URL}/webhook/lead-qualification

# Reiniciar
docker-compose -f docker-compose.production.yml restart app
```

---

## 💾 Backup Automático

### Opção 1: Com Docker Compose

```bash
# Iniciar serviço de backup
docker-compose --profile with-backup -f docker-compose.production.yml up -d backup

# Backups serão salvos em: ./backups/
```

### Opção 2: Cron Manual

```bash
# Criar script de backup
cat > /opt/backup-leman.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/leman-backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec leman-postgres pg_dump -U leman_user leman_imoveis | gzip > "$BACKUP_DIR/leman_$DATE.sql.gz"
find "$BACKUP_DIR" -name "leman_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup-leman.sh

# Adicionar ao cron
sudo crontab -e
# Adicionar: 0 2 * * * /opt/backup-leman.sh
```

---

## 📊 Monitoramento

### Health Checks

```bash
# App
curl http://localhost:5000/api/health

# PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres pg_isready

# Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli ping

# Nginx
curl http://localhost/health
```

### Logs

```bash
# Todos os logs
docker-compose -f docker-compose.production.yml logs -f

# Apenas erros
docker-compose -f docker-compose.production.yml logs -f | grep -i error

# Últimas 100 linhas
docker-compose -f docker-compose.production.yml logs --tail=100
```

### Recursos

```bash
# Uso de CPU/RAM por container
docker stats

# Espaço em disco
df -h

# Tamanho dos volumes
docker system df -v
```

---

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose -f docker-compose.production.yml logs NOME_DO_SERVICO

# Verificar configuração
docker-compose -f docker-compose.production.yml config

# Rebuild
docker-compose -f docker-compose.production.yml build --no-cache NOME_DO_SERVICO
docker-compose -f docker-compose.production.yml up -d
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.production.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.production.yml exec postgres psql -U leman_user -d leman_imoveis -c "SELECT 1"

# Verificar senha no .env
cat .env | grep POSTGRES_PASSWORD
```

### Porta já em uso

```bash
# Ver o que está usando a porta
sudo lsof -i :80
sudo lsof -i :5000

# Matar processo
sudo kill -9 PID

# Ou mudar porta no docker-compose.yml
# ports:
#   - "8080:80"  # Usar porta 8080 ao invés de 80
```

---

## 📝 Checklist de Deploy

- [ ] Docker e Docker Compose instalados
- [ ] Repositório clonado
- [ ] Arquivo .env configurado
- [ ] Senhas seguras geradas
- [ ] Banco de dados criado (PostgreSQL ou Supabase)
- [ ] Schema SQL aplicado
- [ ] Containers iniciados com sucesso
- [ ] Site acessível via navegador
- [ ] Dashboard admin acessível
- [ ] SSL/HTTPS configurado (produção)
- [ ] Firewall configurado
- [ ] Backup automático ativo
- [ ] Monitoramento configurado
- [ ] DNS apontando para servidor (produção)

---

## 📞 Suporte

**Email:** contato@lemanimoveis.com.br  
**WhatsApp:** (61) 99868-7245  
**GitHub:** https://github.com/vml-arquivos/leman-negocios-imobiliarios  
**Issues:** https://github.com/vml-arquivos/leman-negocios-imobiliarios/issues

---

## 🎯 Comandos Resumidos

```bash
# Deploy completo em 3 comandos
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git
cd leman-negocios-imobiliarios
cp .env.supabase.example .env && nano .env
docker-compose -f docker-compose.production.yml up -d

# Verificar
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f

# Acessar
# http://localhost (site)
# http://localhost/admin (dashboard)
```

---

**🎉 Sistema pronto para deploy com Docker!** 🐳
