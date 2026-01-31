# ANÁLISE DO SISTEMA EM PRODUÇÃO
**Data:** 31 de Janeiro de 2026  
**Sistema:** Leman Negócios Imobiliários

---

## 📋 CONFIGURAÇÃO ATUAL

### **Infraestrutura**
- **Ambiente:** Docker Compose (Produção)
- **Banco de Dados:** PostgreSQL 16 (local no Docker, NÃO Supabase)
- **Cache:** Redis 7
- **Proxy:** Nginx com SSL
- **N8N:** Disponível (opcional)
- **Backup:** Automático diário

### **URLs Configuradas**
- **BASE_URL:** `https://leman.casadf.com.br` ✅ (HTTPS)
- **VITE_API_URL:** `https://leman.casadf.com.br` ✅ (HTTPS)
- **PUBLIC_URL:** `https://lemanimoveis.com.br` (no Docker)

### **Portas Expostas**
- **80:** HTTP (Nginx)
- **443:** HTTPS (Nginx)
- **5000:** App Node.js
- **5432:** PostgreSQL
- **6379:** Redis
- **5678:** N8N (opcional)

---

## 🗄️ SCHEMA DO BANCO DE DADOS REAL

### **Tabelas Existentes (18 tabelas)**

1. **users** - Usuários do sistema
2. **properties** - Imóveis
3. **property_images** - Imagens dos imóveis
4. **leads** - Leads/clientes potenciais
5. **interactions** - Interações com leads
6. **conversations** - Conversas com agentes IA
7. **messages** - Mensagens das conversas
8. **ai_property_matches** - Matching IA (Cliente x Imóvel)
9. **landlords** - Proprietários
10. **tenants** - Inquilinos
11. **rental_contracts** - Contratos de locação
12. **rental_payments** - Pagamentos de aluguéis
13. **property_expenses** - Despesas de imóveis
14. **landlord_transfers** - Repasses aos proprietários
15. **financing_simulations** - Simulações de financiamento
16. **analytics_events** - Eventos de analytics
17. **blog_posts** - Posts do blog
18. **site_settings** - Configurações do site

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### **1. DESSINCRONIA TOTAL ENTRE SCHEMA DRIZZLE E BANCO REAL**

**Problema:**
O arquivo `drizzle/schema.ts` que acabei de criar **NÃO CORRESPONDE** ao banco de dados real que está rodando em produção.

**Diferenças Críticas:**

| Campo no Banco Real | Campo no Drizzle (que criei) | Status |
|---------------------|------------------------------|--------|
| `price` (bigint) | `salePrice` (integer) | ❌ Nome e tipo diferentes |
| `rental_price` | `rentPrice` | ❌ Nome diferente |
| `area` | `totalArea` + `builtArea` | ❌ Estrutura diferente |
| `is_featured` | `featured` | ❌ Nome diferente |
| `views_count` | ❌ Não existe | ❌ Campo faltando |
| `owner_id` | `createdBy` | ❌ Nome diferente |
| `amenities` (jsonb) | ❌ Não existe | ❌ Campo faltando |

### **2. TABELAS FALTANTES NO DRIZZLE**

Tabelas que existem no banco mas **NÃO** estão no `drizzle/schema.ts`:
- ❌ `property_images`
- ❌ `interactions`
- ❌ `conversations`
- ❌ `messages`
- ❌ `ai_property_matches`
- ❌ `blog_posts`
- ❌ `site_settings`

### **3. TABELAS QUE CRIEI MAS NÃO EXISTEM NO BANCO**

Tabelas que coloquei no schema mas **NÃO** estão no banco real:
- ❌ `n8nConversas` (o banco usa `conversations`)
- ❌ `n8nMensagens` (o banco usa `messages`)
- ❌ `n8nFilaMensagens` (não existe)
- ❌ `n8nAutomacoesLog` (não existe)
- ❌ `n8nLigacoes` (não existe)
- ❌ `analyticsEvents` (existe como `analytics_events`)
- ❌ `campaignSources` (não existe)
- ❌ `transactions` (não existe)
- ❌ `commissions` (não existe)
- ❌ `reviews` (não existe)

---

## 🔧 AÇÕES CORRETIVAS NECESSÁRIAS

### **PRIORIDADE 1: REESCREVER DRIZZLE SCHEMA**

Preciso **DESCARTAR** o schema que criei e criar um novo **100% sincronizado** com o banco real PostgreSQL.

**Estratégia:**
1. Ler o arquivo `database/schema-postgresql.sql` completo
2. Converter cada tabela SQL para sintaxe Drizzle ORM
3. Manter **exatamente** os mesmos nomes de campos
4. Manter **exatamente** os mesmos tipos de dados
5. Adicionar tipos TypeScript inferidos

### **PRIORIDADE 2: ATUALIZAR CÓDIGO DO SERVIDOR**

Arquivos que precisam ser atualizados:
- `server/db.ts` - Funções de acesso ao banco
- `server/routers.ts` - Routers tRPC
- `server/n8n-integration.ts` - Usar `conversations` e `messages`
- `server/rental-management.ts` - Ajustar para campos reais

### **PRIORIDADE 3: CORRIGIR FRONTEND**

Componentes que precisam ser ajustados:
- Usar `price` ao invés de `salePrice`
- Usar `rental_price` ao invés de `rentPrice`
- Usar `is_featured` ao invés de `featured`
- Ajustar tipos TypeScript

---

## ✅ PONTOS POSITIVOS

1. ✅ Sistema já está com **HTTPS configurado** (`https://leman.casadf.com.br`)
2. ✅ Docker Compose bem estruturado
3. ✅ Nginx configurado como reverse proxy
4. ✅ Backup automático configurado
5. ✅ Health checks implementados
6. ✅ Schema SQL bem documentado e completo

---

## 🎯 PRÓXIMOS PASSOS

1. **Reescrever `drizzle/schema.ts`** baseado no SQL real
2. **Atualizar `server/db.ts`** com funções corretas
3. **Corrigir routers** para usar nomes de campos corretos
4. **Atualizar frontend** para usar tipos corretos
5. **Validar build** e testar sistema
6. **Fazer commit** das correções

---

**Conclusão:** O sistema está bem estruturado em produção, mas o código TypeScript/Drizzle está **completamente dessincronizado** com o banco real. Preciso refazer o schema do zero baseado no SQL existente.
