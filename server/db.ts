// ============================================
// DATABASE CONNECTION & CORE FUNCTIONS
import { ENV } from "./_core/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, asc, and, or, like, gte, lte, sql } from "drizzle-orm";
import { mapPropertyInputToDb, mapLeadInputToDb } from "./_core/mappers";

// ============================================
import {
  users,
  properties,
  leads,
  financingSimulations,
  rentalPayments,
  n8nConversas,
  n8nMensagens,
} from "../drizzle/schema";

let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function ensureClient() {
  if (_client) return _client;

  const url = process.env.DATABASE_URL || ENV.databaseUrl;
  if (!url) {
    throw new Error("DATABASE_URL não definido (variável de ambiente).");
  }

  // Adicionar parâmetro pgbouncer=true se usando Supabase Transaction Pooler (porta 6543)
  const connectionUrl = url.includes('6543') && !url.includes('pgbouncer=true')
    ? `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true`
    : url;

  _client = postgres(connectionUrl, {
    prepare: false,
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
  });

  return _client;
}

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

// ============================================
// USERS - Funções de Usuário
// ============================================

export const db = {
  getUserByEmail: async (email: string): Promise<any> => {
    const database = await getDb();
    if (!database) return null;

    const result = await database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  },

  createUser: async (userData: any): Promise<any> => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const result = await database
      .insert(users)
      .values(userData)
      .returning();

    return result[0];
  },

  updateUserLastSignIn: async (userId: number): Promise<void> => {
    try {
      const database = await getDb();
      if (!database) {
        console.warn('[DB] Database not available, skipping last_sign_in_at update');
        return;
      }

      const now = new Date();
      await database
        .update(users)
        .set({ last_sign_in_at: now, updated_at: now })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('[DB] Error updating last_sign_in_at:', error);
      // Não lançar erro para não derrubar o login
    }
  },

  listUsers: async (): Promise<any[]> => {
    const database = await getDb();
    if (!database) return [];

    const result = await database
      .select()
      .from(users)
      .orderBy(desc(users.created_at));

    return result;
  },

  getUserById: async (id: number): Promise<any> => {
    const database = await getDb();
    if (!database) return null;

    const result = await database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] || null;
  },
};

export async function upsertUser(user: any): Promise<void> {
  const database = await getDb();
  if (!database) return;

  const existing = await database
    .select()
    .from(users)
    .where(eq(users.email, user.email))
    .limit(1);

  if (existing.length > 0) {
    await database
      .update(users)
      .set({
        name: user.name,
        avatar_url: user.avatar_url,
        last_sign_in_at: new Date(),
      })
      .where(eq(users.id, existing[0].id));
  } else {
    await database.insert(users).values(user);
  }
}

// ============================================
// PROPERTIES - Funções de Imóveis
// ============================================

/**
 * Cria um imóvel mapeando o payload camelCase para snake_case antes do insert.
 * @param property - Payload camelCase vindo do router
 * @param userId   - ID do usuário autenticado (created_by)
 */
export async function createProperty(property: any, userId?: number): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped = mapPropertyInputToDb(property, userId ?? property.createdBy);

  const result = await database
    .insert(properties)
    .values(mapped as any)
    .returning();

  return result[0];
}

/**
 * Atualiza um imóvel mapeando o payload camelCase para snake_case antes do update.
 */
export async function updateProperty(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped = mapPropertyInputToDb(data);
  mapped.updated_at = new Date();

  const result = await database
    .update(properties)
    .set(mapped)
    .where(eq(properties.id, id))
    .returning();

  return result[0];
}

export async function deleteProperty(id: number): Promise<void> {
  const database = await getDb();
  if (!database) return;

  await database.delete(properties).where(eq(properties.id, id));
}

export async function getPropertyById(id: number): Promise<any> {
  const database = await getDb();
  if (!database) return null;

  const result = await database
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  return result[0] || null;
}

