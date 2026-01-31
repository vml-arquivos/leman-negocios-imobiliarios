# 🚀 INSTRUÇÕES DE DEPLOY

## ✅ Correções Aplicadas

### 1. **Status "Geladeira" Adicionado**
- ✅ Backend (routers.ts) - Enum do tRPC atualizado
- ✅ Frontend (PropertyNew.tsx e PropertyEdit.tsx) - Opção adicionada
- ✅ Banco de Dados (schema.ts) - Enum do PostgreSQL atualizado
- ✅ Migration SQL criada

### 2. **Arquivos Modificados**
```
server/routers.ts                           # Backend tRPC
client/src/pages/admin/PropertyNew.tsx      # Formulário de cadastro
client/src/pages/admin/PropertyEdit.tsx     # Formulário de edição
drizzle/schema.ts                           # Schema do banco
drizzle/migrations/add_geladeira_status.sql # Migration
```

---

## 📋 COMO FAZER O DEPLOY

### **Opção 1: Script Automático (Recomendado)**

Conecte no VPS via SSH e execute:

```bash
ssh root@174.138.78.197

cd /root/leman-negocios-imobiliarios
git pull origin main
chmod +x update.sh
./update.sh
```

O script vai:
1. ✅ Atualizar o código do GitHub
2. ✅ Aplicar migration no banco de dados
3. ✅ Rebuild dos containers Docker
4. ✅ Reiniciar a aplicação

---

### **Opção 2: Passo a Passo Manual**

```bash
# 1. Conectar no VPS
ssh root@174.138.78.197

# 2. Ir para o diretório do projeto
cd /root/leman-negocios-imobiliarios

# 3. Atualizar código
git pull origin main

# 4. Aplicar migration no banco de dados
docker exec leman-postgres psql -U leman_user -d leman_db -c "ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'geladeira';"

# 5. Parar containers
docker compose down

# 6. Rebuild (sem cache)
docker compose build --no-cache

# 7. Iniciar containers
docker compose up -d

# 8. Verificar status
docker compose ps
docker compose logs -f --tail=50
```

---

## 🔍 VERIFICAÇÃO

Após o deploy, teste:

1. **Acessar o sistema:**
   - URL: http://174.138.78.197
   - Login: evandro@lemannegocios.com.br
   - Senha: admin123

2. **Testar cadastro de imóvel:**
   - Ir em "Imóveis" → "Novo Imóvel"
   - Preencher os campos
   - Selecionar status "Geladeira"
   - Salvar

3. **Verificar se salvou no banco:**
   ```bash
   docker exec leman-postgres psql -U leman_user -d leman_db -c "SELECT id, title, status FROM properties ORDER BY id DESC LIMIT 5;"
   ```

---

## ⚠️ PROBLEMAS CONHECIDOS E SOLUÇÕES

### **Problema: "Formulário cortado sem scroll"**

**Causa:** O formulário PropertyNew.tsx é uma página completa, não um modal. Se está aparecendo cortado, pode ser:
- Problema de CSS/viewport
- Zoom do navegador
- Resolução de tela

**Solução:**
1. Pressione `Ctrl + 0` (ou `Cmd + 0` no Mac) para resetar zoom
2. Tente em outro navegador
3. Verifique se o AdminLayout está correto

### **Problema: "Imóvel não salva no banco"**

**Causa:** Migration não foi aplicada no banco de dados.

**Solução:**
```bash
docker exec leman-postgres psql -U leman_user -d leman_db -c "ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'geladeira';"
```

### **Problema: "Erro de conexão SSH"**

**Causa:** Firewall bloqueando conexão ou IP mudou.

**Solução:**
- Verificar se o IP do VPS é realmente 174.138.78.197
- Verificar se a porta 22 está aberta
- Tentar conectar via painel da DigitalOcean/HostGator

---

## 📊 COMANDOS ÚTEIS

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver logs apenas do backend
docker compose logs -f leman-app

# Ver logs apenas do banco
docker compose logs -f leman-postgres

# Reiniciar apenas um container
docker compose restart leman-app

# Entrar no container
docker exec -it leman-app sh

# Entrar no PostgreSQL
docker exec -it leman-postgres psql -U leman_user -d leman_db

# Ver tabelas do banco
docker exec leman-postgres psql -U leman_user -d leman_db -c "\dt"

# Ver enum do banco
docker exec leman-postgres psql -U leman_user -d leman_db -c "\dT+ property_status"
```

---

## 🎯 PRÓXIMOS PASSOS

Após o deploy funcionar:

1. ✅ Testar CRUD completo de imóveis
2. ✅ Verificar módulo financeiro
3. ✅ Testar gestão de clientes
4. ✅ Configurar HTTPS (SSL)
5. ✅ Implementar edição/exclusão de usuários
6. ✅ Melhorar CRM e Analytics

---

## 📞 SUPORTE

Se tiver problemas:
1. Verifique os logs: `docker compose logs -f`
2. Verifique se os containers estão rodando: `docker compose ps`
3. Verifique se o banco está acessível: `docker exec leman-postgres pg_isready`

---

**Última atualização:** 31/01/2026
**Versão:** 1.0.0
