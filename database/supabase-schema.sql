-- ============================================
-- LEMAN NEGÓCIOS IMOBILIÁRIOS
-- Schema Supabase - Workflow de Atendimento com IA
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS - Tipos de Status
-- ============================================

-- Status de atendimento
CREATE TYPE attendance_status AS ENUM (
  'waiting',           -- Aguardando atendimento
  'in_progress_ai',    -- Em atendimento (IA)
  'waiting_response',  -- Aguardando resposta do cliente
  'transferred',       -- Transferido para humano
  'completed',         -- Finalizado
  'archived'           -- Arquivado
);

-- Tipo de mensagem
CREATE TYPE message_type AS ENUM (
  'text',
  'image',
  'audio',
  'video',
  'document',
  'location',
  'contact',
  'property_card',     -- Card de imóvel
  'property_list',     -- Lista de imóveis
  'button_response',   -- Resposta de botão
  'list_response',     -- Resposta de lista
  'system'             -- Mensagem do sistema
);

-- Tipo de remetente
CREATE TYPE sender_type AS ENUM (
  'user',              -- Cliente
  'ai',                -- Agente IA
  'agent',             -- Atendente humano
  'system'             -- Sistema
);

-- Status da mensagem
CREATE TYPE message_status AS ENUM (
  'queued',            -- Na fila
  'processing',        -- Processando
  'sent',              -- Enviada
  'delivered',         -- Entregue
  'read',              -- Lida
  'failed',            -- Falhou
  'cancelled'          -- Cancelada
);

-- Canal de comunicação
CREATE TYPE communication_channel AS ENUM (
  'whatsapp',
  'instagram',
  'facebook',
  'website',
  'telegram',
  'email'
);

