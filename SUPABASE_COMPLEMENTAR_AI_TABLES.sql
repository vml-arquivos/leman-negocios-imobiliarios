-- ============================================================================================================
-- SCRIPT COMPLEMENTAR: TABELAS PARA AGENTES IA (N8N)
-- Leman Negócios Imobiliários - Evandro Santos
-- 
-- Este script adiciona 5 tabelas sugeridas pelo Gemini para melhorar
-- a integração com agentes de IA e workflows N8N
--
-- Data: 27/01/2026
-- Versão: 1.1.0
-- ============================================================================================================

-- ============================================================================================================
-- ENUMS ADICIONAIS PARA AGENTES IA
-- ============================================================================================================

-- Enum: Papéis da IA na conversa
CREATE TYPE ai_role AS ENUM ('user', 'assistant', 'system');

-- Enum: Sistema de amortização (financiamento)
CREATE TYPE amortization_system AS ENUM ('SAC', 'PRICE');

-- Enum: Status de simulação
CREATE TYPE simulation_status AS ENUM ('pending', 'contacted', 'converted', 'lost');

-- ============================================================================================================
-- TABELA 1: AI_CONTEXT_STATUS (Memória da IA)
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS ai_context_status (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  role ai_role NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ai_context_status IS 'Armazena o contexto e histórico de conversas dos agentes de IA';
COMMENT ON COLUMN ai_context_status.session_id IS 'ID único da sessão de conversa';
COMMENT ON COLUMN ai_context_status.phone IS 'Telefone do cliente (chave de identificação)';
COMMENT ON COLUMN ai_context_status.message IS 'Mensagem enviada ou recebida';
COMMENT ON COLUMN ai_context_status.role IS 'Papel: user, assistant ou system';

-- Índices para performance
CREATE INDEX idx_ai_context_session ON ai_context_status(session_id);
CREATE INDEX idx_ai_context_phone ON ai_context_status(phone);
CREATE INDEX idx_ai_context_created ON ai_context_status(created_at DESC);

-- ============================================================================================================
-- TABELA 2: CLIENT_INTERESTS (Interesses Extraídos pela IA)
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS client_interests (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_type property_type,
  interest_type transaction_type,
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_neighborhoods TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE client_interests IS 'Interesses e preferências do cliente extraídos pela IA durante conversas';
COMMENT ON COLUMN client_interests.client_id IS 'Referência ao lead';
COMMENT ON COLUMN client_interests.property_type IS 'Tipo de imóvel de interesse';
COMMENT ON COLUMN client_interests.interest_type IS 'Interesse: venda, locação ou ambos';
COMMENT ON COLUMN client_interests.budget_min IS 'Orçamento mínimo em centavos';
COMMENT ON COLUMN client_interests.budget_max IS 'Orçamento máximo em centavos';

-- Índices para performance
CREATE INDEX idx_client_interests_client ON client_interests(client_id);
CREATE INDEX idx_client_interests_type ON client_interests(property_type);
CREATE INDEX idx_client_interests_budget ON client_interests(budget_min, budget_max);

-- ============================================================================================================
-- TABELA 3: FINANCING_SIMULATIONS (Simulações de Financiamento)
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS financing_simulations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Dados do cliente
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  
  -- Preferências do imóvel
  property_type VARCHAR(100),
  desired_location VARCHAR(255),
  estimated_value INTEGER,
  
  -- Dados da simulação
  property_value INTEGER NOT NULL,
  down_payment INTEGER NOT NULL,
  financed_amount INTEGER NOT NULL,
  term_months INTEGER NOT NULL,
  amortization_system amortization_system DEFAULT 'SAC' NOT NULL,
  
  -- Resultados
  selected_bank VARCHAR(100),
  interest_rate NUMERIC(5, 2),
  first_installment INTEGER,
  last_installment INTEGER,
  average_installment INTEGER,
  total_amount INTEGER,
  total_interest INTEGER,
  
  -- Tracking
  ip_address VARCHAR(45),
  user_agent TEXT,
  status simulation_status DEFAULT 'pending',
  contacted BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE financing_simulations IS 'Simulações de financiamento imobiliário realizadas por leads';
COMMENT ON COLUMN financing_simulations.lead_id IS 'Lead associado (se já existir)';
COMMENT ON COLUMN financing_simulations.property_value IS 'Valor do imóvel em centavos';
COMMENT ON COLUMN financing_simulations.down_payment IS 'Entrada em centavos';
COMMENT ON COLUMN financing_simulations.financed_amount IS 'Valor financiado em centavos';
COMMENT ON COLUMN financing_simulations.term_months IS 'Prazo em meses';
COMMENT ON COLUMN financing_simulations.interest_rate IS 'Taxa de juros anual (%)';

-- Índices para performance
CREATE INDEX idx_financing_lead ON financing_simulations(lead_id);
CREATE INDEX idx_financing_status ON financing_simulations(status);
CREATE INDEX idx_financing_contacted ON financing_simulations(contacted);
CREATE INDEX idx_financing_created ON financing_simulations(created_at DESC);
CREATE INDEX idx_financing_email ON financing_simulations(email);
CREATE INDEX idx_financing_phone ON financing_simulations(phone);

-- ============================================================================================================
-- TABELA 4: LEAD_INSIGHTS (Inteligência e Análise de Leads)
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS lead_insights (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Análise de sentimento
  sentiment_score INTEGER CHECK (sentiment_score >= -100 AND sentiment_score <= 100),
  
  -- Resumo gerado por IA
  ai_summary TEXT,
  
  -- Última interação
  last_interaction TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE lead_insights IS 'Insights e análises de inteligência artificial sobre leads';
COMMENT ON COLUMN lead_insights.lead_id IS 'Referência ao lead';
COMMENT ON COLUMN lead_insights.sentiment_score IS 'Score de sentimento: -100 (negativo) a +100 (positivo)';
COMMENT ON COLUMN lead_insights.ai_summary IS 'Resumo gerado pela IA sobre o lead';
COMMENT ON COLUMN lead_insights.last_interaction IS 'Data da última interação analisada';

-- Índices para performance
CREATE INDEX idx_lead_insights_lead ON lead_insights(lead_id);
CREATE INDEX idx_lead_insights_sentiment ON lead_insights(sentiment_score);
CREATE INDEX idx_lead_insights_updated ON lead_insights(updated_at DESC);

-- Constraint: Um lead pode ter apenas um registro de insights
CREATE UNIQUE INDEX idx_lead_insights_unique ON lead_insights(lead_id);

-- ============================================================================================================
-- TABELA 5: OWNERS (Proprietários de Imóveis)
-- ============================================================================================================

CREATE TABLE IF NOT EXISTS owners (
  id SERIAL PRIMARY KEY,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(20),
  email VARCHAR(320),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  
  -- Endereço
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Dados bancários
  bank_name VARCHAR(100),
  bank_agency VARCHAR(20),
  bank_account VARCHAR(30),
  pix_key VARCHAR(255),
  
  -- Observações
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE owners IS 'Proprietários de imóveis cadastrados no sistema';
COMMENT ON COLUMN owners.cpf_cnpj IS 'CPF ou CNPJ do proprietário';
COMMENT ON COLUMN owners.pix_key IS 'Chave PIX para pagamentos';
COMMENT ON COLUMN owners.active IS 'Proprietário ativo no sistema';

-- Índices para performance
CREATE INDEX idx_owners_name ON owners(name);
CREATE INDEX idx_owners_email ON owners(email);
CREATE INDEX idx_owners_phone ON owners(phone);
CREATE INDEX idx_owners_cpf_cnpj ON owners(cpf_cnpj);
CREATE INDEX idx_owners_active ON owners(active);

-- Constraint: CPF/CNPJ único (se informado)
CREATE UNIQUE INDEX idx_owners_cpf_cnpj_unique ON owners(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;

-- ============================================================================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================================================

-- Trigger: Atualizar updated_at em client_interests
CREATE OR REPLACE FUNCTION update_client_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_interests_updated_at
BEFORE UPDATE ON client_interests
FOR EACH ROW
EXECUTE FUNCTION update_client_interests_updated_at();

-- Trigger: Atualizar updated_at em financing_simulations
CREATE OR REPLACE FUNCTION update_financing_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financing_simulations_updated_at
BEFORE UPDATE ON financing_simulations
FOR EACH ROW
EXECUTE FUNCTION update_financing_simulations_updated_at();

-- Trigger: Atualizar updated_at em lead_insights
CREATE OR REPLACE FUNCTION update_lead_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_insights_updated_at
BEFORE UPDATE ON lead_insights
FOR EACH ROW
EXECUTE FUNCTION update_lead_insights_updated_at();

-- Trigger: Atualizar updated_at em owners
CREATE OR REPLACE FUNCTION update_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_owners_updated_at
BEFORE UPDATE ON owners
FOR EACH ROW
EXECUTE FUNCTION update_owners_updated_at();

-- ============================================================================================================
-- VIEWS ADICIONAIS PARA AGENTES IA
-- ============================================================================================================

-- View: Simulações pendentes de contato
CREATE OR REPLACE VIEW v_financing_pending_contact AS
SELECT 
  fs.*,
  l.name as lead_name,
  l.status as lead_status
FROM financing_simulations fs
LEFT JOIN leads l ON l.id = fs.lead_id
WHERE fs.contacted = FALSE
AND fs.status = 'pending'
ORDER BY fs.created_at DESC;

COMMENT ON VIEW v_financing_pending_contact IS 'Simulações de financiamento aguardando contato';

-- View: Insights de leads com alto potencial
CREATE OR REPLACE VIEW v_high_potential_leads AS
SELECT 
  l.*,
  li.sentiment_score,
  li.ai_summary,
  li.last_interaction
FROM leads l
INNER JOIN lead_insights li ON li.lead_id = l.id
WHERE li.sentiment_score >= 50
AND l.status NOT IN ('perdido', 'inativo', 'convertido')
ORDER BY li.sentiment_score DESC, l.score DESC;

COMMENT ON VIEW v_high_potential_leads IS 'Leads com alto potencial (sentiment >= 50)';

-- ============================================================================================================
-- MENSAGEM DE CONCLUSÃO
-- ============================================================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SCRIPT COMPLEMENTAR EXECUTADO COM SUCESSO!';
  RAISE NOTICE '   • 5 tabelas adicionais criadas para agentes IA';
  RAISE NOTICE '   • 3 enums adicionais criados';
  RAISE NOTICE '   • 4 triggers de atualização configurados';
  RAISE NOTICE '   • 2 views adicionais criadas';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TABELAS CRIADAS:';
  RAISE NOTICE '   1. ai_context_status (Memória da IA)';
  RAISE NOTICE '   2. client_interests (Interesses extraídos)';
  RAISE NOTICE '   3. financing_simulations (Simulações)';
  RAISE NOTICE '   4. lead_insights (Insights de IA)';
  RAISE NOTICE '   5. owners (Proprietários)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema 100%% pronto para agentes IA!';
END $$;
