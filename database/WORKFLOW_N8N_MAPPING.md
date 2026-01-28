# 🔄 Mapeamento Workflow N8N → Supabase Leman Imóveis

## 📋 Análise do Workflow Atual

### Estrutura Identificada:

**Workflow:** Secretária Virtual (Atendimento com IA)

**Componentes Principais:**
1. ✅ Webhook de entrada (mensagens recebidas)
2. ✅ Fila de mensagens (`n8n_fila_mensagens`)
3. ✅ Buffer de 3 segundos (espera por múltiplas mensagens)
4. ✅ Processamento com IA (OpenAI/Gemini)
5. ✅ Transcrição de áudio
6. ✅ Text-to-Speech (resposta em áudio)
7. ✅ Histórico de conversas
8. ✅ Contexto de atendimento (24h de validade)
9. ✅ Escalação para humano
10. ✅ Integração com ChatWoot

---

## 🗄️ Mapeamento de Tabelas

### Tabela Antiga → Nova (Supabase)

| Tabela Antiga | Tabela Nova Supabase | Descrição |
|---------------|---------------------|-----------|
| `n8n_fila_mensagens` | `message_queue` | Fila de mensagens para processamento |
| `historico_conversas` (implícito) | `conversations` | Conversas/atendimentos |
| Não existia | `messages` | Histórico completo de mensagens |
| `contexto_atendimento` (implícito) | `conversation_context` | Contexto extraído pela IA |
| Não existia | `attendance_status_history` | Histórico de mudanças de status |
| Não existia | `ai_responses` | Respostas geradas pela IA |
| Não existia | `webhook_logs` | Log de webhooks |

---

## 🔄 Fluxo Adaptado para Supabase

### 1. Receber Mensagem (Webhook)

**Antes (ChatWoot):**
```javascript
{
  "body": {
    "id": "msg_id",
    "account": { "id": "account_id" },
    "conversation": { "id": "conv_id" },
    "content": "Olá, quero alugar um apartamento",
    "message_type": "incoming",
    "conversation": {
      "meta": {
        "sender": {
          "phone_number": "5561998687245"
        }
      },
      "labels": []
    }
  }
}
```

**Depois (Supabase):**
```sql
-- 1. Buscar ou criar conversa
INSERT INTO conversations (
  external_id,
  channel,
  customer_phone,
  status
) VALUES (
  '5561998687245',
  'whatsapp',
  '(61) 99868-7245',
  'waiting'
)
ON CONFLICT (external_id) 
DO UPDATE SET
  last_message_at = NOW(),
  updated_at = NOW()
RETURNING *;

-- 2. Adicionar à fila
INSERT INTO message_queue (
  conversation_id,
  sender_type,
  content,
  message_type,
  priority,
  status
) VALUES (
  conversation_id,
  'user',
  'Olá, quero alugar um apartamento',
  'text',
  0,
  'queued'
);
```

---

### 2. Processar Fila (Schedule - cada 3 segundos)

**Antes:**
```sql
SELECT * FROM n8n_fila_mensagens
WHERE telefone = '5561998687245'
ORDER BY timestamp;

-- Esperar 3 segundos
-- Verificar se é a última mensagem
-- Processar
-- DELETE FROM n8n_fila_mensagens WHERE telefone = '...'
```

**Depois (Supabase):**
```sql
-- Pegar próxima mensagem (com lock)
SELECT * FROM get_next_queued_message();

-- Retorna:
{
  "id": "uuid",
  "conversation_id": "uuid",
  "content": "Olá, quero alugar um apartamento",
  "message_type": "text",
  "created_at": "2026-01-27T10:00:00Z"
}

-- Após processar com sucesso:
SELECT mark_message_processed('uuid-da-mensagem');

-- Se falhar:
SELECT mark_message_failed('uuid-da-mensagem', 'Erro ao processar');
```

---

### 3. Buscar Histórico/Contexto

