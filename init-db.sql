-- ============================================================================================================
-- SCRIPT DE INICIALIZAÇÃO DO POSTGRESQL
-- Cria os bancos de dados necessários para o sistema Leman Negócios Imobiliários
-- ============================================================================================================

-- Criar banco de dados para N8N (workflows)
SELECT 'CREATE DATABASE n8n'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec

-- Criar banco de dados para o CRM (aplicação principal)
SELECT 'CREATE DATABASE leman_imoveis'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'leman_imoveis')\gexec
