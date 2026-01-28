-- ============================================
-- LEMAN NEGÓCIOS IMOBILIÁRIOS
-- Schema PostgreSQL/Supabase
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca full-text

-- ============================================
-- TABELA: users (Usuários do Sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'user')),
  avatar_url TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_open_id ON users(open_id);

-- ============================================
-- TABELA: properties (Imóveis)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('casa', 'apartamento', 'cobertura', 'terreno', 'comercial', 'rural')),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('venda', 'aluguel', 'ambos')),
  price BIGINT NOT NULL, -- em centavos
  rental_price BIGINT, -- em centavos
  area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  suites INTEGER,
  parking_spaces INTEGER,
  address VARCHAR(255),
  neighborhood VARCHAR(100),
  city VARCHAR(100) DEFAULT 'Brasília',
  state VARCHAR(2) DEFAULT 'DF',
  zip_code VARCHAR(10),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  features JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  virtual_tour_url TEXT,
  status VARCHAR(50) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido', 'alugado', 'inativo')),
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_transaction ON properties(transaction_type);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_featured ON properties(is_featured);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);

-- ============================================
-- TABELA: property_images (Imagens dos Imóveis)
-- ============================================
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_images_property ON property_images(property_id);

-- ============================================
-- TABELA: leads (Leads/Clientes Potenciais)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  source VARCHAR(100), -- 'website', 'whatsapp', 'instagram', 'simulador', etc
  stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'warm', 'hot', 'converted', 'lost')),
  score INTEGER DEFAULT 0,
  interest_type VARCHAR(50), -- 'compra', 'aluguel', 'ambos'
  budget_min BIGINT, -- em centavos
  budget_max BIGINT, -- em centavos
  preferred_neighborhoods JSONB DEFAULT '[]'::jsonb,
  preferred_property_types JSONB DEFAULT '[]'::jsonb,
  bedrooms_min INTEGER,
  notes TEXT,
  ai_profile JSONB, -- Perfil gerado por IA
  ai_score DECIMAL(5,2), -- Score de qualificação por IA
  ai_insights TEXT, -- Insights da IA sobre o cliente
  last_interaction_at TIMESTAMP,
  converted_at TIMESTAMP,
  assigned_to INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_score ON leads(score);
CREATE INDEX idx_leads_ai_score ON leads(ai_score);

-- ============================================
-- TABELA: interactions (Interações com Leads)
-- ============================================
CREATE TABLE IF NOT EXISTS interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'email', 'whatsapp', 'meeting', 'visit', 'simulation', 'ai_chat')),
  channel VARCHAR(50), -- 'phone', 'email', 'whatsapp', 'website', 'ai_agent'
  subject VARCHAR(255),
  notes TEXT,
  metadata JSONB, -- Dados adicionais (mensagens, resultados, etc)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interactions_lead ON interactions(lead_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_date ON interactions(created_at);

-- ============================================
-- TABELA: conversations (Conversas com Agentes de IA)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'whatsapp', 'website', 'instagram'
  external_id VARCHAR(255), -- ID externo (ex: número WhatsApp)
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  agent_type VARCHAR(50), -- 'pre_attendance', 'qualification', 'recommendation'
  context JSONB, -- Contexto da conversa
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_external ON conversations(external_id);

-- ============================================
-- TABELA: messages (Mensagens das Conversas)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('user', 'agent', 'ai', 'system')),
  sender_id INTEGER, -- ID do usuário ou agente
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'property_card')),
  metadata JSONB, -- Dados adicionais (URLs, coordenadas, etc)
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

-- ============================================
-- TABELA: ai_property_matches (Matching IA: Cliente x Imóvel)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_property_matches (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) NOT NULL, -- 0-100
  match_reasons JSONB, -- Motivos do match
  ai_recommendation TEXT, -- Recomendação personalizada da IA
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'interested', 'not_interested')),
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_matches_lead ON ai_property_matches(lead_id);
CREATE INDEX idx_ai_matches_property ON ai_property_matches(property_id);
CREATE INDEX idx_ai_matches_score ON ai_property_matches(match_score DESC);
CREATE INDEX idx_ai_matches_status ON ai_property_matches(status);

