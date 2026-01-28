# 🗄️ CONFIGURAÇÃO DO SUPABASE - LEMAN NEGÓCIOS IMOBILIÁRIOS

**Data:** 27 de Janeiro de 2026  
**Versão:** 1.1.0  
**Status:** ✅ Pronto para Produção

---

## 📋 VISÃO GERAL

Este diretório contém **2 scripts SQL** para configurar o banco de dados Supabase:

1. **SUPABASE_FINAL_CLEAN.sql** (Script Principal) - 37 KB
   - 22 tabelas principais
   - 65 índices otimizados
   - 5 views
   - 10 triggers
   - Sistema CRM completo

2. **SUPABASE_COMPLEMENTAR_AI_TABLES.sql** (Script Complementar) - 13 KB
   - 5 tabelas adicionais para agentes IA
   - 3 enums adicionais
   - 4 triggers
   - 2 views
   - Integração com N8N

---

## 🚀 COMO EXECUTAR

### Passo 1: Executar Script Principal

```
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu lateral: SQL Editor
4. Clique: New Query
5. Cole o conteúdo de: SUPABASE_FINAL_CLEAN.sql
6. Clique: Run (Ctrl+Enter)
7. Aguarde 30-60 segundos
```

**Mensagem esperada:**
```
✅ SETUP COMPLETO SUPABASE - LEMAN NEGÓCIOS IMOBILIÁRIOS
   • Tabelas criadas: 22
   • Views criadas: 5
   • Índices criados: 65
   • Triggers criados: 10
```

### Passo 2: Executar Script Complementar (Agentes IA)

```
1. No mesmo SQL Editor
2. Clique: New Query
3. Cole o conteúdo de: SUPABASE_COMPLEMENTAR_AI_TABLES.sql
4. Clique: Run (Ctrl+Enter)
5. Aguarde 10-20 segundos
```

**Mensagem esperada:**
```
✅ SCRIPT COMPLEMENTAR EXECUTADO COM SUCESSO!
   • 5 tabelas adicionais criadas para agentes IA
   • 3 enums adicionais criados
   • 4 triggers de atualização configurados
   • 2 views adicionais criadas
```

---

## 📊 TABELAS CRIADAS

### 🔵 Script Principal (22 tabelas)

**Principais (CRM + N8N):**
1. users - Usuários do sistema
2. properties - Imóveis
3. property_images - Fotos dos imóveis
4. leads - Leads e clientes
5. interactions - Histórico de interações
6. appointments - Agendamentos de visitas
7. proposals - Propostas comerciais
8. contracts - Contratos
9. transactions - Transações financeiras
10. commissions - Comissões

**N8N (Workflows):**
11. n8n_conversas - Conversas WhatsApp
12. n8n_mensagens - Histórico de mensagens
13. n8n_fila_mensagens - Fila temporária
14. n8n_ligacoes - Registro de ligações
15. n8n_automacoes_log - Log de automações

**CRM (Sistema):**
16. blog_posts - Posts do blog
17. blog_categories - Categorias do blog
18. site_settings - Configurações do site
19. analytics_events - Eventos de analytics
20. campaign_sources - Fontes de campanha
21. reviews - Avaliações
22. webhooks_log - Log de webhooks

### 🟢 Script Complementar (5 tabelas)

**Agentes IA:**
1. **ai_context_status** - Memória da IA (contexto de conversas)
2. **client_interests** - Interesses extraídos pela IA
3. **financing_simulations** - Simulações de financiamento
4. **lead_insights** - Insights e análise de sentimento
5. **owners** - Proprietários de imóveis

---

## 🔑 CAMPOS CHAVE DE SINCRONIZAÇÃO

### Identificação de Leads
- `leads.telefone` (UNIQUE) ← Chave principal
- `n8n_conversas.telefone` (UNIQUE) ← Vincula WhatsApp
- `ai_context_status.phone` ← Vincula contexto IA

### Identificação de Imóveis
- `properties.id` (PK)
- `properties.reference_code` (UNIQUE)

### Sincronização IA
- `client_interests.client_id` → `leads.id`
- `lead_insights.lead_id` → `leads.id`
- `financing_simulations.lead_id` → `leads.id`

---

## ✅ VALIDAÇÃO PÓS-EXECUÇÃO

### 1️⃣ Verificar Total de Tabelas (27)

```sql
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Deve retornar: 27 (22 + 5)
```

### 2️⃣ Verificar Tabelas de Agentes IA

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ai_context_status',
  'client_interests',
  'financing_simulations',
  'lead_insights',
  'owners'
)
ORDER BY table_name;

-- Deve retornar 5 tabelas
```

### 3️⃣ Verificar Views (7)

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve retornar 7 views:
-- v_agendamentos_proximos
-- v_dashboard_financeiro
-- v_financing_pending_contact (nova)
-- v_high_potential_leads (nova)
-- v_imoveis_disponiveis
-- v_leads_ativos
-- v_leads_inativos
```

### 4️⃣ Testar Inserção de Dados

