# 🚀 CHANGELOG - MIGRAÇÃO MYSQL → POSTGRESQL

**Data:** 27 de Janeiro de 2026  
**Versão:** 1.0.0  
**Tipo:** Migração de Infraestrutura

---

## 📋 RESUMO

Migração completa do sistema de **MySQL** para **PostgreSQL nativo**, corrigindo inconsistência crítica entre o código-fonte e a infraestrutura Docker.

---

## 🔧 ARQUIVOS MODIFICADOS

### 1. **package.json**
- ❌ Removido: `mysql2` (^3.15.0)
- ✅ Adicionado: `pg` (^8.11.3)
- ✅ Adicionado: `@types/pg` (^8.11.6)

### 2. **server/db.ts**
- ❌ Removido: `import mysql from "mysql2/promise"`
- ❌ Removido: `drizzle-orm/mysql2`
- ✅ Adicionado: `import postgres from "postgres"`
- ✅ Adicionado: `drizzle-orm/postgres-js`
- ✅ Alterado: Pool de conexões para PostgreSQL
- ✅ Alterado: `.returning()` em vez de `.insertId`

### 3. **drizzle/schema.ts**
- ❌ Removido: `drizzle-orm/mysql-core`
- ✅ Adicionado: `drizzle-orm/postgres-core`
- ✅ Convertido: `mysqlTable` → `pgTable`
- ✅ Convertido: `mysqlEnum` → `pgEnum`
- ✅ Convertido: `int().autoincrement()` → `serial()`
- ✅ Convertido: `decimal()` → `numeric()`
- ✅ Removido: `.onUpdateNow()` (não suportado nativamente)

### 4. **drizzle.config.ts**
- ✅ Alterado: `dialect: "mysql"` → `dialect: "postgresql"`

### 5. **docker-compose.prod.yml**
- ✅ Otimizado: Portas expostas (apenas 80/443)
- ✅ Adicionado: Volumes com bind mounts
- ✅ Adicionado: Variáveis de ambiente completas
- ✅ Melhorado: Configuração de segurança

### 6. **.env.production.example**
- ✅ Criado: Template completo com todas as variáveis
- ✅ Adicionado: OpenAI, Gemini, Supabase, Google Maps, SMTP

### 7. **nginx/conf.d/leman.conf**
- ✅ Otimizado: Proxy reverso com SSL/TLS
- ✅ Adicionado: Rate limiting
- ✅ Adicionado: Caching de arquivos estáticos
- ✅ Adicionado: Security headers

### 8. **scripts/seed-full-demo.ts**
- ✅ Migrado: MySQL → PostgreSQL
- ✅ Atualizado: Imports e conexão

### 9. **scripts/seed-leman-demo.ts**
- ✅ Migrado: MySQL → PostgreSQL
- ✅ Atualizado: Imports e conexão

### 10. **seed.mjs**
- ✅ Migrado: MySQL → PostgreSQL

### 11. **seed-properties.mjs**
- ✅ Migrado: MySQL → PostgreSQL

### 12. **scripts/seed-properties.mjs**
- ✅ Migrado: MySQL → PostgreSQL

---

## 📄 ARQUIVOS ADICIONADOS

1. **MIGRACAO_MYSQL_PARA_POSTGRESQL.md** - Guia completo de migração
2. **CHANGELOG_MIGRACAO.md** - Este arquivo

---

## ⚠️ BREAKING CHANGES

### 1. **Dependências**
- Remova `node_modules` e execute `pnpm install` novamente
- O driver `mysql2` não é mais necessário

### 2. **Variáveis de Ambiente**
- `DATABASE_URL` agora deve usar formato PostgreSQL:
  ```
  postgresql://user:password@host:5432/database
  ```

### 3. **Timestamps com `updatedAt`**
- PostgreSQL não suporta `.onUpdateNow()` nativo
- **Solução recomendada:** Usar middleware na aplicação ou triggers SQL

### 4. **Migrations**
- Execute `pnpm db:push` para aplicar o schema PostgreSQL
- Dados antigos do MySQL precisam ser migrados manualmente

---

## 🔐 MELHORIAS DE SEGURANÇA

1. ✅ Banco de dados NÃO exposto (porta 5432 fechada)
2. ✅ Redis NÃO exposto (porta 6379 fechada)
3. ✅ App NÃO exposto (porta 5000 fechada)
4. ✅ Apenas Nginx exposto (80/443)
5. ✅ HSTS ativado (63 dias)
6. ✅ TLS 1.2+ obrigatório
7. ✅ Security headers configurados
8. ✅ Rate limiting ativado

---

## 🚀 PRÓXIMOS PASSOS

### 1. Instalar Dependências
```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.production.example .env.production
# Edite .env.production com seus valores reais
```

### 3. Executar Migrations
```bash
pnpm db:push
```

### 4. Seed de Dados (Opcional)
```bash
pnpm db:seed
```

### 5. Build e Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 SUPORTE

Para dúvidas ou problemas:
1. Consulte `MIGRACAO_MYSQL_PARA_POSTGRESQL.md`
2. Verifique logs: `docker-compose logs -f`
3. Valide conexão: `psql postgresql://...`

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] package.json atualizado
- [x] server/db.ts migrado
- [x] drizzle/schema.ts convertido
- [x] drizzle.config.ts atualizado
- [x] docker-compose.prod.yml otimizado
- [x] .env.production.example criado
- [x] nginx/conf.d/leman.conf otimizado
- [x] Scripts de seed migrados
- [x] Documentação completa
- [x] Sintaxe validada
- [ ] Testes de integração (executar após deploy)
- [ ] Migrations aplicadas (executar após deploy)

---

**Migração concluída com sucesso! 🎉**