export async function listProperties(params: {
  status?: string;
  transactionType?: string;
  propertyType?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions = [];

  if (params.status) {
    conditions.push(eq(properties.status, params.status as any));
  }
  if (params.transactionType) {
    conditions.push(eq(properties.transaction_type, params.transactionType as any));
  }
  if (params.propertyType) {
    conditions.push(eq(properties.property_type, params.propertyType as any));
  }
  if (params.neighborhood) {
    conditions.push(eq(properties.neighborhood, params.neighborhood));
  }
  if (params.minPrice) {
    conditions.push(gte(properties.sale_price, String(params.minPrice)));
  }
  if (params.maxPrice) {
    conditions.push(lte(properties.sale_price, String(params.maxPrice)));
  }
  if (params.minArea) {
    conditions.push(gte(properties.total_area, String(params.minArea)));
  }
  if (params.maxArea) {
    conditions.push(lte(properties.total_area, String(params.maxArea)));
  }
  if (params.bedrooms) {
    conditions.push(eq(properties.bedrooms, params.bedrooms));
  }
  if (params.bathrooms) {
    conditions.push(eq(properties.bathrooms, params.bathrooms));
  }
  if (params.search) {
    conditions.push(
      or(
        like(properties.title, `%${params.search}%`),
        like(properties.description, `%${params.search}%`),
        like(properties.neighborhood, `%${params.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await database
    .select()
    .from(properties)
    .where(whereClause)
    .orderBy(desc(properties.created_at))
    .limit(params.limit || 50)
    .offset(params.offset || 0);

  // Buscar imagens de property_images para cada imóvel
  const { propertyImages } = await import("../drizzle/schema");
  const itemsWithImages = await Promise.all(
    items.map(async (property) => {
      const images = await database
        .select()
        .from(propertyImages)
        .where(eq(propertyImages.property_id, property.id))
        .orderBy(desc(propertyImages.is_main), asc(propertyImages.display_order));

      const imageUrls = images.map(img => img.url);
      const finalImages = imageUrls.length > 0 ? imageUrls : (property.images as any) || [];

      return {
        ...property,
        images: finalImages,
      };
    })
  );

  const totalResult = await database
    .select({ count: sql<number>`count(*)` })
    .from(properties)
    .where(whereClause);

  return {
    items: itemsWithImages,
    total: Number(totalResult[0]?.count || 0),
  };
}

// ============================================
// LEADS - Funções de Leads
// ============================================

/**
 * Cria um lead mapeando o payload camelCase para snake_case antes do insert.
 * O campo `telefone` é NOT NULL e UNIQUE — o mapper valida isso.
 */
export async function createLead(lead: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped = mapLeadInputToDb(lead);

  const result = await database
    .insert(leads)
    .values(mapped as any)
    .returning();

  return result[0];
}

/**
 * Atualiza um lead mapeando o payload camelCase para snake_case antes do update.
 */
export async function updateLead(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped = mapLeadInputToDb(data);
  mapped.ultima_interacao = new Date();

  const result = await database
    .update(leads)
    .set(mapped)
    .where(eq(leads.id, id))
    .returning();

  return result[0];
}

export async function listLeads(params: {
  limit?: number;
  offset?: number;
  status?: string;   // campo real no DB
  origem?: string;   // campo real no DB
  assignedTo?: number;
  search?: string;
}) {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions = [];

  // Usar status (não stage) e origem (não source) — campos reais do schema
  if (params.status) {
    conditions.push(eq(leads.status, params.status as any));
  }
  if (params.origem) {
    conditions.push(eq(leads.origem, params.origem as any));
  }
  if (params.assignedTo) {
    conditions.push(eq(leads.assigned_to, params.assignedTo));
  }
  if (params.search) {
    conditions.push(
      or(
        like(leads.name, `%${params.search}%`),
        like(leads.email, `%${params.search}%`),
        like(leads.telefone, `%${params.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await database
    .select()
    .from(leads)
    .where(whereClause)
    .orderBy(desc(leads.created_at))
    .limit(params.limit || 50)
    .offset(params.offset || 0);

  const totalResult = await database
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(whereClause);

  return {
    items,
    total: Number(totalResult[0]?.count || 0),
  };
}

export async function getLeadById(id: number): Promise<any> {
  const database = await getDb();
  if (!database) return null;

  const result = await database
    .select()
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getAllLeads(params?: any) {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(leads)
    .orderBy(desc(leads.created_at));
}

/**
 * Busca leads por status (campo real no DB, equivale ao antigo "stage").
 */
export async function getLeadsByStage(stage: string) {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(leads)
    .where(eq(leads.status, stage as any))
    .orderBy(desc(leads.created_at));
}

export async function deleteLead(id: number): Promise<void> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  await database
    .delete(leads)
    .where(eq(leads.id, id));
}

// ============================================
// FINANCING SIMULATIONS
// ============================================

export async function createFinancingSimulation(simulation: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .insert(financingSimulations)
    .values(simulation)
    .returning();

  return result[0];
}

export async function listFinancingSimulations(leadId: number): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(financingSimulations)
    .where(eq(financingSimulations.lead_id, leadId))
    .orderBy(desc(financingSimulations.created_at));
}

// ============================================
// RENTAL PAYMENTS
// ============================================

export async function createRentalPayment(payment: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .insert(rentalPayments)
    .values(payment)
    .returning();

  return result[0];
}

export async function updateRentalPayment(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .update(rentalPayments)
    .set({ ...data, updated_at: new Date() })
    .where(eq(rentalPayments.id, id))
    .returning();

  return result[0];
}

export async function listRentalPayments(params: {
  propertyId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions = [];
  if (params.status) {
    conditions.push(eq(rentalPayments.status, params.status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await database
    .select()
    .from(rentalPayments)
    .where(whereClause)
    .orderBy(desc(rentalPayments.due_date))
    .limit(params.limit || 50)
    .offset(params.offset || 0);

  const totalResult = await database
    .select({ count: sql<number>`count(*)` })
    .from(rentalPayments)
    .where(whereClause);

  return {
    items,
    total: Number(totalResult[0]?.count || 0),
  };
}

// ============================================
// N8N INTEGRATION
// ============================================

export async function getConversaByTelefone(telefone: string) {
  const database = await getDb();
  if (!database) return null;

  const result = await database
    .select()
    .from(n8nConversas)
    .where(eq(n8nConversas.telefone, telefone))
    .limit(1);

  return result[0] || null;
}

export async function createConversa(data: any) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .insert(n8nConversas)
    .values(data)
    .returning();

  return result[0];
}

export async function createMensagem(data: any) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .insert(n8nMensagens)
    .values(data)
    .returning();

  return result[0];
}

export async function listMensagens(conversaId: number) {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(n8nMensagens)
    .where(eq(n8nMensagens.conversa_id, conversaId))
    .orderBy(n8nMensagens.timestamp);
}

// ============================================
// INTERACTION FUNCTIONS (STUB)
// ============================================

export async function getInteractionsByLeadId(leadId: number) {
  // TODO: Adicionar tabela 'interactions' ao schema
  console.warn("[Database] interactions table not implemented yet");
  return [];
}

export async function createInteraction(data: any) {
  // TODO: Adicionar tabela 'interactions' ao schema
  console.warn("[Database] interactions table not implemented yet");
  return null;
}

// ============================================
// BLOG FUNCTIONS (STUB)
// ============================================

export async function listBlogPosts(params?: any) {
  // TODO: Adicionar tabela 'blog_posts' ao schema
  console.warn("[Database] blog_posts table not implemented yet");
  return { items: [], total: 0 };
}

export async function getBlogPostById(id: number) {
  console.warn("[Database] blog_posts table not implemented yet");
  return null;
}

export async function getBlogPostBySlug(slug: string) {
  console.warn("[Database] blog_posts table not implemented yet");
  return null;
}

export async function createBlogPost(data: any) {
  console.warn("[Database] blog_posts table not implemented yet");
  return null;
}

export async function updateBlogPost(id: number, data: any) {
  console.warn("[Database] blog_posts table not implemented yet");
  return null;
}

export async function deleteBlogPost(id: number) {
  console.warn("[Database] blog_posts table not implemented yet");
}

export async function getAllBlogCategories() {
  console.warn("[Database] blog_categories table not implemented yet");
  return [];
}

export async function createBlogCategory(data: any) {
  console.warn("[Database] blog_categories table not implemented yet");
  return null;
}

// ============================================
// SITE SETTINGS (STUB)
// ============================================

export async function getSiteSettings() {
  console.warn("[Database] site_settings table not implemented yet");
  return {};
}

export async function updateSiteSettings(data: any) {
  console.warn("[Database] site_settings table not implemented yet");
}

// ============================================
// CLIENT PROFILE STUBS
// ============================================

export async function getUnifiedClients() {
  return [];
}

export async function getClientProfile(id: number) {
  return null;
}

export async function getClientFinancials(id: number) {
  return { total_spent: 0, active_contracts: 0 };
}

export async function getClientInteractions(id: number) {
  return [];
}

// ============================================
// HELPER PARA IMAGEM DE CAPA
// ============================================

export function getCoverImage(property: any): string {
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    return typeof property.images[0] === 'string' ? property.images[0] : property.images[0].url;
  }
  return '/imoveis/padrao.jpg';
}

// ============================================
// WEBHOOK LOG (STUB)
// ============================================

export async function createWebhookLog(data: any) {
  // TODO: Adicionar tabela 'webhook_logs' ao schema se necessário
  console.log("[WebhookLog]", JSON.stringify(data));
  return null;
}

// ============================================
// OWNERS (PROPRIETÁRIOS) STUBS
// ============================================

export async function getAllOwners(): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  // Usa a tabela landlords como stub de owners
  const { landlords } = await import("../drizzle/schema");
  return await database.select().from(landlords).orderBy(desc(landlords.created_at));
}

export async function getOwnerById(id: number): Promise<any> {
  const database = await getDb();
  if (!database) return null;
  const { landlords } = await import("../drizzle/schema");
  const result = await database.select().from(landlords).where(eq(landlords.id, id)).limit(1);
  return result[0] || null;
}

export async function searchOwners(query: string): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  const { landlords } = await import("../drizzle/schema");
  return await database
    .select()
    .from(landlords)
    .where(or(like(landlords.name, `%${query}%`), like(landlords.email, `%${query}%`)))
    .limit(20);
}

export async function createOwner(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { landlords } = await import("../drizzle/schema");
  const mapped: any = {
    name: data.name,
    cpf_cnpj: data.cpfCnpj ?? data.cpf_cnpj,
    email: data.email,
    phone: data.phone ?? data.whatsapp,
    status: data.active === false ? "inactive" : "active",
  };
  const result = await database.insert(landlords).values(mapped).returning();
  return result[0];
}

export async function updateOwner(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const { landlords } = await import("../drizzle/schema");
  const mapped: any = {};
  if (data.name !== undefined)    mapped.name = data.name;
  if (data.email !== undefined)   mapped.email = data.email;
  if (data.phone !== undefined)   mapped.phone = data.phone;
  if (data.cpfCnpj !== undefined) mapped.cpf_cnpj = data.cpfCnpj;
  if (data.active !== undefined)  mapped.status = data.active ? "active" : "inactive";
  const result = await database.update(landlords).set(mapped).where(eq(landlords.id, id)).returning();
  return result[0];
}

export async function deleteOwner(id: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  const { landlords } = await import("../drizzle/schema");
  await database.delete(landlords).where(eq(landlords.id, id));
}

// ============================================
// AI / CONTEXT STUBS
// ============================================

export async function saveAiContext(data: any) {
  console.warn("[Database] ai_context table not implemented yet");
  return null;
}

export async function getAiHistoryBySession(sessionId: string) {
  console.warn("[Database] ai_context table not implemented yet");
  return [];
}

export async function getAiHistoryByPhone(phone: string) {
  console.warn("[Database] ai_context table not implemented yet");
  return [];
}

export async function createMessageBuffer(data: any) {
  console.warn("[Database] message_buffer table not implemented yet");
  return null;
}

export async function upsertLeadFromWhatsApp(data: any) {
  // Tenta encontrar pelo telefone e criar/atualizar
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const phone = data.phone ?? data.whatsapp ?? data.telefone;
  if (!phone) throw new Error("telefone obrigatório para upsertLeadFromWhatsApp");
  const existing = await database.select().from(leads).where(eq(leads.telefone, phone)).limit(1);
  if (existing.length > 0) {
    const mapped = mapLeadInputToDb({ ...data, telefone: phone });
    mapped.ultima_interacao = new Date();
    const result = await database.update(leads).set(mapped as any).where(eq(leads.id, existing[0].id)).returning();
    return result[0];
  } else {
    const mapped = mapLeadInputToDb({ ...data, telefone: phone, stage: data.stage ?? "novo" });
    const result = await database.insert(leads).values(mapped as any).returning();
    return result[0];
  }
}

// ============================================
// WEBHOOK LOGS (LISTA)
// ============================================

export async function getWebhookLogs(params?: any) {
  console.warn("[Database] webhook_logs table not implemented yet");
  return { items: [], total: 0 };
}

// ============================================
// CLIENT INTEREST STUB
// ============================================

export async function createClientInterest(data: any) {
  console.warn("[Database] client_interest table not implemented yet");
  return null;
}

export async function getClientProperties(clientId: number) {
  console.warn("[Database] client_properties table not implemented yet");
  return [];
}

// ============================================
// STUBS ADICIONAIS PARA ELIMINAR WARNINGS DE BUILD
// ============================================

export async function getUserByOpenId(openId: string): Promise<any> {
  // OAuth open_id não está no schema atual — stub para não quebrar build
  console.warn("[Database] getUserByOpenId: open_id column not in current schema");
  return null;
}

/** Stub de tabela leadInsights — não existe no schema atual */
export const leadInsights = null;
