/**
 * N8N INTEGRATION HELPER
 * 
 * Funções auxiliares para integração com N8N e gerenciamento de chat history
 * Usa as tabelas nativas do Supabase: n8n_conversas, n8n_mensagens, n8n_fila_mensagens
 */

import { getDb } from "./db";
import { 
  n8nConversas, 
  n8nMensagens,
  n8nFilaMensagens,
  n8nAutomacoesLog,
  n8nLigacoes,
  leads 
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ============================================
// TIPOS
// ============================================

export interface N8nConversa {
  id: number;
  telefone: string;
  leadId: number | null;
  nome: string | null;
  email: string | null;
  status: string;
  origem: string;
  tags: string[] | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  ultimaInteracao: Date;
}

export interface N8nMensagem {
  id: number;
  conversaId: number | null;
  telefone: string;
  mensagem: string;
  tipo: string;
  direcao: string;
  metadata: any;
  timestamp: Date;
}

export interface N8nFilaMensagem {
  id: number;
  telefone: string;
  idMensagem: string;
  mensagem: string;
  processada: boolean;
  timestamp: Date;
}

// ============================================
// FUNÇÕES DE CHAT HISTORY
// ============================================

/**
 * Buscar ou criar conversa por telefone
 * Usado pelo webhook para garantir que existe uma conversa
 */
export async function getOrCreateConversa(data: {
  telefone: string;
  nome?: string;
  email?: string;
  leadId?: number;
}): Promise<N8nConversa> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar conversa existente
  const existing = await db
    .select()
    .from(n8nConversas)
    .where(eq(n8nConversas.telefone, data.telefone))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar última interação
    const [updated] = await db
      .update(n8nConversas)
      .set({ 
        ultimaInteracao: new Date(),
        ...(data.nome && { nome: data.nome }),
        ...(data.email && { email: data.email }),
        ...(data.leadId && { leadId: data.leadId }),
      })
      .where(eq(n8nConversas.id, existing[0].id))
      .returning();
    
    return updated as N8nConversa;
  }

  // Criar nova conversa
  const [conversa] = await db
    .insert(n8nConversas)
    .values({
      telefone: data.telefone,
      nome: data.nome || null,
      email: data.email || null,
      leadId: data.leadId || null,
      status: "ativo",
      origem: "whatsapp",
    })
    .returning();

  return conversa as N8nConversa;
}

/**
 * Buscar histórico de mensagens por telefone
 * Usado pelo N8N para contexto de conversas
 */
export async function getChatHistory(telefone: string, limit: number = 50): Promise<N8nMensagem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const messages = await db
    .select()
    .from(n8nMensagens)
    .where(eq(n8nMensagens.telefone, telefone))
    .orderBy(desc(n8nMensagens.timestamp))
    .limit(limit);

  return messages as N8nMensagem[];
}

/**
 * Buscar histórico de mensagens por conversa ID
 */
export async function getChatHistoryByConversaId(conversaId: number, limit: number = 50): Promise<N8nMensagem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const messages = await db
    .select()
    .from(n8nMensagens)
    .where(eq(n8nMensagens.conversaId, conversaId))
    .orderBy(desc(n8nMensagens.timestamp))
    .limit(limit);

  return messages as N8nMensagem[];
}

/**
 * Salvar mensagem no histórico
 * Usado pelo webhook para registrar mensagens recebidas/enviadas
 */
export async function saveMensagem(data: {
  conversaId?: number;
  telefone: string;
  mensagem: string;
  tipo?: 'texto' | 'imagem' | 'audio' | 'video' | 'documento';
  direcao?: 'recebida' | 'enviada';
  metadata?: any;
}): Promise<N8nMensagem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [message] = await db
    .insert(n8nMensagens)
    .values({
      conversaId: data.conversaId || null,
      telefone: data.telefone,
      mensagem: data.mensagem,
      tipo: data.tipo || 'texto',
      direcao: data.direcao || 'recebida',
      metadata: data.metadata || {},
    })
    .returning();

  return message as N8nMensagem;
}

/**
 * Adicionar mensagem à fila de processamento
 * Usado pelo webhook para processar mensagens assincronamente
 */