```sql
-- Criar lead de teste
INSERT INTO leads (name, telefone, status, profile, origem)
VALUES ('Teste IA', '5561888888888', 'novo', 'lead', 'whatsapp')
RETURNING id;

-- Criar contexto IA
INSERT INTO ai_context_status (session_id, phone, message, role)
VALUES ('session_123', '5561888888888', 'Olá, gostaria de informações', 'user');

-- Criar insights
INSERT INTO lead_insights (lead_id, sentiment_score, ai_summary)
VALUES (
  (SELECT id FROM leads WHERE telefone = '5561888888888'),
  75,
  'Cliente demonstrou alto interesse em apartamentos na Asa Sul'
);

-- Verificar sincronização
SELECT 
  l.name,
  l.telefone,
  li.sentiment_score,
  li.ai_summary,
  COUNT(aic.id) as total_mensagens
FROM leads l
LEFT JOIN lead_insights li ON li.lead_id = l.id
LEFT JOIN ai_context_status aic ON aic.phone = l.telefone
WHERE l.telefone = '5561888888888'
GROUP BY l.id, l.name, l.telefone, li.sentiment_score, li.ai_summary;

-- Limpar dados de teste
DELETE FROM leads WHERE telefone = '5561888888888';
```

---

## 🔧 CONFIGURAÇÃO DO N8N

### Credencial PostgreSQL (Supabase)

```
1. N8N > Settings > Credentials > Add Credential
2. Selecionar: Postgres
3. Preencher:
   - Host: db.YOUR_PROJECT.supabase.co
   - Database: postgres
   - User: postgres
   - Password: YOUR_PASSWORD
   - Port: 5432
   - SSL: Enable
4. Test Connection
5. Save
```

### Queries Úteis para N8N

**Buscar contexto da conversa:**
```sql
SELECT * FROM ai_context_status
WHERE phone = '{{ $json.phone }}'
ORDER BY created_at DESC
LIMIT 10;
```

**Salvar mensagem da IA:**
```sql
INSERT INTO ai_context_status (session_id, phone, message, role)
VALUES (
  '{{ $json.session_id }}',
  '{{ $json.phone }}',
  '{{ $json.message }}',
  'assistant'
);
```

**Atualizar insights do lead:**
```sql
INSERT INTO lead_insights (lead_id, sentiment_score, ai_summary, last_interaction)
VALUES (
  {{ $json.lead_id }},
  {{ $json.sentiment_score }},
  '{{ $json.ai_summary }}',
  NOW()
)
ON CONFLICT (lead_id) DO UPDATE SET
  sentiment_score = EXCLUDED.sentiment_score,
  ai_summary = EXCLUDED.ai_summary,
  last_interaction = NOW(),
  updated_at = NOW();
```

**Buscar leads com alto potencial:**
```sql
SELECT * FROM v_high_potential_leads
LIMIT 10;
```

**Buscar simulações pendentes:**
```sql
SELECT * FROM v_financing_pending_contact
LIMIT 20;
```

---

## 📈 ESTATÍSTICAS FINAIS

| Componente | Script Principal | Script Complementar | Total |
|------------|------------------|---------------------|-------|
| **Tabelas** | 22 | 5 | **27** |
| **Enums** | 10 | 3 | **13** |
| **Índices** | 65 | 15 | **80** |
| **Triggers** | 10 | 4 | **14** |
| **Views** | 5 | 2 | **7** |
| **Políticas RLS** | 3 | 0 | **3** |

---

## 🆘 TROUBLESHOOTING

### Erro: "relation already exists"

**Causa:** Tabela já existe de execução anterior  
**Solução:** Scripts usam `IF NOT EXISTS`, então é seguro executar novamente

### Erro: "type already exists"

**Causa:** Enum já existe  
**Solução:** Scripts usam `CREATE TYPE ... AS ENUM`, então é seguro

### Erro: "permission denied"

**Causa:** Usuário sem permissões  
**Solução:** Usar usuário `postgres` ou admin no Supabase

---

## 📞 SUPORTE

Em caso de dúvidas:

1. Verificar logs do Supabase: Dashboard > Logs
2. Consultar documentação: https://supabase.com/docs
3. Revisar este guia completo

---

## ✅ CHECKLIST FINAL

- [ ] Script principal executado (SUPABASE_FINAL_CLEAN.sql)
- [ ] Script complementar executado (SUPABASE_COMPLEMENTAR_AI_TABLES.sql)
- [ ] 27 tabelas criadas e validadas
- [ ] 7 views criadas e testadas
- [ ] Credenciais copiadas (URL, anon_key, service_role_key)
- [ ] .env do CRM configurado
- [ ] .env do N8N configurado
- [ ] Credencial PostgreSQL criada no N8N
- [ ] Workflows N8N importados (15 arquivos)
- [ ] Testes de integração realizados

---

**🎉 Banco de dados 100% pronto para agentes IA e produção!**

**Evandro Santos - Leman Negócios Imobiliários**  
*27 tabelas | 80 índices | 7 views | 14 triggers | 0 erros!*
