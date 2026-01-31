-- ============================================
-- SQL SIMPLIFICADO PARA SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- TABELA: property_images
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

-- TABELA: proposals
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  tipo VARCHAR(50) NOT NULL,
  valor_proposta INTEGER NOT NULL,
  valor_entrada INTEGER,
  valor_financiamento INTEGER,
  prazo_meses INTEGER,
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'rascunho',
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

-- TABELA: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
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

-- TABELA: lead_assignments
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
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='leads' AND column_name='assigned_to'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_to INTEGER REFERENCES users(id);
    CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
  END IF;
END $$;

-- Garantir que a tabela users tem o campo role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    CREATE INDEX idx_users_role ON users(role);
  END IF;
END $$;

-- Inserir configurações padrão do site (SE NÃO EXISTIR A TABELA)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='site_settings') THEN
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
  END IF;
END $$;

-- ============================================
-- VIEW: Leads com corretor responsável
-- ============================================

CREATE OR REPLACE VIEW leads_with_agent AS
SELECT 
  l.*,
  u.name as agent_name,
  u.email as agent_email
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id;

-- ============================================
-- VIEW: Estatísticas de corretores (SIMPLIFICADA)
-- ============================================

CREATE OR REPLACE VIEW agent_statistics AS
SELECT 
  u.id as agent_id,
  u.name as agent_name,
  u.email as agent_email,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'novo' THEN l.id END) as new_leads,
  COUNT(DISTINCT p.id) as total_properties
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id
LEFT JOIN properties p ON p.created_by = u.id
WHERE u.role IN ('admin', 'agent')
GROUP BY u.id, u.name, u.email;

-- ============================================
-- FUNÇÃO: Distribuir lead automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  next_agent_id INTEGER;
  auto_assign_enabled TEXT;
BEGIN
  -- Verificar se a tabela site_settings existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='site_settings') THEN
    -- Verificar se auto-assign está habilitado
    SELECT value INTO auto_assign_enabled
    FROM site_settings
    WHERE key = 'auto_assign_leads';
    
    -- Se auto-assign está habilitado e lead não tem corretor
    IF auto_assign_enabled = 'true' AND NEW.assigned_to IS NULL THEN
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
        
        -- Registrar na tabela de assignments (se existir)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='lead_assignments') THEN
          INSERT INTO lead_assignments (lead_id, assigned_to, notes)
          VALUES (NEW.id, next_agent_id, 'Auto-assigned by system');
        END IF;
      END IF;
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
-- CONCLUÍDO!
-- Tabelas criadas:
-- - property_images
-- - proposals  
-- - audit_logs
-- - lead_assignments
--
-- Campos adicionados:
-- - leads.assigned_to
-- - users.role
--
-- Views criadas:
-- - leads_with_agent
-- - agent_statistics
--
-- Trigger criado:
-- - auto_assign_lead (distribuição automática)
-- ============================================
