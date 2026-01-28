# 🔧 Configuração Workflow N8N - Leman Imóveis

## 📋 Pré-requisitos

- ✅ Supabase configurado com schema aplicado
- ✅ N8N instalado (self-hosted ou cloud)
- ✅ Evolution API (WhatsApp)
- ✅ OpenAI API Key
- ✅ Google Cloud API (TTS opcional)

---

## 🚀 Workflows Necessários

### 1. **Webhook: Receber Mensagens WhatsApp**
**Nome:** `leman-webhook-incoming-messages`  
**Trigger:** Webhook POST  
**Descrição:** Recebe mensagens do WhatsApp via Evolution API

### 2. **Schedule: Processar Fila de Mensagens**
**Nome:** `leman-process-message-queue`  
**Trigger:** Cron (cada 3 segundos)  
**Descrição:** Processa mensagens enfileiradas

### 3. **Tool: Buscar Imóveis**
**Nome:** `leman-tool-search-properties`  
**Trigger:** Chamado pela IA  
**Descrição:** Busca imóveis no banco de dados

### 4. **Tool: Agendar Visita**
**Nome:** `leman-tool-schedule-visit`  
**Trigger:** Chamado pela IA  
**Descrição:** Agenda visita a imóvel

### 5. **Tool: Escalar para Humano**
**Nome:** `leman-tool-escalate-human`  
**Trigger:** Chamado pela IA  
**Descrição:** Transfere atendimento para humano

---

## 📝 Workflow 1: Receber Mensagens

### Nodes:

#### 1. Webhook (Trigger)
```json
{
  "httpMethod": "POST",
  "path": "leman-incoming-whatsapp",
  "responseMode": "lastNode"
}
```

#### 2. Extract Info (Set)
```javascript
{
  "external_id": "={{ $json.key.remoteJid }}",
  "customer_name": "={{ $json.pushName || '' }}",
  "customer_phone": "={{ $json.key.remoteJid.replace('@s.whatsapp.net', '') }}",
  "message_type": "={{ $json.message?.conversation ? 'text' : ($json.message?.audioMessage ? 'audio' : 'other') }}",
  "content": "={{ $json.message?.conversation || $json.message?.extendedTextMessage?.text || '' }}",
  "is_audio": "={{ !!$json.message?.audioMessage }}",
  "audio_url": "={{ $json.message?.audioMessage?.url || '' }}",
  "timestamp": "={{ $json.messageTimestamp }}"
}
```

#### 3. Supabase: Buscar ou Criar Conversa
```sql
-- Node: Postgres (Supabase)
INSERT INTO conversations (
  external_id,
  channel,
  customer_name,
  customer_phone,
  status
) VALUES (
  '{{ $json.external_id }}',
  'whatsapp',
  '{{ $json.customer_name }}',
  '{{ $json.customer_phone }}',
  'waiting'
)
ON CONFLICT (external_id) 
DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  last_message_at = NOW(),
  updated_at = NOW()
RETURNING *;
```

#### 4. Supabase: Adicionar à Fila
```sql
INSERT INTO message_queue (
  conversation_id,
  external_id,
  sender_type,
  content,
  message_type,
  media_url,
  priority,
  status
) VALUES (
  '{{ $('Buscar ou Criar Conversa').item.json.id }}',
  '{{ $json.external_id }}',
  'user',
  '{{ $json.content }}',
  '{{ $json.message_type }}',
  '{{ $json.audio_url }}',
  0,
  'queued'
);
```

#### 5. Webhook Response
```json
{
  "success": true,
  "message": "Mensagem recebida e enfileirada"
}
```

---

## ⏰ Workflow 2: Processar Fila

### Nodes:

#### 1. Schedule Trigger (Cron)
```
*/3 * * * * *  (cada 3 segundos)
```

#### 2. Supabase: Pegar Próxima Mensagem
```sql
SELECT * FROM get_next_queued_message();
```

