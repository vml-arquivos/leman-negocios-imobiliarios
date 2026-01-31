-- ============================================
-- PASSO 1: Adicionar 'agent' ao enum user_role
-- Execute APENAS este SQL primeiro
-- Depois execute o PASSO 2
-- ============================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent';

-- ============================================
-- CONCLUÍDO!
-- Agora execute o SUPABASE_PASSO_2.sql
-- ============================================
