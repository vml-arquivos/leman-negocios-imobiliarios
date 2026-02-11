// ARQUIVO: drizzle/schema.ts (SUPABASE ENTERPRISE VERSION)
import { pgTable, serial, varchar, text, timestamp, integer, boolean, numeric, jsonb, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ENUMS
export const userRoleEnum = pgEnum("user_role", ["admin", "agent", "user"]);
export const leadStatusEnum = pgEnum("lead_status", ["novo", "em_atendimento", "agendou_visita", "proposta", "fechado", "arquivado"]);
export const propertyStatusEnum = pgEnum("property_status", ["disponivel", "reservado", "vendido", "alugado", "inativo"]);

// TABELAS PRINCIPAIS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email").notNull().unique(),
  password: varchar("password"),
  role: varchar("role").default("user"),
  avatar_url: text("avatar_url"),
  active: boolean("active").default(true),
  last_sign_in_at: timestamp("last_sign_in_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  property_type: varchar("property_type").notNull(),
  transaction_type: varchar("transaction_type").notNull(),

  // CAMPOS REAIS DO SUPABASE
  sale_price: integer("sale_price"),
  rent_price: integer("rent_price"),
  condo_fee: integer("condo_fee"),
  iptu: integer("iptu"),

  address: varchar("address"),
  neighborhood: varchar("neighborhood"),
  city: varchar("city").default("Brasília"),
  state: varchar("state").default("DF"),

  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  suites: integer("suites"),
  parking_spaces: integer("parking_spaces"),

  // Mapeado de total_area
  area: integer("total_area"),

  features: jsonb("features").default([]),
  images: jsonb("images").default([]),
  video_url: text("video_url"),

  // STATUS
  status: varchar("status").default("disponivel"),
  featured: boolean("featured").default(false),

  owner_id: integer("owner_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// TABELA DE IMAGENS DE IMÓVEIS
export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 1024 }).notNull(),
  caption: text("caption"),
  display_order: integer("display_order").notNull().default(0),
  is_main: boolean("is_main").notNull().default(false),
  storage_key: text("storage_key"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  telefone: varchar("telefone").notNull().unique(),
  status: varchar("status").default("novo"),
  interesse: text("interesse"),
  orcamento_max: integer("orcamento_max"),
  score: integer("score").default(0),
  assigned_to: integer("assigned_to").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  ultima_interacao: timestamp("ultima_interacao").defaultNow(),
});

// TABELAS DE N8N & IA
export const n8nConversas = pgTable("n8n_conversas", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone").notNull(),
  lead_id: integer("lead_id").references(() => leads.id),
  status: varchar("status").default("ativo"),
  metadata: jsonb("metadata"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const n8nMensagens = pgTable("n8n_mensagens", {
  id: serial("id").primaryKey(),
  conversa_id: integer("conversa_id").references(() => n8nConversas.id),
  mensagem: text("mensagem").notNull(),
  direcao: varchar("direcao").default("recebida"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// RELATIONS
export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(users, { fields: [properties.owner_id], references: [users.id] }),
}));

// STUBS PARA COMPATIBILIDADE (tabelas que o código espera mas não existem no Supabase)
export const financingSimulations = pgTable("financing_simulations", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").references(() => leads.id),
  property_value: integer("property_value"),
  down_payment: integer("down_payment"),
  term_months: integer("term_months"),
  interest_rate: varchar("interest_rate"),
  simulation_result: jsonb("simulation_result"),
  created_at: timestamp("created_at").defaultNow(),
});

export const landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  cpf_cnpj: varchar("cpf_cnpj"),
  email: varchar("email"),
  phone: varchar("phone"),
  status: varchar("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  cpf: varchar("cpf"),
  email: varchar("email"),
  phone: varchar("phone"),
  status: varchar("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const rentalPayments = pgTable("rental_payments", {
  id: serial("id").primaryKey(),
  contract_id: integer("contract_id"),
  reference_month: varchar("reference_month"),
  amount_total: integer("amount_total"),
  status: varchar("status").default("pending"),
  due_date: timestamp("due_date"),
  paid_at: timestamp("paid_at"),
  created_at: timestamp("created_at").defaultNow(),
});
