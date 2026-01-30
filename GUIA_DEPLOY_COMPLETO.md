# 🚀 Guia Completo de Deploy - Leman Negócios Imobiliários

## 📋 Visão Geral

Este guia cobre o deploy completo do sistema em VPS (DigitalOcean, Google Cloud, AWS, etc) com PostgreSQL/Supabase e integração com agentes de IA.

---

## 🎯 Opções de Deploy

### Opção 1: Deploy Automatizado (Recomendado)
### Opção 2: Deploy Manual
### Opção 3: Deploy com Supabase

---

## 🚀 Opção 1: Deploy Automatizado

### Pré-requisitos
- VPS Ubuntu 22.04+ (mínimo 2GB RAM, 2 vCPU, 50GB disco)
- Acesso root via SSH
- Domínio configurado (opcional, mas recomendado)

### Passo a Passo

#### 1. Conectar no VPS
```bash
ssh root@SEU_IP_VPS
```

#### 2. Baixar e executar script de deploy
```bash
# Clonar repositório
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git /opt/leman-imoveis
cd /opt/leman-imoveis

# Executar deploy
sudo ./deploy-vps.sh
```

O script irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Configurar firewall (UFW)
- ✅ Criar banco de dados PostgreSQL
- ✅ Gerar senhas seguras automaticamente
- ✅ Iniciar todos os serviços
- ✅ Configurar backup automático

#### 3. Configurar domínio (opcional)
```bash
# Apontar DNS do domínio para o IP do VPS
# Depois executar:
sudo certbot --nginx -d lemanimoveis.com.br -d www.lemanimoveis.com.br
```

#### 4. Configurar integrações
```bash
cd /opt/leman-imoveis
nano .env

# Adicionar:
N8N_BASE_URL=https://seu-n8n.com
N8N_API_KEY=sua_api_key
OPENAI_API_KEY=sk-...
WHATSAPP_API_URL=https://sua-evolution-api.com
WHATSAPP_API_KEY=sua_api_key

# Reiniciar
docker-compose -f docker-compose.production.yml restart
```

---

## 🔧 Opção 2: Deploy Manual

### 1. Preparar VPS

```bash
# Atualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# Instalar dependências
sudo apt-get install -y curl git wget unzip ca-certificates gnupg lsb-release ufw

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configurar Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw reload
```

### 3. Clonar Repositório

```bash
sudo mkdir -p /opt/leman-imoveis
cd /opt/leman-imoveis
sudo git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git .
```

### 4. Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.supabase.example .env

# Gerar senhas seguras
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Editar .env
nano .env

# Configurar:
DATABASE_URL=postgresql://leman_user:${POSTGRES_PASSWORD}@postgres:5432/leman_imoveis
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=... (gerar outra senha)
COOKIE_SECRET=... (gerar outra senha)
PUBLIC_URL=https://seu-dominio.com.br
```

### 5. Criar Banco de Dados

```bash
# Iniciar PostgreSQL
docker-compose -f docker-compose.production.yml up -d postgres

# Aguardar inicializar
sleep 15

# Aplicar schema
docker-compose -f docker-compose.production.yml exec -T postgres psql -U leman_user -d leman_imoveis < database/schema-postgresql.sql
```

### 6. Iniciar Aplicação

```bash
# Build
docker-compose -f docker-compose.production.yml build

# Iniciar todos os serviços
docker-compose -f docker-compose.production.yml up -d

# Verificar logs
docker-compose -f docker-compose.production.yml logs -f
```

### 7. Configurar SSL

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d lemanimoveis.com.br -d www.lemanimoveis.com.br

# Renovação automática
sudo crontab -e
# Adicionar: 0 3 * * * certbot renew --quiet
```

---

## ☁️ Opção 3: Deploy com Supabase

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Crie novo projeto
3. Anote:
   - Database URL
   - Supabase URL
   - Anon Key
   - Service Key

### 2. Executar Schema no Supabase

```bash
# Copiar conteúdo de database/schema-postgresql.sql
# Colar no SQL Editor do Supabase
# Executar
```

### 3. Configurar .env

```bash
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Deploy da Aplicação

**Opção A: VPS com Docker**
```bash
# Usar docker-compose.production.yml
# Remover serviço 'postgres' (usar Supabase)
docker-compose -f docker-compose.production.yml up -d app nginx redis
```

**Opção B: Vercel/Netlify**
```bash
# Build
npm run build

# Deploy no Vercel
vercel --prod

# Ou Netlify
netlify deploy --prod
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

1. **users** - Usuários do sistema
2. **properties** - Imóveis
3. **leads** - Clientes potenciais
4. **conversations** - Conversas com agentes IA
5. **messages** - Mensagens das conversas
6. **ai_property_matches** - Matching IA cliente-imóvel
7. **landlords** - Proprietários
8. **tenants** - Inquilinos
9. **rental_contracts** - Contratos de locação
10. **rental_payments** - Pagamentos de aluguel
11. **property_expenses** - Despesas
12. **landlord_transfers** - Repasses
13. **financing_simulations** - Simulações de financiamento
14. **blog_posts** - Artigos do blog

