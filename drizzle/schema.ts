import { 
  serial, text, timestamp, varchar, boolean, numeric, 
  json, jsonb, date, pgEnum, pgTable, integer 
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
// TABELA DE USUÁRIOS E IMÓVEIS
// ============================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).unique(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: roleEnum("role").default("user").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  referenceCode: varchar("referenceCode", { length: 50 }).unique(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  salePrice: integer("salePrice"),
  rentPrice: integer("rentPrice"),
  status: propertyStatusEnum("property_status").default("disponivel").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  stage: leadStageEnum("lead_stage").default("novo").notNull(),
  assignedTo: integer("assignedTo").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// TABELAS N8N
// ============================================
export const n8nConversas = pgTable("n8n_conversas", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone", { length: 20 }).notNull().unique(),
  leadId: integer("lead_id").references(() => leads.id),
  metadata: jsonb("metadata").default({}),
  ultimaInteracao: timestamp("ultima_interacao").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const n8nMensagens = pgTable("n8n_mensagens", {
  id: serial("id").primaryKey(),
  conversaId: integer("conversa_id").references(() => n8nConversas.id),
  mensagem: text("mensagem").notNull(),
  direcao: varchar("direcao", { length: 20 }).default("recebida"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ============================================
// FINANCEIRO E SIMULAÇÕES
// ============================================
export const financingSimulations = pgTable("financing_simulations", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").references(() => leads.id),
  propertyValue: integer("propertyValue").notNull(),
  downPayment: integer("downPayment").notNull(),
  termMonths: integer("termMonths").notNull(),
  amortizationSystem: amortizationSystemEnum("amortization_system").default("SAC").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const rentalPayments = pgTable("rental_payments", {
  id: serial("id").primaryKey(),
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(),
  totalAmount: integer("totalAmount").notNull(),
  status: paymentStatusEnum("payment_status").default("pendente").notNull(),
  dueDate: date("dueDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