**Antes:**
```javascript
// Buscar histórico implícito
const historico = await buscarHistorico(session_id);
const contexto_valido = (Date.now() - historico.updated_at) < 24 * 60 * 60 * 1000;
```

**Depois (Supabase):**
```sql
-- Buscar conversa e contexto
SELECT
  c.*,
  ctx.*,
  (EXTRACT(EPOCH FROM (NOW() - c.last_message_at)) / 3600) AS horas_desde_ultima_msg
FROM conversations c
LEFT JOIN conversation_context ctx ON ctx.conversation_id = c.id
WHERE c.external_id = '5561998687245';

-- Buscar últimas 10 mensagens
SELECT
  m.sender_type,
  m.content,
  m.sent_at,
  m.ai_intent
FROM messages m
WHERE m.conversation_id = 'uuid-da-conversa'
ORDER BY m.sent_at DESC
LIMIT 10;
```

---

### 4. Processar com IA

**Antes:**
```javascript
const prompt = `
Você é uma secretária virtual.
Histórico: ${historico}
Mensagem: ${mensagem}
`;

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: prompt },
    { role: 'user', content: mensagem }
  ]
});
```

**Depois (Supabase - mesma lógica, mas salvar tudo):**
```javascript
// 1. Buscar contexto
const { data: conversation } = await supabase
  .from('conversations')
  .select('*, conversation_context(*)')
  .eq('external_id', phone)
  .single();

// 2. Buscar histórico
const { data: messages } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversation.id)
  .order('sent_at', { ascending: false })
  .limit(10);

// 3. Montar prompt com contexto
const prompt = `
Você é um assistente imobiliário da Leman Negócios Imobiliários.

**Contexto do Cliente:**
${conversation.conversation_context ? JSON.stringify(conversation.conversation_context) : 'Novo cliente'}

**Histórico Recente:**
${messages.map(m => `${m.sender_type}: ${m.content}`).join('\n')}

**Nova Mensagem:**
${mensagem}

**Instruções:**
- Seja cordial e profissional
- Identifique a intenção do cliente (comprar, alugar, vender, avaliar)
- Colete preferências (tipo de imóvel, localização, preço, quartos)
- Recomende imóveis compatíveis
- Agende visitas quando apropriado
`;

// 4. Processar com IA
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: prompt },
    { role: 'user', content: mensagem }
  ]
});

// 5. Extrair intenção e entidades
const intent = extractIntent(response); // Ex: 'busca_aluguel'
const entities = extractEntities(response); // Ex: { tipo: 'apartamento', bairro: 'Águas Claras' }

// 6. Salvar mensagem do usuário
await supabase.from('messages').insert({
  conversation_id: conversation.id,
  sender_type: 'user',
  content: mensagem,
  ai_processed: true,
  ai_intent: intent,
  ai_entities: entities,
  ai_confidence: 95.5
});

// 7. Salvar resposta da IA
await supabase.from('messages').insert({
  conversation_id: conversation.id,
  sender_type: 'ai',
  content: response.choices[0].message.content
});

// 8. Salvar resposta da IA para análise
await supabase.from('ai_responses').insert({
  conversation_id: conversation.id,
  prompt: prompt,
  response: response.choices[0].message.content,
  ai_model: 'gpt-4',
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  total_tokens: response.usage.total_tokens
});

// 9. Atualizar contexto
await supabase.from('conversation_context').upsert({
  conversation_id: conversation.id,
  customer_intent: intent,
  transaction_type: entities.transaction_type || 'aluguel',
  property_type: entities.property_type || 'apartamento',
  neighborhoods: entities.neighborhoods || [],
  min_price: entities.min_price,
  max_price: entities.max_price,
  bedrooms: entities.bedrooms,
  qualification_score: calculateScore(conversation, entities),
  last_ai_analysis_at: new Date()
});

// 10. Atualizar status da conversa
await supabase.from('conversations').update({
  status: 'in_progress_ai',
  last_message_at: new Date()
}).eq('id', conversation.id);
```

---

### 5. Enviar Resposta

