// =====================================================================
// ATUALIZAÇÃO DO SCHEMA DRIZZLE ORM - MÓDULO FINANCEIRO (REUTILIZAÇÃO)
// AUTOR: Senior Full Stack Lead
// DATA: 30/01/2026
// =====================================================================

// Nota: Este arquivo contém apenas as MODIFICAÇÕES e ADIÇÕES.
// O código deve ser mesclado ao `drizzle/schema.ts` existente.

import { serial, text, timestamp, varchar, boolean, numeric, json, date, pgEnum, pgTable, integer } from "drizzle-orm/pg-core";

// ============================================
// 1. ÚNICA NOVA TABELA: financial_categories
// ============================================

export const financialCategoryTypeEnum = pgEnum("financial_category_type", ["income", "expense"]);

export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: financialCategoryTypeEnum("type").notNull(),
  color: varchar("color", { length: 20 }), // Ex: '#FF5733'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FinancialCategory = typeof financialCategories.$inferSelect;
export type InsertFinancialCategory = typeof financialCategories.$inferInsert;


// ============================================
// 2. ATUALIZAÇÃO DA TABELA `contracts`
// Localize a tabela `contracts` existente e adicione as seguintes colunas:
// ============================================

/*
// Exemplo de como a tabela `contracts` ficaria:
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  tenantId: integer("tenantId").notNull(),
  ownerId: integer("ownerId").notNull(),
  status: varchar("status", { length: 50 }).default("ACTIVE").notNull(),
  rentAmount: integer("rentAmount").notNull(), // em centavos
  adminFeeRate: integer("adminFeeRate").default(10).notNull(), // percentual
  startDate: timestamp("startDate").defaultNow().notNull(),
  paymentDay: integer("paymentDay").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),

  // --- NOVAS COLUNAS ADICIONADAS ---
  adminFeePercent: numeric("admin_fee_percent", { precision: 5, scale: 2 }),
  rentDueDay: integer("rent_due_day"),
  readjustmentIndex: varchar("readjustment_index", { length: 50 }),
  isActiveRental: boolean("is_active_rental").default(false),
});
*/

// ============================================
// 3. ATUALIZAÇÃO DA TABELA `transactions`
// Localize a tabela `transactions` existente e adicione as seguintes colunas:
// ============================================

/*
// Exemplo de como a tabela `transactions` ficaria:
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  propertyId: integer("propertyId"),
  leadId: integer("leadId"),
  ownerId: integer("ownerId"),
  description: text("description").notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentDate: date("paymentDate"),
  dueDate: date("dueDate"),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),

  // --- NOVAS COLUNAS ADICIONADAS ---
  categoryId: integer("category_id").references(() => financialCategories.id, { onDelete: 'set null' }),
  parentTransactionId: integer("parent_transaction_id").references(() => transactions.id, { onDelete: 'set null' }),
  recurrence: varchar("recurrence", { length: 100 }),
});
*/

// =====================================================================
// NOTA: O código acima é uma representação das alterações. O desenvolvedor
// deve mesclar estas novas colunas e a nova tabela no arquivo `drizzle/schema.ts` existente.
// =====================================================================
