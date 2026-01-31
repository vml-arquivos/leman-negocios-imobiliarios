import { 
  serial, text, timestamp, varchar, boolean, numeric, 
  json, date, pgEnum, pgTable, integer 
} from "drizzle-orm/pg-core";

// ============================================
// DEFINIÇÃO DE ENUMS (PostgreSQL)
// ============================================
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const propertyTypeEnum = pgEnum("property_type", ["casa", "apartamento", "cobertura", "terreno", "comercial", "rural", "lancamento"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["venda", "locacao", "ambos"]);
export const propertyStatusEnum = pgEnum("property_status", ["disponivel", "reservado", "vendido", "alugado", "inativo", "geladeira"]);
export const leadSourceEnum = pgEnum("lead_source", ["site", "whatsapp", "instagram", "facebook", "indicacao", "portal_zap", "portal_vivareal", "portal_olx", "google", "outro"]);
export const leadStageEnum = pgEnum("lead_stage", ["novo", "contato_inicial", "qualificado", "visita_agendada", "visita_realizada", "proposta", "negociacao", "fechado_ganho", "fechado_perdido", "sem_interesse"]);
export const clientTypeEnum = pgEnum("client_type", ["comprador", "locatario", "proprietario"]);
export const urgencyLevelEnum = pgEnum("urgency_level", ["baixa", "media", "alta", "urgente"]);
export const priorityEnum = pgEnum("priority", ["baixa", "media", "alta", "urgente"]);
export const messageTypeEnum = pgEnum("message_type", ["incoming", "outgoing"]);
export const aiRoleEnum = pgEnum("ai_role", ["user", "assistant", "system"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["success", "error", "pending"]);
export const amortizationSystemEnum = pgEnum("amortization_system", ["SAC", "PRICE"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pendente", "pago", "atrasado", "cancelado"]);

// ============================================
// TABELA DE USUÁRIOS (EXPANDIDA)
// ============================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).unique(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password"), // Campo para autenticação local
  avatarUrl: text("avatar_url"), // URL da foto de perfil
  loginMethod: varchar("login_method", { length: 20 }).default("local"), // 'local', 'google', 'oauth'
  role: roleEnum("role").default("user").notNull(),
  active: boolean("active").default(true).notNull(),
  lastSignedIn: timestamp("last_signed_in"), // Tracking de última atividade
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TABELA DE IMÓVEIS (EXPANDIDA)
// ============================================
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  
  // Informações Básicas
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  referenceCode: varchar("referenceCode", { length: 50 }).unique(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  
  // Localização
  address: text("address"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  
  // Preços e Custos
  salePrice: integer("salePrice"),
  rentPrice: integer("rentPrice"),
  condoFee: integer("condo_fee"),
  iptu: integer("iptu"),
  
  // Características
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  suites: integer("suites"),
  parkingSpaces: integer("parking_spaces"),
  totalArea: integer("total_area"),
  builtArea: integer("built_area"),
  
  // Recursos e Mídia
  features: text("features"), // JSON string com array de features
  images: text("images"), // JSON string com array de URLs
  mainImage: text("main_image"), // URL da imagem principal
  
  // Status e Visibilidade
  status: propertyStatusEnum("property_status").default("disponivel").notNull(),
  featured: boolean("featured").default(false), // Destaque na home
  published: boolean("published").default(true), // Visível publicamente
  
  // SEO
  slug: varchar("slug", { length: 255 }).unique(),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  
  // Auditoria
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ============================================
// TABELA DE LEADS (EXPANDIDA)
// ============================================
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }), // Campo separado para WhatsApp
  stage: leadStageEnum("lead_stage").default("novo").notNull(),
  source: leadSourceEnum("lead_source").default("site"),
  assignedTo: integer("assignedTo").references(() => users.id),
  propertyId: integer("property_id").references(() => properties.id), // Imóvel de interesse
  notes: text("notes"), // Observações do corretor
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ============================================
// TABELAS N8N
// ============================================
export const n8nConversas = pgTable("n8n_conversas", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone", { length: 20 }).notNull().unique(),
  leadId: integer("lead_id").references(() => leads.id),
  metadata: json("metadata").default({}),
  ultimaInteracao: timestamp("ultima_interacao").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const n8nMensagens = pgTable("n8n_mensagens", {
  id: serial("id").primaryKey(),
  conversaId: integer("conversa_id").references(() => n8nConversas.id),
  mensagem: text("mensagem").notNull(),
  direcao: varchar("direcao", { length: 20 }).default("recebida"),
  metadata: json("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ============================================
// FINANCEIRO E SIMULAÇÕES (EXPANDIDO)
// ============================================
export const financingSimulations = pgTable("financing_simulations", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").references(() => leads.id),
  propertyId: integer("property_id").references(() => properties.id),
  propertyValue: integer("propertyValue").notNull(),
  downPayment: integer("downPayment").notNull(),
  termMonths: integer("termMonths").notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }), // Taxa de juros anual
  monthlyPayment: integer("monthly_payment"), // Parcela calculada
  totalAmount: integer("total_amount"), // Valor total a pagar
  totalInterest: integer("total_interest"), // Total de juros
  amortizationSystem: amortizationSystemEnum("amortization_system").default("SAC").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const rentalPayments = pgTable("rental_payments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => rentalContracts.id),
  propertyId: integer("property_id").references(() => properties.id),
  landlordId: integer("landlord_id").references(() => landlords.id),
  tenantId: integer("tenant_id").references(() => tenants.id),
  tenantName: varchar("tenant_name", { length: 255 }),
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(),
  rentAmount: integer("rent_amount").notNull(),
  condoFee: integer("condo_fee"),
  iptu: integer("iptu"),
  waterBill: integer("water_bill"),
  gasBill: integer("gas_bill"),
  otherCharges: integer("other_charges"),
  lateFee: integer("late_fee"),
  interest: integer("interest"),
  discount: integer("discount"),
  totalAmount: integer("totalAmount").notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  commissionAmount: integer("commission_amount"),
  landlordAmount: integer("landlord_amount"),
  status: paymentStatusEnum("payment_status").default("pendente").notNull(),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paid_date"),
  paymentDate: varchar("payment_date", { length: 10 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentProof: text("payment_proof"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ============================================
// TIPOS INFERIDOS (para TypeScript)
// ============================================
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type FinancingSimulation = typeof financingSimulations.$inferSelect;
export type InsertFinancingSimulation = typeof financingSimulations.$inferInsert;
export type RentalPayment = typeof rentalPayments.$inferSelect;
export type InsertRentalPayment = typeof rentalPayments.$inferInsert;

// ============================================
// GESTÃO DE ALUGUÉIS - LANDLORDS & TENANTS
// ============================================

export const landlordStatusEnum = pgEnum("landlord_status", ["ativo", "inativo", "pendente"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["ativo", "inativo", "inadimplente"]);
export const contractStatusEnum = pgEnum("contract_status", ["ativo", "encerrado", "pendente", "cancelado"]);
export const expenseTypeEnum = pgEnum("expense_type", ["manutencao", "reparo", "reforma", "condominio", "iptu", "seguro", "outro"]);
export const transferStatusEnum = pgEnum("transfer_status", ["pendente", "processado", "cancelado"]);

export const landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }).unique(),
  address: text("address"),
  bankAccount: text("bank_account"), // Dados bancários para repasse
  status: landlordStatusEnum("status").default("ativo").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  occupation: varchar("occupation", { length: 100 }),
  monthlyIncome: integer("monthly_income"),
  status: tenantStatusEnum("status").default("ativo").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rentalContracts = pgTable("rental_contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  landlordId: integer("landlord_id").references(() => landlords.id).notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  rentAmount: integer("rent_amount").notNull(), // Valor do aluguel
  monthlyRent: integer("monthly_rent").notNull(),
  deposit: integer("deposit"), // Caução
  condoFee: integer("condo_fee"),
  iptu: integer("iptu"),
  waterBill: integer("water_bill"),
  gasBill: integer("gas_bill"),
  paymentDay: integer("payment_day").default(10), // Dia do vencimento
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }), // Taxa de comissão (%)
  commissionAmount: integer("commission_amount"),
  managementFee: numeric("management_fee", { precision: 5, scale: 2 }), // Taxa de administração (%)
  status: contractStatusEnum("status").default("ativo").notNull(),
  contractDocument: text("contract_document"), // URL do contrato
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const propertyExpenses = pgTable("property_expenses", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  landlordId: integer("landlord_id").references(() => landlords.id).notNull(),
  expenseType: expenseTypeEnum("expense_type").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  expenseDate: date("expense_date").notNull(),
  paidBy: varchar("paid_by", { length: 50 }).default("imobiliaria"), // 'imobiliaria' ou 'proprietario'
  status: paymentStatusEnum("status").default("pendente").notNull(),
  receipt: text("receipt"), // URL do comprovante
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const landlordTransfers = pgTable("landlord_transfers", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").references(() => landlords.id).notNull(),
  referenceMonth: varchar("reference_month", { length: 7 }).notNull(), // YYYY-MM
  totalRentReceived: integer("total_rent_received").notNull(),
  totalCommissions: integer("total_commissions").notNull(),
  totalExpenses: integer("total_expenses").notNull(),
  rentAmount: integer("rent_amount").notNull(),
  managementFee: integer("management_fee").notNull(),
  expenses: integer("expenses").default(0).notNull(),
  netAmount: integer("net_amount").notNull(), // Valor líquido a repassar
  paymentsIncluded: text("payments_included"), // JSON array de IDs
  expensesIncluded: text("expenses_included"), // JSON array de IDs
  status: transferStatusEnum("status").default("pendente").notNull(),
  transferDate: date("transfer_date"),
  receipt: text("receipt"), // URL do comprovante
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// ANALYTICS & MARKETING
// ============================================

export const eventTypeEnum = pgEnum("event_type", ["page_view", "property_view", "lead_form", "whatsapp_click", "phone_click", "search", "filter_change"]);

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: eventTypeEnum("event_type").notNull(),
  eventData: json("event_data").default({}),
  sessionId: varchar("session_id", { length: 100 }),
  userId: integer("user_id").references(() => users.id),
  propertyId: integer("property_id").references(() => properties.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const campaignSources = pgTable("campaign_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(), // 'google', 'facebook', 'instagram', etc.
  medium: varchar("medium", { length: 50 }), // 'cpc', 'organic', 'social'
  campaign: varchar("campaign", { length: 100 }),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 50 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  utmTerm: varchar("utm_term", { length: 100 }),
  utmContent: varchar("utm_content", { length: 100 }),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  cost: integer("cost").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TRANSAÇÕES E COMISSÕES
// ============================================

export const transactionTypeFinancialEnum = pgEnum("transaction_type_financial", ["venda", "locacao", "comissao_entrada", "comissao_recorrente", "repasse_proprietario"]);
export const transactionCategoryEnum = pgEnum("transaction_category", ["receita", "despesa"]);

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: transactionTypeFinancialEnum("type").notNull(),
  category: transactionCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  leadId: integer("lead_id").references(() => leads.id),
  userId: integer("user_id").references(() => users.id), // Corretor responsável
  transactionDate: date("transaction_date").notNull(),
  status: paymentStatusEnum("status").default("pendente").notNull(),
  receipt: text("receipt"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // Corretor
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  amount: integer("amount").notNull(),
  status: paymentStatusEnum("status").default("pendente").notNull(),
  paidDate: date("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// REVIEWS & TESTIMONIALS
// ============================================

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientPhoto: text("client_photo"),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  approved: boolean("approved").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// N8N EXTENDED TABLES
// ============================================

export const n8nFilaMensagens = pgTable("n8n_fila_mensagens", {
  id: serial("id").primaryKey(),
  idMensagem: varchar("id_mensagem", { length: 100 }).unique(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  mensagem: text("mensagem").notNull(),
  tipo: varchar("tipo", { length: 20 }).default("texto"), // 'texto', 'imagem', 'audio', 'video'
  metadata: json("metadata").default({}),
  processada: boolean("processada").default(false),
  tentativas: integer("tentativas").default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const n8nAutomacoesLog = pgTable("n8n_automacoes_log", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'boas_vindas', 'followup', 'lembrete', etc.
  conversaId: integer("conversa_id").references(() => n8nConversas.id),
  leadId: integer("lead_id").references(() => leads.id),
  status: webhookStatusEnum("status").default("success").notNull(),
  mensagem: text("mensagem"),
  metadata: json("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const n8nLigacoes = pgTable("n8n_ligacoes", {
  id: serial("id").primaryKey(),
  conversaId: integer("conversa_id").references(() => n8nConversas.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  duracao: integer("duracao"), // Duração em segundos
  status: varchar("status", { length: 20 }).default("completada"), // 'completada', 'nao_atendida', 'ocupado'
  gravacao: text("gravacao"), // URL da gravação
  metadata: json("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ============================================
// TIPOS INFERIDOS ADICIONAIS
// ============================================

export type Landlord = typeof landlords.$inferSelect;
export type InsertLandlord = typeof landlords.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type RentalContract = typeof rentalContracts.$inferSelect;
export type InsertRentalContract = typeof rentalContracts.$inferInsert;
export type PropertyExpense = typeof propertyExpenses.$inferSelect;
export type InsertPropertyExpense = typeof propertyExpenses.$inferInsert;
export type LandlordTransfer = typeof landlordTransfers.$inferSelect;
export type InsertLandlordTransfer = typeof landlordTransfers.$inferInsert;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type CampaignSource = typeof campaignSources.$inferSelect;
export type InsertCampaignSource = typeof campaignSources.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
