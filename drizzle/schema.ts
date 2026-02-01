import { 
  serial, text, timestamp, varchar, boolean, numeric, 
  json, jsonb, date, pgEnum, pgTable, integer 
} from "drizzle-orm/pg-core";

// ============================================
// DEFINIÇÃO DE ENUMS (PostgreSQL)
// ============================================
export const roleEnum = pgEnum("role", ["user", "admin", "agent"]);
export const propertyTypeEnum = pgEnum("property_type", ["casa", "apartamento", "cobertura", "terreno", "comercial", "rural"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["venda", "aluguel", "ambos"]);
export const propertyStatusEnum = pgEnum("property_status", ["disponivel", "reservado", "vendido", "alugado", "inativo"]);
export const leadStatusEnum = pgEnum("lead_status", ["novo", "contato_inicial", "qualificado", "visita_agendada", "visita_realizada", "proposta", "negociacao", "fechado_ganho", "fechado_perdido", "sem_interesse"]);
export const leadProfileEnum = pgEnum("lead_profile", ["lead", "cliente", "proprietario"]);
export const interestTypeEnum = pgEnum("interest_type", ["compra", "aluguel", "ambos"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pendente", "pago", "atrasado", "cancelado"]);
export const amortizationSystemEnum = pgEnum("amortization_system", ["SAC", "PRICE"]);
export const simulationStatusEnum = pgEnum("simulation_status", ["pending", "contacted", "converted"]);

// ============================================
// TABELA DE USUÁRIOS
// ============================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  open_id: varchar("open_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("user"),
  avatar_url: text("avatar_url"),

  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE IMÓVEIS
// ============================================
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reference_code: varchar("reference_code").unique(),
  property_type: propertyTypeEnum("property_type").notNull(),
  transaction_type: transactionTypeEnum("transaction_type").notNull(),
  address: varchar("address"),
  neighborhood: varchar("neighborhood"),
  city: varchar("city").default("Brasília"),
  state: varchar("state").default("DF"),
  zip_code: varchar("zip_code"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  sale_price: integer("sale_price"),
  rent_price: integer("rent_price"),
  condo_fee: integer("condo_fee"),
  iptu: integer("iptu"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  suites: integer("suites"),
  parking_spaces: integer("parking_spaces"),
  total_area: integer("total_area"),
  built_area: integer("built_area"),
  features: json("features").$type<string[]>().default([]),
  images: json("images").$type<string[]>().default([]),
  main_image: varchar("main_image"),
  video_url: text("video_url"),
  tour_virtual_url: text("tour_virtual_url"),
  status: propertyStatusEnum("status").default("disponivel").notNull(),
  featured: boolean("featured").default(false),
  published: boolean("published").default(true),
  meta_title: varchar("meta_title"),
  meta_description: text("meta_description"),
  slug: varchar("slug").unique(),
  owner_id: integer("owner_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_by: integer("created_by").references(() => users.id),
});

// ============================================
// TABELA DE IMAGENS DE IMÓVEIS
// ============================================
export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  caption: text("caption"),
  display_order: integer("display_order").default(0),
  is_main: boolean("is_main").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE LEADS
// ============================================
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }).notNull().unique(),
  cpf: varchar("cpf", { length: 14 }),
  profile: leadProfileEnum("profile").default("lead"),
  status: leadStatusEnum("status").default("novo").notNull(),
  interesse: text("interesse"),
  tipo_imovel: propertyTypeEnum("tipo_imovel"),
  finalidade: interestTypeEnum("finalidade"),
  orcamento_min: integer("orcamento_min"),
  orcamento_max: integer("orcamento_max"),
  regioes_interesse: json("regioes_interesse").$type<string[]>(),
  quartos: integer("quartos"),
  vagas: integer("vagas"),
  observacoes: text("observacoes"),
  score: integer("score").default(0),
  origem: varchar("origem").default("whatsapp"),
  utm_source: varchar("utm_source"),
  utm_medium: varchar("utm_medium"),
  utm_campaign: varchar("utm_campaign"),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata").default({}),
  ultima_interacao: timestamp("ultima_interacao").defaultNow(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  assigned_to: integer("assigned_to").references(() => users.id),
});

// ============================================
// TABELA DE INTERAÇÕES
// ============================================
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  user_id: integer("user_id").references(() => users.id),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  canal: varchar("canal").default("whatsapp"),
  assunto: varchar("assunto"),
  descricao: text("descricao"),
  resultado: varchar("resultado"),
  proxima_acao: varchar("proxima_acao"),
  data_proxima_acao: timestamp("data_proxima_acao"),
  metadata: json("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE SIMULAÇÕES DE FINANCIAMENTO
// ============================================
export const financingSimulations = pgTable("financing_simulations", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").references(() => leads.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  property_type: varchar("property_type"),
  desired_location: varchar("desired_location"),
  estimated_value: integer("estimated_value"),
  property_value: integer("property_value").notNull(),
  down_payment: integer("down_payment").notNull(),
  financed_amount: integer("financed_amount").notNull(),
  term_months: integer("term_months").notNull(),
  amortization_system: amortizationSystemEnum("amortization_system").default("SAC").notNull(),
  selected_bank: varchar("selected_bank"),
  interest_rate: numeric("interest_rate", { precision: 5, scale: 2 }),
  first_installment: integer("first_installment"),
  last_installment: integer("last_installment"),
  average_installment: integer("average_installment"),
  total_amount: integer("total_amount"),
  total_interest: integer("total_interest"),
  ip_address: varchar("ip_address"),
  user_agent: text("user_agent"),
  status: simulationStatusEnum("status").default("pending"),
  contacted: boolean("contacted").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE PAGAMENTOS DE ALUGUEL
// ============================================
export const rentalPayments = pgTable("rental_payments", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").references(() => properties.id),
  tenant_name: varchar("tenant_name", { length: 255 }),
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(),
  rent_amount: integer("rent_amount").notNull(),
  condo_fee: integer("condo_fee"),
  iptu: integer("iptu"),
  other_charges: integer("other_charges"),
  totalAmount: integer("totalAmount").notNull(),
  payment_status: paymentStatusEnum("payment_status").default("pendente").notNull(),
  dueDate: date("dueDate").notNull(),
  paid_date: date("paid_date"),
  payment_method: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE CONVERSAS N8N
// ============================================
export const n8nConversas = pgTable("n8n_conversas", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone", { length: 20 }).notNull().unique(),
  lead_id: integer("lead_id").references(() => leads.id),
  nome: varchar("nome"),
  email: varchar("email"),
  status: varchar("status").default("ativo"),
  origem: varchar("origem").default("whatsapp"),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  ultima_interacao: timestamp("ultima_interacao").defaultNow().notNull(),
});

// ============================================
// TABELA DE MENSAGENS N8N
// ============================================
export const n8nMensagens = pgTable("n8n_mensagens", {
  id: serial("id").primaryKey(),
  conversa_id: integer("conversa_id").references(() => n8nConversas.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  mensagem: text("mensagem").notNull(),
  tipo: varchar("tipo").default("texto"),
  direcao: varchar("direcao").default("recebida"),
  metadata: json("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ============================================
// TABELA DE FILA DE MENSAGENS N8N
// ============================================
export const n8nFilaMensagens = pgTable("n8n_fila_mensagens", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  id_mensagem: varchar("id_mensagem").notNull().unique(),
  mensagem: text("mensagem").notNull(),
  processada: boolean("processada").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ============================================
// TABELA DE AUTOMAÇÕES LOG N8N
// ============================================
export const n8nAutomacoesLog = pgTable("n8n_automacoes_log", {
  id: serial("id").primaryKey(),
  workflow_id: varchar("workflow_id").notNull(),
  workflow_name: varchar("workflow_name"),
  execution_id: varchar("execution_id"),
  lead_id: integer("lead_id").references(() => leads.id),
  acao: varchar("acao").notNull(),
  resultado: varchar("resultado").notNull(),
  erro: text("erro"),
  metadata: json("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE LIGAÇÕES N8N
// ============================================
export const n8nLigacoes = pgTable("n8n_ligacoes", {
  id: serial("id").primaryKey(),
  lead_id: integer("lead_id").references(() => leads.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  retell_call_id: varchar("retell_call_id").unique(),
  duracao: integer("duracao"),
  transcricao: text("transcricao"),
  resumo: text("resumo"),
  sentimento: varchar("sentimento"),
  proxima_acao: text("proxima_acao"),
  gravacao_url: text("gravacao_url"),
  status: varchar("status").default("concluida"),
  metadata: json("metadata").default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE ANALYTICS EVENTS
// ============================================
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  event_type: varchar("event_type").notNull(),
  event_data: json("event_data").default({}),
  user_id: integer("user_id").references(() => users.id),
  session_id: varchar("session_id"),
  ip_address: varchar("ip_address"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE CAMPAIGN SOURCES
// ============================================
export const campaignSources = pgTable("campaign_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  utm_source: varchar("utm_source"),
  utm_medium: varchar("utm_medium"),
  utm_campaign: varchar("utm_campaign"),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE BLOG CATEGORIES
// ============================================
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE BLOG POSTS
// ============================================
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  featured_image: varchar("featured_image", { length: 500 }),
  category_id: integer("category_id").references(() => blogCategories.id),
  author_id: integer("author_id").references(() => users.id),
  published: boolean("published").default(false),
  published_at: timestamp("published_at"),
  meta_title: varchar("meta_title"),
  meta_description: text("meta_description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE SITE SETTINGS
// ============================================
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  type: varchar("type").default("text"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE REVIEWS
// ============================================
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").references(() => properties.id),
  lead_id: integer("lead_id").references(() => leads.id),
  client_name: varchar("client_name", { length: 255 }).notNull(),
  client_photo: varchar("client_photo", { length: 500 }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  approved: boolean("approved").default(false),
  featured: boolean("featured").default(false),
  display_order: integer("display_order"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TIPOS INFERIDOS (para TypeScript)
// ============================================
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;
export type FinancingSimulation = typeof financingSimulations.$inferSelect;
export type InsertFinancingSimulation = typeof financingSimulations.$inferInsert;
export type RentalPayment = typeof rentalPayments.$inferSelect;
export type InsertRentalPayment = typeof rentalPayments.$inferInsert;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = typeof blogCategories.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
