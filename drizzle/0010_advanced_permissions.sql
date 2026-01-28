-- ============================================
-- MIGRAÇÃO: Sistema Avançado de Permissões
-- ============================================

-- 1. Expandir enum de roles
ALTER TYPE role ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE role ADD VALUE IF NOT EXISTS 'corretor';
ALTER TYPE role ADD VALUE IF NOT EXISTS 'atendente';

-- 2. Adicionar campos de permissões e status aos usuários
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 3. Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(320),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- 5. Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6. Inserir configurações padrão
INSERT INTO system_settings (key, value, description) VALUES
  ('site_name', '"Leman Negócios Imobiliários"', 'Nome do site'),
  ('primary_color', '"#c9a962"', 'Cor primária do site'),
  ('contact_email', '"contato@lemannegocios.com.br"', 'Email de contato'),
  ('contact_phone', '"(61) 99868-7245"', 'Telefone de contato'),
  ('logo_url', '"/logo-leman.jpg"', 'URL da logo'),
  ('enable_notifications', 'true', 'Habilitar notificações'),
  ('enable_ai_features', 'true', 'Habilitar recursos de IA')
ON CONFLICT (key) DO NOTHING;

-- 7. Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Logs de auditoria de todas as ações do sistema';
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';
COMMENT ON COLUMN users.permissions IS 'Permissões customizadas do usuário (array de strings)';
COMMENT ON COLUMN users.active IS 'Indica se o usuário está ativo no sistema';
