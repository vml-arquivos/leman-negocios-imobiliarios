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
  "openId",
  name,
  email,
  password,
  "loginMethod",
  role,
  "createdAt",
  "updatedAt",
  "lastSignedIn"
) VALUES (
  'admin-001',
  'Administrador',
  'admin@admin.com',
  '91855c8b28823db3a9feb12359fdda50.a63d20aea39b3e685dfcb6450b76b48f5fe68a12cdc8d33a10fbbbe2b81a70525756e031a21bd8b93c9a485cd4f51761752980c4b7690fb6702628dabb8a4c6a',
  'local',
  'admin',
  NOW(),
  NOW(),
  NOW()
);

-- Verificar
SELECT id, "openId", email, name, role, "loginMethod", "createdAt"
FROM users 
WHERE email = 'admin@admin.com';
