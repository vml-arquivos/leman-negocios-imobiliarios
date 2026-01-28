-- ============================================
-- CRIAR USUÁRIO ADMIN PADRÃO
-- ============================================

-- Deletar usuário admin se já existir
DELETE FROM users WHERE email = 'admin@admin.com';

-- Inserir usuário admin
-- Email: admin@admin.com
-- Senha: admin123
-- Hash gerado com scrypt (Node.js)
INSERT INTO users (
  name,
  email,
  password,
  login_method,
  role,
  telefone,
  active,
  created_at,
  updated_at
) VALUES (
  'Administrador',
  'admin@admin.com',
  '0348ff76205ac3e53b61031a9cc109d0.9dc707e9d43f40b6f409391a02d0f2af973ce53fadd0913e5df42f48f7f53be063cfff60ca411c5b862d2e7d8118933febef48d4f010a1675396ca0cd15eb33f',
  'local',
  'admin',
  '+5561999999999',
  true,
  NOW(),
  NOW()
);

-- Verificar
SELECT id, name, email, role, active, created_at 
FROM users 
WHERE email = 'admin@admin.com';
