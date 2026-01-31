// ============================================
// SISTEMA DE DISTRIBUIÇÃO DE LEADS
// ============================================
import { getDb } from "./db";
import { leads, users } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Estratégias de distribuição de leads
 */
export type DistributionStrategy = "round_robin" | "least_loaded" | "manual" | "random";

/**
 * Buscar todos os corretores ativos
 */
export async function getActiveAgents() {
  const database = await getDb();
  if (!database) return [];

  return await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "agent" as any),
        // Adicionar filtro de ativo quando o campo existir
      )
    );
}

/**
 * Contar leads atribuídos a cada corretor
 */
export async function getAgentLeadCounts() {
  const database = await getDb();
  if (!database) return [];

  const result = await database
    .select({
      agent_id: leads.assigned_to,
      count: sql<number>`count(*)`,
    })
    .from(leads)
    .where(sql`${leads.assigned_to} IS NOT NULL`)
    .groupBy(leads.assigned_to);

  return result.map(r => ({
    agentId: r.agent_id,
    leadCount: Number(r.count),
  }));
}

/**
 * Distribuição Round-Robin: próximo corretor na fila
 */
export async function distributeRoundRobin(): Promise<number | null> {
  const agents = await getActiveAgents();
  if (agents.length === 0) return null;

  const leadCounts = await getAgentLeadCounts();
  
  // Criar mapa de contagem
  const countMap = new Map(leadCounts.map(lc => [lc.agentId, lc.leadCount]));
  
  // Encontrar corretor com menos leads
  let minCount = Infinity;
  let selectedAgent: number | null = null;
  
  for (const agent of agents) {
    const count = countMap.get(agent.id) || 0;
    if (count < minCount) {
      minCount = count;
      selectedAgent = agent.id;
    }
  }
  
  return selectedAgent;
}

/**
 * Distribuição Least Loaded: corretor com menos leads ativos
 */
export async function distributeLeastLoaded(): Promise<number | null> {
  const database = await getDb();
  if (!database) return null;

  const agents = await getActiveAgents();
  if (agents.length === 0) return null;

  // Contar apenas leads ativos (não fechados)
  const result = await database
    .select({
      agent_id: leads.assigned_to,
      count: sql<number>`count(*)`,
    })
    .from(leads)
    .where(
      and(
        sql`${leads.assigned_to} IS NOT NULL`,
        sql`${leads.status} NOT IN ('fechado_ganho', 'fechado_perdido', 'sem_interesse')`
      )
    )
    .groupBy(leads.assigned_to);

  const countMap = new Map(result.map(r => [r.agent_id, Number(r.count)]));
  
  // Encontrar corretor com menos leads ativos
  let minCount = Infinity;
  let selectedAgent: number | null = null;
  
  for (const agent of agents) {
    const count = countMap.get(agent.id) || 0;
    if (count < minCount) {
      minCount = count;
      selectedAgent = agent.id;
    }
  }
  
  return selectedAgent;
}

/**
 * Distribuição Aleatória
 */
export async function distributeRandom(): Promise<number | null> {
  const agents = await getActiveAgents();
  if (agents.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * agents.length);
  return agents[randomIndex].id;
}

/**
 * Atribuir lead a um corretor específico
 */
export async function assignLeadToAgent(leadId: number, agentId: number, assignedBy?: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  await database
    .update(leads)
    .set({
      assigned_to: agentId,
      updated_at: new Date(),
    })
    .where(eq(leads.id, leadId));

  // TODO: Registrar na tabela lead_assignments quando ela existir
  console.log(`[Lead Distribution] Lead ${leadId} assigned to agent ${agentId}`);
  
  return true;
}

/**
 * Distribuir lead automaticamente baseado na estratégia configurada
 */
export async function autoAssignLead(leadId: number, strategy: DistributionStrategy = "round_robin"): Promise<number | null> {
  let agentId: number | null = null;

  switch (strategy) {
    case "round_robin":
      agentId = await distributeRoundRobin();
      break;
    case "least_loaded":
      agentId = await distributeLeastLoaded();
      break;
    case "random":
      agentId = await distributeRandom();
      break;
    case "manual":
      // Não faz nada, aguarda atribuição manual
      return null;
    default:
      agentId = await distributeRoundRobin();
  }

  if (agentId) {
    await assignLeadToAgent(leadId, agentId);
  }

  return agentId;
}

/**
 * Reatribuir lead para outro corretor
 */
export async function reassignLead(leadId: number, newAgentId: number, reassignedBy: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  await database
    .update(leads)
    .set({
      assigned_to: newAgentId,
      updated_at: new Date(),
    })
    .where(eq(leads.id, leadId));

  console.log(`[Lead Distribution] Lead ${leadId} reassigned to agent ${newAgentId} by user ${reassignedBy}`);
  
  return true;
}

/**
 * Obter estatísticas de distribuição
 */
export async function getDistributionStats() {
  const database = await getDb();
  if (!database) return [];

  const agents = await getActiveAgents();
  const leadCounts = await getAgentLeadCounts();
  
  const countMap = new Map(leadCounts.map(lc => [lc.agentId, lc.leadCount]));
  
  return agents.map(agent => ({
    agentId: agent.id,
    agentName: agent.name,
    agentEmail: agent.email,
    totalLeads: countMap.get(agent.id) || 0,
  }));
}

/**
 * Obter leads de um corretor específico
 */
export async function getAgentLeads(agentId: number, filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const database = await getDb();
  if (!database) return [];

  let query = database
    .select()
    .from(leads)
    .where(eq(leads.assigned_to, agentId));

  if (filters?.status) {
    query = query.where(and(
      eq(leads.assigned_to, agentId),
      eq(leads.status, filters.status as any)
    ));
  }

  query = query.orderBy(desc(leads.created_at));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return await query;
}
