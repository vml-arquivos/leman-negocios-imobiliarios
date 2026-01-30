# 🤖 Integração com Agentes de IA - Leman Negócios Imobiliários

## 📋 Visão Geral

Sistema completo de integração com agentes de IA (N8N) para pré-atendimento, qualificação de leads, análise de perfil e recomendação automática de imóveis.

---

## 🗄️ Tabelas para Agentes de IA

### 1. **conversations** - Conversas
Armazena todas as conversas com clientes através de diferentes canais.

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  channel VARCHAR(50), -- 'whatsapp', 'website', 'instagram'
  external_id VARCHAR(255), -- Número WhatsApp, ID do chat
  status VARCHAR(50), -- 'active', 'closed', 'archived'
  agent_type VARCHAR(50), -- Tipo de agente IA
  context JSONB, -- Contexto da conversa
  started_at TIMESTAMP,
  last_message_at TIMESTAMP,
  closed_at TIMESTAMP
);
```

### 2. **messages** - Mensagens
Histórico completo de todas as mensagens trocadas.

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_type VARCHAR(50), -- 'user', 'agent', 'ai', 'system'
  sender_id INTEGER,
  content TEXT,
  message_type VARCHAR(50), -- 'text', 'image', 'property_card'
  metadata JSONB,
  is_read BOOLEAN,
  sent_at TIMESTAMP
);
```

### 3. **ai_property_matches** - Matching Cliente x Imóvel
Recomendações automáticas de imóveis para clientes.

```sql
CREATE TABLE ai_property_matches (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  property_id INTEGER REFERENCES properties(id),
  match_score DECIMAL(5,2), -- 0-100
  match_reasons JSONB,
  ai_recommendation TEXT,
  status VARCHAR(50), -- 'pending', 'sent', 'viewed', 'interested'
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP
);
```

### 4. **leads** - Campos de IA
Campos adicionados à tabela de leads para análise por IA.

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_profile JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_insights TEXT;
```

---

## 🔄 Fluxos de Integração

### Fluxo 1: Pré-Atendimento WhatsApp

```
Cliente envia mensagem
  ↓
Webhook N8N recebe mensagem
  ↓
IA analisa intenção
  ↓
Cria/atualiza lead no banco
  ↓
Salva conversa e mensagem
  ↓
IA responde automaticamente
  ↓
Se qualificado → Notifica corretor
```

**Webhook N8N:**
```
POST https://seu-n8n.com/webhook/whatsapp-incoming
```

**Payload:**
```json
{
  "from": "5561998687245",
  "name": "João Silva",
  "message": "Olá, gostaria de alugar um apartamento",
  "timestamp": "2026-01-27T10:30:00Z"
}
```

**Ações do Agente:**
1. Buscar ou criar lead
2. Criar conversa
3. Salvar mensagem
4. Analisar intenção (compra/aluguel)
5. Fazer perguntas qualificadoras
6. Atualizar perfil do lead

---

### Fluxo 2: Qualificação Automática

```
Lead criado/atualizado
  ↓
Webhook N8N dispara análise
  ↓
IA analisa histórico de conversas
  ↓
Gera perfil do cliente (ai_profile)
  ↓
Calcula score de qualificação (ai_score)
  ↓
Gera insights (ai_insights)
  ↓
Atualiza lead no banco
  ↓
Se score alto → Move para "hot"
```

**Webhook N8N:**
```
POST https://seu-n8n.com/webhook/lead-qualification
```

**Payload:**
```json
{
  "lead_id": 123,
  "name": "João Silva",
  "phone": "5561998687245",
  "email": "joao@email.com",
  "source": "whatsapp",
  "interactions_count": 5,
  "last_messages": [
    "Quero alugar apartamento 3 quartos",
    "Meu orçamento é até R$ 3.000",
    "Prefiro Águas Claras ou Vicente Pires"
  ]
}
```

**Resposta Esperada:**
```json
{
  "ai_profile": {
    "intent": "aluguel",
    "urgency": "alta",
    "budget": { "min": 2500, "max": 3000 },
    "preferences": {
      "neighborhoods": ["Águas Claras", "Vicente Pires"],
      "bedrooms": 3,
      "property_type": "apartamento"
    },
    "family_profile": "casal_com_filhos",
    "decision_stage": "pesquisa_ativa"
  },
  "ai_score": 85.5,
  "ai_insights": "Cliente com alta intenção de locação, orçamento definido e preferências claras. Recomenda-se envio imediato de opções em Águas Claras."
}
```

---

### Fluxo 3: Recomendação Automática de Imóveis

```
Lead qualificado
  ↓
