/**
 * WEBHOOKS ROUTER — Leman Negócios Imobiliários
 *
 * Webhook universal para receber mensagens do WhatsApp de qualquer provedor:
 * - Evolution API (formato nativo)
 * - Z-API
 * - WPPConnect
 * - N8N (formato normalizado)
 * - Payload genérico
 *
 * Fluxo por mensagem recebida:
 * 1. Normalizar payload (qualquer formato → formato interno)
 * 2. Salvar mensagem no message_buffer e ai_context_status
 * 3. Chamar Agente de IA para extração de dados
 * 4. Upsert lead com dados extraídos
 * 5. Salvar interação + lead_insights + client_interests
 * 6. Retornar resultado com dados extraídos
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  leads,
  aiContextStatus,
  webhooksLog,
  leadInsights,
} from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { processWhatsAppMessage, generateConversationAnalysis } from "../ai-agent";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Garante formato 55XXXXXXXXXXX
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}

/**
 * Normaliza payloads de diferentes provedores para um formato interno único.
 * Suporta: Evolution API, Z-API, WPPConnect, N8N, payload genérico.
 */
function normalizePayload(body: any): {
  phone: string;
  message: string;
  senderName?: string;
  messageId?: string;
  direction: "in" | "out";
  timestamp: Date;
} | null {
  // ── Evolution API ────────────────────────────────────────────────────────
  if (body?.data?.key?.remoteJid || body?.key?.remoteJid) {
    const data = body.data ?? body;
    const jid: string = data.key?.remoteJid ?? "";
    const phone = normalizePhone(jid.replace("@s.whatsapp.net", "").replace("@c.us", ""));
    const message =
      data.message?.conversation ??
      data.message?.extendedTextMessage?.text ??
      data.message?.imageMessage?.caption ??
      data.message?.documentMessage?.caption ??
      "[mídia]";
    const direction = data.key?.fromMe ? "out" : "in";
    return {
      phone,
      message,
      senderName: data.pushName ?? data.verifiedBizName,
      messageId: data.key?.id,
      direction,
      timestamp: data.messageTimestamp
        ? new Date(Number(data.messageTimestamp) * 1000)
        : new Date(),
    };
  }

  // ── Z-API ────────────────────────────────────────────────────────────────
  if (body?.phone && body?.text?.message) {
    return {
      phone: normalizePhone(body.phone),
      message: body.text.message,
      senderName: body.senderName ?? body.senderPhoto?.name,
      messageId: body.messageId,
      direction: body.fromMe ? "out" : "in",
      timestamp: body.momment ? new Date(body.momment * 1000) : new Date(),
    };
  }

  // ── WPPConnect ───────────────────────────────────────────────────────────
  if (body?.from && body?.body) {
    return {
      phone: normalizePhone(body.from.replace("@c.us", "")),
      message: body.body,
      senderName: body.sender?.pushname,
      messageId: body.id,
      direction: body.fromMe ? "out" : "in",
      timestamp: body.t ? new Date(body.t * 1000) : new Date(),
    };
  }

  // ── N8N / formato normalizado ────────────────────────────────────────────
  if (body?.phone && body?.message) {
    return {
      phone: normalizePhone(body.phone),
      message: body.message,
      senderName: body.senderName ?? body.name,
      messageId: body.messageId,
      direction: body.direction ?? "in",
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    };
  }

  return null;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const webhooksRouter = router({

  /**
   * WEBHOOK UNIVERSAL — aceita qualquer formato de provedor WhatsApp
   * URL: POST /api/trpc/webhooks.receiveMessage
   *
   * Também aceita Evolution API diretamente via body sem normalização prévia.
   */
  receiveMessage: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Normalizar payload
      const normalized = normalizePayload(input);

      if (!normalized) {
        // Log e ignora payloads não reconhecidos (ex: status, ack, etc.)
        await db.insert(webhooksLog).values({
          source: "whatsapp",
          event_type: "unknown_format",
          payload: input,
          status: "ignored",
        } as any);
        return { success: true, action: "ignored", reason: "Formato não reconhecido" };
      }

      // Ignorar mensagens enviadas pelo próprio número (outgoing)
      if (normalized.direction === "out") {
        return { success: true, action: "ignored", reason: "Mensagem de saída" };
      }

      // 2. Salvar no message_buffer (para o WhatsApp Inbox)
      try {
        await db.execute(
          sql`INSERT INTO message_buffer (phone, message, processed, created_at)
              VALUES (${normalized.phone}, ${normalized.message}, false, ${normalized.timestamp})
              ON CONFLICT DO NOTHING`
        );
      } catch (_) {
        // message_buffer pode não existir em todos os ambientes — não bloquear
      }

      // 3. Processar com Agente de IA (extração de dados + upsert lead)
      let agentResult: Awaited<ReturnType<typeof processWhatsAppMessage>> | null = null;
      try {
        agentResult = await processWhatsAppMessage(
          normalized.phone,
          normalized.message,
          normalized.senderName,
          normalized.messageId ? `wa_${normalized.messageId}` : undefined
        );
      } catch (err) {
        console.error("[Webhook] AI Agent error:", err);
      }

      // 4. Log do webhook
      await db.insert(webhooksLog).values({
        source: "whatsapp",
        event_type: "message_received",
        payload: input,
        response: {
          phone: normalized.phone,
          leadId: agentResult?.leadId,
          isNewLead: agentResult?.isNewLead,
          extracted: agentResult?.extracted,
        },
        status: "success",
      } as any);

      return {
        success: true,
        action: agentResult?.isNewLead ? "lead_created" : "lead_updated",
        phone: normalized.phone,
        leadId: agentResult?.leadId,
        isNewLead: agentResult?.isNewLead ?? false,
        extracted: agentResult?.extracted ?? {},
        historyLength: agentResult?.historyLength ?? 0,
      };
    }),

  /**
   * WEBHOOK LEGADO — mantém compatibilidade com N8N e integrações anteriores
   * Aceita o formato { phone, message, direction, timestamp, senderName }
   */
  receiveWhatsAppMessage: publicProcedure
    .input(z.object({
      phone: z.string(),
      message: z.string(),
      direction: z.enum(["in", "out"]).optional().default("in"),
      timestamp: z.union([z.string(), z.date()]).optional(),
      messageId: z.string().optional(),
      senderName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input.direction === "out") {
        return { success: true, action: "ignored" };
      }

      let agentResult: Awaited<ReturnType<typeof processWhatsAppMessage>> | null = null;
      try {
        agentResult = await processWhatsAppMessage(
          input.phone,
          input.message,
          input.senderName
        );
      } catch (err) {
        console.error("[Webhook Legacy] AI Agent error:", err);
      }

      await db.insert(webhooksLog).values({
        source: "n8n",
        event_type: "message_received",
        payload: input,
        response: { leadId: agentResult?.leadId, extracted: agentResult?.extracted },
        status: "success",
      } as any);

      return {
        success: true,
        action: agentResult?.isNewLead ? "lead_created" : "lead_updated",
        leadId: agentResult?.leadId,
        isNewLead: agentResult?.isNewLead ?? false,
        extracted: agentResult?.extracted ?? {},
      };
    }),

  /**
   * Buscar histórico de conversa por telefone (para o admin)
   */
  getConversationHistory: publicProcedure
    .input(z.object({
      phone: z.string(),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { phone: input.phone, total: 0, messages: [] };

      const normalizedPhone = normalizePhone(input.phone);

      const messages = await db
        .select()
        .from(aiContextStatus)
        .where(eq(aiContextStatus.phone, normalizedPhone))
        .orderBy(aiContextStatus.created_at)
        .limit(input.limit);

      return {
        phone: normalizedPhone,
        total: messages.length,
        messages,
      };
    }),

  /**
   * Gerar análise de custo-benefício de uma conversa (IA)
   */
  analyzeConversation: protectedProcedure
    .input(z.object({ phone: z.string() }))
    .mutation(async ({ input }) => {
      const analysis = await generateConversationAnalysis(input.phone);
      return { phone: input.phone, ...analysis };
    }),

  /**
   * Buscar lead por telefone
   */
  findByPhone: publicProcedure
    .input(z.object({ phone: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { found: false };

      const normalizedPhone = normalizePhone(input.phone);
      const result = await db
        .select()
        .from(leads)
        .where(eq(leads.telefone, normalizedPhone))
        .limit(1);

      if (result.length === 0) return { found: false, phone: normalizedPhone };

      const lead = result[0];
      const insights = await db
        .select()
        .from(leadInsights)
        .where(eq(leadInsights.lead_id, lead.id))
        .limit(1);

      return {
        found: true,
        phone: normalizedPhone,
        lead,
        insights: insights[0] ?? null,
      };
    }),

  /**
   * Listar logs de webhook (admin)
   */
  getLogs: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(100) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(webhooksLog)
        .orderBy(desc(webhooksLog.created_at))
        .limit(input?.limit ?? 100);
    }),

  /**
   * Health check
   */
  healthCheck: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "webhooks-ai-agent",
    version: "2.0",
  })),
});
