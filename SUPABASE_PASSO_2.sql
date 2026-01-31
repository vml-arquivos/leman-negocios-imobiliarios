-- ============================================
-- PASSO 2: Criar campos, tabelas, views e triggers
-- Execute DEPOIS do PASSO 1
-- ============================================

-- Adicionar campo assigned_to na tabela leads
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'leads' 
      AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_to INTEGER;
    ALTER TABLE leads ADD CONSTRAINT fk_leads_assigned_to 
      FOREIGN KEY (assigned_to) REFERENCES users(id);
    CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
  END IF;
END $$;

-- Criar tabela lead_assignments
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  assigned_to INTEGER NOT NULL,
  assigned_by INTEGER,
  assigned_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT fk_lead_assignments_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_assignments_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id),
  CONSTRAINT unique_lead_assignment UNIQUE(lead_id, assigned_to)
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to ON lead_assignments(assigned_to);

-- Criar tabela audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Inserir configurações de distribuição
INSERT INTO site_settings (key, value, type) 
VALUES 
  ('auto_assign_leads', 'false', 'boolean'),
  ('lead_distribution_method', 'round_robin', 'text')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  type = EXCLUDED.type;

-- Criar view leads_with_agent
CREATE OR REPLACE VIEW leads_with_agent AS
SELECT 
  l.*,
  u.name as agent_name,
  u.email as agent_email
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id;

-- Criar view agent_statistics
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
WHERE u.role = 'admin' OR u.role = 'agent'
GROUP BY u.id, u.name, u.email;

-- Criar função de auto-distribuição
CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  next_agent_id INTEGER;
  auto_assign_enabled TEXT;
BEGIN
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
    WHERE u.role = 'admin' OR u.role = 'agent'
    GROUP BY u.id
    ORDER BY COUNT(l.id) ASC, RANDOM()
    LIMIT 1;
    
    IF next_agent_id IS NOT NULL THEN
      NEW.assigned_to := next_agent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger de auto-distribuição
DROP TRIGGER IF EXISTS trigger_auto_assign_lead ON leads;
CREATE TRIGGER trigger_auto_assign_lead
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();

-- ============================================
-- CONCLUÍDO!
-- Sistema de distribuição de leads instalado
-- ============================================
