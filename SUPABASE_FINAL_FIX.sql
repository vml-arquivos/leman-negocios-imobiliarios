-- ============================================
-- SQL FINAL - APENAS O QUE ESTÁ FALTANDO
-- Execute no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Adicionar valor 'agent' ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent';

-- PASSO 2: Adicionar campo assigned_to na tabela leads (se não existir)
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

-- PASSO 3: Criar tabela lead_assignments (histórico de atribuições)
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

-- PASSO 4: Criar tabela audit_logs (se não existir)
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

-- PASSO 5: Atualizar configurações do site
INSERT INTO site_settings (key, value, type) VALUES
  ('auto_assign_leads', 'false', 'boolean'),
  ('lead_distribution_method', 'round_robin', 'text')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  type = EXCLUDED.type;

-- PASSO 6: Criar view leads_with_agent
CREATE OR REPLACE VIEW leads_with_agent AS
SELECT 
  l.*,
  u.name as agent_name,
  u.email as agent_email
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id;

-- PASSO 7: Criar view agent_statistics (usando apenas 'admin' e 'agent')
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

-- PASSO 8: Criar função de auto-distribuição
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

-- PASSO 9: Criar trigger de auto-distribuição
DROP TRIGGER IF EXISTS trigger_auto_assign_lead ON leads;
CREATE TRIGGER trigger_auto_assign_lead
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();

-- ============================================
-- CONCLUÍDO!
-- 
-- O que foi feito:
-- 1. Adicionado 'agent' ao enum user_role
-- 2. Adicionado campo leads.assigned_to
-- 3. Criada tabela lead_assignments
-- 4. Criada tabela audit_logs
-- 5. Configurações de distribuição adicionadas
-- 6. View leads_with_agent criada
-- 7. View agent_statistics criada
-- 8. Função auto_assign_lead criada
-- 9. Trigger de auto-distribuição criado
-- ============================================
