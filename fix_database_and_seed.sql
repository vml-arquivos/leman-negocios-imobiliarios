-- ============================================
-- SCRIPT DE CORREÇÃO E SEED DO BANCO DE DADOS
-- Leman Negócios Imobiliários
-- ============================================

-- 1. Criar tabela users se não existir (snake_case)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Deletar usuário admin se já existir
DELETE FROM users WHERE email = 'admin@admin.com';

-- 3. Inserir usuário admin com senha hasheada (bcrypt)
-- Email: admin@admin.com
-- Senha: admin123
-- Hash bcrypt gerado: $2b$10$.i6e70M1ldVFwJAY5hTU.u0Nx2rdW60Z7NfKz.4ASCUpmWkVQZ6rK
INSERT INTO users (
  open_id,
  name,
  email,
  password,
  role,
  created_at,
  updated_at
) VALUES (
  'admin-001',
  'Administrador',
  'admin@admin.com',
  '$2b$10$.i6e70M1ldVFwJAY5hTU.u0Nx2rdW60Z7NfKz.4ASCUpmWkVQZ6rK',
  'admin',
  NOW(),
  NOW()
);

-- 4. Verificar se o usuário foi criado
SELECT id, open_id, email, name, role, created_at
FROM users 
WHERE email = 'admin@admin.com';

-- 5. Listar todas as tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 6. Verificar total de usuários
SELECT COUNT(*) as total_users FROM users;