-- ============================================
-- TABELA: landlords (Proprietários)
-- ============================================
CREATE TABLE IF NOT EXISTS landlords (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  address TEXT,
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  bank_name VARCHAR(100),
  agency_number VARCHAR(20),
  account_number VARCHAR(30),
  account_type VARCHAR(20) CHECK (account_type IN ('corrente', 'poupanca')),
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landlords_cpf_cnpj ON landlords(cpf_cnpj);
CREATE INDEX idx_landlords_status ON landlords(status);

-- ============================================
-- TABELA: tenants (Inquilinos)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  occupation VARCHAR(100),
  employer VARCHAR(255),
  monthly_income BIGINT, -- em centavos
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_cpf ON tenants(cpf);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================
-- TABELA: rental_contracts (Contratos de Locação)
-- ============================================
CREATE TABLE IF NOT EXISTS rental_contracts (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id),
  landlord_id INTEGER NOT NULL REFERENCES landlords(id),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  contract_number VARCHAR(50) UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  rent_amount BIGINT NOT NULL, -- em centavos
  condo_fee BIGINT DEFAULT 0,
  iptu BIGINT DEFAULT 0,
  commission_rate DECIMAL(5,2) NOT NULL,
  payment_day INTEGER DEFAULT 5,
  deposit_amount BIGINT DEFAULT 0,
  adjustment_index VARCHAR(20) DEFAULT 'IGPM' CHECK (adjustment_index IN ('IGPM', 'IPCA', 'IGP-M')),
  adjustment_period_months INTEGER DEFAULT 12,
  last_adjustment_date DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_property ON rental_contracts(property_id);
CREATE INDEX idx_contracts_landlord ON rental_contracts(landlord_id);
CREATE INDEX idx_contracts_tenant ON rental_contracts(tenant_id);
CREATE INDEX idx_contracts_status ON rental_contracts(status);

-- ============================================
-- TABELA: rental_payments (Pagamentos de Aluguel)
-- ============================================
CREATE TABLE IF NOT EXISTS rental_payments (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES rental_contracts(id),
  property_id INTEGER NOT NULL REFERENCES properties(id),
  landlord_id INTEGER NOT NULL REFERENCES landlords(id),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  reference_month VARCHAR(7) NOT NULL, -- YYYY-MM
  rent_amount BIGINT NOT NULL,
  condo_fee BIGINT DEFAULT 0,
  iptu BIGINT DEFAULT 0,
  water_bill BIGINT DEFAULT 0,
  gas_bill BIGINT DEFAULT 0,
  other_charges BIGINT DEFAULT 0,
  late_fee BIGINT DEFAULT 0,
  interest BIGINT DEFAULT 0,
  discount BIGINT DEFAULT 0,
  total_amount BIGINT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount BIGINT NOT NULL,
  net_amount BIGINT NOT NULL, -- Valor líquido para proprietário
  due_date DATE NOT NULL,
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_proof TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_contract ON rental_payments(contract_id);
CREATE INDEX idx_payments_landlord ON rental_payments(landlord_id);
CREATE INDEX idx_payments_reference ON rental_payments(reference_month);
CREATE INDEX idx_payments_status ON rental_payments(status);
CREATE INDEX idx_payments_due_date ON rental_payments(due_date);

-- ============================================
-- TABELA: property_expenses (Despesas por Imóvel)
-- ============================================
CREATE TABLE IF NOT EXISTS property_expenses (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id),
  landlord_id INTEGER NOT NULL REFERENCES landlords(id),
  expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('manutencao', 'reparo', 'pintura', 'limpeza', 'jardinagem', 'seguranca', 'seguro', 'iptu', 'condominio', 'taxa_administracao', 'outros')),
  description TEXT NOT NULL,
  amount BIGINT NOT NULL, -- em centavos
  paid_by VARCHAR(20) NOT NULL CHECK (paid_by IN ('imobiliaria', 'proprietario', 'inquilino')),
  expense_date DATE NOT NULL,
  payment_date DATE,
  payment_method VARCHAR(50),
  supplier_name VARCHAR(255),
  invoice_number VARCHAR(100),
  invoice_url TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_property ON property_expenses(property_id);
CREATE INDEX idx_expenses_landlord ON property_expenses(landlord_id);
CREATE INDEX idx_expenses_type ON property_expenses(expense_type);
CREATE INDEX idx_expenses_date ON property_expenses(expense_date);

-- ============================================
-- TABELA: landlord_transfers (Repasses aos Proprietários)
-- ============================================
CREATE TABLE IF NOT EXISTS landlord_transfers (
  id SERIAL PRIMARY KEY,
  landlord_id INTEGER NOT NULL REFERENCES landlords(id),
  reference_month VARCHAR(7) NOT NULL, -- YYYY-MM
  total_received BIGINT NOT NULL, -- Total recebido dos inquilinos
  total_commission BIGINT NOT NULL, -- Total de comissões
  total_expenses BIGINT NOT NULL, -- Total de despesas
  net_amount BIGINT NOT NULL, -- Valor líquido a repassar
  transfer_date DATE,
  transfer_method VARCHAR(50),
  transfer_proof TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfers_landlord ON landlord_transfers(landlord_id);
CREATE INDEX idx_transfers_reference ON landlord_transfers(reference_month);
CREATE INDEX idx_transfers_status ON landlord_transfers(status);

-- ============================================
-- TABELA: financing_simulations (Simulações de Financiamento)
-- ============================================
CREATE TABLE IF NOT EXISTS financing_simulations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  property_type VARCHAR(50),
  preferred_location VARCHAR(100),
  estimated_value BIGINT,
  property_value BIGINT NOT NULL,
  down_payment BIGINT NOT NULL,
  term_months INTEGER NOT NULL,
  selected_bank VARCHAR(100),
  interest_rate DECIMAL(5,2),
  amortization_system VARCHAR(20) CHECK (amortization_system IN ('SAC', 'PRICE')),
  first_installment BIGINT,
  last_installment BIGINT,
  average_installment BIGINT,
  total_amount BIGINT,
  total_interest BIGINT,
  results JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_simulations_lead ON financing_simulations(lead_id);
CREATE INDEX idx_simulations_email ON financing_simulations(email);
CREATE INDEX idx_simulations_phone ON financing_simulations(phone);

-- ============================================
-- TABELA: blog_posts (Artigos do Blog)
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id INTEGER REFERENCES users(id),
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views_count INTEGER DEFAULT 0,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_status ON blog_posts(status);
CREATE INDEX idx_blog_published ON blog_posts(published_at);

-- ============================================
-- TABELA: site_settings (Configurações do Site)
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: analytics_events (Eventos de Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_date ON analytics_events(created_at);

-- ============================================
-- TRIGGERS PARA updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landlords_updated_at BEFORE UPDATE ON landlords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON rental_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON rental_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON landlord_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Imóveis disponíveis com informações completas
CREATE OR REPLACE VIEW v_available_properties AS
SELECT 
  p.*,
  u.name as owner_name,
  u.email as owner_email,
  (SELECT COUNT(*) FROM ai_property_matches WHERE property_id = p.id) as matches_count
FROM properties p
LEFT JOIN users u ON p.owner_id = u.id
WHERE p.status = 'disponivel';

-- View: Leads qualificados com score alto
CREATE OR REPLACE VIEW v_hot_leads AS
SELECT 
  l.*,
  u.name as assigned_agent,
  (SELECT COUNT(*) FROM interactions WHERE lead_id = l.id) as interactions_count,
  (SELECT MAX(created_at) FROM interactions WHERE lead_id = l.id) as last_interaction
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.stage IN ('qualified', 'warm', 'hot')
  AND l.ai_score >= 70
ORDER BY l.ai_score DESC, l.score DESC;

-- View: Contratos ativos com informações financeiras
CREATE OR REPLACE VIEW v_active_contracts AS
SELECT 
  rc.*,
  p.title as property_title,
  p.address as property_address,
  ll.name as landlord_name,
  t.name as tenant_name,
  (SELECT COUNT(*) FROM rental_payments WHERE contract_id = rc.id AND status = 'pago') as payments_made,
  (SELECT COUNT(*) FROM rental_payments WHERE contract_id = rc.id AND status = 'atrasado') as payments_overdue
FROM rental_contracts rc
JOIN properties p ON rc.property_id = p.id
JOIN landlords ll ON rc.landlord_id = ll.id
JOIN tenants t ON rc.tenant_id = t.id
WHERE rc.status = 'ativo';

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Usuário admin padrão
INSERT INTO users (email, password, name, role) VALUES
('admin@lemannegocios.com.br', '$2a$10$rOzJQjYgDx5c8vKvZ5vQqOXxN5xN5xN5xN5xN5xN5xN5xN5xN5xN5', 'Administrador Leman', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Configurações do site
INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES
('site_name', 'Leman Negócios Imobiliários', 'text'),
('site_phone', '(61) 99868-7245', 'text'),
('site_email', 'contato@lemanimoveis.com.br', 'text'),
('site_whatsapp', '5561998687245', 'text'),
('site_instagram', '@leman.negociosimob', 'text'),
('site_address', 'Brasília - DF', 'text'),
('commission_rate_default', '10.00', 'number'),
('n8n_webhook_url', '', 'text'),
('supabase_url', '', 'text'),
('supabase_anon_key', '', 'text')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
