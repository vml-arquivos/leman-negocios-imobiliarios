-- ============================================
-- LEMAN NEGÓCIOS IMOBILIÁRIOS - DATABASE INIT
-- ============================================
-- Este script cria TODAS as tabelas do sistema
-- Execute APENAS UMA VEZ no banco novo

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'admin', 'gerente', 'corretor', 'atendente');
CREATE TYPE lead_status AS ENUM ('novo', 'contato', 'qualificado', 'negociacao', 'ganho', 'perdido');
CREATE TYPE lead_profile AS ENUM ('lead', 'cliente', 'ex-cliente');
CREATE TYPE property_type AS ENUM ('apartamento', 'casa', 'terreno', 'comercial', 'rural');
CREATE TYPE property_status AS ENUM ('disponivel', 'reservado', 'vendido', 'alugado');
CREATE TYPE interest_type AS ENUM ('compra', 'aluguel', 'ambos');
CREATE TYPE appointment_status AS ENUM ('agendado', 'confirmado', 'realizado', 'cancelado');
CREATE TYPE proposal_status AS ENUM ('rascunho', 'enviada', 'aceita', 'rejeitada', 'expirada');
CREATE TYPE contract_status AS ENUM ('rascunho', 'ativo', 'concluido', 'cancelado');
CREATE TYPE contract_type AS ENUM ('venda', 'locacao');
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
CREATE TYPE simulation_status AS ENUM ('pending', 'contacted', 'converted', 'lost');
CREATE TYPE amortization_system AS ENUM ('SAC', 'PRICE');
CREATE TYPE ai_role AS ENUM ('user', 'assistant', 'system');

-- ============================================
-- TABELA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(64) UNIQUE,
  name TEXT NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password VARCHAR(255),
  login_method VARCHAR(64) DEFAULT 'local',
  role user_role NOT NULL DEFAULT 'user',
  telefone VARCHAR(20),
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_open_id ON users(open_id);

-- ============================================
-- TABELA: properties
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type property_type NOT NULL,
  address TEXT NOT NULL,
  neighborhood VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area_total INTEGER,
  area_util INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spaces INTEGER,
  sale_price INTEGER,
  rent_price INTEGER,
  condominium_fee INTEGER,
  iptu INTEGER,
  features TEXT[],
  amenities TEXT[],
  video_url TEXT,
  tour_virtual_url TEXT,
  status property_status NOT NULL DEFAULT 'disponivel',
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255) UNIQUE,
  owner_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(type);

-- ============================================
-- TABELA: property_images
-- ============================================
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_images_property_id ON property_images(property_id);

-- ============================================
-- TABELA: leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  telefone VARCHAR(20) NOT NULL UNIQUE,
  cpf VARCHAR(14),
  profile lead_profile DEFAULT 'lead',
  status lead_status NOT NULL DEFAULT 'novo',
  interesse TEXT,
  tipo_imovel property_type,
  finalidade interest_type,
  orcamento_min INTEGER,
  orcamento_max INTEGER,
  regioes_interesse TEXT[],
  quartos INTEGER,
  vagas INTEGER,
  observacoes TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  origem VARCHAR(50) DEFAULT 'whatsapp',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  ultima_interacao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_to INTEGER REFERENCES users(id)
);

CREATE INDEX idx_leads_telefone ON leads(telefone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

-- ============================================
-- TABELA: interactions
-- ============================================
CREATE TABLE IF NOT EXISTS interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  tipo VARCHAR(50) NOT NULL,
  canal VARCHAR(50) DEFAULT 'whatsapp',
  assunto VARCHAR(255),
  descricao TEXT,
  resultado VARCHAR(100),
  proxima_acao VARCHAR(255),
  data_proxima_acao TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);

-- ============================================
-- TABELA: blog_categories
-- ============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABELA: blog_posts
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image VARCHAR(500),
  category_id INTEGER REFERENCES blog_categories(id),
  author_id INTEGER REFERENCES users(id),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);

-- ============================================
-- TABELA: site_settings
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  site_name VARCHAR(100) DEFAULT 'Leman Negócios Imobiliários',
  site_description TEXT,
  primary_color VARCHAR(7) DEFAULT '#FF6B00',
  logo_url VARCHAR(500),
  favicon_url VARCHAR(500),
  contact_email VARCHAR(320),
  contact_phone VARCHAR(20),
  whatsapp_number VARCHAR(20),
  facebook_url VARCHAR(500),
  instagram_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  youtube_url VARCHAR(500),
  address TEXT,
  google_analytics_id VARCHAR(50),
  facebook_pixel_id VARCHAR(50),
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO site_settings (site_name, primary_color, contact_email, contact_phone, whatsapp_number)
VALUES ('Leman Negócios Imobiliários', '#FF6B00', 'contato@lemannegocios.com.br', '+5561999999999', '+5561999999999')
ON CONFLICT DO NOTHING;

-- ============================================
-- OUTRAS TABELAS (simplificadas)
-- ============================================

CREATE TABLE IF NOT EXISTS message_buffer (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_context_status (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  role ai_role NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_interests (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_type property_type,
  interest_type interest_type,
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_neighborhoods TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks_log (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100),
  payload JSONB,
  response JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INSERIR USUÁRIO ADMIN
-- ============================================
-- Email: evandro@lemannegocios.com.br
-- Senha: admin123
-- Hash bcrypt: $2b$10$zkyttAuPXwkmE6QkqVsEEe/UQOZb592LwMwa10J5oRf.S03.sXMNK

INSERT INTO users (name, email, password, login_method, role, telefone, active, created_at, updated_at, last_signed_in)
VALUES (
  'Evandro Santos',
  'evandro@lemannegocios.com.br',
  '$2b$10$zkyttAuPXwkmE6QkqVsEEe/UQOZb592LwMwa10J5oRf.S03.sXMNK',
  'local',
  'admin',
  '+5561999999999',
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
