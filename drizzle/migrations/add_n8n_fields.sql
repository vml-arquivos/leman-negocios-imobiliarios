-- Migration: Add N8N Integration Fields
-- Created: 2026-01-31
-- Description: Adiciona campos para armazenar conversas do WhatsApp via N8N

-- ============================================
-- TABELA: leads
-- ============================================

-- Adicionar coluna n8n_conversas (JSONB array)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS n8n_conversas JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna last_message_at (timestamp)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

-- Comentários para documentação
COMMENT ON COLUMN leads.n8n_conversas IS 'Histórico de conversas do WhatsApp enviadas pelo N8N. Formato: [{ phone, message, direction, timestamp, messageId }]';
COMMENT ON COLUMN leads.last_message_at IS 'Timestamp da última mensagem recebida/enviada via N8N';

-- ============================================
-- TABELA: owners
-- ============================================

-- Adicionar coluna n8n_conversas (JSONB array)
ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS n8n_conversas JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna last_message_at (timestamp)
ALTER TABLE owners 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

-- Comentários para documentação
COMMENT ON COLUMN owners.n8n_conversas IS 'Histórico de conversas do WhatsApp enviadas pelo N8N. Formato: [{ phone, message, direction, timestamp, messageId }]';
COMMENT ON COLUMN owners.last_message_at IS 'Timestamp da última mensagem recebida/enviada via N8N';

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para busca rápida por telefone nas conversas
CREATE INDEX IF NOT EXISTS idx_leads_n8n_conversas ON leads USING GIN (n8n_conversas);
CREATE INDEX IF NOT EXISTS idx_owners_n8n_conversas ON owners USING GIN (n8n_conversas);

-- Índice para ordenação por última mensagem
CREATE INDEX IF NOT EXISTS idx_leads_last_message_at ON leads (last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_owners_last_message_at ON owners (last_message_at DESC NULLS LAST);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as colunas foram criadas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'n8n_conversas'
  ) THEN
    RAISE NOTICE '✓ Coluna leads.n8n_conversas criada com sucesso';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'last_message_at'
  ) THEN
    RAISE NOTICE '✓ Coluna leads.last_message_at criada com sucesso';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'owners' 
    AND column_name = 'n8n_conversas'
  ) THEN
    RAISE NOTICE '✓ Coluna owners.n8n_conversas criada com sucesso';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'owners' 
    AND column_name = 'last_message_at'
  ) THEN
    RAISE NOTICE '✓ Coluna owners.last_message_at criada com sucesso';
  END IF;
END $$;