**Antes (ChatWoot):**
```javascript
await fetch(`${chatwoot_url}/api/v1/accounts/${account_id}/conversations/${conv_id}/messages`, {
  method: 'POST',
  headers: {
    'api_access_token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: response,
    message_type: 'outgoing',
    private: false
  })
});
```

**Depois (WhatsApp direto via Evolution API):**
```javascript
// Enviar via Evolution API
await fetch('https://evolution-api.com/message/sendText', {
  method: 'POST',
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    number: '5561998687245',
    text: response
  })
});

// Salvar no Supabase que foi enviada
await supabase.from('messages').update({
  status: 'sent',
  delivered_at: new Date()
}).eq('id', message_id);
```

---

### 6. Transcrever Áudio

**Antes (Gemini):**
```javascript
const transcription = await gemini.audio.transcribe({
  audio: audioBuffer,
  model: 'gemini-2.5-pro'
});
```

**Depois (Salvar no Supabase):**
```javascript
// Transcrever
const transcription = await gemini.audio.transcribe({
  audio: audioBuffer
});

// Salvar mensagem com áudio + transcrição
await supabase.from('messages').insert({
  conversation_id: conversation.id,
  sender_type: 'user',
  message_type: 'audio',
  content: transcription.text, // Transcrição
  media_url: audioUrl, // URL do áudio
  media_mime_type: 'audio/ogg'
});
```

---

### 7. Gerar Áudio (Text-to-Speech)

**Antes (Google TTS):**
```javascript
const audio = await googleTTS.synthesize({
  text: response,
  voice: 'pt-BR-Neural2-C'
});

// Enviar via ChatWoot
await sendAudioToChatwoot(audio);
```

**Depois (Salvar no Supabase):**
```javascript
// Gerar áudio
const audio = await googleTTS.synthesize({
  text: response
});

// Upload para storage
const audioUrl = await uploadToStorage(audio);

// Salvar mensagem
await supabase.from('messages').insert({
  conversation_id: conversation.id,
  sender_type: 'ai',
  message_type: 'audio',
  content: response, // Texto original
  media_url: audioUrl,
  media_mime_type: 'audio/wav'
});

// Enviar via WhatsApp
await sendWhatsAppAudio(phone, audioUrl);
```

---

### 8. Escalar para Humano

**Antes:**
```javascript
// Adicionar etiqueta no ChatWoot
await addLabel(conversation_id, 'aguardando-atendente');
```

**Depois (Supabase):**
```sql
-- Atualizar status
UPDATE conversations
SET
  status = 'transferred',
  transferred_at = NOW()
WHERE id = 'uuid-da-conversa';

-- Notificar atendente (webhook N8N)
-- Enviar para Telegram/Slack
```

---

### 9. Atualizar Status/Contexto

**Antes:**
```javascript
// Salvar contexto implícito
await saveContext(session_id, {
  status: 'agendado',
  ultimo_contexto: { ... }
});
```

**Depois (Supabase):**
```sql
-- Atualizar contexto
UPDATE conversation_context
SET
  customer_intent = 'agendamento_visita',
  qualification_score = 95.0,
  properties_interested = ARRAY['uuid-imovel-1', 'uuid-imovel-2'],
  last_ai_analysis_at = NOW()
WHERE conversation_id = 'uuid-da-conversa';

-- Atualizar status
UPDATE conversations
SET status = 'waiting_response'
WHERE id = 'uuid-da-conversa';
```

---

## 🔧 Campos Importantes para IA

### Tabela `conversations`

| Campo | Uso pela IA | Exemplo |
|-------|-------------|---------|
| `context` | Dados extraídos pela IA | `{"nome": "João", "interesse": "apartamento"}` |
| `customer_preferences` | Preferências do cliente | `{"bairros": ["Águas Claras"], "preco_max": 300000}` |
| `status` | Status do atendimento | `in_progress_ai`, `waiting_response` |

### Tabela `messages`

