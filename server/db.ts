import { eq, desc, and, or, like, gte, lte, sql, inArray } from "drizzle-orm";
import { ENV } from "./_core/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  InsertUser,
  users,
  properties,
  propertyImages,
  leads,
  interactions,
  blogPosts,
  blogCategories,
  siteSettings,
  messageBuffer,
  aiContextStatus,
  clientInterests,
  webhookLogs,
  owners,
  analyticsEvents,
  campaignSources,
  transactions,
  commissions,
  reviews,
  // Tabelas de aluguel
  landlords,
  tenants,
  rentalContracts,
  rentalPayments,
  propertyExpenses,
  landlordTransfers,
  type Property,
  type PropertyImage,
  type Lead,
  type Interaction,
  type BlogPost,
  type BlogCategory,
  type SiteSetting,
  type MessageBuffer,
  type AiContextStatus,
  type ClientInterest,
  type WebhookLog,
  type Owner,
  type AnalyticsEvent,
  type CampaignSource,
  type Transaction,
  type Commission,
  type Review,
  type InsertAnalyticsEvent,
  type InsertCampaignSource,
  type InsertTransaction,
  type InsertCommission,
  type InsertReview,
  type Landlord,
  type Tenant,
  type RentalContract,
  type RentalPayment,
  type PropertyExpense,
  type LandlordTransfer
} from "../drizzle/schema";

let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function ensureClient() {
  if (_client) return _client;

  const url = process.env.DATABASE_URL || ENV.databaseUrl;
  if (!url) {
    throw new Error("DATABASE_URL não definido (variável de ambiente).");
  }

  // Esperado: postgresql://USER:PASSWORD@HOST:5432/DBNAME
  _client = postgres(url, {
    max: 20, // Número máximo de conexões no pool
    idle_timeout: 30, // Timeout de inatividade em segundos
    connect_timeout: 10, // Timeout de conexão em segundos
  });
  
  return _client;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      const client = ensureClient();
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Export db para compatibilidade com código legado
export const db = {
  getUserByEmail: async (email: string) => {
    const dbInstance = await getDb();
    if (!dbInstance) return null;
    const result = await dbInstance.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },
  updateUserLastSignIn: async (userId: number) => {
    const dbInstance = await getDb();
    if (!dbInstance) return;
    await dbInstance.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
  },
  createUser: async (userData: InsertUser) => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    const result = await dbInstance.insert(users).values(userData).returning();
    return result[0];
  },
  getAllLeads: async (params: any) => {
    return listLeads(params);
  },
  getSiteSettings: async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return null;
    const result = await dbInstance.select().from(siteSettings).limit(1);
    return result[0] || null;
  },
};

// ============================================
// USER FUNCTIONS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.openId, user.openId))
    .limit(1);

  if (existingUser.length > 0) {
    await db.update(users).set(user).where(eq(users.openId, user.openId));
  } else {
    await db.insert(users).values(user);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] || null;
}

// ============================================
// PROPERTY FUNCTIONS
// ============================================

export async function createProperty(property: InsertProperty): Promise<Property> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(properties).values(property).returning();
  if (!result[0]) throw new Error("Failed to create property");
  return result[0];
}

export async function updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(properties).set(data).where(eq(properties.id, id)).returning();
  if (!result[0]) throw new Error("Property not found");
  return result[0];
}

export async function deleteProperty(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(properties).where(eq(properties.id, id));
}

export async function getPropertyById(id: number): Promise<Property | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result[0] || null;
}

