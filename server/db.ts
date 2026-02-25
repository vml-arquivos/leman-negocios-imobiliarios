// ============================================
// DATABASE CONNECTION & CORE FUNCTIONS
// Alinhado ao schema real do Supabase (pasted_content_2.txt)
// ============================================
import { ENV } from "./_core/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, asc, and, or, like, gte, lte, sql } from "drizzle-orm";
import { mapPropertyInputToDb, mapLeadInputToDb } from "./_core/mappers";

import {
  users,
  properties,
  propertyImages,
  leads,
  interactions,
  blogPosts,
  blogCategories,
  siteSettings,
  owners,
  n8nConversas,
  n8nMensagens,
  financingSimulations,
  webhooksLog,
  aiContextStatus,
  clientInterests,
  analyticsEvents,
  leadInsights,
} from "../drizzle/schema";

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTION
// ─────────────────────────────────────────────────────────────────────────────

let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function ensureClient() {
  if (_client) return _client;

  const url = process.env.DATABASE_URL || ENV.databaseUrl;
  if (!url) throw new Error("DATABASE_URL não definido (variável de ambiente).");

  // Adicionar pgbouncer=true se usando Supabase Transaction Pooler (porta 6543)
  const connectionUrl =
    url.includes("6543") && !url.includes("pgbouncer=true")
      ? `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`
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

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export const db = {
  getUserByEmail: async (email: string): Promise<any> => {
    const database = await getDb();
    if (!database) return null;
    const result = await database.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },

  createUser: async (userData: any): Promise<any> => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");
    const result = await database.insert(users).values(userData).returning();
    return result[0];
  },

  updateUserLastSignIn: async (userId: number): Promise<void> => {
    try {
      const database = await getDb();
      if (!database) return;
      const now = new Date();
      await database
        .update(users)
        .set({ last_sign_in_at: now, updated_at: now })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("[DB] Error updating last_sign_in_at:", error);
    }
  },

  listUsers: async (): Promise<any[]> => {
    const database = await getDb();
    if (!database) return [];
    return await database.select().from(users).orderBy(desc(users.created_at));
  },

  getUserById: async (id: number): Promise<any> => {
    const database = await getDb();
    if (!database) return null;
    const result = await database.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  },
};

export async function upsertUser(user: any): Promise<void> {
  const database = await getDb();
  if (!database) return;

  const existing = await database.select().from(users).where(eq(users.email, user.email)).limit(1);

  if (existing.length > 0) {
    await database
      .update(users)
      .set({ name: user.name, avatar_url: user.avatar_url, last_sign_in_at: new Date() })
      .where(eq(users.id, existing[0].id));
  } else {
    await database.insert(users).values(user);
  }
}

