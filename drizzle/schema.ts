import { serial, text, timestamp, varchar, boolean, numeric, json, date, pgEnum, pgTable, integer } from "drizzle-orm/pg-core";


// ============================================
// DEFINIÇÃO DE ENUMS (PostgreSQL)
// ============================================

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const propertyTypeEnum = pgEnum("property_type", ["casa", "apartamento", "cobertura", "terreno", "comercial", "rural", "lancamento"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["venda", "locacao", "ambos"]);
export const propertyStatusEnum = pgEnum("property_status", ["disponivel", "reservado", "vendido", "alugado", "inativo"]);
export const leadSourceEnum = pgEnum("lead_source", ["site", "whatsapp", "instagram", "facebook", "indicacao", "portal_zap", "portal_vivareal", "portal_olx", "google", "outro"]);
export const leadStageEnum = pgEnum("lead_stage", ["novo", "contato_inicial", "qualificado", "visita_agendada", "visita_realizada", "proposta", "negociacao", "fechado_ganho", "fechado_perdido", "sem_interesse"]);
export const clientTypeEnum = pgEnum("client_type", ["comprador", "locatario", "proprietario"]);
export const qualificationEnum = pgEnum("qualification", ["quente", "morno", "frio", "nao_qualificado"]);
export const buyerProfileEnum = pgEnum("buyer_profile", ["investidor", "primeira_casa", "upgrade", "curioso", "indeciso"]);
export const urgencyLevelEnum = pgEnum("urgency_level", ["baixa", "media", "alta", "urgente"]);
export const priorityEnum = pgEnum("priority", ["baixa", "media", "alta", "urgente"]);
export const interactionTypeEnum = pgEnum("interaction_type", ["ligacao", "whatsapp", "email", "visita", "reuniao", "proposta", "nota", "status_change"]);
export const themeStyleEnum = pgEnum("theme_style", ["modern", "classic"]);
export const messageTypeEnum = pgEnum("message_type", ["incoming", "outgoing"]);
export const aiRoleEnum = pgEnum("ai_role", ["user", "assistant", "system"]);
export const interestTypeEnum = pgEnum("interest_type", ["venda", "locacao", "ambos"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["success", "error", "pending"]);
export const amortizationSystemEnum = pgEnum("amortization_system", ["SAC", "PRICE"]);

export const eventTypeEnum = pgEnum("event_type", ["page_view", "property_view", "contact_form", "whatsapp_click", "phone_click", "search", "filter", "share"]);
export const leadStatusEnum = pgEnum("lead_status", ["pending", "contacted", "converted", "lost"]);
export const accountTypeEnum = pgEnum("account_type", ["corrente", "poupanca"]);
export const pixKeyTypeEnum = pgEnum("pix_key_type", ["cpf", "cnpj", "email", "telefone", "aleatoria"]);
export const accountStatusEnum = pgEnum("account_status", ["ativo", "inativo", "bloqueado"]);
export const ownerStatusEnum = pgEnum("owner_status", ["ativo", "inativo"]);
export const feeResponsibilityEnum = pgEnum("fee_responsibility", ["proprietario", "inquilino"]);
export const adjustmentIndexEnum = pgEnum("adjustment_index", ["IGPM", "IPCA", "INPC"]);
export const contractStatusEnum = pgEnum("contract_status", ["ativo", "encerrado", "suspenso"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pendente", "pago", "atrasado", "cancelado"]);
export const expenseTypeEnum = pgEnum("expense_type", ["manutencao", "reparo", "limpeza", "condominio", "iptu", "energia", "agua", "gas", "internet", "seguro", "outros"]);
export const paidByEnum = pgEnum("paid_by", ["imobiliaria", "proprietario", "inquilino"]);
export const expenseStatusEnum = pgEnum("expense_status", ["pendente", "pago", "reembolsado"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pendente", "processando", "concluido", "cancelado"]);


/**
 * Schema completo para o sistema Leman Negócios Imobiliários
 * Inclui: usuários, imóveis, leads, interações, blog, configurações
 */

// ============================================
// TABELA DE USUÁRIOS (AUTH)
// ============================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).unique(), // Nullable para compatibilidade com auth local
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // Hash da senha (bcrypt/scrypt)
  loginMethod: varchar("login_method", { length: 64 }).default("local"),
  role: roleEnum("role").default("user").notNull(),
  telefone: varchar("telefone", { length: 20 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// TABELA DE IMÓVEIS
// ============================================

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  
  // Informações básicas
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  referenceCode: varchar("referenceCode", { length: 50 }).unique(),
  
  // Tipo e finalidade
  propertyType: propertyTypeEnum("property_type").notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  
  // Localização
  address: varchar("address", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  
  // Valores
  salePrice: integer("salePrice"), // em centavos
  rentPrice: integer("rentPrice"), // em centavos
  condoFee: integer("condoFee"), // em centavos
  iptu: integer("iptu"), // em centavos (anual)
  
  // Características
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  suites: integer("suites"),
  parkingSpaces: integer("parkingSpaces"),
  totalArea: integer("totalArea"), // em m²
  builtArea: integer("builtArea"), // em m²
  
  // Características adicionais (JSON)
  features: text("features"), // JSON array: ["piscina", "churrasqueira", "academia"]
  
  // Imagens (JSON array de URLs)
  images: text("images"), // JSON array de objetos: [{url: "", caption: ""}]
  mainImage: varchar("mainImage", { length: 500 }),
  
  // Status e visibilidade
  status: propertyStatusEnum("property_status").default("disponivel").notNull(),
  featured: boolean("featured").default(false),
  published: boolean("published").default(true),
  
  // SEO
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  slug: varchar("slug", { length: 255 }).unique(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdBy: integer("createdBy"),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ============================================
// TABELA DE IMAGENS DE IMÓVEIS
// ============================================

export const propertyImages = pgTable("propertyImages", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(),
  isPrimary: integer("isPrimary").default(0).notNull(), // 1 = imagem principal, 0 = secundária
  displayOrder: integer("displayOrder").default(0).notNull(),
  caption: varchar("caption", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;

// ============================================
// TABELA DE LEADS/CLIENTES
// ============================================

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  
  // Informações pessoais
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  
  // Origem do lead
  source: leadSourceEnum("lead_source").default("site"),
  
  // Status no pipeline
  stage: leadStageEnum("lead_stage").default("novo").notNull(),
  
  // Perfil do cliente
  clientType: clientTypeEnum("client_type").default("comprador").notNull(),
  
  qualification: qualificationEnum("qualification").default("nao_qualificado").notNull(),
  
  buyerProfile: buyerProfileEnum("buyer_profile"),
  
  urgencyLevel: urgencyLevelEnum("urgency_level").default("media"),
  
  // Interesse
  interestedPropertyId: integer("interestedPropertyId"), // ID do imóvel de interesse
  transactionInterest: transactionTypeEnum("transaction_type").default("venda"),
  budgetMin: integer("budgetMin"), // em centavos
  budgetMax: integer("budgetMax"), // em centavos
  preferredNeighborhoods: text("preferredNeighborhoods"), // JSON array
  preferredPropertyTypes: text("preferredPropertyTypes"), // JSON array
  
  // Notas e tags
  notes: text("notes"),
  tags: text("tags"), // JSON array: ["vip", "urgente", "investidor"]
  
  // Atribuição
  assignedTo: integer("assignedTo"), // ID do usuário responsável
  
  // Score e prioridade
  score: integer("score").default(0), // 0-100
  priority: priorityEnum("priority").default("media"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  convertedAt: timestamp("convertedAt"),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ============================================
// TABELA DE INTERAÇÕES/HISTÓRICO
// ============================================

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  
  leadId: integer("leadId").notNull(),
  userId: integer("userId"), // Quem fez a interação
  
  type: eventTypeEnum("event_type").notNull(),
  
  subject: varchar("subject", { length: 255 }),
  description: text("description"),
  
  // Metadados específicos (JSON)
  metadata: text("metadata"), // Ex: {duration: 300, outcome: "positivo"}
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

// ============================================
// TABELA DE POSTS DO BLOG
// ============================================

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  authorId: integer("authorId"),
  
  // SEO
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  
  // Imagem de capa
  coverImage: varchar("coverImage", { length: 500 }),
  
  // Status
  published: boolean("published").default(false),
  publishedAt: timestamp("publishedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ============================================
// TABELA DE CONFIGURAÇÕES DO SITE
// ============================================

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  
  // Identidade Visual
  siteName: varchar("siteName", { length: 100 }).default("Leman"),
  logoUrl: varchar("logoUrl", { length: 500 }),
  faviconUrl: varchar("faviconUrl", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#c9a962"),
  secondaryColor: varchar("secondaryColor", { length: 20 }).default("#1a1f3c"),
  theme: themeStyleEnum("theme").default("modern"),
  
  // Contato
  contactEmail: varchar("contactEmail", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactWhatsapp: varchar("contactWhatsapp", { length: 20 }),
  address: varchar("address", { length: 255 }),
  
  // Redes Sociais
  socialInstagram: varchar("socialInstagram", { length: 255 }),
  socialFacebook: varchar("socialFacebook", { length: 255 }),
  socialLinkedin: varchar("socialLinkedin", { length: 255 }),
  
  // SEO Global
  globalMetaTitle: varchar("globalMetaTitle", { length: 255 }),
  globalMetaDescription: text("globalMetaDescription"),
  
  // Timestamps
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

// ============================================
// TABELA DE MENSAGENS (EX: WHATSAPP)
// ============================================

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  
  leadId: integer("leadId").notNull(),
  userId: integer("userId"), // Corretor que enviou/recebeu
  
  content: text("content").notNull(),
  type: messageTypeEnum("type").notNull(), // incoming, outgoing
  
  // Metadados
  timestamp: timestamp("timestamp").notNull(),
  read: boolean("read").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================
// TABELA DE CONVERSAS (AGRUPA MENSAGENS)
// ============================================

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  
  leadId: integer("leadId").notNull().unique(),
  
  lastMessageId: integer("lastMessageId"),
  lastMessageTimestamp: timestamp("lastMessageTimestamp"),
  
  // Status
  unreadMessages: integer("unreadMessages").default(0),
  archived: boolean("archived").default(false),
  
  // Atribuição
  assignedTo: integer("assignedTo"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ============================================
// TABELA DE CONVERSAS DE IA (CHATBOT)
// ============================================

export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  leadId: integer('leadId').notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull(),
  role: aiRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;

// ============================================
// TABELA DE INTERESSES EM IMÓVEIS
// ============================================

export const propertyInterests = pgTable('property_interests', {
  id: serial('id').primaryKey(),
  leadId: integer('leadId').notNull(),
  propertyId: integer('propertyId').notNull(),
  interestType: interestTypeEnum('interest_type').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PropertyInterest = typeof propertyInterests.$inferSelect;
export type InsertPropertyInterest = typeof propertyInterests.$inferInsert;

// ============================================
// TABELA DE WEBHOOKS
// ============================================

export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  source: varchar('source', { length: 100 }).notNull(), // ex: 'rdstation', 'facebook_leads'
  payload: json('payload').notNull(),
  status: webhookStatusEnum('status').default('pending').notNull(),
  processedAt: timestamp('processed_at'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

// ============================================
// TABELA DE EVENTOS DE TRACKING
// ============================================

export const trackingEvents = pgTable('tracking_events', {
  id: serial('id').primaryKey(),
  eventType: eventTypeEnum('event_type').notNull(),
  leadId: integer('leadId'),
  propertyId: integer('propertyId'),
  sessionId: varchar('sessionId', { length: 100 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertTrackingEvent = typeof trackingEvents.$inferInsert;

// ============================================
// TABELA DE FONTES DE CAMPANHA
// ============================================

export const campaignSources = pgTable('campaign_sources', {
  id: serial("id").primaryKey(),
  
  // Parâmetros UTM
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
  utmTerm: varchar("utmTerm", { length: 100 }),
  utmContent: varchar("utmContent", { length: 100 }),
  
  // Métricas
  visits: integer("visits").default(0),
  leadsGenerated: integer("leadsGenerated").default(0),
  
  // Datas
  startDate: date("startDate"),
  endDate: date("endDate"),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CampaignSource = typeof campaignSources.$inferSelect;
export type InsertCampaignSource = typeof campaignSources.$inferInsert;

// ============================================
// TABELAS FINANCEIRAS
// ============================================

// NOVA TABELA ADICIONADA
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Ex: Aluguel, IPTU
  type: varchar("type", { length: 20 }).notNull(), // 'income' | 'expense'
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  
  // Tipo de transação
  type: varchar("type", { length: 50 }).notNull(), // commission, expense, revenue
  category: varchar("category", { length: 100 }), // sale_commission, marketing, office, etc
  
  // Valores
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  
  // Relacionamentos
  propertyId: integer("propertyId"), // Imóvel relacionado
  leadId: integer("leadId"), // Cliente relacionado
  ownerId: integer("ownerId"), // Proprietário relacionado
  
  // Descrição
  description: text("description").notNull(),
  notes: text("notes"),
  
  // Status de pagamento
  status: varchar("status", { length: 50 }).default("pending"), // pending, paid, cancelled
  paymentMethod: varchar("paymentMethod", { length: 50 }), // pix, transfer, check, cash
  paymentDate: date("paymentDate"),
  dueDate: date("dueDate"),
  
  // Comprovantes
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),

  // --- NOVAS COLUNAS ADICIONADAS ---
  categoryId: integer("categoryId").references(() => financialCategories.id, { onDelete: 'set null' }),
  parentTransactionId: integer("parentTransactionId").references(() => transactions.id, { onDelete: 'set null' }),
  recurrence: varchar("recurrence", { length: 100 }),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  
  // Venda relacionada
  propertyId: integer("propertyId").notNull(),
  leadId: integer("leadId").notNull(), // Comprador
  ownerId: integer("ownerId"), // Vendedor
  
  // Valores da venda
  salePrice: numeric("salePrice", { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric("commissionRate", { precision: 5, scale: 2 }).notNull(), // Percentual (ex: 6.00 para 6%)
  commissionAmount: numeric("commissionAmount", { precision: 12, scale: 2 }).notNull(),
  
  // Divisão de comissão (se houver)
  splitWithAgent: boolean("splitWithAgent").default(false),
  agentName: varchar("agentName", { length: 255 }),
  agentCommissionAmount: numeric("agentCommissionAmount", { precision: 12, scale: 2 }),
  
  // Status
  status: varchar("status", { length: 50 }).default("pending"), // pending, paid, cancelled
  paymentDate: date("paymentDate"),
  
  // Notas
  notes: text("notes"),
  
  // Transação financeira relacionada
  transactionId: integer("transactionId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

// ============================================
// TABELA DE AVALIAÇÕES DE CLIENTES
// ============================================

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  
  // Informações do cliente
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientRole: varchar("clientRole", { length: 100 }), // Empresário, Médico, etc
  clientPhoto: varchar("clientPhoto", { length: 500 }),
  
  // Avaliação
  rating: integer("rating").notNull(), // 1 a 5 estrelas
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  
  // Relacionamentos (opcional)
  propertyId: integer("propertyId"), // Imóvel avaliado
  leadId: integer("leadId"), // Cliente do CRM
  
  // Status
  approved: boolean("approved").default(false),
  featured: boolean("featured").default(false), // Destacar na home
  
  // Metadados
  displayOrder: integer("displayOrder").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ============================================
// TABELAS DE CONTRATOS E INTELIGÊNCIA
// ============================================

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  tenantId: integer("tenantId").notNull(),
  ownerId: integer("ownerId").notNull(),
  status: varchar("status", { length: 50 }).default("ACTIVE").notNull(),
  rentAmount: integer("rentAmount"), // em centavos (reutilizado de valor_parcela)
  adminFeeRate: integer("adminFeeRate").default(10).notNull(), // percentual
  startDate: timestamp("startDate").defaultNow().notNull(),
  paymentDay: integer("paymentDay").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),

  // --- NOVAS COLUNAS ADICIONADAS ---
  adminFeePercent: numeric("adminFeePercent", { precision: 5, scale: 2 }),
  rentDueDay: integer("rentDueDay"),
  readjustmentIndex: varchar("readjustmentIndex", { length: 50 }),
  isActiveRental: boolean("isActiveRental").default(false),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

export const leadInsights = pgTable("lead_insights", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  sentimentScore: integer("sentimentScore"), // 0-100
  aiSummary: text("aiSummary"),
  lastInteraction: timestamp("lastInteraction").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LeadInsight = typeof leadInsights.$inferSelect;
export type InsertLeadInsight = typeof leadInsights.$inferInsert;



// ============================================
// TABELA DE SIMULAÇÕES DE FINANCIAMENTO
// ============================================

export const financingSimulations = pgTable("financing_simulations", {
  id: serial("id").primaryKey(),
  
  // Dados do Lead
  leadId: integer("leadId"), // Vinculado ao lead se já existir
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  
  // Dados do Imóvel Desejado
  propertyType: varchar("propertyType", { length: 100 }),
  desiredLocation: varchar("desiredLocation", { length: 255 }),
  estimatedValue: integer("estimatedValue"), // Valor estimado em centavos
  
  // Dados da Simulação
  propertyValue: integer("propertyValue").notNull(), // Valor do imóvel em centavos
  downPayment: integer("downPayment").notNull(), // Entrada em centavos
  financedAmount: integer("financedAmount").notNull(), // Valor financiado em centavos
  termMonths: integer("termMonths").notNull(), // Prazo em meses
  
  // Sistema de Amortização
  amortizationSystem: amortizationSystemEnum("amortization_system").default("SAC").notNull(),
  
  // Banco Selecionado
  selectedBank: varchar("selectedBank", { length: 100 }),
  interestRate: numeric("interestRate", { precision: 5, scale: 2 }), // Taxa de juros anual
  
  // Resultados da Simulação
  firstInstallment: integer("firstInstallment"), // Primeira parcela em centavos
  lastInstallment: integer("lastInstallment"), // Última parcela em centavos (SAC)
  averageInstallment: integer("averageInstallment"), // Parcela média em centavos
  totalAmount: integer("totalAmount"), // Valor total a pagar em centavos
  totalInterest: integer("totalInterest"), // Total de juros em centavos
  
  // Metadados
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Status
  status: leadStatusEnum("lead_status").default("pending"),
  contacted: boolean("contacted").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FinancingSimulation = typeof financingSimulations.$inferSelect;
export type InsertFinancingSimulation = typeof financingSimulations.$inferInsert;

// ============================================
// SISTEMA DE GESTÃO DE ALUGUÉIS
// ============================================

// Tabela de Proprietários (Landlords)
export const landlords = pgTable("landlords", {
  id: serial("id").primaryKey(),
  
  // Dados Pessoais
  name: varchar("name", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }).notNull().unique(),
  rg: varchar("rg", { length: 20 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  
  // Endereço
  address: varchar("address", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  
  // Dados Bancários
  bankName: varchar("bankName", { length: 100 }),
  bankCode: varchar("bankCode", { length: 10 }),
  agencyNumber: varchar("agencyNumber", { length: 20 }),
  accountNumber: varchar("accountNumber", { length: 20 }),
  accountType: accountTypeEnum("account_type"),
  pixKey: varchar("pixKey", { length: 255 }),
  pixKeyType: pixKeyTypeEnum("pix_key_type"),
  
  // Configurações
  commissionRate: numeric("commissionRate", { precision: 5, scale: 2 }).default("10.00"), // Taxa de administração padrão
  autoTransfer: boolean("autoTransfer").default(false), // Repasse automático
  
  // Status
  status: accountStatusEnum("account_status").default("ativo").notNull(),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Landlord = typeof landlords.$inferSelect;
export type InsertLandlord = typeof landlords.$inferInsert;

// Tabela de Locatários (Tenants)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  
  // Dados Pessoais
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  rg: varchar("rg", { length: 20 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  
  // Endereço
  address: varchar("address", { length: 255 }),
  
  // Status
  status: accountStatusEnum("account_status").default("ativo").notNull(),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// Tabela de Propriedades do Proprietário (associação)
export const propertyOwners = pgTable("property_owners", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  landlordId: integer("landlordId").notNull(),
  ownershipPercentage: numeric("ownershipPercentage", { precision: 5, scale: 2 }).default("100.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyOwner = typeof propertyOwners.$inferSelect;
export type InsertPropertyOwner = typeof propertyOwners.$inferInsert;

// Tabela de Contratos de Aluguel (associação)
export const rentalAgreements = pgTable("rental_agreements", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  tenantId: integer("tenantId").notNull(),
  landlordId: integer("landlordId").notNull(),
  
  // Detalhes do Contrato
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  rentAmount: integer("rentAmount").notNull(), // em centavos
  condoFee: integer("condoFee"), // em centavos
  iptu: integer("iptu"), // em centavos
  
  // Responsabilidades
  condoFeeResponsibility: feeResponsibilityEnum("condo_fee_responsibility").default("inquilino"),
  iptuResponsibility: feeResponsibilityEnum("iptu_responsibility").default("proprietario"),
  
  // Reajuste
  adjustmentIndex: adjustmentIndexEnum("adjustment_index").default("IGPM"),
  adjustmentMonth: integer("adjustmentMonth"), // Mês de reajuste (1-12)
  
  // Status
  status: contractStatusEnum("contract_status").default("ativo").notNull(),
  
  // Documentos
  contractUrl: varchar("contractUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RentalAgreement = typeof rentalAgreements.$inferSelect;
export type InsertRentalAgreement = typeof rentalAgreements.$inferInsert;

// Tabela de Pagamentos de Aluguel
export const rentPayments = pgTable("rent_payments", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreementId").notNull(),
  
  // Valores
  rentAmount: integer("rentAmount").notNull(),
  condoFee: integer("condoFee"),
  iptu: integer("iptu"),
  otherFees: integer("otherFees"),
  totalAmount: integer("totalAmount").notNull(),
  
  // Datas
  dueDate: date("dueDate").notNull(),
  paymentDate: date("paymentDate"),
  
  // Status
  status: paymentStatusEnum("payment_status").default("pendente").notNull(),
  
  // Metadados
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RentPayment = typeof rentPayments.$inferSelect;
export type InsertRentPayment = typeof rentPayments.$inferInsert;

// Tabela de Despesas do Imóvel
export const propertyExpenses = pgTable("property_expenses", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  
  // Detalhes da Despesa
  description: varchar("description", { length: 255 }).notNull(),
  expenseType: expenseTypeEnum("expense_type").notNull(),
  amount: integer("amount").notNull(), // em centavos
  date: date("date").notNull(),
  
  // Responsável pelo pagamento
  paidBy: paidByEnum("paid_by").notNull(),
  
  // Status
  status: expenseStatusEnum("expense_status").default("pendente").notNull(),
  
  // Documentos
  invoiceUrl: varchar("invoiceUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PropertyExpense = typeof propertyExpenses.$inferSelect;
export type InsertPropertyExpense = typeof propertyExpenses.$inferInsert;

// Tabela de Repasses ao Proprietário
export const ownerTransfers = pgTable("owner_transfers", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlordId").notNull(),
  rentPaymentId: integer("rentPaymentId"), // Pagamento de aluguel que originou o repasse
  
  // Valores
  grossAmount: integer("grossAmount").notNull(), // Valor bruto do aluguel
  commissionAmount: integer("commissionAmount").notNull(), // Comissão da imobiliária
  netAmount: integer("netAmount").notNull(), // Valor líquido a ser repassado
  
  // Datas
  transferDate: date("transferDate"),
  expectedDate: date("expectedDate"),
  
  // Status
  status: transactionStatusEnum("transaction_status").default("pendente").notNull(),
  
  // Metadados
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OwnerTransfer = typeof ownerTransfers.$inferSelect;
export type InsertOwnerTransfer = typeof ownerTransfers.$inferInsert;'''