export async function listProperties(params: {
  limit?: number;
  offset?: number;
  search?: string;
  city?: string;
  neighborhood?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  const filters = [];

  if (params.search) {
    filters.push(
      or(
        like(properties.title, `%${params.search}%`),
        like(properties.description, `%${params.search}%`),
        like(properties.address, `%${params.search}%`)
      )
    );
  }
  if (params.city) filters.push(eq(properties.city, params.city));
  if (params.neighborhood) filters.push(eq(properties.neighborhood, params.neighborhood));
  if (params.type) filters.push(eq(properties.type, params.type));
  if (params.status) filters.push(eq(properties.status, params.status));
  if (params.minPrice != null) filters.push(gte(properties.salePrice, params.minPrice));
  if (params.maxPrice != null) filters.push(lte(properties.salePrice, params.maxPrice));

  const whereClause = filters.length ? and(...(filters as any)) : undefined;

  const items = await db
    .select()
    .from(properties)
    .where(whereClause as any)
    .orderBy(desc(properties.createdAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(properties)
    .where(whereClause as any);

  const total = totalResult?.[0]?.count ?? 0;

  return { items, total };
}

// ============================================
// PROPERTY IMAGE FUNCTIONS
// ============================================

export async function addPropertyImage(image: InsertPropertyImage): Promise<PropertyImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(propertyImages).values(image).returning();
  if (!result[0]) throw new Error("Failed to add property image");
  return result[0];
}

export async function listPropertyImages(propertyId: number): Promise<PropertyImage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(propertyImages).where(eq(propertyImages.propertyId, propertyId)).orderBy(desc(propertyImages.createdAt));
}

// ============================================
// LEAD FUNCTIONS
// ============================================

export async function createLead(lead: InsertLead): Promise<Lead> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(lead).returning();
  if (!result[0]) throw new Error("Failed to create lead");
  return result[0];
}

export async function listLeads(params: { limit?: number; offset?: number; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  const filters = [];

  if (params.status) filters.push(eq(leads.stage, params.status));
  if (params.search) {
    filters.push(or(like(leads.name, `%${params.search}%`), like(leads.email, `%${params.search}%`), like(leads.phone, `%${params.search}%`)));
  }

  const whereClause = filters.length ? and(...(filters as any)) : undefined;

  const items = await db
    .select()
    .from(leads)
    .where(whereClause as any)
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(whereClause as any);

  const total = totalResult?.[0]?.count ?? 0;

  return { items, total };
}

// ============================================
// INTERACTIONS FUNCTIONS
// ============================================

export async function createInteraction(interaction: InsertInteraction): Promise<Interaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(interactions).values(interaction).returning();
  if (!result[0]) throw new Error("Failed to create interaction");
  return result[0];
}

export async function listInteractions(leadId: number): Promise<Interaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(interactions).where(eq(interactions.leadId, leadId)).orderBy(desc(interactions.createdAt));
}

// ============================================
// BLOG FUNCTIONS
// ============================================

export async function createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(blogCategories).values(category).returning();
  if (!result[0]) throw new Error("Failed to create blog category");
  return result[0];
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogCategories).orderBy(desc(blogCategories.createdAt));
}

export async function createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(blogPosts).values(post).returning();
  if (!result[0]) throw new Error("Failed to create blog post");
  return result[0];
}

export async function updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(blogPosts).set(data).where(eq(blogPosts.id, id)).returning();
  if (!result[0]) throw new Error("Blog post not found");
  return result[0];
}

export async function deleteBlogPost(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function getBlogPostById(id: number): Promise<BlogPost | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result[0] || null;
}

export async function listBlogPosts(params: { limit?: number; offset?: number; categoryId?: number; search?: string; published?: boolean }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  const filters = [];

  if (params.categoryId != null) filters.push(eq(blogPosts.categoryId, params.categoryId));
  if (params.published != null) filters.push(eq(blogPosts.published, params.published));
  if (params.search) filters.push(or(like(blogPosts.title, `%${params.search}%`), like(blogPosts.content, `%${params.search}%`)));

  const whereClause = filters.length ? and(...(filters as any)) : undefined;

  const items = await db
    .select()
    .from(blogPosts)
    .where(whereClause as any)
    .orderBy(desc(blogPosts.createdAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(whereClause as any);

  const total = totalResult?.[0]?.count ?? 0;

  return { items, total };
}

// ============================================
// SITE SETTINGS FUNCTIONS
// ============================================

export async function getSiteSettings(): Promise<SiteSetting | null> {
  const dbInstance = await getDb();
  if (!dbInstance) return null;
  const result = await dbInstance.select().from(siteSettings).limit(1);
  return result[0] || null;
}

export async function updateSiteSettings(data: Partial<SiteSetting>): Promise<SiteSetting> {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");
  
  // Verificar se já existe configuração
  const existing = await dbInstance.select().from(siteSettings).limit(1);
  
  if (existing.length > 0) {
    const result = await dbInstance.update(siteSettings).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(siteSettings.id, existing[0].id)).returning();
    return result[0];
  } else {
    // Criar configuração inicial
    const result = await dbInstance.insert(siteSettings).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any).returning();
    return result[0];
  }
}

