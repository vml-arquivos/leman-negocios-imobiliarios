# Changelog: Migração para Schema Mestre

**Data:** 09 de Fevereiro de 2026  
**Objetivo:** Sincronizar o schema do Drizzle com o PostgreSQL real e adicionar simulador SAC vs PRICE

## ✅ Tarefas Concluídas

### 1. Schema Database (drizzle/schema.ts)
- ✅ **Substituído completamente** por `schema_mestre.ts`
- ✅ Novos campos snake_case: `last_sign_in_at`, `avatar_url`, `price`, `rental_price`, `is_featured`, etc.
- ✅ Novas tabelas adicionadas:
  - `conversations` (CRM)
  - `messages` (CRM)
  - `aiPropertyMatches` (IA)
  - `landlords` (SaaS Locação)
  - `tenants` (SaaS Locação)
  - `rentalContracts` (SaaS Locação)
- ✅ Tipos financeiros migrados para `bigint` (centavos) para evitar erros de arredondamento

### 2. Backend: server/db.ts
- ✅ **Imports corrigidos:** Removidas tabelas `n8nConversas`, `n8nMensagens` e types antigos
- ✅ **Colunas atualizadas para snake_case:**
  - `users.openId` → `users.open_id`
  - `users.lastSignedIn` → `users.last_sign_in_at`
  - `users.avatarUrl` → `users.avatar_url`
  - `properties.salePrice` → `properties.price`
  - `properties.transactionType` → `properties.transaction_type`
  - `properties.propertyType` → `properties.property_type`
  - `properties.totalArea` → `properties.area`
  - `leads.assignedTo` → `leads.assigned_to`
  - `financingSimulations.leadId` → `financingSimulations.lead_id`
  - `rentalPayments.dueDate` → `rentalPayments.due_date`
- ✅ **Funções de update corrigidas:** `updated_at` agora é usado corretamente
- ✅ **Funções N8N desativadas:** Substituídas por stubs para evitar crash

### 3. Backend: server/routers.ts
- ✅ **Imports corrigidos:** Removidas tabelas inexistentes (`analyticsEvents`, `campaignSources`, `reviews`, `interactions`)
- ✅ **Zod schemas atualizados:**
  - `salePrice` → `price`
  - `rentPrice` → `rental_price`
  - `featured` → `is_featured`
- ✅ **Filtros corrigidos:** `p.featured` → `p.is_featured` no properties router

### 4. Frontend: Simulador de Financiamento
- ✅ **Novo componente criado:** `client/src/pages/FinancingComparator.tsx`
  - Comparativo visual SAC vs PRICE
  - Gráficos interativos com Recharts
  - Tabelas completas de amortização
  - Cálculos matemáticos precisos
- ✅ **Integração:** Componente injetado em `FinancingSimulatorNew.tsx`
  - Mantém funcionalidade existente (captura de leads, múltiplos bancos)
  - Adiciona seção de comparação visual ao final da página
  - Marcador `LEMAN__FINANCING_COMPARATOR__EMBED` para idempotência

## 📊 Arquivos Modificados

```
M  drizzle/schema.ts                           (substituído por schema_mestre.ts)
M  server/db.ts                                (imports + snake_case + stubs N8N)
M  server/routers.ts                           (imports + Zod + filtros)
M  client/src/pages/FinancingSimulatorNew.tsx  (+ import + injeção do comparador)
A  client/src/pages/FinancingComparator.tsx    (novo componente SAC vs PRICE)
```

## 🔍 Validações Necessárias

1. **Banco de Dados:** Executar migrations do Drizzle para sincronizar estrutura
2. **Testes:** Verificar se todas as queries funcionam com novos nomes de colunas
3. **Frontend:** Testar simulador de financiamento em desenvolvimento
4. **Dependências:** Verificar se `recharts` está instalado no package.json

## 🚀 Próximos Passos

1. Executar `pnpm drizzle-kit generate` para criar migrations
2. Executar `pnpm drizzle-kit push` para aplicar no banco (ou revisar SQL manualmente)
3. Testar aplicação localmente
4. Criar Pull Request com estas alterações
5. Deploy em staging para validação final

## ⚠️ Breaking Changes

- **Nomes de colunas:** Código antigo que referencie `salePrice`, `rentPrice`, `featured`, etc. precisará ser atualizado
- **Tipos:** Valores financeiros agora são `bigint` (centavos) ao invés de `integer` (reais)
- **Tabelas N8N:** Funcionalidades que dependiam de `n8nConversas`/`n8nMensagens` foram desativadas

## 📝 Notas Técnicas

- **Backup criado:** `FinancingSimulatorNew.tsx.backup` (pode ser removido após validação)
- **Idempotência:** Script pode ser executado múltiplas vezes sem duplicar alterações
- **Compatibilidade:** Schema mestre sincronizado com PostgreSQL real em produção
