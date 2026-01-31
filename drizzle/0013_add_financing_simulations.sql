-- ============================================
-- MIGRATION: Adicionar Tabela de Simulações de Financiamento
-- ============================================

-- Criar enum para status de simulação
CREATE TYPE simulation_status AS ENUM ('pendente', 'contatado', 'convertido', 'perdido');

-- Criar tabela de simulações de financiamento
CREATE TABLE IF NOT EXISTS financing_simulations (
  id SERIAL PRIMARY KEY,
  
  -- Dados do Cliente
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  cpf VARCHAR(14),
  
  -- Dados da Simulação
  property_value INTEGER NOT NULL, -- Valor do imóvel em centavos
  down_payment INTEGER NOT NULL, -- Entrada em centavos
  financed_amount INTEGER NOT NULL, -- Valor financiado em centavos
  term_months INTEGER NOT NULL, -- Prazo em meses
  interest_rate NUMERIC(5, 2) NOT NULL, -- Taxa de juros anual
  amortization_system amortization_system NOT NULL, -- SAC ou PRICE
  monthly_payment INTEGER NOT NULL, -- Parcela mensal em centavos
  total_amount INTEGER NOT NULL, -- Valor total a pagar em centavos
  
  -- Dados Adicionais
  monthly_income INTEGER, -- Renda mensal em centavos
  property_id INTEGER, -- Imóvel de interesse (opcional)
  notes TEXT,
  
  -- Status e Acompanhamento
  status simulation_status DEFAULT 'pendente' NOT NULL,
  contacted_at TIMESTAMP,
  converted_at TIMESTAMP,
  lost_reason TEXT,
  
  -- Metadados
  ip_address VARCHAR(45),
  user_agent TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_financing_simulations_email ON financing_simulations(email);
CREATE INDEX idx_financing_simulations_phone ON financing_simulations(phone);
CREATE INDEX idx_financing_simulations_status ON financing_simulations(status);
CREATE INDEX idx_financing_simulations_created_at ON financing_simulations(created_at);
CREATE INDEX idx_financing_simulations_property_id ON financing_simulations(property_id);

-- Comentários
COMMENT ON TABLE financing_simulations IS 'Armazena simulações de financiamento bancário realizadas por clientes';
COMMENT ON COLUMN financing_simulations.status IS 'Status do lead: pendente, contatado, convertido, perdido';
COMMENT ON COLUMN financing_simulations.amortization_system IS 'Sistema de amortização: SAC ou PRICE';