// ============================================
// CLIENTS UNIFIED FUNCTIONS (CRM 360º)
// ============================================

export async function getUnifiedClients(params: {
  limit?: number;
  offset?: number;
  search?: string;
  type?: string;
  source?: string;
}) {
  const dbInstance = await getDb();
  if (!dbInstance) return { items: [], total: 0 };
  
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  
  // Buscar leads (compradores/locatários)
  const leadsData = await dbInstance.select({
    id: leads.id,
    name: leads.name,
    email: leads.email,
    phone: leads.phone,
    whatsapp: leads.whatsapp,
    clientType: leads.clientType,
    source: leads.source,
    stage: leads.stage,
    qualification: leads.qualification,
    score: leads.score,
    lastContactedAt: leads.lastContactedAt,
    createdAt: leads.createdAt,
    updatedAt: leads.updatedAt,
  }).from(leads).limit(limit).offset(offset);
  
  // Buscar proprietários (landlords)
  const landlordsData = await dbInstance.select({
    id: landlords.id,
    name: landlords.name,
    email: landlords.email,
    phone: landlords.phone,
    whatsapp: landlords.whatsapp,
    cpfCnpj: landlords.cpfCnpj,
    status: landlords.status,
    createdAt: landlords.createdAt,
    updatedAt: landlords.updatedAt,
  }).from(landlords).limit(limit).offset(offset);
  
  // Normalizar dados
  const normalizedLeads = leadsData.map(l => ({
    id: l.id,
    entityType: 'lead' as const,
    name: l.name,
    email: l.email,
    phone: l.phone || l.whatsapp,
    clientType: l.clientType === 'comprador' ? 'Comprador' : l.clientType === 'locatario' ? 'Locatário' : 'Lead',
    source: l.source || 'site',
    status: l.stage || 'novo',
    qualification: l.qualification,
    score: l.score,
    lastInteraction: l.lastContactedAt,
    createdAt: l.createdAt,
  }));
  
  const normalizedLandlords = landlordsData.map(l => ({
    id: l.id,
    entityType: 'landlord' as const,
    name: l.name,
    email: l.email,
    phone: l.phone || l.whatsapp,
    clientType: 'Proprietário',
    source: 'cadastro',
    status: l.status || 'ativo',
    qualification: null,
    score: null,
    lastInteraction: l.updatedAt,
    createdAt: l.createdAt,
  }));
  
  // Combinar e ordenar por data de criação
  const allClients = [...normalizedLeads, ...normalizedLandlords]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Aplicar filtros
  let filtered = allClients;
  
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      (c.email && c.email.toLowerCase().includes(searchLower)) ||
      (c.phone && c.phone.includes(params.search!))
    );
  }
  
  if (params.type && params.type !== 'all') {
    filtered = filtered.filter(c => c.clientType.toLowerCase() === params.type!.toLowerCase());
  }
  
  if (params.source && params.source !== 'all') {
    filtered = filtered.filter(c => c.source === params.source);
  }
  
  return {
    items: filtered,
    total: filtered.length,
  };
}

