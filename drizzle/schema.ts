// ARQUIVO: schema_mestre.ts
// DESCRIÇÃO: Schema Drizzle Sincronizado com PostgreSQL Real (Leman Imóveis)
// FONTE: Gemini Architect (Modo PRO)

import { pgTable, serial, varchar, text, timestamp, integer, bigint, boolean, decimal, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- NÚCLEO: USUÁRIOS & AUTH ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  open_id: varchar("open_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("user"), // admin, agent, user, owner
  avatar_url: text("avatar_url"),
  phone: varchar("phone", { length: 20 }),
  last_sign_in_at: timestamp("last_sign_in_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// --- IMÓVEIS (VITRINE) ---
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  property_type: varchar("property_type", { length: 50 }).notNull(),
  transaction_type: varchar("transaction_type", { length: 50 }).notNull(),
  // FINANCEIRO IMÓVEL (Centavos para evitar erro de arredondamento)
  price: bigint("price", { mode: "number" }), 
  rental_price: bigint("rental_price", { mode: "number" }),
  condo_fee: bigint("condo_fee", { mode: "number" }),
  iptu: bigint("iptu", { mode: "number" }),
  // DETALHES
  area: decimal("area", { precision: 10, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  suites: integer("suites"),
  parking_spaces: integer("parking_spaces"),
  // LOCALIZAÇÃO
  address: varchar("address", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }).default("Brasília"),
  state: varchar("state", { length: 2 }).default("DF"),
  zip_code: varchar("zip_code", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  // MÍDIA E METADADOS
  features: jsonb("features").default([]),
  images: jsonb("images").default([]), // Backup legado, usar tabela propertyImages
  video_url: text("video_url"),
  virtual_tour_url: text("virtual_tour_url"),
  status: varchar("status", { length: 50 }).default("disponivel"),
  is_featured: boolean("is_featured").default(false),
  views_count: integer("views_count").default(0),
  owner_id: integer("owner_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: varchar("title"),
  display_order: integer("display_order").default(0),
  is_cover: boolean("is_cover").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// --- CRM & INTELIGÊNCIA ARTIFICIAL ---
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  source: varchar("source", { length: 100 }), // site, facebook, indicação
  stage: varchar("stage", { length: 50 }).default("new"), // new, contacted, visiting, proposal, closed
  interest_type: varchar("interest_type", { length: 50 }), // compra, aluguel
  budget_min: bigint("budget_min", { mode: "number" }),
  budget_max: bigint("budget_max", { mode: "number" }),
  preferred_neighborhoods: jsonb("preferred_neighborhoods").default([]),
  notes: text("notes"),
  assigned_to: integer("assigned_to").references(() => users.id),
  // CÉREBRO DA IA
  ai_profile: jsonb("ai_profile"), // Perfil comportamental gerado
  ai_score: integer("ai_score").default(0), // 0 a 100 (Probabilidade de Fechamento)
  ai_insights: text("ai_insights"),
  last_interaction_at: timestamp("last_interaction_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").references(() => leads.id),
  user_id: integer("user_id").references(() => users.id),
  channel: varchar("channel", { length: 50 }).default("whatsapp"),
  status: varchar("status", { length: 50 }).default("open"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: integer("conversation_id").references(() => conversations.id),
  sender_type: varchar("sender_type", { length: 20 }), // 'user', 'lead', 'system', 'ai'
  content: text("content"),
  metadata: jsonb("metadata"),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const aiPropertyMatches = pgTable("ai_property_matches", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").notNull().references(() => leads.id),
  property_id: integer("property_id").notNull().references(() => properties.id),
  match_score: decimal("match_score", { precision: 5, scale: 2 }), // Score de compatibilidade
  match_reasons: jsonb("match_reasons"), // Por que deu match? (ex: "Bairro correto, Preço dentro")
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, liked, rejected
  created_at: timestamp("created_at").defaultNow(),
});

// --- FINANCEIRO & LOCAÇÃO (SAAS) ---
export const landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf_cnpj: varchar("cpf_cnpj", { length: 20 }).unique(),
  email: varchar("email"),
  phone: varchar("phone"),
  bank_info: jsonb("bank_info"), // Banco, Agência, Conta, PIX
  commission_rate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
  status: varchar("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 20 }).unique(),
  email: varchar("email"),
  phone: varchar("phone"),
  status: varchar("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const rentalContracts = pgTable("rental_contracts", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").references(() => properties.id),
  landlord_id: integer("landlord_id").references(() => landlords.id),
  tenant_id: integer("tenant_id").references(() => tenants.id),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  rent_amount: bigint("rent_amount", { mode: "number" }).notNull(), // Valor do aluguel vigente
  payment_day: integer("payment_day").default(5),
  status: varchar("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const rentalPayments = pgTable("rental_payments", {
  id: serial("id").primaryKey(),
  contract_id: integer("contract_id").references(() => rentalContracts.id),
  reference_month: varchar("reference_month", { length: 7 }), // "2023-10"
  amount_total: bigint("amount_total", { mode: "number" }), // Aluguel + Condomínio + IPTU
  amount_net: bigint("amount_net", { mode: "number" }), // O que vai pro dono
  status: varchar("status").default("pending"), // pending, paid, overdue
  due_date: timestamp("due_date"),
  paid_at: timestamp("paid_at"),
});

export const financingSimulations = pgTable("financing_simulations", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").references(() => leads.id),
  property_value: bigint("property_value", { mode: "number" }),
  down_payment: bigint("down_payment", { mode: "number" }),
  term_months: integer("term_months"),
  interest_rate: decimal("interest_rate", { precision: 5, scale: 2 }),
  simulation_result: jsonb("simulation_result"), // Dados SAC/PRICE completos
  created_at: timestamp("created_at").defaultNow(),
});

// RELAÇÕES (Para queries inteligentes do Drizzle)
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.owner_id], references: [users.id] }),
  images: many(propertyImages),
  matches: many(aiPropertyMatches),
}));

export const leadsRelations = relations(leads, ({ many }) => ({
  matches: many(aiPropertyMatches),
  simulations: many(financingSimulations),
  conversations: many(conversations),
}));