| Campo | Uso pela IA | Exemplo |
|-------|-------------|---------|
| `ai_intent` | Intenção identificada | `busca_aluguel`, `agendamento_visita` |
| `ai_entities` | Entidades extraídas | `{"tipo": "apartamento", "quartos": 3}` |
| `ai_confidence` | Confiança da IA | `95.5` |

### Tabela `conversation_context`

| Campo | Uso pela IA | Exemplo |
|-------|-------------|---------|
| `customer_intent` | Intenção principal | `comprar`, `alugar`, `vender` |
| `customer_urgency` | Urgência | `baixa`, `média`, `alta`, `urgente` |
| `property_type` | Tipo de imóvel | `casa`, `apartamento`, `terreno` |
| `neighborhoods` | Bairros preferidos | `["Águas Claras", "Vicente Pires"]` |
| `min_price` / `max_price` | Faixa de preço | `200000` (R$ 2.000 em centavos) |
| `qualification_score` | Score de qualificação | `85.5` (0-100) |
| `properties_sent` | Imóveis enviados | `["uuid1", "uuid2"]` |
| `properties_interested` | Imóveis com interesse | `["uuid1"]` |

---

## 📊 Exemplo Completo de Fluxo

### Cenário: Cliente pergunta sobre apartamento

**1. Webhook recebe mensagem:**
```json
{
  "from": "5561998687245",
  "name": "João Silva",
  "message": "Olá, quero alugar um apartamento de 3 quartos em Águas Claras"
}
```

**2. Criar/atualizar conversa:**
```sql
INSERT INTO conversations (external_id, channel, customer_name, customer_phone, status)
VALUES ('5561998687245', 'whatsapp', 'João Silva', '(61) 99868-7245', 'waiting')
ON CONFLICT (external_id) DO UPDATE SET last_message_at = NOW()
RETURNING id;
```

**3. Adicionar à fila:**
```sql
INSERT INTO message_queue (conversation_id, sender_type, content, message_type)
VALUES ('uuid-conversa', 'user', 'Olá, quero alugar...', 'text');
```

**4. Schedule pega da fila (3s depois):**
```sql
SELECT * FROM get_next_queued_message();
```

**5. Processar com IA:**
```javascript
const response = await openai.chat.completions.create({...});
// Resposta: "Olá João! Que ótimo! Temos ótimos apartamentos de 3 quartos em Águas Claras. Qual sua faixa de preço?"
```

**6. Salvar mensagens:**
```sql
-- Mensagem do usuário
INSERT INTO messages (conversation_id, sender_type, content, ai_intent, ai_entities, ai_confidence)
VALUES ('uuid', 'user', 'Olá, quero alugar...', 'busca_aluguel', '{"tipo": "apartamento", "quartos": 3, "bairro": "Águas Claras"}', 95.5);

-- Resposta da IA
INSERT INTO messages (conversation_id, sender_type, content)
VALUES ('uuid', 'ai', 'Olá João! Que ótimo!...');
```

**7. Atualizar contexto:**
```sql
INSERT INTO conversation_context (
  conversation_id, customer_intent, transaction_type, property_type,
  neighborhoods, bedrooms, qualification_score
) VALUES (
  'uuid', 'busca_aluguel', 'aluguel', 'apartamento',
  ARRAY['Águas Claras'], 3, 85.0
);
```

**8. Enviar WhatsApp:**
```javascript
await sendWhatsApp('5561998687245', 'Olá João! Que ótimo!...');
```

**9. Marcar como processada:**
```sql
SELECT mark_message_processed('uuid-mensagem-fila');
```

**10. Atualizar status:**
```sql
UPDATE conversations
SET status = 'in_progress_ai', last_message_at = NOW()
WHERE id = 'uuid';
```

---

## 🎯 Próximos Passos

1. ✅ Aplicar schema no Supabase
2. ⏳ Adaptar workflow N8N
3. ⏳ Configurar webhooks
4. ⏳ Testar fluxo completo

---

**Sistema desenvolvido por Manus AI** 🤖
