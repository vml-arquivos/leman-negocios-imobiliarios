# 📚 Guia de Uso - Schema Supabase Leman Imóveis

## 🚀 Como Aplicar o Schema no Supabase

### 1. Acessar Supabase
```
1. Acesse https://supabase.com
2. Faça login
3. Selecione seu projeto (ou crie um novo)
4. Vá em "SQL Editor" no menu lateral
```

### 2. Executar SQL
```
1. Clique em "New query"
2. Cole todo o conteúdo de: database/supabase-schema.sql
3. Clique em "Run" (ou Ctrl+Enter)
4. Aguarde a execução (pode levar 30-60 segundos)
5. Verifique se não há erros
```

### 3. Verificar Tabelas Criadas
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Tabelas esperadas:**
- ai_responses
- attendance_status_history
- conversation_context
- conversations
- message_queue
- messages
- webhook_logs

---

## 📊 Como Usar as Tabelas

### 1. Criar Nova Conversa

```sql
INSERT INTO conversations (
  external_id,
  channel,
  customer_name,
  customer_phone,
  status
) VALUES (
  '5561998687245',        -- Número WhatsApp
  'whatsapp',
  'João Silva',
  '(61) 99868-7245',
  'waiting'
) RETURNING id;
```

### 2. Adicionar Mensagem à Fila

```sql
INSERT INTO message_queue (
  conversation_id,
  sender_type,
  content,
  message_type,
  priority
) VALUES (
  'uuid-da-conversa',
  'user',
  'Olá, quero alugar um apartamento',
  'text',
  0  -- Prioridade normal
);
```

### 3. Pegar Próxima Mensagem da Fila

```sql
SELECT * FROM get_next_queued_message();
```

**Retorna:**
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "content": "Olá, quero alugar um apartamento",
  "message_type": "text",
  "created_at": "2026-01-27T10:00:00Z"
}
```

### 4. Salvar Mensagem Processada

```sql
-- Inserir mensagem do usuário
INSERT INTO messages (
  conversation_id,
  sender_type,
  content,
  message_type,
  ai_processed,
  ai_intent,
  ai_confidence
) VALUES (
  'uuid-da-conversa',
  'user',
  'Olá, quero alugar um apartamento',
  'text',
  TRUE,
  'busca_aluguel',
  95.5
);

-- Inserir resposta da IA
INSERT INTO messages (
  conversation_id,
  sender_type,
  content,
  message_type
) VALUES (
  'uuid-da-conversa',
  'ai',
  'Olá João! Que ótimo! Para te ajudar melhor, qual região você prefere?',
  'text'
);

-- Marcar mensagem da fila como processada
SELECT mark_message_processed('uuid-da-mensagem-na-fila');
```

### 5. Atualizar Contexto da Conversa

```sql
-- Criar contexto (primeira vez)
INSERT INTO conversation_context (
  conversation_id,
  customer_intent,
  transaction_type,
  property_type,
  neighborhoods,
  min_price,
  max_price,
  bedrooms,
  qualification_score
) VALUES (
  'uuid-da-conversa',
  'busca_aluguel',
  'aluguel',
  'apartamento',
  ARRAY['Águas Claras', 'Vicente Pires'],
  200000,  -- R$ 2.000 em centavos
  300000,  -- R$ 3.000
  3,
  85.5
);

-- Atualizar contexto existente
UPDATE conversation_context
SET
  neighborhoods = ARRAY['Águas Claras', 'Vicente Pires', 'Sudoeste'],
  max_price = 350000,
  qualification_score = 90.0,
  last_ai_analysis_at = NOW()
WHERE conversation_id = 'uuid-da-conversa';
```

### 6. Mudar Status do Atendimento

```sql
UPDATE conversations
SET status = 'in_progress_ai'
WHERE id = 'uuid-da-conversa';

-- O trigger automaticamente registra a mudança em attendance_status_history
```

### 7. Transferir para Atendente Humano

```sql
UPDATE conversations
SET
  status = 'transferred',
  assigned_agent_id = 'uuid-do-agente',
  assigned_agent_name = 'Maria Atendente',
  transferred_at = NOW()
WHERE id = 'uuid-da-conversa';
```

### 8. Finalizar Atendimento

```sql
UPDATE conversations
SET
  status = 'completed',
  completed_at = NOW()
WHERE id = 'uuid-da-conversa';
```

---

## 🔄 Workflow Completo com N8N

### Fluxo 1: Mensagem Recebida (WhatsApp → Supabase)

```javascript
// N8N Webhook recebe mensagem do WhatsApp
{
  "from": "5561998687245",
  "name": "João Silva",
  "message": "Olá, quero alugar um apartamento"
}

// 1. Buscar ou criar conversa
const conversation = await supabase
  .from('conversations')
  .select('*')
  .eq('external_id', from)
  .single();

if (!conversation) {
  conversation = await supabase
    .from('conversations')
    .insert({
      external_id: from,
      channel: 'whatsapp',
      customer_name: name,
      customer_phone: from,
      status: 'waiting'
    })
    .select()
    .single();
}