#### 3. IF: Tem Mensagem?
```javascript
{{ $json.id !== undefined && $json.id !== null }}
```

**Se NÃO:** Stop and Error (silencioso)  
**Se SIM:** Continuar

#### 4. Supabase: Buscar Conversa e Contexto
```sql
SELECT
  c.*,
  ctx.customer_intent,
  ctx.transaction_type,
  ctx.property_type,
  ctx.neighborhoods,
  ctx.min_price,
  ctx.max_price,
  ctx.bedrooms,
  ctx.qualification_score,
  ctx.properties_sent,
  ctx.properties_interested
FROM conversations c
LEFT JOIN conversation_context ctx ON ctx.conversation_id = c.id
WHERE c.id = '{{ $('Pegar Próxima Mensagem').item.json.conversation_id }}';
```

#### 5. Supabase: Buscar Histórico (últimas 10 mensagens)
```sql
SELECT
  sender_type,
  content,
  sent_at,
  ai_intent
FROM messages
WHERE conversation_id = '{{ $('Buscar Conversa').item.json.id }}'
ORDER BY sent_at DESC
LIMIT 10;
```

#### 6. Code: Montar Contexto
```javascript
const conversation = $('Buscar Conversa').item.json;
const messages = $('Buscar Histórico').all().map(m => m.json);
const currentMessage = $('Pegar Próxima Mensagem').item.json;

// Montar histórico
const historico = messages
  .reverse()
  .map(m => `${m.sender_type === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`)
  .join('\n');

// Montar contexto
const contexto = conversation.customer_intent ? `
**Contexto do Cliente:**
- Intenção: ${conversation.customer_intent}
- Tipo de transação: ${conversation.transaction_type || 'N/A'}
- Tipo de imóvel: ${conversation.property_type || 'N/A'}
- Bairros: ${conversation.neighborhoods?.join(', ') || 'N/A'}
- Faixa de preço: R$ ${(conversation.min_price / 100).toFixed(2)} - R$ ${(conversation.max_price / 100).toFixed(2)}
- Quartos: ${conversation.bedrooms || 'N/A'}
- Score de qualificação: ${conversation.qualification_score || 0}/100
` : 'Novo cliente, sem contexto anterior.';

return [{
  json: {
    conversation_id: conversation.id,
    external_id: conversation.external_id,
    customer_name: conversation.customer_name,
    message: currentMessage.content,
    message_type: currentMessage.message_type,
    historico: historico,
    contexto: contexto
  }
}];
```

#### 7. Switch: Tipo de Mensagem

**Caso 1: Texto**
```javascript
{{ $json.message_type === 'text' }}
```

**Caso 2: Áudio**
```javascript
{{ $json.message_type === 'audio' }}
```

#### 8a. (Se Áudio) Transcrever com Gemini/Whisper
```javascript
// Node: OpenAI Whisper ou Google Gemini
// Transcrever áudio
```

#### 8b. Merge: Juntar transcrição com contexto

#### 9. AI Agent (OpenAI)
```javascript
{
  "model": "gpt-4",
  "temperature": 0.7,
  "systemMessage": `Você é um assistente imobiliário da **Leman Negócios Imobiliários**, especializado em imóveis de médio e alto padrão no Distrito Federal.

**Regiões Atendidas:**
- Vicente Pires
- Águas Claras
- Park Way
- Arniqueiras
- Sudoeste
- Guará
- Taguatinga

**Sua missão:**
1. Identificar a intenção do cliente (comprar, alugar, vender, avaliar)
2. Coletar preferências (tipo, localização, preço, quartos, características)
3. Qualificar o lead (urgência, capacidade financeira, estágio de decisão)
4. Recomendar imóveis compatíveis
5. Agendar visitas
6. Oferecer simulação de financiamento

**Ferramentas disponíveis:**
- buscar_imoveis: Busca imóveis no banco de dados
- agendar_visita: Agenda visita a um imóvel
- simular_financiamento: Simula financiamento bancário
- escalar_humano: Transfere para atendente humano

**Contexto Atual:**
{{ $json.contexto }}

**Histórico da Conversa:**
{{ $json.historico }}

**Instruções:**
- Seja cordial, profissional e prestativo
- Use o nome do cliente quando disponível
- Faça perguntas abertas para entender melhor as necessidades
- Não invente informações sobre imóveis
- Use as ferramentas disponíveis quando apropriado
- Se não souber responder, escale para humano`,
  "userMessage": "{{ $json.message }}"
}
```

**Tools:**
- Tool Workflow: buscar_imoveis
- Tool Workflow: agendar_visita
- Tool Workflow: simular_financiamento
- Tool Workflow: escalar_humano

#### 10. Code: Extrair Intenção e Entidades
```javascript
const aiResponse = $input.item.json.output;

// Extrair intenção (simplificado)
let intent = 'conversa_geral';
if (aiResponse.toLowerCase().includes('alugar') || aiResponse.toLowerCase().includes('aluguel')) {
  intent = 'busca_aluguel';
} else if (aiResponse.toLowerCase().includes('comprar') || aiResponse.toLowerCase().includes('compra')) {
  intent = 'busca_compra';
} else if (aiResponse.toLowerCase().includes('vender') || aiResponse.toLowerCase().includes('venda')) {
  intent = 'venda_imovel';
} else if (aiResponse.toLowerCase().includes('avaliar') || aiResponse.toLowerCase().includes('avaliação')) {
  intent = 'avaliacao_imovel';
} else if (aiResponse.toLowerCase().includes('visita') || aiResponse.toLowerCase().includes('agendar')) {
  intent = 'agendamento_visita';
}

// Extrair entidades (simplificado - em produção usar NER)
const entities = {
  property_type: null,
  neighborhoods: [],
  bedrooms: null,
  min_price: null,
  max_price: null
};

// Tipo de imóvel
if (aiResponse.toLowerCase().includes('apartamento')) entities.property_type = 'apartamento';
if (aiResponse.toLowerCase().includes('casa')) entities.property_type = 'casa';
if (aiResponse.toLowerCase().includes('cobertura')) entities.property_type = 'cobertura';
if (aiResponse.toLowerCase().includes('terreno')) entities.property_type = 'terreno';

// Bairros
const bairros = ['Vicente Pires', 'Águas Claras', 'Park Way', 'Arniqueiras', 'Sudoeste', 'Guará', 'Taguatinga'];
bairros.forEach(bairro => {
  if (aiResponse.toLowerCase().includes(bairro.toLowerCase())) {
    entities.neighborhoods.push(bairro);
  }
});

// Quartos
const quartosMatch = aiResponse.match(/(\d+)\s*(quarto|dormitório)/i);
if (quartosMatch) {
  entities.bedrooms = parseInt(quartosMatch[1]);
}

return [{
  json: {
    ...$ input.item.json,
    ai_response: aiResponse,
    ai_intent: intent,
    ai_entities: entities,
    ai_confidence: 85.0 // Simplificado
  }
}];
```

#### 11. Supabase: Salvar Mensagem do Usuário
```sql
INSERT INTO messages (
  conversation_id,
  sender_type,
  content,
  message_type,
  ai_processed,
  ai_intent,
  ai_entities,
  ai_confidence,
  sent_at
) VALUES (
  '{{ $json.conversation_id }}',
  'user',
  '{{ $json.message }}',
  '{{ $json.message_type }}',
  true,
  '{{ $json.ai_intent }}',
  '{{ JSON.stringify($json.ai_entities) }}',
  {{ $json.ai_confidence }},
  NOW()
);
```

#### 12. Supabase: Salvar Resposta da IA
```sql
INSERT INTO messages (
  conversation_id,
  sender_type,
  content,
  message_type,
  sent_at
) VALUES (
  '{{ $json.conversation_id }}',
  'ai',
  '{{ $json.ai_response }}',
  'text',
  NOW()
);
```

#### 13. Supabase: Atualizar/Criar Contexto
```sql
INSERT INTO conversation_context (
  conversation_id,
  customer_intent,
  transaction_type,
  property_type,
  neighborhoods,
  bedrooms,
  min_price,
  max_price,
  qualification_score,
  last_ai_analysis_at
) VALUES (
  '{{ $json.conversation_id }}',
  '{{ $json.ai_intent }}',
  '{{ $json.ai_entities.transaction_type || "aluguel" }}',
  '{{ $json.ai_entities.property_type }}',
  ARRAY[{{ $json.ai_entities.neighborhoods.map(n => `'${n}'`).join(',') }}],
  {{ $json.ai_entities.bedrooms || 'NULL' }},
  {{ $json.ai_entities.min_price || 'NULL' }},
  {{ $json.ai_entities.max_price || 'NULL' }},
  {{ $json.ai_confidence }},
  NOW()
)
ON CONFLICT (conversation_id)
DO UPDATE SET
  customer_intent = EXCLUDED.customer_intent,
  property_type = COALESCE(EXCLUDED.property_type, conversation_context.property_type),
  neighborhoods = CASE 
    WHEN EXCLUDED.neighborhoods IS NOT NULL AND array_length(EXCLUDED.neighborhoods, 1) > 0 
    THEN EXCLUDED.neighborhoods 
    ELSE conversation_context.neighborhoods 
  END,
  bedrooms = COALESCE(EXCLUDED.bedrooms, conversation_context.bedrooms),
  min_price = COALESCE(EXCLUDED.min_price, conversation_context.min_price),
  max_price = COALESCE(EXCLUDED.max_price, conversation_context.max_price),
  qualification_score = EXCLUDED.qualification_score,
  last_ai_analysis_at = NOW();
```

#### 14. Supabase: Atualizar Status da Conversa
```sql
UPDATE conversations
SET
  status = 'in_progress_ai',
  last_message_at = NOW(),
  updated_at = NOW()
WHERE id = '{{ $json.conversation_id }}';
```

#### 15. HTTP Request: Enviar WhatsApp (Evolution API)
```javascript
{
  "method": "POST",
  "url": "{{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
  "headers": {
    "apikey": "{{ $env.EVOLUTION_API_KEY }}",
    "Content-Type": "application/json"
  },
  "body": {
    "number": "{{ $json.external_id }}",
    "text": "{{ $json.ai_response }}"
  }
}
```

#### 16. Supabase: Marcar Mensagem como Processada
```sql
SELECT mark_message_processed('{{ $('Pegar Próxima Mensagem').item.json.id }}');
```

#### 17. (Se Erro) Supabase: Marcar como Falha
```sql
SELECT mark_message_failed(
  '{{ $('Pegar Próxima Mensagem').item.json.id }}',
  '{{ $json.error }}'
);
```

---

## 🔧 Variáveis de Ambiente (.env)

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=leman-imoveis

# OpenAI
OPENAI_API_KEY=sk-...

# Google Cloud (TTS - opcional)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# N8N
N8N_WEBHOOK_URL=https://n8n.seudominio.com
```

---

## 📊 Monitoramento

### Queries Úteis:

**Mensagens na fila:**
```sql
SELECT COUNT(*) FROM message_queue WHERE status = 'queued';
```

**Conversas ativas:**
```sql
SELECT COUNT(*) FROM conversations WHERE status IN ('waiting', 'in_progress_ai', 'waiting_response');
```

**Taxa de sucesso:**
```sql
SELECT
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM message_queue
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;
```

---

## 🎯 Próximos Passos

1. ✅ Aplicar schema no Supabase
2. ⏳ Importar workflows no N8N
3. ⏳ Configurar credenciais
4. ⏳ Testar fluxo completo
5. ⏳ Monitorar e ajustar

---

**Sistema desenvolvido por Manus AI** 🤖