export async function getUserByOpenId(openId: string): Promise<any> {
  const database = await getDb();
  if (!database) return null;
  const result = await database.select().from(users).where(eq(users.open_id, openId)).limit(1);
  return result[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTIES
// Colunas reais: title, description, reference_code, property_type,
//   transaction_type, address, neighborhood, city, state, zip_code,
//   latitude, longitude, sale_price, rent_price, condo_fee, iptu,
//   bedrooms, bathrooms, suites, parking_spaces, total_area, built_area,
//   features, images, main_image, video_url, tour_virtual_url,
//   status, featured, published, meta_title, meta_description, slug,
//   owner_id, created_by
// ─────────────────────────────────────────────────────────────────────────────

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

  if (!result[0]) return null;

  // Buscar imagens da tabela property_images
  const imgs = await database
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.property_id, id))
    .orderBy(desc(propertyImages.is_main), asc(propertyImages.display_order));

  const imageUrls = imgs.map((img: any) => img.url);
  const finalImages = imageUrls.length > 0 ? imageUrls : (result[0].images as any) || [];

  return { ...result[0], images: finalImages };
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
  published?: boolean;
  featured?: boolean;
}) {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions: any[] = [];

  if (params.status)          conditions.push(eq(properties.status, params.status as any));
  if (params.transactionType) conditions.push(eq(properties.transaction_type, params.transactionType as any));
  if (params.propertyType)    conditions.push(eq(properties.property_type, params.propertyType as any));
  if (params.neighborhood)    conditions.push(eq(properties.neighborhood, params.neighborhood));
  if (params.published !== undefined) conditions.push(eq(properties.published, params.published));
  if (params.featured  !== undefined) conditions.push(eq(properties.featured,  params.featured));
  if (params.bedrooms)        conditions.push(eq(properties.bedrooms, params.bedrooms));
  if (params.bathrooms)       conditions.push(eq(properties.bathrooms, params.bathrooms));

  if (params.minPrice) conditions.push(gte(properties.sale_price, String(params.minPrice)));
  if (params.maxPrice) conditions.push(lte(properties.sale_price, String(params.maxPrice)));
  if (params.minArea)  conditions.push(gte(properties.total_area,  String(params.minArea)));
  if (params.maxArea)  conditions.push(lte(properties.total_area,  String(params.maxArea)));

  if (params.search) {
    conditions.push(
      or(
        like(properties.title,        `%${params.search}%`),
        like(properties.description,  `%${params.search}%`),
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

  // Enriquecer com imagens da tabela property_images
  const itemsWithImages = await Promise.all(
    items.map(async (property: any) => {
      const imgs = await database
        .select()
        .from(propertyImages)
        .where(eq(propertyImages.property_id, property.id))
        .orderBy(desc(propertyImages.is_main), asc(propertyImages.display_order));

      const imageUrls = imgs.map((img: any) => img.url);
      const finalImages = imageUrls.length > 0 ? imageUrls : (property.images as any) || [];

      return { ...property, images: finalImages };
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

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY IMAGES
// ─────────────────────────────────────────────────────────────────────────────

export async function addPropertyImage(data: {
  property_id: number;
  url: string;
  caption?: string;
  display_order?: number;
  is_main?: boolean;
}): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .insert(propertyImages)
    .values(data as any)
    .returning();

  return result[0];
}

export async function deletePropertyImage(imageId: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database.delete(propertyImages).where(eq(propertyImages.id, imageId));
}

export async function listPropertyImages(propertyId: number): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.property_id, propertyId))
    .orderBy(desc(propertyImages.is_main), asc(propertyImages.display_order));
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADS
// Colunas reais: name, email, telefone (NOT NULL UNIQUE), cpf, profile,
//   status, interesse, tipo_imovel, finalidade, orcamento_min, orcamento_max,
//   regioes_interesse (ARRAY), quartos, vagas, observacoes, score, origem,
//   utm_source, utm_medium, utm_campaign, tags (ARRAY), metadata,
//   ultima_interacao, assigned_to
// ─────────────────────────────────────────────────────────────────────────────

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
  status?: string;
  origem?: string;
  assignedTo?: number;
  search?: string;
}) {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions: any[] = [];

  if (params.status)     conditions.push(eq(leads.status, params.status as any));
  if (params.origem)     conditions.push(eq(leads.origem, params.origem as any));
  if (params.assignedTo) conditions.push(eq(leads.assigned_to, params.assignedTo));

  if (params.search) {
    conditions.push(
      or(
        like(leads.name,     `%${params.search}%`),
        like(leads.email,    `%${params.search}%`),
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
  const result = await database.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllLeads(): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  return await database.select().from(leads).orderBy(desc(leads.created_at));
}

export async function getLeadsByStage(stage: string): Promise<any[]> {
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
  await database.delete(leads).where(eq(leads.id, id));
}

export async function upsertLeadFromWhatsApp(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const phone = data.phone ?? data.whatsapp ?? data.telefone;
  if (!phone) throw new Error("telefone obrigatório para upsertLeadFromWhatsApp");

  const existing = await database
    .select()
    .from(leads)
    .where(eq(leads.telefone, phone))
    .limit(1);

  if (existing.length > 0) {
    const mapped = mapLeadInputToDb({ ...data, telefone: phone });
    mapped.ultima_interacao = new Date();
    const result = await database
      .update(leads)
      .set(mapped as any)
      .where(eq(leads.id, existing[0].id))
      .returning();
    return result[0];
  } else {
    const mapped = mapLeadInputToDb({ ...data, telefone: phone, stage: data.stage ?? "novo" });
    const result = await database.insert(leads).values(mapped as any).returning();
    return result[0];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getInteractionsByLeadId(leadId: number): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(interactions)
    .where(eq(interactions.lead_id, leadId))
    .orderBy(desc(interactions.created_at));
}

export async function createInteraction(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped: any = {
    lead_id:           data.leadId ?? data.lead_id,
    user_id:           data.userId ?? data.user_id,
    tipo:              data.tipo ?? data.type ?? "nota",
    canal:             data.canal ?? data.channel ?? "whatsapp",
    assunto:           data.assunto ?? data.subject,
    descricao:         data.descricao ?? data.description,
    resultado:         data.resultado ?? data.result,
    proxima_acao:      data.proxima_acao ?? data.nextAction,
    data_proxima_acao: data.data_proxima_acao ?? data.nextActionDate,
    metadata:          data.metadata ?? {},
  };

  const result = await database.insert(interactions).values(mapped).returning();
  return result[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────────────────────────────────────────

export async function listBlogPosts(params?: {
  published?: boolean;
  categoryId?: number;
  limit?: number;
  offset?: number;
}): Promise<{ items: any[]; total: number }> {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions: any[] = [];
  if (params?.published !== undefined) conditions.push(eq(blogPosts.published, params.published));
  if (params?.categoryId)              conditions.push(eq(blogPosts.category_id, params.categoryId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await database
    .select()
    .from(blogPosts)
    .where(whereClause)
    .orderBy(desc(blogPosts.created_at))
    .limit(params?.limit || 50)
    .offset(params?.offset || 0);

  const totalResult = await database
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(whereClause);

  return { items, total: Number(totalResult[0]?.count || 0) };
}

export async function getBlogPostById(id: number): Promise<any> {
  const database = await getDb();
  if (!database) return null;
  const result = await database.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result[0] || null;
}

export async function getBlogPostBySlug(slug: string): Promise<any> {
  const database = await getDb();
  if (!database) return null;
  const result = await database.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result[0] || null;
}

export async function createBlogPost(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(blogPosts).values(data).returning();
  return result[0];
}

export async function updateBlogPost(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database
    .update(blogPosts)
    .set({ ...data, updated_at: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();
  return result[0];
}

export async function deleteBlogPost(id: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function getAllBlogCategories(): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  return await database.select().from(blogCategories).orderBy(asc(blogCategories.name));
}

export async function createBlogCategory(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(blogCategories).values(data).returning();
  return result[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// SITE SETTINGS (key/value store)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<Record<string, string>> {
  const database = await getDb();
  if (!database) return {};

  const rows = await database.select().from(siteSettings);
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value ?? "";
  }
  return result;
}

export async function updateSiteSettings(data: Record<string, string>): Promise<void> {
  const database = await getDb();
  if (!database) return;

  for (const [key, value] of Object.entries(data)) {
    const existing = await database
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);

    if (existing.length > 0) {
      await database
        .update(siteSettings)
        .set({ value, updated_at: new Date() })
        .where(eq(siteSettings.key, key));
    } else {
      await database.insert(siteSettings).values({ key, value });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNERS (proprietários — tabela real no Supabase)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllOwners(): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  return await database.select().from(owners).orderBy(desc(owners.created_at));
}

export async function getOwnerById(id: number): Promise<any> {
  const database = await getDb();
  if (!database) return null;
  const result = await database.select().from(owners).where(eq(owners.id, id)).limit(1);
  return result[0] || null;
}

export async function searchOwners(query: string): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  return await database
    .select()
    .from(owners)
    .where(or(like(owners.name, `%${query}%`), like(owners.email, `%${query}%`)))
    .limit(20);
}

export async function createOwner(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped: any = {
    name:         data.name,
    cpf_cnpj:     data.cpfCnpj ?? data.cpf_cnpj,
    email:        data.email,
    phone:        data.phone,
    whatsapp:     data.whatsapp,
    address:      data.address,
    city:         data.city,
    state:        data.state,
    zip_code:     data.zipCode ?? data.zip_code,
    bank_name:    data.bankName ?? data.bank_name,
    bank_agency:  data.bankAgency ?? data.bank_agency,
    bank_account: data.bankAccount ?? data.bank_account,
    pix_key:      data.pixKey ?? data.pix_key,
    notes:        data.notes,
    active:       data.active !== false,
  };

  const result = await database.insert(owners).values(mapped).returning();
  return result[0];
}

export async function updateOwner(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped: any = {};
  if (data.name        !== undefined) mapped.name         = data.name;
  if (data.email       !== undefined) mapped.email        = data.email;
  if (data.phone       !== undefined) mapped.phone        = data.phone;
  if (data.whatsapp    !== undefined) mapped.whatsapp     = data.whatsapp;
  if (data.cpfCnpj     !== undefined) mapped.cpf_cnpj     = data.cpfCnpj;
  if (data.cpf_cnpj    !== undefined) mapped.cpf_cnpj     = data.cpf_cnpj;
  if (data.address     !== undefined) mapped.address      = data.address;
  if (data.city        !== undefined) mapped.city         = data.city;
  if (data.state       !== undefined) mapped.state        = data.state;
  if (data.zipCode     !== undefined) mapped.zip_code     = data.zipCode;
  if (data.bankName    !== undefined) mapped.bank_name    = data.bankName;
  if (data.bankAgency  !== undefined) mapped.bank_agency  = data.bankAgency;
  if (data.bankAccount !== undefined) mapped.bank_account = data.bankAccount;
  if (data.pixKey      !== undefined) mapped.pix_key      = data.pixKey;
  if (data.notes       !== undefined) mapped.notes        = data.notes;
  if (data.active      !== undefined) mapped.active       = data.active;
  mapped.updated_at = new Date();

  const result = await database.update(owners).set(mapped).where(eq(owners.id, id)).returning();
  return result[0];
}

export async function deleteOwner(id: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database.delete(owners).where(eq(owners.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCING SIMULATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function createFinancingSimulation(simulation: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(financingSimulations).values(simulation).returning();
  return result[0];
}

export async function listFinancingSimulations(leadId?: number): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  if (leadId) {
    return await database
      .select()
      .from(financingSimulations)
      .where(eq(financingSimulations.lead_id, leadId))
      .orderBy(desc(financingSimulations.created_at));
  }

  return await database
    .select()
    .from(financingSimulations)
    .orderBy(desc(financingSimulations.created_at));
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK LOGS
// ─────────────────────────────────────────────────────────────────────────────

export async function createWebhookLog(data: any): Promise<any> {
  const database = await getDb();
  if (!database) {
    console.log("[WebhookLog]", JSON.stringify(data));
    return null;
  }

  try {
    const result = await database
      .insert(webhooksLog)
      .values({
        source:     data.source ?? "system",
        event_type: data.event_type ?? data.eventType,
        payload:    data.payload ?? data,
        response:   data.response,
        status:     data.status ?? "received",
      })
      .returning();
    return result[0];
  } catch (err) {
    console.error("[WebhookLog] Error saving log:", err);
    return null;
  }
}

export async function getWebhookLogs(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: any[]; total: number }> {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const items = await database
    .select()
    .from(webhooksLog)
    .orderBy(desc(webhooksLog.created_at))
    .limit(params?.limit || 50)
    .offset(params?.offset || 0);

  const totalResult = await database
    .select({ count: sql<number>`count(*)` })
    .from(webhooksLog);

  return { items, total: Number(totalResult[0]?.count || 0) };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

export async function saveAiContext(data: any): Promise<any> {
  const database = await getDb();
  if (!database) return null;

  try {
    const result = await database
      .insert(aiContextStatus)
      .values({
        session_id: data.session_id ?? data.sessionId,
        phone:      data.phone,
        message:    data.message,
        role:       data.role ?? "user",
      })
      .returning();
    return result[0];
  } catch (err) {
    console.error("[AI Context] Error saving:", err);
    return null;
  }
}

export async function getAiHistoryBySession(sessionId: string): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(aiContextStatus)
    .where(eq(aiContextStatus.session_id, sessionId))
    .orderBy(asc(aiContextStatus.created_at));
}

export async function getAiHistoryByPhone(phone: string): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(aiContextStatus)
    .where(eq(aiContextStatus.phone, phone))
    .orderBy(asc(aiContextStatus.created_at));
}

// ─────────────────────────────────────────────────────────────────────────────
// N8N INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

export async function getConversaByTelefone(telefone: string): Promise<any> {
  const database = await getDb();
  if (!database) return null;

  const result = await database
    .select()
    .from(n8nConversas)
    .where(eq(n8nConversas.telefone, telefone))
    .limit(1);

  return result[0] || null;
}

export async function createConversa(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(n8nConversas).values(data).returning();
  return result[0];
}

export async function createMensagem(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(n8nMensagens).values(data).returning();
  return result[0];
}

export async function listMensagens(conversaId: number): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(n8nMensagens)
    .where(eq(n8nMensagens.conversa_id, conversaId))
    .orderBy(n8nMensagens.timestamp);
}

export async function createMessageBuffer(data: any): Promise<any> {
  // Tabela message_buffer existe no Supabase mas não está no schema Drizzle
  // Usar raw SQL para não depender de tabela no schema
  const database = await getDb();
  if (!database) return null;

  try {
    const result = await database.execute(
      sql`INSERT INTO message_buffer (phone, message) VALUES (${data.phone}, ${data.message}) RETURNING *`
    );
    return (result as any)[0] || null;
  } catch (err) {
    console.error("[MessageBuffer] Error:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT INTERESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function createClientInterest(data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const mapped: any = {
    client_id:               data.clientId ?? data.client_id,
    property_type:           data.propertyType ?? data.property_type,
    interest_type:           data.interestType ?? data.interest_type,
    budget_min:              data.budgetMin ?? data.budget_min,
    budget_max:              data.budgetMax ?? data.budget_max,
    preferred_neighborhoods: data.preferredNeighborhoods ?? data.preferred_neighborhoods,
    notes:                   data.notes,
  };

  const result = await database.insert(clientInterests).values(mapped).returning();
  return result[0];
}

export async function getClientProperties(clientId: number): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(clientInterests)
    .where(eq(clientInterests.client_id, clientId));
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT PROFILE (unified view)
// ─────────────────────────────────────────────────────────────────────────────

export async function getUnifiedClients(): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(leads)
    .orderBy(desc(leads.created_at));
}

export async function getClientProfile(id: number): Promise<any> {
  return await getLeadById(id);
}

export async function getClientFinancials(id: number): Promise<any> {
  return { total_spent: 0, active_contracts: 0 };
}

export async function getClientInteractions(id: number): Promise<any[]> {
  return await getInteractionsByLeadId(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export async function trackEvent(data: {
  event_type: string;
  event_data?: any;
  user_id?: number;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<void> {
  const database = await getDb();
  if (!database) return;

  try {
    await database.insert(analyticsEvents).values(data as any);
  } catch (err) {
    console.error("[Analytics] Error tracking event:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAD INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getLeadInsights(leadId: number): Promise<any> {
  const database = await getDb();
  if (!database) return null;

  const result = await database
    .select()
    .from(leadInsights)
    .where(eq(leadInsights.lead_id, leadId))
    .limit(1);

  return result[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getCoverImage(property: any): string {
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    return typeof property.images[0] === "string" ? property.images[0] : property.images[0].url;
  }
  if (property.main_image) return property.main_image;
  return "/imoveis/padrao.jpg";
}

// ─────────────────────────────────────────────────────────────────────────────
// RENTAL PAYMENTS (tabela legada — mantida para compatibilidade de build)
// ─────────────────────────────────────────────────────────────────────────────
import { rentalPayments } from "../drizzle/schema";

export async function createRentalPayment(payment: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(rentalPayments).values(payment).returning();
  return result[0];
}

export async function updateRentalPayment(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database
    .update(rentalPayments)
    .set({ ...data })
    .where(eq(rentalPayments.id, id))
    .returning();
  return result[0];
}

export async function listRentalPayments(params: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: any[]; total: number }> {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions: any[] = [];
  if (params.status) conditions.push(eq(rentalPayments.status, params.status as any));

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

  return { items, total: Number(totalResult[0]?.count || 0) };
}

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP INBOX QUERIES (raw SQL — tabela message_buffer sem Drizzle schema)
// ─────────────────────────────────────────────────────────────────────────────
export async function listWhatsAppConversations(limit = 50): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  try {
    const rows = await database.execute(
      sql`SELECT
            mb.phone,
            MAX(mb.created_at) AS last_at,
            (SELECT message FROM message_buffer WHERE phone = mb.phone ORDER BY created_at DESC LIMIT 1) AS last_message,
            COUNT(*) FILTER (WHERE mb.processed = false OR mb.processed IS NULL) AS pending_count,
            l.id AS lead_id,
            l.name AS lead_name,
            l.score AS lead_score,
            l.status AS lead_status
          FROM message_buffer mb
          LEFT JOIN leads l ON l.telefone = mb.phone
          GROUP BY mb.phone, l.id, l.name, l.score, l.status
          ORDER BY last_at DESC
          LIMIT ${limit}`
    );
    return (rows as any).rows ?? (rows as any[]);
  } catch (err) {
    console.error("[WhatsAppInbox] listConversations error:", err);
    return [];
  }
}

export async function getWhatsAppThread(phone: string, limit = 100): Promise<any[]> {
  const database = await getDb();
  if (!database) return [];
  try {
    const rows = await database.execute(
      sql`SELECT id, phone, message, processed, created_at
          FROM message_buffer
          WHERE phone = ${phone}
          ORDER BY created_at ASC
          LIMIT ${limit}`
    );
    return (rows as any).rows ?? (rows as any[]);
  } catch (err) {
    console.error("[WhatsAppInbox] getThread error:", err);
    return [];
  }
}

export async function markMessageProcessed(messageId: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  try {
    await database.execute(
      sql`UPDATE message_buffer SET processed = true WHERE id = ${messageId}`
    );
  } catch (err) {
    console.error("[WhatsAppInbox] markProcessed error:", err);
  }
}
