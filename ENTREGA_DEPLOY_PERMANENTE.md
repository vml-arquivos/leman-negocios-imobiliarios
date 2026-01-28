# 🚀 Sistema Leman Negócios Imobiliários - Deploy Permanente

## ✅ Entrega Completa

Sistema 100% pronto para deploy permanente em VPS com Docker, PostgreSQL, Nginx e SSL.

---

## 📦 O que foi entregue:

### 🐳 **Docker & Infraestrutura**
- ✅ `Dockerfile` otimizado para produção (multi-stage build)
- ✅ `docker-compose.prod.yml` com stack completa:
  - PostgreSQL 16
  - Redis 7
  - Aplicação Node.js
  - Nginx reverse proxy
  - N8N (opcional)

### 🌐 **Nginx & SSL**
- ✅ `nginx/nginx.conf` - Configuração principal
- ✅ `nginx/conf.d/leman.conf` - Virtual host com SSL
- ✅ HTTP/2 habilitado
- ✅ Gzip compression
- ✅ Security headers
- ✅ Rate limiting
- ✅ Cache de arquivos estáticos

### 🔧 **Scripts de Deploy**
- ✅ `deploy-production.sh` - Deploy automatizado
- ✅ `.env.production.example` - Template de configuração
- ✅ Geração automática de senhas seguras
- ✅ Health checks configurados

### 📚 **Documentação**
- ✅ `DEPLOY_PERMANENTE.md` - Guia completo passo a passo
- ✅ Instruções para Google Cloud VPS
- ✅ Configuração de SSL com Let's Encrypt
- ✅ Scripts de backup automático
- ✅ Comandos úteis e troubleshooting

---

## 🎯 Como Usar:

### **Opção 1: Deploy Rápido (Recomendado)**

```bash
# 1. Conectar na VPS
ssh usuario@SEU_IP

# 2. Clonar repositório
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git /opt/leman-imoveis
cd /opt/leman-imoveis

# 3. Configurar ambiente
cp .env.production.example .env
nano .env  # Editar configurações

# 4. Executar deploy
chmod +x deploy-production.sh
./deploy-production.sh
```

### **Opção 2: Deploy Manual**

Siga o guia completo em `DEPLOY_PERMANENTE.md`

---

## 🔗 Links Importantes:

- **Repositório GitHub:** https://github.com/vml-arquivos/leman-negocios-imobiliarios
- **Documentação Completa:** DEPLOY_PERMANENTE.md
- **Site de Demonstração:** https://5008-i5muzy3mzf3y64lazpcaq-d96c10ee.us2.manus.computer

---

## 💾 Recursos Incluídos:

### **Banco de Dados**
- PostgreSQL 16 com volumes persistentes
- Migrations automáticas
- Seed com dados de exemplo
- Backup automático configurável

### **Cache & Performance**
- Redis para sessões e cache
- Nginx com gzip e cache de estáticos
- Health checks automáticos
- Rate limiting configurado

### **Segurança**
- SSL/HTTPS com Let's Encrypt
- Security headers (HSTS, X-Frame-Options, etc.)
- Firewall UFW configurado
- Fail2ban para proteção contra brute force
- Senhas geradas automaticamente

### **Monitoramento**
- Logs persistentes
- Health checks em todos os serviços
- Portainer (interface web) opcional
- Métricas com Docker stats

---

## 📊 Arquitetura:

```
Internet
    ↓
[Nginx:443] → SSL/HTTPS
    ↓
[App:5000] → Node.js + Express
    ↓
[PostgreSQL:5432] → Banco de Dados
[Redis:6379] → Cache/Sessões
[N8N:5678] → Automações (opcional)
```

---

## 🔧 Comandos Úteis:

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker-compose -f docker-compose.prod.yml restart

# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Atualizar aplicação
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Checklist de Deploy:

- [ ] VPS Ubuntu configurada
- [ ] Docker e Docker Compose instalados
- [ ] Domínio apontando para VPS
- [ ] Variáveis de ambiente configuradas
- [ ] SSL configurado com Certbot
- [ ] Aplicação rodando
- [ ] Backups configurados
- [ ] Firewall configurado
- [ ] Monitoramento configurado (opcional)

---

## 📞 Suporte:

- **GitHub Issues:** https://github.com/vml-arquivos/leman-negocios-imobiliarios/issues
- **Email:** contato@lemanimoveis.com.br
- **WhatsApp:** (61) 99868-7245

---

**🎉 Sistema 100% pronto para produção permanente!**

Data de Entrega: $(date +"%d/%m/%Y %H:%M")
Versão: 1.0.0
