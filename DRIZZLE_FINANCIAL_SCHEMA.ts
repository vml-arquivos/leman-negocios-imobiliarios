// =====================================================================
// DRIZZLE ORM SCHEMA - MÓDULO FINANCEIRO E ALUGUÉIS (ADITIVO)
// AUTOR: Senior Database Architect
// DATA: 30/01/2026
// =====================================================================

import { serial, text, timestamp, varchar, boolean, numeric, json, date, pgEnum, pgTable, integer } from "drizzle-orm/pg-core";

// ============================================
// 1. NOVOS ENUMS
// ============================================

export const financialTransactionTypeEnum = pgEnum("financial_transaction_type", [
  'INCOME', 
  'EXPENSE'
]);

export const financialTransactionStatusEnum = pgEnum("financial_transaction_status", [
  'PENDING', 
  'PAID', 
  'OVERDUE', 
  'CANCELED'
]);

export const financialEntityTypeEnum = pgEnum("financial_entity_type", [
  'OWNER', 
  'TENANT', 
  'BROKER', 
  'COMPANY', 
  'SUPPLIER'
]);

export const rentalContractStatusEnum = pgEnum("rental_contract_status", [
  'ACTIVE', 
  'INACTIVE', 
  'PENDING_SIGNATURE', 
  'TERMINATED'
]);

// ============================================
// 2. NOVAS TABELAS
// ============================================

// Tabela 1: financial_categories
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  type: financialTransactionTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela 2: owner_bank_details
export const ownerBankDetails = pgTable("owner_bank_details", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bankName: varchar("bank_name", { length: 100 }),
  agencyNumber: varchar("agency_number", { length: 20 }),
  accountNumber: varchar("account_number", { length: 30 }),
  accountType: accountTypeEnum("account_type"), // Reutiliza enum existente
  pixKeyType: pixKeyTypeEnum("pix_key_type"), // Reutiliza enum existente
  pixKey: varchar("pix_key", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela 3: rental_contracts
export const rentalContracts = pgTable("rental_contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: 'restrict' }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: 'restrict' }),
  tenantId: integer("tenant_id").notNull().references(() => users.id, { onDelete: 'restrict' }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  rentAmount: integer("rent_amount").notNull(), // Em centavos
  adminFeePercentage: numeric("admin_fee_percentage", { precision: 5, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull(),
  status: rentalContractStatusEnum("status").default('ACTIVE').notNull(),
  contractDocumentUrl: varchar("contract_document_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela 4: financial_transactions
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: integer("amount").notNull(), // Em centavos
  type: financialTransactionTypeEnum("type").notNull(),
  status: financialTransactionStatusEnum("status").default('PENDING').notNull(),
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  categoryId: integer("category_id").references(() => financialCategories.id, { onDelete: 'set null' }),
  
  // Relação Polimórfica
  entityType: financialEntityTypeEnum("entity_type"),
  entityId: integer("entity_id"),
  
  // Relações Diretas
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'set null' }),
  contractId: integer("contract_id").references(() => rentalContracts.id, { onDelete: 'set null' }),
  
  // Controle de Recorrência
  recurrenceId: varchar("recurrence_id", { length: 100 }),
  
  // Campo para IA
  lastRemindedAt: timestamp("last_reminded_at"),
  
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// 3. TIPOS INFERIDOS (para uso no tRPC)
// ============================================

export type FinancialCategory = typeof financialCategories.$inferSelect;
export type InsertFinancialCategory = typeof financialCategories.$inferInsert;

export type OwnerBankDetails = typeof ownerBankDetails.$inferSelect;
export type InsertOwnerBankDetails = typeof ownerBankDetails.$inferInsert;

export type RentalContract = typeof rentalContracts.$inferSelect;
export type InsertRentalContract = typeof rentalContracts.$inferInsert;

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = typeof financialTransactions.$inferInsert;

// =====================================================================
// NOTA: Este código deve ser adicionado ao final do arquivo `drizzle/schema.ts`
// para integrar o novo módulo ao schema existente.
// =====================================================================
