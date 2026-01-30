-- =====================================================================
-- MIGRAÇÃO SQL - MÓDULO FINANCEIRO E GESTÃO DE ALUGUÉIS
-- ESTRATÉGIA: REUTILIZAÇÃO MÁXIMA (ALTER TABLE)
-- AUTOR: Senior Full Stack Lead
-- DATA: 30/01/2026
-- =====================================================================

-- DIRETRIZ DE OURO: REUTILIZAÇÃO MÁXIMA. Não crie novas tabelas se puder alterar as existentes.

-- ETAPA 1: CRIAÇÃO DA ÚNICA TABELA NOVA NECESSÁRIA

-- Tabela: financial_categories
-- Motivo: Essencial para categorizar o livro-razão (tabela `transactions`). Não há substituto.
CREATE TABLE IF NOT EXISTS "financial_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "type" VARCHAR(50) NOT NULL, -- 'income' ou 'expense'
  "color" VARCHAR(20), -- Ex: '#FF5733' para UI
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================================
-- ETAPA 2: ATUALIZAÇÃO DAS TABELAS EXISTENTES (ALTER TABLE)
-- =====================================================================

-- Tabela: contracts
-- Motivo: A tabela `contracts` já existe e pode ser estendida para suportar aluguéis.
-- Ação: Adicionar colunas `NULLABLE` para não quebrar contratos de venda existentes.
ALTER TABLE "contracts"
  ADD COLUMN IF NOT EXISTS "admin_fee_percent" NUMERIC(5, 2) NULL,
  ADD COLUMN IF NOT EXISTS "rent_due_day" INTEGER NULL,
  ADD COLUMN IF NOT EXISTS "readjustment_index" VARCHAR(50) NULL, -- Ex: 'IGPM'
  ADD COLUMN IF NOT EXISTS "is_active_rental" BOOLEAN DEFAULT false;

-- Tabela: transactions
-- Motivo: A tabela `transactions` já existe e servirá como nosso livro-razão.
-- Ação: Adicionar colunas para categorização e relacionamento.
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "category_id" INTEGER NULL REFERENCES "financial_categories"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "parent_transaction_id" INTEGER NULL REFERENCES "transactions"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "recurrence" VARCHAR(100) NULL; -- Ex: 'monthly', 'yearly'

-- Tabela: landlords (identificada como `owners` na instrução, mas `landlords` no schema)
-- Motivo: A tabela `landlords` já possui os campos bancários necessários.
-- Ação: Nenhuma alteração necessária. Os dados (`pix_key`, `bank_account`, etc.) serão lidos desta tabela.

-- =====================================================================
-- ETAPA 3: ÍNDICES PARA PERFORMANCE DAS NOVAS COLUNAS
-- =====================================================================

CREATE INDEX IF NOT EXISTS "idx_contracts_active_rental" ON "contracts" ("is_active_rental");
CREATE INDEX IF NOT EXISTS "idx_transactions_category" ON "transactions" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_parent" ON "transactions" ("parent_transaction_id");

-- =====================================================================
-- REVISÃO DA ESTRATÉGIA
-- =====================================================================
-- 1. **Reutilização Máxima:** As tabelas `contracts` e `transactions` foram reutilizadas e estendidas.
-- 2. **Impacto Mínimo:** As novas colunas em `contracts` são `NULLABLE`, garantindo que os registros existentes não sejam afetados.
-- 3. **Tabela `landlords`:** A tabela existente `landlords` já contém os dados bancários dos proprietários, eliminando a necessidade de uma nova tabela `owner_bank_details`.
-- 4. **Eficiência:** Apenas uma nova tabela (`financial_categories`) foi criada, conforme estritamente necessário.
-- A migração está pronta e alinhada com a diretriz de reutilização.
-- =====================================================================
