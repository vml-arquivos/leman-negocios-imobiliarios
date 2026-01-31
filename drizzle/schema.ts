import { serial, text, timestamp, varchar, boolean, numeric, json, date, pgEnum, pgTable, integer } from "drizzle-orm/pg-core";


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
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

// ============================================
// TABELA DE BLOG POSTS
// ============================================

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  
  featuredImage: varchar("featuredImage", { length: 500 }),
  
  categoryId: integer("categoryId"),
  authorId: integer("authorId"),
  
  // SEO
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  
  // Status
  published: boolean("published").default(false),
  publishedAt: timestamp("publishedAt"),
  
  // Estatísticas
  views: integer("views").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ============================================
// TABELA DE CATEGORIAS DE BLOG
// ============================================

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = typeof blogCategories.$inferInsert;

// ============================================
// TABELA DE CONFIGURAÇÕES DO SITE
// ============================================

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  
  // Informações da empresa
  companyName: varchar("companyName", { length: 255 }),
  companyDescription: text("companyDescription"),
  companyLogo: varchar("companyLogo", { length: 500 }),
  
  // Informações do corretor
  realtorName: varchar("realtorName", { length: 255 }),
  realtorPhoto: varchar("realtorPhoto", { length: 500 }),
  realtorBio: text("realtorBio"),
  realtorCreci: varchar("realtorCreci", { length: 50 }),
  
  // Contatos
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  
  // Redes sociais
  instagram: varchar("instagram", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  youtube: varchar("youtube", { length: 255 }),
  tiktok: varchar("tiktok", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  
  // SEO
  siteTitle: varchar("siteTitle", { length: 255 }),
  siteDescription: text("siteDescription"),
  siteKeywords: text("siteKeywords"),
  
  // Integrações
  googleAnalyticsId: varchar("googleAnalyticsId", { length: 50 }),
  facebookPixelId: varchar("facebookPixelId", { length: 50 }),
  
  // Customização Visual (Site Builder)
  themeStyle: themeStyleEnum("theme_style").default("modern"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#0f172a"), // Hex color
  
  // Seção Hero
  heroTitle: varchar("heroTitle", { length: 255 }),
  heroSubtitle: text("heroSubtitle"),
  heroBackgroundImage: varchar("heroBackgroundImage", { length: 500 }),
  
  // Seção Sobre
  aboutSectionTitle: varchar("aboutSectionTitle", { length: 255 }),
  aboutSectionContent: text("aboutSectionContent"),
  aboutSectionImage: varchar("aboutSectionImage", { length: 500 }),
  
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// ============================================
// TABELAS DE INTEGRAÇÃO WHATSAPP / N8N
// ============================================

// Buffer de mensagens do WhatsApp
export const messageBuffer = pgTable("message_buffer", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  messageId: varchar("messageId", { length: 255 }).notNull().unique(),
  content: text("content"),
  type: messageTypeEnum("message_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processed: integer("processed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageBuffer = typeof messageBuffer.$inferSelect;
export type InsertMessageBuffer = typeof messageBuffer.$inferInsert;

// Contexto e histórico de IA
export const aiContextStatus = pgTable("ai_context_status", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  message: text("message").notNull(), // JSON com {type: 'ai'|'user', content: string}
  role: aiRoleEnum("ai_role").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiContextStatus = typeof aiContextStatus.$inferSelect;
export type InsertAiContextStatus = typeof aiContextStatus.$inferInsert;

// Interesses dos clientes (para N8N)
export const clientInterests = pgTable("client_interests", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull(), // Referência ao lead
  propertyType: varchar("propertyType", { length: 100 }), // Tipo de imóvel de interesse
  interestType: interestTypeEnum("interest_type"),
  budgetMin: integer("budgetMin"), // Em centavos
  budgetMax: integer("budgetMax"), // Em centavos
  preferredNeighborhoods: text("preferredNeighborhoods"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ClientInterest = typeof clientInterests.$inferSelect;
export type InsertClientInterest = typeof clientInterests.$inferInsert;

// Webhooks e logs de integração
export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 50 }).notNull(), // whatsapp, n8n, etc
  event: varchar("event", { length: 100 }).notNull(),
  payload: text("payload"), // JSON do payload recebido
  response: text("response"), // JSON da resposta enviada
  status: webhookStatusEnum("webhook_status").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

// ============================================
// TABELA DE PROPRIETÁRIOS
// ============================================

export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  
  // Informações pessoais
  name: varchar("name", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  
  // Endereço
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  
  // Informações bancárias (para pagamentos)
  bankName: varchar("bankName", { length: 100 }),
  bankAgency: varchar("bankAgency", { length: 20 }),
  bankAccount: varchar("bankAccount", { length: 30 }),
  pixKey: varchar("pixKey", { length: 255 }),
  
  // Notas e observações
  notes: text("notes"),
  
  // Status
  active: boolean("active").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Owner = typeof owners.$inferSelect;
export type InsertOwner = typeof owners.$inferInsert;

// ============================================
// TABELAS DE ANALYTICS E MÉTRICAS
// ============================================

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  
  // Tipo de evento
  eventType: varchar("eventType", { length: 50 }).notNull(), // page_view, property_view, contact_form, whatsapp_click, phone_click
  
  // Dados do evento
  propertyId: integer("propertyId"),
  leadId: integer("leadId"),
  userId: integer("userId"),
  
  // Origem do tráfego
  source: varchar("source", { length: 100 }), // google_ads, facebook_ads, instagram, organic, direct
  medium: varchar("medium", { length: 100 }), // cpc, social, organic, referral
  campaign: varchar("campaign", { length: 255 }), // Nome da campanha
  
  // Dados técnicos
  url: varchar("url", { length: 500 }),
  referrer: varchar("referrer", { length: 500 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  
  // Metadados
  metadata: json("metadata"), // Dados adicionais em JSON
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export const campaignSources = pgTable("campaign_sources", {
  id: serial("id").primaryKey(),
  
  // Identificação da campanha
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(), // google, facebook, instagram, etc
  medium: varchar("medium", { length: 100 }), // cpc, social, etc
  campaignId: varchar("campaignId", { length: 255 }), // ID externo da campanha
  
  // Métricas
  budget: numeric("budget", { precision: 10, scale: 2 }), // Orçamento investido
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  conversions: integer("conversions").default(0), // Leads gerados
  
  // Status
  active: boolean("active").default(true),
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
  rentAmount: integer("rentAmount").notNull(), // em centavos
  adminFeeRate: integer("adminFeeRate").default(10).notNull(), // percentual
  startDate: timestamp("startDate").defaultNow().notNull(),
  paymentDay: integer("paymentDay").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  
  // Dados Profissionais
  occupation: varchar("occupation", { length: 100 }),
  employer: varchar("employer", { length: 255 }),
  monthlyIncome: integer("monthlyIncome"), // em centavos
  
  // Referências
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  
  // Status
  status: ownerStatusEnum("owner_status").default("ativo").notNull(),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// Tabela de Contratos de Locação (Expandida)
export const rentalContracts = pgTable("rental_contracts", {
  id: serial("id").primaryKey(),
  
  // Relacionamentos
  propertyId: integer("propertyId").notNull(),
  landlordId: integer("landlordId").notNull(),
  tenantId: integer("tenantId").notNull(),
  
  // Dados do Contrato
  contractNumber: varchar("contractNumber", { length: 50 }).unique(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  durationMonths: integer("durationMonths").notNull(),
  
  // Valores
  rentAmount: integer("rentAmount").notNull(), // Aluguel em centavos
  condoFee: integer("condoFee").default(0), // Condomínio em centavos
  iptu: integer("iptu").default(0), // IPTU mensal em centavos
  waterBill: integer("waterBill").default(0), // Água em centavos
  gasBill: integer("gasBill").default(0), // Gás em centavos
  
  // Responsabilidades
  condoFeeResponsibility: feeResponsibilityEnum("condo_fee_responsibility").default("inquilino"),
  iptuResponsibility: feeResponsibilityEnum("iptu_responsibility").default("proprietario"),
  
  // Comissão
  commissionRate: numeric("commissionRate", { precision: 5, scale: 2 }).notNull(), // Taxa de administração
  commissionAmount: integer("commissionAmount").notNull(), // Valor da comissão em centavos
  
  // Pagamento
  paymentDay: integer("paymentDay").default(5).notNull(), // Dia do vencimento
  
  // Garantias
  depositAmount: integer("depositAmount"), // Caução em centavos
  guarantorName: varchar("guarantorName", { length: 255 }),
  guarantorCpf: varchar("guarantorCpf", { length: 14 }),
  guarantorPhone: varchar("guarantorPhone", { length: 20 }),
  
  // Reajuste
  adjustmentIndex: adjustmentIndexEnum("adjustment_index").default("IGPM"),
  lastAdjustmentDate: date("lastAdjustmentDate"),
  
  // Status
  status: contractStatusEnum("contract_status").default("ativo").notNull(),
  
  // Documentos
  contractUrl: varchar("contractUrl", { length: 500 }),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RentalContract = typeof rentalContracts.$inferSelect;
export type InsertRentalContract = typeof rentalContracts.$inferInsert;

// Tabela de Pagamentos de Aluguel
export const rentalPayments = pgTable("rental_payments", {
  id: serial("id").primaryKey(),
  
  // Relacionamentos
  contractId: integer("contractId").notNull(),
  propertyId: integer("propertyId").notNull(),
  landlordId: integer("landlordId").notNull(),
  tenantId: integer("tenantId").notNull(),
  
  // Referência
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(), // YYYY-MM
  
  // Valores
  rentAmount: integer("rentAmount").notNull(), // Aluguel em centavos
  condoFee: integer("condoFee").default(0),
  iptu: integer("iptu").default(0),
  waterBill: integer("waterBill").default(0),
  gasBill: integer("gasBill").default(0),
  otherCharges: integer("otherCharges").default(0),
  totalAmount: integer("totalAmount").notNull(), // Total a receber do inquilino
  
  // Multa e Juros (se houver atraso)
  lateFee: integer("lateFee").default(0), // Multa em centavos
  interest: integer("interest").default(0), // Juros em centavos
  discount: integer("discount").default(0), // Desconto em centavos
  
  // Comissão
  commissionRate: numeric("commissionRate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: integer("commissionAmount").notNull(),
  
  // Repasse ao Proprietário
  landlordAmount: integer("landlordAmount").notNull(), // Valor líquido para o proprietário
  
  // Datas
  dueDate: date("dueDate").notNull(),
  paymentDate: date("paymentDate"),
  
  // Status
  status: paymentStatusEnum("payment_status").default("pendente").notNull(),
  
  // Pagamento
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentProof: varchar("paymentProof", { length: 500 }),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RentalPayment = typeof rentalPayments.$inferSelect;
export type InsertRentalPayment = typeof rentalPayments.$inferInsert;

// Tabela de Despesas por Imóvel
export const propertyExpenses = pgTable("property_expenses", {
  id: serial("id").primaryKey(),
  
  // Relacionamentos
  propertyId: integer("propertyId").notNull(),
  landlordId: integer("landlordId").notNull(),
  contractId: integer("contractId"), // Opcional, se for relacionado a um contrato específico
  
  // Tipo de Despesa
  expenseType: expenseTypeEnum("expense_type").notNull(),
  
  // Descrição
  description: text("description").notNull(),
  
  // Valores
  amount: integer("amount").notNull(), // Valor em centavos
  
  // Responsável pelo Pagamento
  paidBy: paidByEnum("paid_by").notNull(),
  
  // Datas
  expenseDate: date("expenseDate").notNull(),
  paymentDate: date("paymentDate"),
  
  // Status
  status: expenseStatusEnum("expense_status").default("pendente").notNull(),
  
  // Comprovantes
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  
  // Fornecedor
  supplierName: varchar("supplierName", { length: 255 }),
  supplierCpfCnpj: varchar("supplierCpfCnpj", { length: 20 }),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PropertyExpense = typeof propertyExpenses.$inferSelect;
export type InsertPropertyExpense = typeof propertyExpenses.$inferInsert;

// Tabela de Repasses aos Proprietários
export const landlordTransfers = pgTable("landlord_transfers", {
  id: serial("id").primaryKey(),
  
  // Relacionamentos
  landlordId: integer("landlordId").notNull(),
  
  // Referência
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(), // YYYY-MM
  
  // Valores Consolidados
  totalRentReceived: integer("totalRentReceived").notNull(), // Total de aluguéis recebidos
  totalCommissions: integer("totalCommissions").notNull(), // Total de comissões
  totalExpenses: integer("totalExpenses").notNull(), // Total de despesas
  netAmount: integer("netAmount").notNull(), // Valor líquido a repassar
  
  // Detalhamento (JSON)
  paymentsIncluded: text("paymentsIncluded"), // JSON array de IDs de rentalPayments
  expensesIncluded: text("expensesIncluded"), // JSON array de IDs de propertyExpenses
  
  // Transferência
  transferDate: date("transferDate"),
  transferMethod: varchar("transferMethod", { length: 50 }), // pix, ted, doc
  transferProof: varchar("transferProof", { length: 500 }),
  
  // Status
  status: transactionStatusEnum("transaction_status").default("pendente").notNull(),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LandlordTransfer = typeof landlordTransfers.$inferSelect;
export type InsertLandlordTransfer = typeof landlordTransfers.$inferInsert;

// Tabela de Histórico de Reajustes
export const rentAdjustments = pgTable("rent_adjustments", {
  id: serial("id").primaryKey(),
  
  // Relacionamentos
  contractId: integer("contractId").notNull(),
  
  // Valores
  previousAmount: integer("previousAmount").notNull(), // Valor anterior em centavos
  newAmount: integer("newAmount").notNull(), // Novo valor em centavos
  adjustmentPercentage: numeric("adjustmentPercentage", { precision: 5, scale: 2 }).notNull(),
  
  // Índice Utilizado
  adjustmentIndex: varchar("adjustmentIndex", { length: 50 }).notNull(), // IGPM, IPCA, etc
  indexValue: numeric("indexValue", { precision: 8, scale: 4 }).notNull(), // Valor do índice
  
  // Datas
  effectiveDate: date("effectiveDate").notNull(),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RentAdjustment = typeof rentAdjustments.$inferSelect;
export type InsertRentAdjustment = typeof rentAdjustments.$inferInsert;


// ============================================
// CATEGORIAS FINANCEIRAS
// ============================================
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // 'income' | 'expense'
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancialCategory = typeof financialCategories.$inferSelect;
export type InsertFinancialCategory = typeof financialCategories.$inferInsert;


// ============================================
// GESTÃO DE CLIENTES UNIFICADA
// ============================================

export const clientTypeEnumV2 = pgEnum("client_type_v2", ["proprietario_locacao", "proprietario_venda", "locatario", "comprador"]);

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }).unique(),
  clientType: clientTypeEnumV2("client_type").notNull(),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clientProperties = pgTable("client_properties", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(), // proprietario, locatario, comprador_potencial
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 100 }),
  agencyNumber: varchar("agency_number", { length: 20 }),
  accountNumber: varchar("account_number", { length: 20 }),
  accountType: varchar("account_type", { length: 50 }),
  pixKey: varchar("pix_key", { length: 255 }),
  pixKeyType: varchar("pix_key_type", { length: 50 }),
  isPrimary: boolean("is_primary").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Duplicate removed - financingSimulations already defined above


// ============================================
// TABELAS N8N (INTEGRAÇÃO WHATSAPP)
// ============================================

// Tabela principal de conversas N8N
export const n8nConversas = pgTable("n8n_conversas", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone", { length: 20 }).notNull().unique(),
  leadId: integer("lead_id").references(() => leads.id),
  nome: varchar("nome", { length: 255 }),
  email: varchar("email", { length: 320 }),
  status: varchar("status", { length: 50 }).default("ativo"),
  origem: varchar("origem", { length: 50 }).default("whatsapp"),
  tags: text("tags").array(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ultimaInteracao: timestamp("ultima_interacao").defaultNow().notNull(),
});

export type N8nConversa = typeof n8nConversas.$inferSelect;
export type InsertN8nConversa = typeof n8nConversas.$inferInsert;

// Mensagens do chat N8N
export const n8nMensagens = pgTable("n8n_mensagens", {
  id: serial("id").primaryKey(),
  conversaId: integer("conversa_id").references(() => n8nConversas.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  mensagem: text("mensagem").notNull(),
  tipo: varchar("tipo", { length: 50 }).default("texto"),
  direcao: varchar("direcao", { length: 20 }).default("recebida"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type N8nMensagem = typeof n8nMensagens.$inferSelect;
export type InsertN8nMensagem = typeof n8nMensagens.$inferInsert;

// Fila de mensagens N8N (para processamento assíncrono)
export const n8nFilaMensagens = pgTable("n8n_fila_mensagens", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  idMensagem: varchar("id_mensagem", { length: 255 }).notNull().unique(),
  mensagem: text("mensagem").notNull(),
  processada: boolean("processada").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type N8nFilaMensagem = typeof n8nFilaMensagens.$inferSelect;
export type InsertN8nFilaMensagem = typeof n8nFilaMensagens.$inferInsert;

// Log de automações N8N
export const n8nAutomacoesLog = pgTable("n8n_automacoes_log", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflow_id", { length: 255 }).notNull(),
  workflowName: varchar("workflow_name", { length: 255 }),
  executionId: varchar("execution_id", { length: 255 }),
  leadId: integer("lead_id").references(() => leads.id),
  acao: varchar("acao", { length: 255 }).notNull(),
  resultado: varchar("resultado", { length: 255 }).notNull(),
  erro: text("erro"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type N8nAutomacaoLog = typeof n8nAutomacoesLog.$inferSelect;
export type InsertN8nAutomacaoLog = typeof n8nAutomacoesLog.$inferInsert;

// Ligações/Chamadas N8N (integração com Retell AI)
export const n8nLigacoes = pgTable("n8n_ligacoes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  retellCallId: varchar("retell_call_id", { length: 255 }).unique(),
  duracao: integer("duracao"),
  transcricao: text("transcricao"),
  resumo: text("resumo"),
  sentimento: varchar("sentimento", { length: 50 }),
  proximaAcao: text("proxima_acao"),
  gravacaoUrl: text("gravacao_url"),
  status: varchar("status", { length: 50 }).default("concluida"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type N8nLigacao = typeof n8nLigacoes.$inferSelect;
export type InsertN8nLigacao = typeof n8nLigacoes.$inferInsert;

// ============================================
// TABELAS ADICIONAIS DO SUPABASE
// ============================================

// Agendamentos de visitas
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  propertyId: integer("property_id").references(() => properties.id),
  userId: integer("user_id").references(() => users.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  nome: varchar("nome", { length: 255 }),
  email: varchar("email", { length: 320 }),
  dataVisita: timestamp("data_visita").notNull(),
  duracao: integer("duracao").default(60),
  imovelEndereco: text("imovel_endereco"),
  status: varchar("status", { length: 50 }).notNull().default("agendado"),
  googleCalendarId: varchar("google_calendar_id", { length: 255 }),
  googleMeetLink: text("google_meet_link"),
  lembreteEnviado: boolean("lembrete_enviado").default(false),
  lembreteEnviadoEm: timestamp("lembrete_enviado_em"),
  observacoes: text("observacoes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// Propostas comerciais
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  userId: integer("user_id").references(() => users.id),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  valorProposta: integer("valor_proposta").notNull(),
  valorEntrada: integer("valor_entrada"),
  valorFinanciamento: integer("valor_financiamento"),
  prazoMeses: integer("prazo_meses"),
  observacoes: text("observacoes"),
  status: varchar("status", { length: 50 }).notNull().default("rascunho"),
  dataEnvio: timestamp("data_envio"),
  dataResposta: timestamp("data_resposta"),
  dataValidade: timestamp("data_validade"),
  documentoUrl: text("documento_url"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;
