-- =====================================================================
-- ARQUITETURA DE DADOS (SCHEMA EXPANSION) - MÓDULO FINANCEIRO E ALUGUÉIS
-- ESTRATÉGIA: 100% ADITIVA (NÃO ALTERA TABELAS EXISTENTES)
-- AUTOR: Senior Database Architect
-- DATA: 30/01/2026
-- =====================================================================

-- ETAPA 1: CRIAÇÃO DE NOVOS ENUMS PARA O MÓDULO FINANCEIRO

CREATE TYPE "financial_transaction_type" AS ENUM (
  'INCOME', 
  'EXPENSE'
);

CREATE TYPE "financial_transaction_status" AS ENUM (
  'PENDING', 
  'PAID', 
  'OVERDUE', 
  'CANCELED'
);

CREATE TYPE "financial_entity_type" AS ENUM (
  'OWNER', 
  'TENANT', 
  'BROKER', 
  'COMPANY', 
  'SUPPLIER'
);

CREATE TYPE "rental_contract_status" AS ENUM (
  'ACTIVE', 
  'INACTIVE', 
  'PENDING_SIGNATURE', 
  'TERMINATED'
);

-- =====================================================================
-- ETAPA 2: CRIAÇÃO DAS NOVAS TABELAS
-- =====================================================================

-- Tabela 1: financial_categories
-- Objetivo: Classificar todas as transações financeiras para relatórios.
CREATE TABLE IF NOT EXISTS "financial_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "description" TEXT,
  "type" "financial_transaction_type" NOT NULL, -- INCOME ou EXPENSE
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela 2: owner_bank_details
-- Objetivo: Armazenar dados bancários dos proprietários para repasses.
-- Estratégia: Tabela separada para isolar dados sensíveis.
CREATE TABLE IF NOT EXISTS "owner_bank_details" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "bank_name" VARCHAR(100),
  "agency_number" VARCHAR(20),
  "account_number" VARCHAR(30),
  "account_type" "account_type", -- Reutiliza enum existente ('corrente', 'poupanca')
  "pix_key_type" "pix_key_type", -- Reutiliza enum existente
  "pix_key" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela 3: rental_contracts
-- Objetivo: Centralizar as regras de negócio para cada contrato de aluguel.
CREATE TABLE IF NOT EXISTS "rental_contracts" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL REFERENCES "properties"("id") ON DELETE RESTRICT,
  "owner_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "tenant_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "rent_amount" INTEGER NOT NULL, -- Em centavos, para evitar problemas com float
  "admin_fee_percentage" NUMERIC(5, 2) NOT NULL, -- Ex: 10.00 para 10%
  "due_day" INTEGER NOT NULL CHECK ("due_day" >= 1 AND "due_day" <= 31), -- Dia do vencimento (ex: 5)
  "status" "rental_contract_status" DEFAULT 'ACTIVE' NOT NULL,
  "contract_document_url" VARCHAR(500),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela 4: financial_transactions
-- Objetivo: O livro-razão da empresa. Registra todas as movimentações financeiras.
CREATE TABLE IF NOT EXISTS "financial_transactions" (
  "id" SERIAL PRIMARY KEY,
  "description" VARCHAR(255) NOT NULL,
  "amount" INTEGER NOT NULL, -- Em centavos
  "type" "financial_transaction_type" NOT NULL,
  "status" "financial_transaction_status" DEFAULT 'PENDING' NOT NULL,
  "due_date" DATE NOT NULL,
  "payment_date" DATE,
  "category_id" INTEGER REFERENCES "financial_categories"("id") ON DELETE SET NULL,
  
  -- Relação Polimórfica: A quem esta transação pertence?
  "entity_type" "financial_entity_type",
  "entity_id" INTEGER,
  
  -- Relações Diretas (para performance e integridade)
  "property_id" INTEGER REFERENCES "properties"("id") ON DELETE SET NULL,
  "contract_id" INTEGER REFERENCES "rental_contracts"("id") ON DELETE SET NULL,
  
  -- Controle de Recorrência
  "recurrence_id" VARCHAR(100), -- ID para agrupar transações recorrentes (ex: 'rent_contract_1_month_02_2026')
  
  -- Campo para IA (Cobrança Automática)
  "last_reminded_at" TIMESTAMP WITH TIME ZONE,
  
  "metadata" JSON,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================================
-- ETAPA 3: ÍNDICES PARA OTIMIZAÇÃO DE CONSULTAS
-- =====================================================================

CREATE INDEX IF NOT EXISTS "idx_transactions_status_due_date" ON "financial_transactions" ("status", "due_date");
CREATE INDEX IF NOT EXISTS "idx_transactions_entity" ON "financial_transactions" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_recurrence" ON "financial_transactions" ("recurrence_id");
CREATE INDEX IF NOT EXISTS "idx_contracts_status" ON "rental_contracts" ("status");
CREATE INDEX IF NOT EXISTS "idx_contracts_owner_tenant" ON "rental_contracts" ("owner_id", "tenant_id");

-- =====================================================================
-- AUDITORIA E REVISÃO
-- =====================================================================
-- 1. As tabelas são novas e não modificam estruturas existentes.
-- 2. Tipos de dados consistentes com o schema atual (INTEGER para valores monetários).
-- 3. Relações com `users` e `properties` estabelecidas via Foreign Keys.
-- 4. A tabela `owner_bank_details` isola dados bancários e se liga ao usuário.
-- 5. A tabela `financial_transactions` é o núcleo, com design polimórfico e índices para performance.
-- 6. Campo `last_reminded_at` adicionado para futuras automações de IA.
-- A arquitetura está pronta para a próxima fase: implementação no Drizzle ORM.
-- =====================================================================