Webhook N8N busca imóveis compatíveis
  ↓
IA analisa perfil vs imóveis disponíveis
  ↓
Calcula match_score para cada imóvel
  ↓
Salva matches no banco (ai_property_matches)
  ↓
Envia top 3 imóveis via WhatsApp
  ↓
Registra envio (status='sent')
  ↓
Cliente visualiza → Atualiza status='viewed'
  ↓
Cliente demonstra interesse → status='interested'
```

**Webhook N8N:**
```
POST https://seu-n8n.com/webhook/property-recommendation
```

**Payload:**
```json
{
  "lead_id": 123,
  "ai_profile": {
    "intent": "aluguel",
    "budget": { "min": 2500, "max": 3000 },
    "preferences": {
      "neighborhoods": ["Águas Claras", "Vicente Pires"],
      "bedrooms": 3
    }
  }
}
```

**Resposta Esperada:**
```json
{
  "matches": [
    {
      "property_id": 45,
      "match_score": 95.5,
      "match_reasons": {
        "price_match": true,
        "location_match": true,
        "bedrooms_match": true,
        "amenities_bonus": ["piscina", "academia"]
      },
      "ai_recommendation": "Apartamento perfeito para seu perfil! 3 quartos em Águas Claras, dentro do orçamento, com piscina e academia. Prédio novo com ótima localização."
    },
    {
      "property_id": 67,
      "match_score": 88.0,
      "match_reasons": {
        "price_match": true,
        "location_match": true,
        "bedrooms_match": true
      },
      "ai_recommendation": "Ótima opção em Vicente Pires, 3 quartos, condomínio com segurança 24h."
    }
  ]
}
```

---

### Fluxo 4: Análise de Perfil Contínua

```
A cada nova interação:
  ↓
Salva mensagem no banco
  ↓
Webhook N8N atualiza perfil
  ↓
IA analisa mudanças de comportamento
  ↓
Atualiza ai_profile e ai_score
  ↓
Se mudança significativa → Re-calcula matches
  ↓
Envia novas recomendações
```

---

## 📊 APIs para Agentes de IA

### 1. Criar/Atualizar Conversa

```typescript
POST /api/trpc/conversations.create

{
  "leadId": 123,
  "channel": "whatsapp",
  "externalId": "5561998687245",
  "agentType": "pre_attendance",
  "context": {
    "source": "organic",
    "first_message": "Quero alugar apartamento"
  }
}
```

### 2. Salvar Mensagem

```typescript
POST /api/trpc/messages.create

{
  "conversationId": 456,
  "senderType": "user",
  "content": "Quero apartamento 3 quartos em Águas Claras",
  "messageType": "text",
  "metadata": {
    "intent": "search",
    "entities": {
      "bedrooms": 3,
      "neighborhood": "Águas Claras"
    }
  }
}
```

### 3. Atualizar Perfil de IA do Lead

```typescript
POST /api/trpc/leads.updateAIProfile

{
  "leadId": 123,
  "aiProfile": { ... },
  "aiScore": 85.5,
  "aiInsights": "Cliente qualificado..."
}
```

### 4. Criar Match de Imóvel

```typescript
POST /api/trpc/ai.createPropertyMatch

{
  "leadId": 123,
  "propertyId": 45,
  "matchScore": 95.5,
  "matchReasons": { ... },
  "aiRecommendation": "Apartamento perfeito..."
}
```

### 5. Buscar Imóveis para Matching

```typescript
GET /api/trpc/properties.searchForMatching

Query: {
  "transactionType": "aluguel",
  "minPrice": 250000, // centavos
  "maxPrice": 300000,
  "neighborhoods": ["Águas Claras", "Vicente Pires"],
  "bedrooms": 3,
  "status": "disponivel"
}
```

### 6. Obter Histórico de Conversa

```typescript
GET /api/trpc/conversations.getHistory

Query: {
  "leadId": 123,
  "limit": 50
}