// 2. Adicionar à fila
await supabase
  .from('message_queue')
  .insert({
    conversation_id: conversation.id,
    sender_type: 'user',
    content: message,
    message_type: 'text'
  });
```

### Fluxo 2: Processar Fila (N8N Schedule)

```javascript
// Executar a cada 5 segundos
// N8N Schedule Trigger: */5 * * * * *

// 1. Pegar próxima mensagem
const { data } = await supabase
  .rpc('get_next_queued_message');

if (!data || data.length === 0) {
  return; // Fila vazia
}

const message = data[0];

// 2. Processar com IA (OpenAI)
const aiResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'Você é um assistente imobiliário...' },
    { role: 'user', content: message.content }
  ]
});

// 3. Extrair intenção e entidades
const intent = extractIntent(aiResponse);
const entities = extractEntities(aiResponse);

// 4. Salvar mensagem do usuário
await supabase
  .from('messages')
  .insert({
    conversation_id: message.conversation_id,
    sender_type: 'user',
    content: message.content,
    ai_processed: true,
    ai_intent: intent,
    ai_entities: entities,
    ai_confidence: 95.5
  });

// 5. Salvar resposta da IA
await supabase
  .from('messages')
  .insert({
    conversation_id: message.conversation_id,
    sender_type: 'ai',
    content: aiResponse.choices[0].message.content
  });

// 6. Enviar resposta via WhatsApp
await sendWhatsAppMessage(
  conversation.external_id,
  aiResponse.choices[0].message.content
);

// 7. Marcar como processada
await supabase
  .rpc('mark_message_processed', { message_queue_id: message.id });

// 8. Atualizar status da conversa
await supabase
  .from('conversations')
  .update({
    status: 'in_progress_ai',
    last_message_at: new Date()
  })
  .eq('id', message.conversation_id);
```

### Fluxo 3: Atualizar Contexto (Após Processamento)

```javascript
// Após processar mensagem, atualizar contexto

const context = {
  customer_intent: 'busca_aluguel',
  transaction_type: 'aluguel',
  property_type: 'apartamento',
  neighborhoods: ['Águas Claras', 'Vicente Pires'],
  min_price: 200000,
  max_price: 300000,
  bedrooms: 3,
  qualification_score: 85.5
};

await supabase
  .from('conversation_context')
  .upsert({
    conversation_id: conversation.id,
    ...context,
    last_ai_analysis_at: new Date()
  });
```

---

## 📊 Consultas Úteis

### Ver Conversas Ativas

```sql
SELECT * FROM v_active_conversations
ORDER BY last_message_at DESC
LIMIT 10;
```

### Ver Mensagens Não Lidas

```sql
SELECT * FROM v_unread_messages
LIMIT 20;
```

### Ver Status da Fila

```sql
SELECT * FROM v_message_queue_status;
```

### Estatísticas de Atendimento

```sql
SELECT * FROM get_attendance_stats();
```

### Histórico de uma Conversa

```sql
SELECT
  m.id,
  m.sender_type,
  m.content,
  m.sent_at,
  m.ai_intent
FROM messages m
WHERE m.conversation_id = 'uuid-da-conversa'
ORDER BY m.sent_at ASC;
```

### Conversas por Status

```sql
SELECT
  status,
  COUNT(*) as total,
  AVG(message_count) as avg_messages
FROM conversations
WHERE status != 'archived'
GROUP BY status
ORDER BY total DESC;
```

### Top 10 Clientes Mais Ativos

```sql
SELECT
  customer_name,
  customer_phone,
  message_count,
  status,
  started_at,
  last_message_at
FROM conversations
WHERE status != 'archived'
ORDER BY message_count DESC
LIMIT 10;
```

### Mensagens com Falha na Fila

```sql
SELECT
  mq.id,
  mq.conversation_id,
  c.customer_name,
  mq.content,
  mq.retry_count,
  mq.error_message,
  mq.created_at
FROM message_queue mq
JOIN conversations c ON c.id = mq.conversation_id
WHERE mq.status = 'failed'
ORDER BY mq.created_at DESC;
```

### Performance da IA

```sql
SELECT
  ai_model,
  COUNT(*) as total_responses,
  AVG(processing_time_ms) as avg_time_ms,
  AVG(total_tokens) as avg_tokens,
  AVG(rating) as avg_rating
FROM ai_responses
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY ai_model
ORDER BY total_responses DESC;
```

---

## 🔐 Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para usuários autenticados
CREATE POLICY "Allow read for authenticated users"
ON conversations
FOR SELECT
TO authenticated
USING (true);

-- Política: Permitir insert/update para service_role
CREATE POLICY "Allow all for service role"
ON conversations
FOR ALL
TO service_role
USING (true);

-- Repetir para outras tabelas...
```

---

## 🔄 Backup e Restore

### Backup

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Ou via pg_dump
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore

```bash
# Via Supabase CLI
supabase db reset
supabase db push

# Ou via psql
psql -h db.xxxxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## 📞 Suporte

**Email:** contato@lemanimoveis.com.br  
**WhatsApp:** (61) 99868-7245  
**GitHub:** https://github.com/vml-arquivos/leman-negocios-imobiliarios

---

**Sistema desenvolvido por Manus AI** 🤖
