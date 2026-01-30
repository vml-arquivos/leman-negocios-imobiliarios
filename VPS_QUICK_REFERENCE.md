# 📚 Referência Rápida – Comandos Essenciais da VPS

**Domínio:** `leman.casadf.com.br`

---

## 🚀 Deployment Inicial (PRIMEIRA VEZ)

```bash
# 1. Conectar à VPS via SSH
ssh usuario@seu_ip_da_vps

# 2. Clonar o repositório
cd /home/ubuntu
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git
cd leman-negocios-imobiliarios

# 3. Editar o arquivo de ambiente (IMPORTANTE!)
nano .env.production
# Altere: JWT_SECRET, DB_PASSWORD, GOOGLE_CLIENT_ID, CERTBOT_EMAIL

# 4. Criar diretórios para SSL
mkdir -p certbot/www certbot/conf

# 5. Gerar certificado SSL (Let's Encrypt)
docker compose run --rm --entrypoint "\n  certbot certonly --webroot -w /var/www/certbot \n    --email seu_email@exemplo.com \n    --agree-tos \n    --no-eff-email \n    -d leman.casadf.com.br \n    --force-renewal"
  certbot

# 6. Fazer o deploy
docker compose up --build -d

# 7. Verificar status
docker compose ps
```

---

## 🔄 Atualizar a Aplicação

```bash
# Navegar para o diretório do projeto
cd /home/ubuntu/leman-negocios-imobiliarios

# Puxar atualizações do GitHub
git pull origin master

# Reconstruir e reiniciar
docker compose up --build -d

# Verificar se tudo está funcionando
docker compose ps
docker compose logs -f app
```

---

## 🛠️ Gerenciamento de Contêineres

| Comando | Descrição |
|---------|-----------|
| `docker compose ps` | Listar status de todos os contêineres |
| `docker compose logs -f app` | Ver logs da aplicação em tempo real |
| `docker compose logs -f nginx` | Ver logs do Nginx |
| `docker compose logs -f postgres` | Ver logs do banco de dados |
| `docker compose restart app` | Reiniciar apenas a aplicação |
| `docker compose restart nginx` | Reiniciar apenas o Nginx |
| `docker compose down` | Parar todos os serviços |
| `docker compose up -d` | Iniciar todos os serviços |
| `docker compose exec app /bin/sh` | Acessar o shell do contêiner da app |

---

## 🔒 Renovação do Certificado SSL

O Certbot renova automaticamente os certificados 30 dias antes da expiração. Se precisar renovar manualmente:

```bash
docker compose run --rm certbot renew
```

---

## 📊 Monitoramento

### Verificar o uso de recursos

```bash
# CPU e memória dos contêineres
docker stats

# Espaço em disco
df -h

# Espaço do Docker
docker system df
```

### Verificar conectividade

```bash
# Testar se a aplicação está respondendo
curl https://leman.casadf.com.br/health

# Verificar se o DNS está resolvendo corretamente
nslookup leman.casadf.com.br

# Verificar certificado SSL
openssl s_client -connect leman.casadf.com.br:443
```

---

## 🚨 Troubleshooting

### A aplicação não está respondendo

```bash
# Ver logs detalhados
docker compose logs -f app

# Reiniciar todos os serviços
docker compose restart

# Verificar se o banco de dados está saudável
docker compose exec postgres pg_isready -U leman_user
```

### Erro de certificado SSL

```bash
# Verificar certificados disponíveis
ls -la certbot/conf/live/

# Renovar certificado manualmente
docker compose run --rm certbot renew --force-renewal

# Reiniciar Nginx após renovação
docker compose restart nginx
```

### Erro de conexão com o banco de dados

```bash
# Verificar status do PostgreSQL
docker compose ps postgres

# Ver logs do PostgreSQL
docker compose logs postgres

# Reiniciar o banco de dados
docker compose restart postgres
```

---

## 📝 Logs Importantes

| Localização | Descrição |
|-------------|-----------|
| `docker compose logs app` | Logs da aplicação Node.js |
| `docker compose logs nginx` | Logs do servidor web |
| `docker compose logs postgres` | Logs do banco de dados |
| `/var/log/docker/` | Logs do daemon do Docker (no host) |

---

## 🔐 Segurança

### Fazer backup do banco de dados

```bash
docker compose exec postgres pg_dump -U leman_user leman_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
docker compose exec -T postgres psql -U leman_user leman_db < backup_20260130_120000.sql
```

### Alterar senha do banco de dados

```bash
docker compose exec postgres psql -U leman_user -d leman_db
# No prompt do PostgreSQL:
# ALTER USER leman_user WITH PASSWORD 'nova_senha_segura';
# \q
```

---

## 📞 Suporte

Se encontrar problemas, consulte:

1.  **Documentação completa:** `VPS_DEPLOYMENT_GUIDE.md`
2.  **Logs da aplicação:** `docker compose logs -f app`
3.  **Status dos serviços:** `docker compose ps`

---

**Última atualização:** 30 de janeiro de 2026