Response: {
  "conversations": [
    {
      "id": 456,
      "channel": "whatsapp",
      "messages": [
        {
          "senderType": "user",
          "content": "Olá",
          "sentAt": "2026-01-27T10:00:00Z"
        },
        {
          "senderType": "ai",
          "content": "Olá! Como posso ajudar?",
          "sentAt": "2026-01-27T10:00:05Z"
        }
      ]
    }
  ]
}
```

---

## 🎯 Casos de Uso Práticos

### Caso 1: Cliente Novo no WhatsApp

**Mensagem:** "Olá, quero comprar uma casa"

**Ações do Sistema:**
1. Criar lead no banco
2. Criar conversa (channel='whatsapp')
3. Salvar mensagem
4. IA responde: "Olá! Que ótimo! Para te ajudar melhor, qual região você prefere?"
5. Cliente responde: "Vicente Pires"
6. IA pergunta: "Qual seu orçamento aproximado?"
7. Cliente: "Até 1 milhão"
8. IA atualiza perfil e envia 3 casas compatíveis
9. Notifica corretor sobre lead qualificado

### Caso 2: Cliente Retornando

**Mensagem:** "Gostei da casa 2, quero agendar visita"

**Ações do Sistema:**
1. Identificar lead existente
2. Buscar conversa ativa
3. Salvar mensagem
4. Identificar imóvel mencionado (property_id=67)
5. Criar interaction tipo='visit'
6. IA responde: "Ótimo! Vou conectar você com um corretor"
7. Notifica corretor via N8N
8. Atualiza lead stage='hot'

### Caso 3: Novo Imóvel Cadastrado

**Ação:** Imóvel cadastrado no sistema

**Ações do Sistema:**
1. Webhook N8N dispara análise
2. Busca leads com perfil compatível
3. Calcula match_score para cada lead
4. Cria registros em ai_property_matches
5. Envia notificação para leads com score > 80
6. Mensagem: "Olá João! Acabamos de receber um imóvel perfeito para você!"

---

## 🔧 Configuração N8N

### Webhook 1: Incoming WhatsApp Message

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "whatsapp-incoming",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Create/Update Lead",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "leads",
        "columns": "name,phone,source,stage"
      }
    },
    {
      "name": "Create Conversation",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "conversations"
      }
    },
    {
      "name": "Save Message",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "messages"
      }
    },
    {
      "name": "OpenAI Analysis",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "model": "gpt-4",
        "prompt": "Analise a intenção do cliente..."
      }
    },
    {
      "name": "Send WhatsApp Response",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.whatsapp.com/send"
      }
    }
  ]
}
```

### Webhook 2: Lead Qualification

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "lead-qualification"
      }
    },
    {
      "name": "Get Conversation History",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "select",
        "table": "messages"
      }
    },
    {
      "name": "OpenAI Profile Analysis",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "model": "gpt-4",
        "prompt": "Analise o perfil do cliente baseado nas conversas..."
      }
    },
    {
      "name": "Update Lead AI Profile",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "update",
        "table": "leads",
        "columns": "ai_profile,ai_score,ai_insights"
      }
    }
  ]
}
```

---

## 📈 Métricas e Monitoramento

### KPIs para Agentes de IA

1. **Taxa de Resposta Automática**
   - Meta: > 95%
   - Query: `SELECT COUNT(*) FROM messages WHERE sender_type='ai'`

2. **Tempo Médio de Primeira Resposta**
   - Meta: < 30 segundos
   - Query: Diferença entre primeira mensagem do usuário e resposta da IA

3. **Taxa de Qualificação**
   - Meta: > 60%
   - Query: `SELECT COUNT(*) FROM leads WHERE ai_score >= 70`

4. **Taxa de Conversão de Matches**
   - Meta: > 15%
   - Query: `SELECT COUNT(*) FROM ai_property_matches WHERE status='interested'`

5. **Satisfação do Cliente**
   - Meta: > 4.5/5
   - Pesquisa pós-atendimento

---

## 🔐 Segurança e Privacidade

### LGPD - Lei Geral de Proteção de Dados

1. **Consentimento**
   - Solicitar consentimento antes de armazenar dados
   - Registrar consentimento em `leads.consent_given`

2. **Direito ao Esquecimento**
   - Endpoint para deletar todos os dados do cliente
   - Anonimizar conversas antigas

3. **Criptografia**
   - Dados sensíveis criptografados no banco
   - Mensagens com informações pessoais protegidas

---

## 📞 Suporte

Para dúvidas sobre integração com agentes de IA:
- **Email**: contato@lemanimoveis.com.br
- **WhatsApp**: (61) 99868-7245
- **GitHub**: https://github.com/vml-arquivos/leman-negocios-imobiliarios

---

**Sistema desenvolvido por Manus AI** 🤖
