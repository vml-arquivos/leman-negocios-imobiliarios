-- ============================================
-- SQL PARA ADICIONAR TABELAS FALTANTES NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- TABELA: property_images (se não existir)
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

-- TABELA: proposals (se não existir)
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  tipo VARCHAR(50) NOT NULL, -- 'compra', 'locacao'
  valor_proposta INTEGER NOT NULL,
  valor_entrada INTEGER,
  valor_financiamento INTEGER,
  prazo_meses INTEGER,
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'rascunho', -- 'rascunho', 'enviada', 'aceita', 'recusada', 'expirada'
  data_envio TIMESTAMP,
  data_resposta TIMESTAMP,
  data_validade TIMESTAMP,
  documento_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_property_id ON proposals(property_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- TABELA: appointments (se não existir)
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  telefone VARCHAR(20) NOT NULL,
  nome VARCHAR(255),
  email VARCHAR(255),
  data_visita TIMESTAMP NOT NULL,
  duracao INTEGER DEFAULT 60, -- em minutos
  imovel_endereco TEXT,
  status VARCHAR(50) DEFAULT 'agendado', -- 'agendado', 'confirmado', 'realizado', 'cancelado', 'nao_compareceu'
  google_calendar_id VARCHAR(255),
  google_meet_link TEXT,
  lembrete_enviado BOOLEAN DEFAULT FALSE,
  lembrete_enviado_em TIMESTAMP,
  observacoes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_property_id ON appointments(property_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data_visita ON appointments(data_visita);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- TABELA: blog_categories (se não existir)
CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABELA: blog_posts (se não existir)
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image VARCHAR(500),
  category_id INTEGER REFERENCES blog_categories(id),
  author_id INTEGER REFERENCES users(id),
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);

-- TABELA: site_settings (se não existir)
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'boolean', 'json'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABELA: audit_logs (para rastreamento de ações)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc
  entity_type VARCHAR(100) NOT NULL, -- 'lead', 'property', 'user', etc
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- TABELA: lead_assignments (distribuição de leads)
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(lead_id, assigned_to)
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to ON lead_assignments(assigned_to);

-- Adicionar campo assigned_to na tabela leads (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='leads' AND column_name='assigned_to') THEN
    ALTER TABLE leads ADD COLUMN assigned_to INTEGER REFERENCES users(id);
    CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
  END IF;
END $$;

-- Garantir que a tabela users tem o campo role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    CREATE INDEX idx_users_role ON users(role);
  END IF;
END $$;

-- Inserir configurações padrão do site (se não existirem)
INSERT INTO site_settings (key, value, type) VALUES
  ('site_name', 'Leman Negócios Imobiliários', 'text'),
  ('site_description', 'Sua imobiliária de confiança em Brasília', 'text'),
  ('contact_email', 'contato@lemanimoveis.com.br', 'text'),
  ('contact_phone', '(61) 99999-9999', 'text'),
  ('whatsapp_number', '5561999999999', 'text'),
  ('address', 'Brasília - DF', 'text'),
  ('auto_assign_leads', 'false', 'boolean'),
  ('lead_distribution_method', 'round_robin', 'text')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Leads com informações do corretor responsável
CREATE OR REPLACE VIEW leads_with_agent AS
SELECT 
  l.*,
  u.name as agent_name,
  u.email as agent_email
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id;

-- View: Estatísticas de corretores
CREATE OR REPLACE VIEW agent_statistics AS
SELECT 
  u.id as agent_id,
  u.name as agent_name,
  u.email as agent_email,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'novo' THEN l.id END) as new_leads,
  COUNT(DISTINCT CASE WHEN l.status IN ('fechado_ganho') THEN l.id END) as converted_leads,
  COUNT(DISTINCT p.id) as total_properties
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id
LEFT JOIN properties p ON p.created_by = u.id
WHERE u.role IN ('admin', 'agent')
GROUP BY u.id, u.name, u.email;

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função: Distribuir lead automaticamente (round-robin)
CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  next_agent_id INTEGER;
  auto_assign_enabled BOOLEAN;
BEGIN
  -- Verificar se auto-assign está habilitado
  SELECT value::BOOLEAN INTO auto_assign_enabled
  FROM site_settings
  WHERE key = 'auto_assign_leads';
  
  IF auto_assign_enabled IS NULL THEN
    auto_assign_enabled := FALSE;
  END IF;
  
  -- Se auto-assign está habilitado e lead não tem corretor
  IF auto_assign_enabled AND NEW.assigned_to IS NULL THEN
    -- Buscar próximo corretor disponível (round-robin)
    SELECT u.id INTO next_agent_id
    FROM users u
    LEFT JOIN leads l ON l.assigned_to = u.id
    WHERE u.role IN ('admin', 'agent')
    GROUP BY u.id
    ORDER BY COUNT(l.id) ASC, RANDOM()
    LIMIT 1;
    
    IF next_agent_id IS NOT NULL THEN
      NEW.assigned_to := next_agent_id;
      
      -- Registrar na tabela de assignments
      INSERT INTO lead_assignments (lead_id, assigned_to, notes)
      VALUES (NEW.id, next_agent_id, 'Auto-assigned by system');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-assign ao criar novo lead
DROP TRIGGER IF EXISTS trigger_auto_assign_lead ON leads;
CREATE TRIGGER trigger_auto_assign_lead
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();

-- ============================================
-- PERMISSÕES (RLS - Row Level Security)
-- ============================================

-- Habilitar RLS nas tabelas sensíveis
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver tudo
CREATE POLICY admin_all_leads ON leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Corretores só veem seus próprios leads
CREATE POLICY agent_own_leads ON leads
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- DADOS INICIAIS (SEED)
-- ============================================

-- Criar usuário admin padrão (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@lemanimoveis.com.br') THEN
    INSERT INTO users (name, email, password, role, active)
    VALUES (
      'Administrador',
      'admin@lemanimoveis.com.br',
      '$2a$10$YourHashedPasswordHere', -- TROCAR pela senha hashada
      'admin',
      TRUE
    );
  END IF;
END $$;

-- ============================================
-- CONCLUÍDO!
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Todas as tabelas e funcionalidades serão criadas
-- ============================================
