/**
 * drizzle/schema.ts
 *
 * Schema Drizzle alinhado 100% ao banco Supabase real.
 * Fonte da verdade: export SQL do Supabase (pasted_content_2.txt).
 *
 * REGRA: Nunca adicionar colunas que não existam no Supabase.
 *        Nunca renomear colunas — usar exatamente os nomes do banco.
 */
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// TABELA: users
// ============================================================
export const users = pgTable("users", {
  id:              serial("id").primaryKey(),
  open_id:         varchar("open_id").unique(),
  name:            text("name").notNull(),
  email:           varchar("email").notNull().unique(),
  password:        varchar("password"),
  login_method:    varchar("login_method").default("local"),
  role:            varchar("role").notNull().default("user"),
  telefone:        varchar("telefone"),
  avatar_url:      text("avatar_url"),
  active:          boolean("active").default(true),
  created_at:      timestamp("created_at").notNull().defaultNow(),
  updated_at:      timestamp("updated_at").notNull().defaultNow(),
  last_signed_in:  timestamp("last_signed_in").notNull().defaultNow(),
  last_sign_in_at: timestamp("last_sign_in_at"),
});

// ============================================================
// TABELA: properties
// Colunas exatas do Supabase (sem invenção):
//   id, title, description, reference_code, property_type,
//   transaction_type, address, neighborhood, city, state,
//   zip_code, latitude, longitude, sale_price, rent_price,
//   condo_fee, iptu, bedrooms, bathrooms, suites,
//   parking_spaces, total_area, built_area, features, images,
//   main_image, video_url, tour_virtual_url, status, featured,
//   published, meta_title, meta_description, slug, owner_id,
//   created_at, updated_at, created_by
// ============================================================
export const properties = pgTable("properties", {
  id:               serial("id").primaryKey(),
  title:            varchar("title").notNull(),
  description:      text("description"),
  reference_code:   varchar("reference_code").unique(),
  property_type:    varchar("property_type").notNull(),   // enum: casa|apartamento|cobertura|terreno|comercial|rural|lancamento
  transaction_type: varchar("transaction_type").notNull(), // enum: venda|locacao|ambos
  address:          varchar("address"),
  neighborhood:     varchar("neighborhood"),
  city:             varchar("city").default("Brasília"),
  state:            varchar("state").default("DF"),
  zip_code:         varchar("zip_code"),
  latitude:         numeric("latitude"),
  longitude:        numeric("longitude"),
  sale_price:       numeric("sale_price"),
  rent_price:       numeric("rent_price"),
  condo_fee:        numeric("condo_fee"),
  iptu:             numeric("iptu"),
  bedrooms:         integer("bedrooms"),
  bathrooms:        integer("bathrooms"),
  suites:           integer("suites"),
  parking_spaces:   integer("parking_spaces"),
  total_area:       numeric("total_area"),
  built_area:       numeric("built_area"),
  features:         jsonb("features").default([]),
  images:           jsonb("images").default([]),
  main_image:       varchar("main_image"),
  video_url:        text("video_url"),
  tour_virtual_url: text("tour_virtual_url"),
  status:           varchar("status").notNull().default("disponivel"), // enum: disponivel|reservado|vendido|alugado|inativo
  featured:         boolean("featured").default(false),
  published:        boolean("published").default(true),
  meta_title:       varchar("meta_title"),
  meta_description: text("meta_description"),
  slug:             varchar("slug").unique(),
  owner_id:         integer("owner_id"),
  created_at:       timestamp("created_at").notNull().defaultNow(),
  updated_at:       timestamp("updated_at").notNull().defaultNow(),
  created_by:       integer("created_by").references(() => users.id),
});

