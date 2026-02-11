// ============================================
// DATABASE CONNECTION & CORE FUNCTIONS
import { ENV } from "./_core/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, asc, and, or, like, gte, lte, sql } from "drizzle-orm";

// ============================================
import {
  users,
  properties,
  leads,
  financingSimulations,
  rentalPayments,
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

  createUser: async (userData: InsertUser): Promise<any> => {
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
      const updateData: any = {
        last_sign_in_at: now,
        updated_at: now,
      };
      
      await database
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('[DB] Error updating last_sign_in_at:', error);
      // Não lançar erro para não derrubar o login
    }
  },

  listUsers: async (): Promise<User[]> => {
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

export async function upsertUser(user: InsertUser): Promise<void> {
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

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return null;

  const result = await database
    .select()
    .from(users)
    .where(eq(users.open_id, openId))
    .limit(1);

  return result[0] || null;
}

// ============================================
// PROPERTIES - Funções de Imóveis
// ============================================

export async function createProperty(property: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .insert(properties)
    .values(property)
    .returning();

  return result[0];
}

export async function updateProperty(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .update(properties)
    .set({ ...data, updated_at: new Date() })
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
    conditions.push(gte(properties.sale_price, params.minPrice));
  }
  if (params.maxPrice) {
    conditions.push(lte(properties.sale_price, params.maxPrice));
  }
  if (params.minArea) {
    conditions.push(gte(properties.area, params.minArea));
  }
  if (params.maxArea) {
    conditions.push(lte(properties.area, params.maxArea));
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

      // Retornar URLs das imagens como array de strings
      const imageUrls = images.map(img => img.url);

      // Fallback: se não houver imagens em property_images, usar properties.images (legado)
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

export async function createLead(lead: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .insert(leads)
    .values(lead)
    .returning();

  return result[0];
}

export async function updateLead(id: number, data: any): Promise<any> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const result = await database
    .update(leads)
    .set({ ...data, updated_at: new Date() })
    .where(eq(leads.id, id))
    .returning();

  return result[0];
}

export async function listLeads(params: { 
  limit?: number; 
  offset?: number; 
  stage?: string; 
  source?: string;
  assignedTo?: number;
  search?: string;
}) {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };

  const conditions = [];

  if (params.stage) {
    conditions.push(eq(leads.stage, params.stage as any));
  }
  if (params.source) {
    conditions.push(eq(leads.source, params.source as any));
  }
  if (params.assignedTo) {
    conditions.push(eq(leads.assigned_to, params.assignedTo));
  }
  if (params.search) {
    conditions.push(
      or(
        like(leads.name, `%${params.search}%`),
        like(leads.email, `%${params.search}%`),
        like(leads.phone, `%${params.search}%`)
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
    .where(eq(n8nMensagens.conversaId, conversaId))
    .orderBy(n8nMensagens.timestamp);
}


// ============================================
// LEAD FUNCTIONS (MISSING)
// ============================================

export async function getLeadsByStage(stage: string) {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(leads)
    .where(eq(leads.stage, stage as any))
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
// INTERACTION FUNCTIONS (MISSING)
// ============================================

// Nota: A tabela 'interactions' não está no schema atual do Drizzle
// Estas funções retornam arrays vazios até a tabela ser adicionada

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
// BLOG FUNCTIONS (MISSING)
// ============================================

export async function getAllLeads(params?: any) {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select()
    .from(leads)
    .orderBy(desc(leads.created_at));
}

export async function listBlogPosts(params?: any) {
  // TODO: Adicionar tabela 'blog_posts' ao schema
  console.warn("[Database] blog_posts table not implemented yet");
  return [];
}

export async function getBlogPostById(id: number) {
  // TODO: Adicionar tabela 'blog_posts' ao schema
  console.warn("[Database] blog_posts table not implemented yet");
  return null;
}

export async function getBlogPostBySlug(slug: string) {
  // TODO: Adicionar tabela 'blog_posts' ao schema
  console.warn("[Database] blog_posts table not implemented yet");
  return null;
}

export async function createBlogPost(data: any) {
  // TODO: Adicionar tabela 'blog_posts' ao schema
  console.warn("[Database] blog_posts table not implemented yet");
  return null;
}


// --- STUBS PARA CORREÇÃO DE BUILD (FASE 2) ---
// Adicione isto ao final do arquivo server/db.ts

export async function getUnifiedClients() {
  // Retorna lista vazia para não quebrar a UI de Admin
  return [];
}

export async function getClientProfile(id: number) {
  // Retorna null ou objeto vazio
  return null;
}

export async function getClientFinancials(id: number) {
  return { total_spent: 0, active_contracts: 0 };
}

export async function getClientInteractions(id: number) {
  return [];
}

// Helper para compatibilidade de imagem no frontend
export function getCoverImage(property: any): string {
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    return typeof property.images[0] === 'string' ? property.images[0] : property.images[0].url;
  }
  return '/imoveis/padrao.jpg'; // Placeholder
}
