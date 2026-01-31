# AUDITORIA TÉCNICA - LEMAN NEGÓCIOS IMOBILIÁRIOS
**Data:** 31 de Janeiro de 2026  
**Status:** Code Red Recovery  
**Executor:** Senior Principal Engineer

---

## RESUMO EXECUTIVO

O sistema apresenta **inconsistências críticas** entre o schema do banco de dados (`drizzle/schema.ts`) e o código da aplicação (routers, componentes e páginas). A análise identificou **mais de 150 erros de TypeScript** que impedem a compilação e o funcionamento adequado do sistema.

---

## 🔴 TOP 3 PROBLEMAS CRÍTICOS

### **1. DESSINCRONIA MASSIVA ENTRE SCHEMA E CÓDIGO**

**Severidade:** CRÍTICA  
**Impacto:** Build quebrado, aplicação não compila

**Detalhes:**
- O arquivo `server/db.ts` importa **mais de 30 tabelas e tipos** que **NÃO EXISTEM** no `drizzle/schema.ts`:
  - `propertyImages`, `interactions`, `blogPosts`, `blogCategories`, `siteSettings`
  - `messageBuffer`, `aiContextStatus`, `clientInterests`, `webhookLogs`
  - `owners`, `analyticsEvents`, `campaignSources`, `transactions`, `commissions`, `reviews`
  - `landlords`, `tenants`, `rentalContracts`, `propertyExpenses`, `landlordTransfers`
  
- O schema atual possui apenas **5 tabelas principais**:
  - `users`, `properties`, `leads`, `n8nConversas`, `n8nMensagens`
  - `financingSimulations`, `rentalPayments`

**Ação Necessária:**
- Remover imports fantasmas de `server/db.ts`
- Remover funções que referenciam tabelas inexistentes
- Atualizar routers para usar apenas tabelas existentes

---

### **2. CAMPOS FALTANTES NO SCHEMA DE PROPERTIES**

**Severidade:** ALTA  
**Impacto:** Páginas públicas e admin quebradas, dados não renderizam

**Detalhes:**
- A tabela `properties` no schema possui apenas **7 campos**:
  ```typescript
  id, title, referenceCode, propertyType, transactionType, 
  salePrice, rentPrice, status, createdAt
  ```

- O código frontend e routers tentam acessar **mais de 20 campos** que não existem:
  - `description`, `address`, `neighborhood`, `city`, `state`, `zipCode`
  - `latitude`, `longitude`, `bedrooms`, `bathrooms`, `suites`
  - `parkingSpaces`, `totalArea`, `builtArea`, `features`
  - `images`, `mainImage`, `featured`, `published`
  - `metaTitle`, `metaDescription`, `slug`, `condoFee`, `iptu`

**Arquivos Afetados:**
- `client/src/pages/Home.tsx` (46+ erros)
- `client/src/pages/Properties.tsx` (20+ erros)
- `client/src/pages/admin/Properties.tsx` (15+ erros)
- `server/routers.ts` (procedures de create/update)

**Ação Necessária:**
- Expandir o schema da tabela `properties` com todos os campos necessários
- Criar migration para adicionar as colunas faltantes

---

### **3. TABELA USERS INCOMPLETA E SISTEMA DE AUTH QUEBRADO**

**Severidade:** CRÍTICA  
**Impacto:** Login/registro não funcionam, autenticação comprometida

**Detalhes:**
- A tabela `users` no schema possui apenas **7 campos**:
  ```typescript
  id, openId, name, email, role, active, createdAt
  ```

- O sistema de autenticação (`server/auth-simple.ts`, `server/_core/rest-auth.ts`) tenta acessar campos que **NÃO EXISTEM**:
  - `password` (campo essencial para login local)
  - `avatarUrl` (usado em perfis)
  - `lastSignedIn` (tracking de última atividade)
  - `loginMethod` (diferenciação entre local/OAuth)

**Erros Específicos:**
- `server/auth-simple.ts:99` - Property 'password' does not exist
- `server/auth-simple.ts:137` - Property 'avatarUrl' does not exist
- `server/_core/rest-auth.ts:29` - Property 'getUserByEmail' does not exist
- `server/_core/rest-auth.ts:74` - Property 'updateUserLastSignIn' does not exist

**Ação Necessária:**
- Adicionar campos `password`, `avatarUrl`, `lastSignedIn`, `loginMethod` ao schema
- Implementar funções `getUserByEmail` e `updateUserLastSignIn` em `server/db.ts`

---

## 📊 ESTATÍSTICAS DE ERROS

| Categoria | Quantidade | Severidade |
|-----------|------------|------------|
| Campos faltantes em `properties` | 68 | ALTA |
| Tabelas/tipos inexistentes | 45 | CRÍTICA |
| Campos faltantes em `users` | 12 | CRÍTICA |
| Parâmetros `any` implícitos | 25 | MÉDIA |
| Routers com procedures quebradas | 8 | ALTA |

**Total de Erros TypeScript:** 158+

---

## 🔧 PLANO DE CORREÇÃO (PRIORIZADO)

### **FASE 1: ESTABILIZAÇÃO DO CORE (URGENTE)**

1. **Corrigir Schema do Banco de Dados**
   - Expandir tabela `users` com campos de autenticação
   - Expandir tabela `properties` com todos os campos necessários
   - Remover referências a tabelas que não serão usadas

2. **Limpar Imports Fantasmas**
   - Refatorar `server/db.ts` para remover imports inexistentes
   - Atualizar `server/routers.ts` para remover procedures órfãs

3. **Corrigir Sistema de Autenticação**
   - Implementar funções faltantes em `server/db.ts`
   - Validar fluxo de login/registro

### **FASE 2: CORREÇÃO DE ROUTERS**

4. **Atualizar Properties Router**
   - Validar procedures `create`, `update`, `list`
   - Garantir que todos os campos estejam no schema

5. **Atualizar Leads Router**
   - Corrigir campos `name` e `leadId` em simulações

### **FASE 3: CORREÇÃO DO FRONTEND**

6. **Corrigir Páginas Públicas**
   - `Home.tsx`, `Properties.tsx`, `PropertyDetails.tsx`

7. **Corrigir Páginas Admin**
   - `Properties.tsx`, `ClientManagement.tsx`, `FinancialDashboard.tsx`

---

## ✅ DEPENDÊNCIAS INSTALADAS

Todas as dependências visuais necessárias estão corretamente instaladas:
- ✅ `lucide-react` (ícones)
- ✅ `recharts` (gráficos)
- ✅ `@radix-ui/*` (componentes ShadcnUI)
- ✅ `framer-motion` (animações)
- ✅ `tailwindcss` (estilização)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Auditoria Completa** (CONCLUÍDA)
2. ⏳ **Correção do Schema** (PRÓXIMO)
3. ⏳ **Limpeza de Imports**
4. ⏳ **Validação de Build**
5. ⏳ **Implementação Visual**

---

**Conclusão:** O sistema requer uma **refatoração estrutural profunda** antes de qualquer melhoria visual. O foco deve ser em estabilizar o core (banco de dados + autenticação + routers) para depois implementar as melhorias de UX/UI solicitadas.