export async function addToFilaMensagens(data: {
  telefone: string;
  idMensagem: string;
  mensagem: string;
}): Promise<N8nFilaMensagem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [message] = await db
    .insert(n8nFilaMensagens)
    .values({
      telefone: data.telefone,
      idMensagem: data.idMensagem,
      mensagem: data.mensagem,
      processada: false,
    })
    .returning();

  return message as N8nFilaMensagem;
}

/**
 * Marcar mensagem como processada
 * Usado pelo N8N após processar uma mensagem
 */
export async function markMensagemAsProcessed(idMensagem: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(n8nFilaMensagens)
    .set({ processada: true })
    .where(eq(n8nFilaMensagens.idMensagem, idMensagem));
}

/**
 * Buscar mensagens não processadas
 * Usado pelo N8N para pegar mensagens pendentes
 */
export async function getUnprocessedMessages(limit: number = 100): Promise<N8nFilaMensagem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const messages = await db
    .select()
    .from(n8nFilaMensagens)
    .where(eq(n8nFilaMensagens.processada, false))
    .orderBy(n8nFilaMensagens.timestamp)
    .limit(limit);

  return messages as N8nFilaMensagem[];
}

/**
 * Buscar Lead ou Owner por telefone
 * Usado pelo N8N para identificar o cliente
 */
export async function findClientByPhone(telefone: string): Promise<{
  type: 'lead' | 'owner' | null;
  client: any;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedPhone = telefone.replace(/\D/g, "");

  // Buscar em leads
  const leadResults = await db
    .select()
    .from(leads)
    .where(eq(leads.phone, telefone))
    .limit(1);

  if (leadResults.length > 0) {
    return {
      type: 'lead',
      client: leadResults[0],
    };
  }

  // Não encontrado
  return null;
}

/**
 * Registrar log de automação N8N
 */
export async function logAutomacao(data: {
  workflowId: string;
  workflowName?: string;
  executionId?: string;
  leadId?: number;
  acao: string;
  resultado: string;
  erro?: string;
  metadata?: any;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(n8nAutomacoesLog).values({
    workflowId: data.workflowId,
    workflowName: data.workflowName || null,
    executionId: data.executionId || null,
    leadId: data.leadId || null,
    acao: data.acao,
    resultado: data.resultado,
    erro: data.erro || null,
    metadata: data.metadata || {},
  });
}

/**
 * Registrar ligação N8N
 */
export async function logLigacao(data: {
  leadId?: number;
  telefone: string;
  retellCallId?: string;
  duracao?: number;
  transcricao?: string;
  resumo?: string;
  sentimento?: string;
  proximaAcao?: string;
  gravacaoUrl?: string;
  status?: string;
  metadata?: any;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(n8nLigacoes).values({
    leadId: data.leadId || null,
    telefone: data.telefone,
    retellCallId: data.retellCallId || null,
    duracao: data.duracao || null,
    transcricao: data.transcricao || null,
    resumo: data.resumo || null,
    sentimento: data.sentimento || null,
    proximaAcao: data.proximaAcao || null,
    gravacaoUrl: data.gravacaoUrl || null,
    status: data.status || 'concluida',
    metadata: data.metadata || {},
  });
}

/**
 * Enviar webhook para N8N
 * Usado para notificar o N8N sobre eventos
 */
export async function sendWebhookToN8N(
  webhookUrl: string,
  payload: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.N8N_API_KEY || '',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('[N8N] Erro ao enviar webhook:', error);
    return false;
  }
}

/**
 * Notificar N8N sobre novo lead
 */
export async function notifyN8NNewLead(lead: any): Promise<boolean> {
  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[N8N] N8N_LEAD_WEBHOOK_URL não configurada');
    return false;
  }

  return sendWebhookToN8N(webhookUrl, {
    event: 'new_lead',
    lead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      createdAt: lead.createdAt,
    },
  });
}

/**
 * Notificar N8N sobre nova mensagem
 */
export async function notifyN8NNewMessage(message: N8nMensagem): Promise<boolean> {
  const webhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[N8N] N8N_WHATSAPP_WEBHOOK_URL não configurada');
    return false;
  }

  return sendWebhookToN8N(webhookUrl, {
    event: 'new_message',
    message: {
      id: message.id,
      telefone: message.telefone,
      mensagem: message.mensagem,
      tipo: message.tipo,
      direcao: message.direcao,
      timestamp: message.timestamp,
    },
  });
}
