# 🧹 Guia de Limpeza e Manutenção - Leman Negócios Imobiliários

## Scripts Disponíveis

### 1. 🧹 Limpeza Completa (`cleanup-and-deploy.sh`)

**Quando usar:** Quando houver problemas persistentes, erros estranhos, ou após muitas atualizações.

**O que faz:**
- Para todos os containers
- Limpa Docker completamente (containers, imagens, volumes, cache)
- Atualiza código do GitHub
- Remove node_modules
- Limpa cache do pnpm
- Remove arquivos de build antigos
- Reinstala todas as dependências do zero
- Faz build limpo
- Sobe containers novos

**Tempo:** ~5-10 minutos

**Como executar:**
```bash
cd /root/app
./cleanup-and-deploy.sh
```

---

### 2. ⚡ Limpeza Rápida (`quick-cleanup.sh`)

**Quando usar:** Deploy normal, atualização de código.

**O que faz:**
- Para containers
- Limpa cache de build do Docker
- Atualiza código do GitHub
- Faz build e sobe containers

**Tempo:** ~2-3 minutos

**Como executar:**
```bash
cd /root/app
./quick-cleanup.sh
```

---

### 3. 🔄 Deploy Simples (comando manual)

**Quando usar:** Mudanças pequenas, teste rápido.

**Como executar:**
```bash
cd /root/app
git pull origin main
docker compose up --build -d
```

**Tempo:** ~2 minutos

---

## 🆘 Comandos Úteis

### Ver logs em tempo real:
```bash
docker compose logs -f
```

### Ver logs de um serviço específico:
```bash
docker compose logs -f app
```

### Ver status dos containers:
```bash
docker compose ps
```

### Reiniciar um serviço específico:
```bash
docker compose restart app
```

### Parar tudo:
```bash
docker compose down
```

### Ver espaço em disco:
```bash
df -h
```

### Ver uso de disco do Docker:
```bash
docker system df
```

### Limpar TUDO do Docker (cuidado!):
```bash
docker system prune -a --volumes -f
```

---

## 🐛 Troubleshooting

### Erro 404 em páginas:
1. Execute `./quick-cleanup.sh`
2. Aguarde 3 minutos
3. Faça Ctrl+Shift+R no navegador

### Erro de banco de dados:
1. Verifique se o container do postgres está rodando: `docker compose ps`
2. Veja os logs: `docker compose logs postgres`
3. Reinicie: `docker compose restart postgres`

### Erro de memória/espaço:
1. Veja o espaço: `df -h`
2. Limpe Docker: `docker system prune -a -f`
3. Execute `./cleanup-and-deploy.sh`

### Containers não sobem:
1. Veja os logs: `docker compose logs`
2. Verifique portas: `netstat -tulpn | grep :5000`
3. Reinicie Docker: `systemctl restart docker`

### Build muito lento:
1. Limpe cache: `docker builder prune -a -f`
2. Use `./cleanup-and-deploy.sh`

---

## 📊 Monitoramento

### Ver uso de recursos:
```bash
docker stats
```

### Ver processos:
```bash
htop
```

### Ver conexões:
```bash
netstat -tulpn
```

---

## 🔒 Segurança

### Backup do banco de dados:
```bash
docker compose exec postgres pg_dump -U leman_user leman_db > backup-$(date +%Y%m%d).sql
```

### Restaurar backup:
```bash
cat backup-20260130.sql | docker compose exec -T postgres psql -U leman_user leman_db
```

---

## 📝 Checklist de Deploy

- [ ] Fazer backup do banco de dados
- [ ] Testar localmente (se possível)
- [ ] Fazer commit e push no GitHub
- [ ] Executar script de deploy na VPS
- [ ] Aguardar build completar (~3 minutos)
- [ ] Verificar logs: `docker compose logs -f`
- [ ] Testar páginas principais:
  - [ ] Home: https://leman.casadf.com.br
  - [ ] Admin: https://leman.casadf.com.br/admin
  - [ ] Clientes: https://leman.casadf.com.br/admin/clientes-gestao
  - [ ] Financeiro: https://leman.casadf.com.br/admin/financial
  - [ ] Settings: https://leman.casadf.com.br/admin/settings
- [ ] Verificar se não há erros no console do navegador (F12)
- [ ] Fazer hard refresh (Ctrl+Shift+R)

---

## 🎯 Recomendações

### Deploy Normal:
Use `./quick-cleanup.sh` - É rápido e suficiente para 95% dos casos.

### Problemas Persistentes:
Use `./cleanup-and-deploy.sh` - Limpa tudo e garante ambiente limpo.

### Urgência:
Use comando manual simples - Mais rápido mas sem limpeza.

---

## 📞 Suporte

Em caso de problemas graves:
1. Salve os logs: `docker compose logs > logs-erro.txt`
2. Verifique o status: `docker compose ps`
3. Tente `./cleanup-and-deploy.sh`
4. Se persistir, entre em contato com suporte técnico

---

**Última atualização:** 30/01/2026