// ============================================================
// TABELA: property_images
// ============================================================
export const propertyImages = pgTable("property_images", {
  id:            serial("id").primaryKey(),
  property_id:   integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url:           varchar("url").notNull(),
  caption:       text("caption"),
  display_order: integer("display_order").default(0),
  is_main:       boolean("is_main").default(false),
  created_at:    timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: leads
// Colunas exatas do Supabase:
//   id, name, email, telefone (NOT NULL UNIQUE), cpf, profile,
//   status (lead_status enum), interesse, tipo_imovel, finalidade,
//   orcamento_min, orcamento_max, regioes_interesse (ARRAY),
//   quartos, vagas, observacoes, score, origem, utm_source,
//   utm_medium, utm_campaign, tags (ARRAY), metadata (jsonb),
//   ultima_interacao, created_at, updated_at, assigned_to
// ============================================================
export const leads = pgTable("leads", {
  id:                serial("id").primaryKey(),
  name:              varchar("name").notNull(),
  email:             varchar("email"),
  telefone:          varchar("telefone").notNull().unique(),
  cpf:               varchar("cpf"),
  profile:           varchar("profile").default("lead"),
  status:            varchar("status").notNull().default("novo"),   // lead_status enum
  interesse:         text("interesse"),
  tipo_imovel:       varchar("tipo_imovel"),
  finalidade:        varchar("finalidade"),
  orcamento_min:     integer("orcamento_min"),
  orcamento_max:     integer("orcamento_max"),
  regioes_interesse: text("regioes_interesse").array(),
  quartos:           integer("quartos"),
  vagas:             integer("vagas"),
  observacoes:       text("observacoes"),
  score:             integer("score").default(0),
  origem:            varchar("origem").default("whatsapp"),
  utm_source:        varchar("utm_source"),
  utm_medium:        varchar("utm_medium"),
  utm_campaign:      varchar("utm_campaign"),
  tags:              text("tags").array(),
  metadata:          jsonb("metadata").default({}),
  ultima_interacao:  timestamp("ultima_interacao").defaultNow(),
  created_at:        timestamp("created_at").notNull().defaultNow(),
  updated_at:        timestamp("updated_at").notNull().defaultNow(),
  assigned_to:       integer("assigned_to").references(() => users.id),
});

// ============================================================
// TABELA: interactions
// ============================================================
export const interactions = pgTable("interactions", {
  id:                 serial("id").primaryKey(),
  lead_id:            integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  user_id:            integer("user_id").references(() => users.id),
  tipo:               varchar("tipo").notNull(),
  canal:              varchar("canal").default("whatsapp"),
  assunto:            varchar("assunto"),
  descricao:          text("descricao"),
  resultado:          varchar("resultado"),
  proxima_acao:       varchar("proxima_acao"),
  data_proxima_acao:  timestamp("data_proxima_acao"),
  metadata:           jsonb("metadata").default({}),
  created_at:         timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: blog_categories
// ============================================================
export const blogCategories = pgTable("blog_categories", {
  id:          serial("id").primaryKey(),
  name:        varchar("name").notNull().unique(),
  slug:        varchar("slug").notNull().unique(),
  description: text("description"),
  created_at:  timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: blog_posts
// ============================================================
export const blogPosts = pgTable("blog_posts", {
  id:               serial("id").primaryKey(),
  title:            varchar("title").notNull(),
  slug:             varchar("slug").notNull().unique(),
  content:          text("content"),
  excerpt:          text("excerpt"),
  featured_image:   varchar("featured_image"),
  category_id:      integer("category_id").references(() => blogCategories.id),
  author_id:        integer("author_id").references(() => users.id),
  published:        boolean("published").default(false),
  published_at:     timestamp("published_at"),
  meta_title:       varchar("meta_title"),
  meta_description: text("meta_description"),
  created_at:       timestamp("created_at").notNull().defaultNow(),
  updated_at:       timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: site_settings  (key/value store)
// ============================================================
export const siteSettings = pgTable("site_settings", {
  id:         serial("id").primaryKey(),
  key:        varchar("key").notNull().unique(),
  value:      text("value"),
  type:       varchar("type").default("text"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: audit_logs
// ============================================================
export const auditLogs = pgTable("audit_logs", {
  id:          serial("id").primaryKey(),
  user_id:     integer("user_id").references(() => users.id),
  action:      varchar("action").notNull(),
  entity_type: varchar("entity_type").notNull(),
  entity_id:   integer("entity_id"),
  old_values:  jsonb("old_values"),
  new_values:  jsonb("new_values"),
  ip_address:  varchar("ip_address"),
  user_agent:  text("user_agent"),
  created_at:  timestamp("created_at").defaultNow(),
});

// ============================================================
// TABELA: owners  (proprietários de imóveis — tabela real no Supabase)
// ============================================================
export const owners = pgTable("owners", {
  id:           serial("id").primaryKey(),
  name:         varchar("name").notNull(),
  cpf_cnpj:     varchar("cpf_cnpj"),
  email:        varchar("email"),
  phone:        varchar("phone"),
  whatsapp:     varchar("whatsapp"),
  address:      text("address"),
  city:         varchar("city"),
  state:        varchar("state"),
  zip_code:     varchar("zip_code"),
  bank_name:    varchar("bank_name"),
  bank_agency:  varchar("bank_agency"),
  bank_account: varchar("bank_account"),
  pix_key:      varchar("pix_key"),
  notes:        text("notes"),
  active:       boolean("active").default(true),
  created_at:   timestamp("created_at").notNull().defaultNow(),
  updated_at:   timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: n8n_conversas
// ============================================================
export const n8nConversas = pgTable("n8n_conversas", {
  id:               serial("id").primaryKey(),
  telefone:         varchar("telefone").notNull().unique(),
  lead_id:          integer("lead_id").references(() => leads.id),
  nome:             varchar("nome"),
  email:            varchar("email"),
  status:           varchar("status").default("ativo"),
  origem:           varchar("origem").default("whatsapp"),
  tags:             text("tags").array(),
  metadata:         jsonb("metadata").default({}),
  created_at:       timestamp("created_at").notNull().defaultNow(),
  updated_at:       timestamp("updated_at").notNull().defaultNow(),
  ultima_interacao: timestamp("ultima_interacao").notNull().defaultNow(),
});

// ============================================================
// TABELA: n8n_mensagens
// ============================================================
export const n8nMensagens = pgTable("n8n_mensagens", {
  id:          serial("id").primaryKey(),
  conversa_id: integer("conversa_id").references(() => n8nConversas.id),
  telefone:    varchar("telefone").notNull(),
  mensagem:    text("mensagem").notNull(),
  tipo:        varchar("tipo").default("texto"),
  direcao:     varchar("direcao").default("recebida"),
  metadata:    jsonb("metadata").default({}),
  timestamp:   timestamp("timestamp").notNull().defaultNow(),
});

// ============================================================
// TABELA: financing_simulations
// ============================================================
export const financingSimulations = pgTable("financing_simulations", {
  id:                  serial("id").primaryKey(),
  lead_id:             integer("lead_id").references(() => leads.id),
  name:                varchar("name").notNull(),
  email:               varchar("email").notNull(),
  phone:               varchar("phone").notNull(),
  property_type:       varchar("property_type"),
  desired_location:    varchar("desired_location"),
  estimated_value:     integer("estimated_value"),
  property_value:      integer("property_value").notNull(),
  down_payment:        integer("down_payment").notNull(),
  financed_amount:     integer("financed_amount").notNull(),
  term_months:         integer("term_months").notNull(),
  amortization_system: varchar("amortization_system").notNull().default("SAC"),
  selected_bank:       varchar("selected_bank"),
  interest_rate:       numeric("interest_rate"),
  first_installment:   integer("first_installment"),
  last_installment:    integer("last_installment"),
  average_installment: integer("average_installment"),
  total_amount:        integer("total_amount"),
  total_interest:      integer("total_interest"),
  ip_address:          varchar("ip_address"),
  user_agent:          text("user_agent"),
  status:              varchar("status").default("pending"),
  contacted:           boolean("contacted").default(false),
  created_at:          timestamp("created_at").notNull().defaultNow(),
  updated_at:          timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: proposals
// ============================================================
export const proposals = pgTable("proposals", {
  id:                  serial("id").primaryKey(),
  lead_id:             integer("lead_id").notNull().references(() => leads.id),
  property_id:         integer("property_id").notNull().references(() => properties.id),
  user_id:             integer("user_id").references(() => users.id),
  tipo:                varchar("tipo").notNull(),
  valor_proposta:      integer("valor_proposta").notNull(),
  valor_entrada:       integer("valor_entrada"),
  valor_financiamento: integer("valor_financiamento"),
  prazo_meses:         integer("prazo_meses"),
  observacoes:         text("observacoes"),
  status:              varchar("status").notNull().default("rascunho"),
  data_envio:          timestamp("data_envio"),
  data_resposta:       timestamp("data_resposta"),
  data_validade:       timestamp("data_validade"),
  documento_url:       text("documento_url"),
  metadata:            jsonb("metadata").default({}),
  created_at:          timestamp("created_at").notNull().defaultNow(),
  updated_at:          timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: contracts
// ============================================================
export const contracts = pgTable("contracts", {
  id:                       serial("id").primaryKey(),
  proposal_id:              integer("proposal_id").references(() => proposals.id),
  lead_id:                  integer("lead_id").notNull().references(() => leads.id),
  property_id:              integer("property_id").notNull().references(() => properties.id),
  user_id:                  integer("user_id").references(() => users.id),
  tipo:                     varchar("tipo").notNull(),
  valor_total:              integer("valor_total").notNull(),
  valor_entrada:            integer("valor_entrada"),
  valor_parcela:            integer("valor_parcela"),
  numero_parcelas:          integer("numero_parcelas"),
  data_inicio:              date("data_inicio").notNull(),
  data_fim:                 date("data_fim"),
  data_vencimento_parcela:  integer("data_vencimento_parcela"),
  status:                   varchar("status").notNull().default("rascunho"),
  documento_url:            text("documento_url"),
  documento_assinado_url:   text("documento_assinado_url"),
  metadata:                 jsonb("metadata").default({}),
  admin_fee_percent:        numeric("admin_fee_percent"),
  rent_due_day:             integer("rent_due_day"),
  readjustment_index:       varchar("readjustment_index"),
  is_active_rental:         boolean("is_active_rental").default(false),
  created_at:               timestamp("created_at").notNull().defaultNow(),
  updated_at:               timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: transactions
// ============================================================
export const transactions = pgTable("transactions", {
  id:                     serial("id").primaryKey(),
  contract_id:            integer("contract_id").references(() => contracts.id),
  lead_id:                integer("lead_id").references(() => leads.id),
  property_id:            integer("property_id").references(() => properties.id),
  tipo:                   varchar("tipo").notNull(),
  descricao:              text("descricao"),
  valor:                  integer("valor").notNull(),
  data_vencimento:        date("data_vencimento").notNull(),
  data_pagamento:         date("data_pagamento"),
  status:                 varchar("status").notNull().default("pendente"),
  forma_pagamento:        varchar("forma_pagamento"),
  asaas_payment_id:       varchar("asaas_payment_id").unique(),
  asaas_invoice_url:      text("asaas_invoice_url"),
  boleto_url:             text("boleto_url"),
  pix_qrcode:             text("pix_qrcode"),
  metadata:               jsonb("metadata").default({}),
  category_id:            integer("category_id"),
  parent_transaction_id:  integer("parent_transaction_id"),
  recurrence:             varchar("recurrence"),
  created_at:             timestamp("created_at").notNull().defaultNow(),
  updated_at:             timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: commissions
// ============================================================
export const commissions = pgTable("commissions", {
  id:               serial("id").primaryKey(),
  user_id:          integer("user_id").notNull().references(() => users.id),
  contract_id:      integer("contract_id").references(() => contracts.id),
  transaction_id:   integer("transaction_id").references(() => transactions.id),
  valor_base:       integer("valor_base").notNull(),
  percentual:       numeric("percentual").notNull(),
  valor_comissao:   integer("valor_comissao").notNull(),
  status:           varchar("status").notNull().default("pendente"),
  data_vencimento:  date("data_vencimento").notNull(),
  data_pagamento:   date("data_pagamento"),
  observacoes:      text("observacoes"),
  metadata:         jsonb("metadata").default({}),
  created_at:       timestamp("created_at").notNull().defaultNow(),
  updated_at:       timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: analytics_events
// ============================================================
export const analyticsEvents = pgTable("analytics_events", {
  id:          serial("id").primaryKey(),
  event_type:  varchar("event_type").notNull(),
  event_data:  jsonb("event_data").default({}),
  user_id:     integer("user_id").references(() => users.id),
  session_id:  varchar("session_id"),
  ip_address:  varchar("ip_address"),
  user_agent:  text("user_agent"),
  created_at:  timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: campaign_sources
// ============================================================
export const campaignSources = pgTable("campaign_sources", {
  id:           serial("id").primaryKey(),
  name:         varchar("name").notNull().unique(),
  utm_source:   varchar("utm_source"),
  utm_medium:   varchar("utm_medium"),
  utm_campaign: varchar("utm_campaign"),
  active:       boolean("active").default(true),
  created_at:   timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: webhooks_log
// ============================================================
export const webhooksLog = pgTable("webhooks_log", {
  id:          serial("id").primaryKey(),
  source:      varchar("source").notNull(),
  event_type:  varchar("event_type"),
  payload:     jsonb("payload"),
  response:    jsonb("response"),
  status:      varchar("status"),
  created_at:  timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: lead_insights
// ============================================================
export const leadInsights = pgTable("lead_insights", {
  id:               serial("id").primaryKey(),
  lead_id:          integer("lead_id").notNull().references(() => leads.id),
  sentiment_score:  integer("sentiment_score"),
  ai_summary:       text("ai_summary"),
  last_interaction: timestamp("last_interaction").notNull().defaultNow(),
  created_at:       timestamp("created_at").notNull().defaultNow(),
  updated_at:       timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: ai_context_status
// ============================================================
export const aiContextStatus = pgTable("ai_context_status", {
  id:         serial("id").primaryKey(),
  session_id: varchar("session_id").notNull(),
  phone:      varchar("phone").notNull(),
  message:    text("message").notNull(),
  role:       varchar("role").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: reviews
// ============================================================
export const reviews = pgTable("reviews", {
  id:          serial("id").primaryKey(),
  property_id: integer("property_id").references(() => properties.id),
  lead_id:     integer("lead_id").references(() => leads.id),
  rating:      integer("rating").notNull(),
  comment:     text("comment"),
  approved:    boolean("approved").default(false),
  created_at:  timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// TABELA: lead_assignments
// ============================================================
export const leadAssignments = pgTable("lead_assignments", {
  id:          serial("id").primaryKey(),
  lead_id:     integer("lead_id").notNull().references(() => leads.id),
  assigned_to: integer("assigned_to").notNull().references(() => users.id),
  assigned_by: integer("assigned_by").references(() => users.id),
  assigned_at: timestamp("assigned_at").defaultNow(),
  notes:       text("notes"),
});

// ============================================================
// TABELA: client_interests
// ============================================================
export const clientInterests = pgTable("client_interests", {
  id:                      serial("id").primaryKey(),
  client_id:               integer("client_id").notNull().references(() => leads.id),
  property_type:           varchar("property_type"),
  interest_type:           varchar("interest_type"),
  budget_min:              integer("budget_min"),
  budget_max:              integer("budget_max"),
  preferred_neighborhoods: text("preferred_neighborhoods"),
  notes:                   text("notes"),
  created_at:              timestamp("created_at").notNull().defaultNow(),
  updated_at:              timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// RELATIONS
// ============================================================
export const propertiesRelations = relations(properties, ({ one }) => ({
  creator: one(users, { fields: [properties.created_by], references: [users.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedUser: one(users, { fields: [leads.assigned_to], references: [users.id] }),
  interactions:  many(interactions),
}));

// ============================================================
// BACKWARD COMPAT: aliases usados em partes do código
// ============================================================
/** @deprecated Use `owners` — tabela real no Supabase */
export const landlords = owners;

/** @deprecated Use `financingSimulations` */
export const rentalPayments = pgTable("rental_payments", {
  id:              serial("id").primaryKey(),
  contract_id:     integer("contract_id"),
  reference_month: varchar("reference_month"),
  amount_total:    numeric("amount_total"),
  status:          varchar("status").default("pending"),
  due_date:        timestamp("due_date"),
  paid_at:         timestamp("paid_at"),
  created_at:      timestamp("created_at").defaultNow(),
});


/** @deprecated Compat export used by legacy router code */
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  color: varchar("color"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