### Views Criadas

- **v_available_properties** - Imóveis disponíveis
- **v_hot_leads** - Leads qualificados
- **v_active_contracts** - Contratos ativos

---

## 🤖 Configurar Agentes de IA

### 1. Configurar N8N

```bash
# Iniciar N8N (se usando docker-compose)
docker-compose --profile with-n8n -f docker-compose.production.yml up -d n8n

# Acessar: http://SEU_IP:5678
# Criar workflows conforme documentação em INTEGRACAO_AGENTES_IA.md
```

### 2. Configurar WhatsApp (Evolution API)

```bash
# Instalar Evolution API
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_api_key \
  atendai/evolution-api:latest

# Conectar WhatsApp
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: sua_api_key" \
  -d '{"instanceName": "leman"}'
```

### 3. Configurar OpenAI

```bash
# Adicionar no .env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```

### 4. Configurar Webhooks

```bash
# No .env
N8N_WHATSAPP_INCOMING_WEBHOOK=https://seu-n8n.com/webhook/whatsapp-incoming
N8N_LEAD_QUALIFICATION_WEBHOOK=https://seu-n8n.com/webhook/lead-qualification
N8N_PROPERTY_RECOMMENDATION_WEBHOOK=https://seu-n8n.com/webhook/property-recommendation
```

---

## 🔐 Segurança

### 1. Trocar Senhas Padrão

```bash
# Editar .env
nano /opt/leman-imoveis/.env

# Trocar:
- Senha do admin (no banco de dados)
- JWT_SECRET
- SESSION_SECRET
- COOKIE_SECRET
- POSTGRES_PASSWORD
- REDIS_PASSWORD
```

### 2. Configurar Fail2Ban

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Configurar Backup Automático

```bash
# Já configurado pelo script de deploy
# Ou manualmente:
sudo crontab -e

# Adicionar:
0 2 * * * docker exec leman-postgres pg_dump -U leman_user leman_imoveis | gzip > /opt/leman-backups/leman_$(date +\%Y\%m\%d).sql.gz
```

---

## 📊 Monitoramento

### Ver Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.production.yml logs -f

# Apenas app
docker-compose -f docker-compose.production.yml logs -f app

# Apenas postgres
docker-compose -f docker-compose.production.yml logs -f postgres
```

### Verificar Status

```bash
# Status dos containers
docker-compose -f docker-compose.production.yml ps

# Uso de recursos
docker stats

# Espaço em disco
df -h
```

### Health Checks

```bash
# App
curl http://localhost:5000/api/health

# PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres pg_isready

# Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

---

## 🔄 Atualização do Sistema

### Atualizar Código

```bash
cd /opt/leman-imoveis
git pull origin main
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### Atualizar Banco de Dados

```bash
# Fazer backup primeiro
docker exec leman-postgres pg_dump -U leman_user leman_imoveis > backup_pre_update.sql

# Aplicar novas migrações
docker-compose -f docker-compose.production.yml exec -T postgres psql -U leman_user -d leman_imoveis < database/migrations/nova_migracao.sql
```

---

## 🆘 Troubleshooting

### Problema: Containers não iniciam

```bash
# Ver logs
docker-compose -f docker-compose.production.yml logs

# Verificar recursos
free -h
df -h

# Reiniciar
docker-compose -f docker-compose.production.yml restart
```

### Problema: Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.production.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.production.yml exec postgres psql -U leman_user -d leman_imoveis -c "SELECT 1"

# Ver logs
docker-compose -f docker-compose.production.yml logs postgres
```

### Problema: Site não carrega

```bash
# Verificar Nginx
docker-compose -f docker-compose.production.yml logs nginx

# Verificar app
docker-compose -f docker-compose.production.yml logs app

# Testar diretamente
curl http://localhost:5000
```

---

## 📞 Suporte

Para dúvidas sobre deploy:
- **Email**: contato@lemanimoveis.com.br
- **WhatsApp**: (61) 99868-7245
- **GitHub**: https://github.com/vml-arquivos/leman-negocios-imobiliarios

---

## 📝 Checklist Pós-Deploy

- [ ] Sistema acessível via navegador
- [ ] SSL/HTTPS configurado
- [ ] Backup automático funcionando
- [ ] Senhas padrão alteradas
- [ ] N8N configurado e funcionando
- [ ] WhatsApp conectado
- [ ] OpenAI configurado
- [ ] Webhooks testados
- [ ] Firewall configurado
- [ ] Monitoramento ativo
- [ ] DNS configurado
- [ ] Email SMTP configurado

---

**Sistema desenvolvido por Manus AI** 🤖