-- ============================================
-- TABELA: conversations
-- Conversas/Atendimentos
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  external_id VARCHAR(255) UNIQUE NOT NULL, -- ID externo (número WhatsApp, ID Instagram, etc)
  channel communication_channel NOT NULL,
  
  -- Cliente
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  customer_avatar_url TEXT,
  
  -- Status do atendimento
  status attendance_status DEFAULT 'waiting' NOT NULL,
  
  -- Agente responsável
  assigned_agent_id UUID, -- ID do atendente humano (se transferido)
  assigned_agent_name VARCHAR(255),
  
  -- Contexto da conversa
  context JSONB DEFAULT '{}'::jsonb, -- Dados extraídos pela IA
  metadata JSONB DEFAULT '{}'::jsonb, -- Metadados adicionais
  
  -- Preferências do cliente (extraídas pela IA)
  customer_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Estatísticas
  message_count INTEGER DEFAULT 0,
  last_message_preview TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  -- Controle de tempo
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transferred_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX idx_conversations_external_id ON conversations(external_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_customer_phone ON conversations(customer_phone);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_assigned_agent ON conversations(assigned_agent_id) WHERE assigned_agent_id IS NOT NULL;

-- Índice GIN para busca no contexto
CREATE INDEX idx_conversations_context ON conversations USING GIN (context);
CREATE INDEX idx_conversations_preferences ON conversations USING GIN (customer_preferences);

-- ============================================
-- TABELA: messages
-- Mensagens das conversas
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamento
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Identificação
  external_message_id VARCHAR(255), -- ID da mensagem no canal externo
  
  -- Remetente
  sender_type sender_type NOT NULL,
  sender_id VARCHAR(255), -- ID do remetente (número, user_id, etc)
  sender_name VARCHAR(255),
  
  -- Conteúdo
  message_type message_type DEFAULT 'text' NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_mime_type VARCHAR(100),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status message_status DEFAULT 'sent' NOT NULL,
  
  -- Resposta a outra mensagem
  reply_to_message_id UUID REFERENCES messages(id),
  
  -- Processamento IA
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_intent VARCHAR(100), -- Intenção identificada pela IA
  ai_entities JSONB, -- Entidades extraídas (nomes, datas, valores, etc)
  ai_confidence DECIMAL(5,2), -- Confiança da IA (0-100)
  
  -- Controle de leitura
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_sender_type ON messages(sender_type);
CREATE INDEX idx_messages_external_id ON messages(external_message_id);
CREATE INDEX idx_messages_ai_intent ON messages(ai_intent) WHERE ai_intent IS NOT NULL;

-- Índice para busca full-text
CREATE INDEX idx_messages_content_search ON messages USING GIN (to_tsvector('portuguese', content));

-- ============================================
-- TABELA: message_queue
-- Fila/Buffer de mensagens para processamento
-- ============================================
CREATE TABLE message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamento
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Dados da mensagem
  external_id VARCHAR(255),
  sender_type sender_type NOT NULL,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  media_url TEXT,
  
  -- Controle de fila
  status VARCHAR(50) DEFAULT 'queued' NOT NULL, -- queued, processing, processed, failed
  priority INTEGER DEFAULT 0, -- Maior = mais prioritário
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Processamento
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_message_queue_status ON message_queue(status) WHERE status IN ('queued', 'processing');
CREATE INDEX idx_message_queue_conversation ON message_queue(conversation_id);
CREATE INDEX idx_message_queue_priority ON message_queue(priority DESC, created_at ASC);
CREATE INDEX idx_message_queue_created_at ON message_queue(created_at ASC);

-- ============================================
-- TABELA: attendance_status_history
-- Histórico de mudanças de status
-- ============================================
CREATE TABLE attendance_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamento
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Mudança de status
  previous_status attendance_status,
  new_status attendance_status NOT NULL,
  
  -- Responsável pela mudança
  changed_by_type sender_type,
  changed_by_id VARCHAR(255),
  changed_by_name VARCHAR(255),
  
  -- Motivo
  reason TEXT,
  notes TEXT,
  
  -- Timestamp
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_status_history_conversation ON attendance_status_history(conversation_id);
CREATE INDEX idx_status_history_changed_at ON attendance_status_history(changed_at DESC);

-- ============================================
-- TABELA: conversation_context
-- Contexto detalhado da conversa (separado para performance)
-- ============================================
CREATE TABLE conversation_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamento
  conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Intenção do cliente
  customer_intent VARCHAR(100), -- comprar, alugar, vender, avaliar, etc
  customer_urgency VARCHAR(50), -- baixa, média, alta, urgente
  
  -- Preferências de imóvel
  property_type VARCHAR(50), -- casa, apartamento, terreno, etc
  transaction_type VARCHAR(50), -- venda, aluguel
  neighborhoods TEXT[], -- Array de bairros preferidos
  min_price BIGINT, -- Em centavos
  max_price BIGINT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spaces INTEGER,
  min_area DECIMAL(10,2),
  max_area DECIMAL(10,2),
  
  -- Requisitos especiais
  required_features TEXT[], -- piscina, churrasqueira, etc
  
  -- Perfil do cliente
  family_profile VARCHAR(100), -- solteiro, casal, família, etc
  decision_stage VARCHAR(100), -- pesquisando, comparando, pronto_para_decidir
  
  -- Score de qualificação
  qualification_score DECIMAL(5,2), -- 0-100
  qualification_reasons JSONB,
  
  -- Imóveis visualizados/enviados
  properties_sent UUID[], -- Array de IDs de imóveis
  properties_viewed UUID[],
  properties_interested UUID[],
  
  -- Última atualização pela IA
  last_ai_analysis_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_context_conversation ON conversation_context(conversation_id);
CREATE INDEX idx_context_intent ON conversation_context(customer_intent);
CREATE INDEX idx_context_transaction_type ON conversation_context(transaction_type);
CREATE INDEX idx_context_qualification_score ON conversation_context(qualification_score DESC);

-- ============================================
-- TABELA: ai_responses
-- Respostas geradas pela IA (para análise e melhoria)
-- ============================================
CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamento
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Prompt e resposta
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  
  -- Modelo usado
  ai_model VARCHAR(100), -- gpt-4, gpt-3.5-turbo, etc
  ai_temperature DECIMAL(3,2),
  
  -- Tokens usados
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Tempo de processamento
  processing_time_ms INTEGER,
  
  -- Feedback
  was_sent BOOLEAN DEFAULT TRUE,
  was_edited BOOLEAN DEFAULT FALSE,
  edited_response TEXT,
  
  -- Avaliação (se houver)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ai_responses_conversation ON ai_responses(conversation_id);
CREATE INDEX idx_ai_responses_created_at ON ai_responses(created_at DESC);
CREATE INDEX idx_ai_responses_model ON ai_responses(ai_model);

-- ============================================
-- TABELA: webhook_logs
-- Log de webhooks recebidos e enviados
-- ============================================
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tipo
  webhook_type VARCHAR(100) NOT NULL, -- incoming, outgoing
  webhook_source VARCHAR(100), -- whatsapp, n8n, evolution-api, etc
  
  -- Dados
  method VARCHAR(10), -- POST, GET, etc
  url TEXT,
  headers JSONB,
  body JSONB,
  
  -- Resposta
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  
  -- Status
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Relacionamento (se aplicável)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_webhook_type ON webhook_logs(webhook_type);
CREATE INDEX idx_webhook_logs_success ON webhook_logs(success);
CREATE INDEX idx_webhook_logs_conversation ON webhook_logs(conversation_id) WHERE conversation_id IS NOT NULL;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_context_updated_at
  BEFORE UPDATE ON conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar contador de mensagens e preview
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    message_count = message_count + 1,
    last_message_preview = LEFT(NEW.content, 100),
    last_message_at = NEW.sent_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_new_message();

-- Trigger para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO attendance_status_history (
      conversation_id,
      previous_status,
      new_status,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_conversation_status_change
  AFTER UPDATE ON conversations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_status_change();

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para obter próxima mensagem da fila
CREATE OR REPLACE FUNCTION get_next_queued_message()
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  content TEXT,
  message_type message_type,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  UPDATE message_queue mq
  SET
    status = 'processing',
    processing_started_at = NOW(),
    updated_at = NOW()
  WHERE mq.id = (
    SELECT mq2.id
    FROM message_queue mq2
    WHERE mq2.status = 'queued'
      AND mq2.retry_count < mq2.max_retries
    ORDER BY mq2.priority DESC, mq2.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING mq.id, mq.conversation_id, mq.content, mq.message_type, mq.created_at;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar mensagem como processada
CREATE OR REPLACE FUNCTION mark_message_processed(message_queue_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE message_queue
  SET
    status = 'processed',
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = message_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar mensagem como falha e retentar
CREATE OR REPLACE FUNCTION mark_message_failed(message_queue_id UUID, error_msg TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE message_queue
  SET
    status = CASE
      WHEN retry_count + 1 >= max_retries THEN 'failed'
      ELSE 'queued'
    END,
    retry_count = retry_count + 1,
    error_message = error_msg,
    processing_started_at = NULL,
    updated_at = NOW()
  WHERE id = message_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de atendimento
CREATE OR REPLACE FUNCTION get_attendance_stats()
RETURNS TABLE (
  status attendance_status,
  count BIGINT,
  avg_response_time_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.status,
    COUNT(*)::BIGINT,
    AVG(EXTRACT(EPOCH FROM (c.last_message_at - c.started_at)) / 60)::NUMERIC
  FROM conversations c
  WHERE c.status != 'archived'
  GROUP BY c.status
  ORDER BY c.status;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de conversas ativas
CREATE OR REPLACE VIEW v_active_conversations AS
SELECT
  c.id,
  c.external_id,
  c.channel,
  c.customer_name,
  c.customer_phone,
  c.status,
  c.message_count,
  c.last_message_preview,
  c.last_message_at,
  c.started_at,
  ctx.customer_intent,
  ctx.qualification_score,
  EXTRACT(EPOCH FROM (NOW() - c.last_message_at)) / 60 AS minutes_since_last_message
FROM conversations c
LEFT JOIN conversation_context ctx ON ctx.conversation_id = c.id
WHERE c.status IN ('waiting', 'in_progress_ai', 'waiting_response', 'transferred')
ORDER BY c.last_message_at DESC;

-- View de mensagens não lidas
CREATE OR REPLACE VIEW v_unread_messages AS
SELECT
  m.id,
  m.conversation_id,
  c.customer_name,
  c.customer_phone,
  m.content,
  m.sent_at,
  EXTRACT(EPOCH FROM (NOW() - m.sent_at)) / 60 AS minutes_ago
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.is_read = FALSE
  AND m.sender_type = 'user'
  AND c.status != 'archived'
ORDER BY m.sent_at ASC;

-- View de fila de mensagens
CREATE OR REPLACE VIEW v_message_queue_status AS
SELECT
  status,
  COUNT(*) AS count,
  MIN(created_at) AS oldest_message,
  MAX(created_at) AS newest_message,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) AS avg_wait_time_seconds
FROM message_queue
WHERE status IN ('queued', 'processing')
GROUP BY status;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE conversations IS 'Conversas/atendimentos com clientes através de diferentes canais';
COMMENT ON TABLE messages IS 'Mensagens trocadas nas conversas';
COMMENT ON TABLE message_queue IS 'Fila de mensagens para processamento assíncrono';
COMMENT ON TABLE attendance_status_history IS 'Histórico de mudanças de status de atendimento';
COMMENT ON TABLE conversation_context IS 'Contexto detalhado extraído pela IA das conversas';
COMMENT ON TABLE ai_responses IS 'Respostas geradas pela IA para análise e melhoria';
COMMENT ON TABLE webhook_logs IS 'Log de webhooks recebidos e enviados';

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Você pode adicionar dados iniciais aqui se necessário

-- ============================================
-- FIM DO SCHEMA
-- ============================================

-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
