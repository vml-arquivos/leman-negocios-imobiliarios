/**
 * N8N INTEGRATION HELPER
 * 
 * Funções auxiliares para integração com N8N e gerenciamento de chat history
 */

import { getDb } from "./db";
import { messageBuffer, aiContextStatus, leads, owners } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ============================================
// TIPOS
// ============================================

export interface ChatMessage {
  id: number;
  phone: string;
  messageId: string;
  content: string;
  type: 'incoming' | 'outgoing';
  timestamp: Date;
  processed: number;
}

export interface AIContext {
  id: number;
  sessionId: string;
  phone: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
}

// ============================================
// FUNÇÕES DE CHAT HISTORY
// ============================================

/**
 * Buscar histórico de mensagens por telefone
 * Usado pelo N8N para contexto de conversas
 */
export async function getChatHistory(phone: string, limit: number = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedPhone = phone.replace(/\D/g, "");

  const messages = await db
    .select()
    .from(messageBuffer)
    .where(eq(messageBuffer.phone, phone))
    .orderBy(desc(messageBuffer.timestamp))
    .limit(limit);

  return messages as ChatMessage[];
}

/**
 * Buscar contexto de IA por sessionId
 * Usado pelo N8N para manter contexto de conversas com IA
 */
export async function getAIContext(sessionId: string, limit: number = 20): Promise<AIContext[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const context = await db
    .select()
    .from(aiContextStatus)
    .where(eq(aiContextStatus.sessionId, sessionId))
    .orderBy(desc(aiContextStatus.createdAt))
    .limit(limit);

  return context as AIContext[];
}

/**
 * Salvar mensagem no buffer
 * Usado pelo webhook para registrar mensagens recebidas
 */
export async function saveMessageToBuffer(data: {
  phone: string;
  messageId: string;
  content: string;
  type: 'incoming' | 'outgoing';
}): Promise<ChatMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [message] = await db
    .insert(messageBuffer)
    .values({
      phone: data.phone,
      messageId: data.messageId,
      content: data.content,
      type: data.type,
      processed: 0,
    })
    .returning();

  return message as ChatMessage;
}

/**
 * Salvar contexto de IA
 * Usado pelo N8N para manter histórico de conversas com IA
 */
export async function saveAIContext(data: {
  sessionId: string;
  phone: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
}): Promise<AIContext> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [context] = await db
    .insert(aiContextStatus)
    .values(data)
    .returning();

  return context as AIContext;
}

/**
 * Marcar mensagem como processada
 * Usado pelo N8N após processar uma mensagem
 */
export async function markMessageAsProcessed(messageId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(messageBuffer)
    .set({ processed: 1 })
    .where(eq(messageBuffer.messageId, messageId));
}

/**
 * Buscar mensagens não processadas
 * Usado pelo N8N para pegar mensagens pendentes
 */
export async function getUnprocessedMessages(limit: number = 100): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const messages = await db
    .select()
    .from(messageBuffer)
    .where(eq(messageBuffer.processed, 0))
    .orderBy(messageBuffer.timestamp)
    .limit(limit);

  return messages as ChatMessage[];
}

/**
 * Buscar Lead ou Owner por telefone
 * Usado pelo N8N para identificar o cliente
 */
export async function findClientByPhone(phone: string): Promise<{
  type: 'lead' | 'owner' | null;
  client: any;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedPhone = phone.replace(/\D/g, "");

  // Buscar em leads
  const leadResults = await db
    .select()
    .from(leads)
    .where(eq(leads.phone, phone))
    .limit(1);

  if (leadResults.length > 0) {
    return {
      type: 'lead',
      client: leadResults[0],
    };
  }

  // Buscar em owners
  const ownerResults = await db
    .select()
    .from(owners)
    .where(eq(owners.phone, phone))
    .limit(1);

  if (ownerResults.length > 0) {
    return {
      type: 'owner',
      client: ownerResults[0],
    };
  }

  return null;
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
export async function notifyN8NNewMessage(message: ChatMessage): Promise<boolean> {
  const webhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[N8N] N8N_WHATSAPP_WEBHOOK_URL não configurada');
    return false;
  }

  return sendWebhookToN8N(webhookUrl, {
    event: 'new_message',
    message: {
      id: message.id,
      phone: message.phone,
      messageId: message.messageId,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp,
    },
  });
}