export async function getClientProfile(entityType: 'lead' | 'landlord' | 'tenant', id: number) {
  const dbInstance = await getDb();
  if (!dbInstance) return null;
  
  if (entityType === 'lead') {
    const result = await dbInstance.select().from(leads).where(eq(leads.id, id)).limit(1);
    return result[0] || null;
  } else if (entityType === 'landlord') {
    const result = await dbInstance.select().from(landlords).where(eq(landlords.id, id)).limit(1);
    return result[0] || null;
  } else if (entityType === 'tenant') {
    const result = await dbInstance.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0] || null;
  }
  
  return null;
}

export async function getClientFinancials(entityType: 'lead' | 'landlord' | 'tenant', id: number) {
  const dbInstance = await getDb();
  if (!dbInstance) return { payments: [], expenses: [], transfers: [], summary: {} };
  
  if (entityType === 'landlord') {
    // Buscar pagamentos de aluguel relacionados
    const payments = await dbInstance.select().from(rentalPayments).where(eq(rentalPayments.landlordId, id));
    
    // Buscar despesas
    const expenses = await dbInstance.select().from(propertyExpenses).where(eq(propertyExpenses.landlordId, id));
    
    // Buscar repasses
    const transfers = await dbInstance.select().from(landlordTransfers).where(eq(landlordTransfers.landlordId, id));
    
    // Calcular resumo
    const totalReceived = payments.reduce((sum, p) => sum + (p.landlordAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalTransferred = transfers.filter(t => t.status === 'concluido').reduce((sum, t) => sum + (t.netAmount || 0), 0);
    
    return {
      payments,
      expenses,
      transfers,
      summary: {
        totalReceived,
        totalExpenses,
        totalTransferred,
        pendingTransfer: totalReceived - totalExpenses - totalTransferred,
      }
    };
  } else if (entityType === 'tenant') {
    const payments = await dbInstance.select().from(rentalPayments).where(eq(rentalPayments.tenantId, id));
    
    const totalPaid = payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalPending = payments.filter(p => p.status === 'pendente').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalOverdue = payments.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    
    return {
      payments,
      expenses: [],
      transfers: [],
      summary: {
        totalPaid,
        totalPending,
        totalOverdue,
      }
    };
  }
  
  return { payments: [], expenses: [], transfers: [], summary: {} };
}

export async function getClientProperties(entityType: 'lead' | 'landlord' | 'tenant', id: number) {
  const dbInstance = await getDb();
  if (!dbInstance) return [];
  
  if (entityType === 'landlord') {
    // Buscar contratos do proprietário e seus imóveis
    const contractsData = await dbInstance.select().from(rentalContracts).where(eq(rentalContracts.landlordId, id));
    const propertyIds = contractsData.map(c => c.propertyId);
    
    if (propertyIds.length === 0) return [];
    
    const propertiesData = await dbInstance.select().from(properties).where(inArray(properties.id, propertyIds));
    return propertiesData;
  } else if (entityType === 'tenant') {
    const contractsData = await dbInstance.select().from(rentalContracts).where(eq(rentalContracts.tenantId, id));
    const propertyIds = contractsData.map(c => c.propertyId);
    
    if (propertyIds.length === 0) return [];
    
    const propertiesData = await dbInstance.select().from(properties).where(inArray(properties.id, propertyIds));
    return propertiesData;
  } else if (entityType === 'lead') {
    // Buscar imóvel de interesse do lead
    const leadData = await dbInstance.select().from(leads).where(eq(leads.id, id)).limit(1);
    if (leadData[0]?.interestedPropertyId) {
      const propertiesData = await dbInstance.select().from(properties).where(eq(properties.id, leadData[0].interestedPropertyId));
      return propertiesData;
    }
  }
  
  return [];
}

export async function getClientInteractions(entityType: 'lead' | 'landlord' | 'tenant', id: number) {
  const dbInstance = await getDb();
  if (!dbInstance) return [];
  
  if (entityType === 'lead') {
    const interactionsData = await dbInstance.select().from(interactions).where(eq(interactions.leadId, id)).orderBy(desc(interactions.createdAt));
    return interactionsData;
  }
  
  // Para landlords e tenants, não há tabela de interações direta
  return [];
}
