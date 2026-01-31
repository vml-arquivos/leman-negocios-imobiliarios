/**
 * WEBHOOKS ROUTER - N8N INTEGRATION
 * 
 * Este router gerencia webhooks recebidos do N8N para integração com WhatsApp.
 * 
 * Funcionalidades:
 * - Receber mensagens do WhatsApp via N8N
 * - Atualizar histórico de conversas em leads/owners
 * - Criar leads automáticos para números desconhecidos
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { leads, owners, messageBuffer, aiContextStatus } from "../../drizzle/schema";
import { eq, or, sql } from "drizzle-orm";

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const whatsappMessageSchema = z.object({
  phone: z.string().min(10, "Telefone inválido").max(20),
  message: z.string().min(1, "Mensagem não pode estar vazia"),
  direction: z.enum(["in", "out"], {
    errorMap: () => ({ message: "Direction deve ser 'in' ou 'out'" }),
  }),
  timestamp: z.string().datetime().or(z.date()),
  messageId: z.string().optional(),
  senderName: z.string().optional(), // Nome do remetente (para criar lead)
  metadata: z.record(z.any()).optional(), // Metadados adicionais
});

// ============================================
// WEBHOOK ROUTER
// ============================================

export const webhooksRouter = router({
  /**
   * Recebe mensagem do WhatsApp via N8N
   * 
   * Fluxo:
   * 1. Valida o payload
   * 2. Busca Lead ou Owner pelo telefone
   * 3. Atualiza n8nConversas com a nova mensagem
   * 4. Atualiza lastMessageAt
   * 5. Se não encontrar ninguém, cria um Lead automático
   */
  receiveWhatsAppMessage: publicProcedure
    .input(whatsappMessageSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Normalizar telefone (remover caracteres especiais)
      const normalizedPhone = input.phone.replace(/\D/g, "");

      try {
        // 1. BUSCAR LEAD PELO TELEFONE
        const existingLeads = await db
          .select()
          .from(leads)
          .where(
            or(
              sql`REGEXP_REPLACE(${leads.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`,
              sql`REGEXP_REPLACE(${leads.whatsapp}, '[^0-9]', '', 'g') = ${normalizedPhone}`
            )
          )
          .limit(1);

        if (existingLeads.length > 0) {
          const lead = existingLeads[0];

          // Atualizar conversas do lead
          const currentConversas = (lead.n8nConversas as any) || [];
          const newMessage = {
            phone: input.phone,
            message: input.message,
            direction: input.direction,
            timestamp: typeof input.timestamp === "string" 
              ? input.timestamp 
              : input.timestamp.toISOString(),
            messageId: input.messageId,
          };

          await db
            .update(leads)
            .set({
              n8nConversas: [...currentConversas, newMessage] as any,
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(leads.id, lead.id));

          // Salvar no messageBuffer para histórico N8N
          await db.insert(messageBuffer).values({
            phone: input.phone,
            messageId: input.messageId || `msg_${Date.now()}`,
            content: input.message,
            type: input.direction === 'in' ? 'incoming' : 'outgoing',
            processed: 1,
          });

          return {
            success: true,
            action: "updated_lead",
            entityType: "lead",
            entityId: lead.id,
            entityName: lead.name,
            message: `Mensagem adicionada ao lead: ${lead.name}`,
          };
        }

        // 2. BUSCAR OWNER PELO TELEFONE
        const existingOwners = await db
          .select()
          .from(owners)
          .where(
            or(
              sql`REGEXP_REPLACE(${owners.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`,
              sql`REGEXP_REPLACE(${owners.whatsapp}, '[^0-9]', '', 'g') = ${normalizedPhone}`
            )
          )
          .limit(1);

        if (existingOwners.length > 0) {
          const owner = existingOwners[0];

          // Atualizar conversas do owner
          const currentConversas = (owner.n8nConversas as any) || [];
          const newMessage = {
            phone: input.phone,
            message: input.message,
            direction: input.direction,
            timestamp: typeof input.timestamp === "string" 
              ? input.timestamp 
              : input.timestamp.toISOString(),
            messageId: input.messageId,
          };

          await db
            .update(owners)
            .set({
              n8nConversas: [...currentConversas, newMessage] as any,
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(owners.id, owner.id));

          return {
            success: true,
            action: "updated_owner",
            entityType: "owner",
            entityId: owner.id,
            entityName: owner.name,
            message: `Mensagem adicionada ao proprietário: ${owner.name}`,
          };
        }

        // 3. CRIAR LEAD AUTOMÁTICO (NÚMERO DESCONHECIDO)
        const newLeadName = input.senderName || `Lead WhatsApp ${normalizedPhone.slice(-4)}`;
        
        const newMessage = {
          phone: input.phone,
          message: input.message,
          direction: input.direction,
          timestamp: typeof input.timestamp === "string" 
            ? input.timestamp 
            : input.timestamp.toISOString(),
          messageId: input.messageId,
        };

        const [newLead] = await db
          .insert(leads)
          .values({
            name: newLeadName,
            phone: input.phone,
            whatsapp: input.phone,
            source: "whatsapp",
            stage: "novo",
            clientType: "comprador",
            qualification: "nao_qualificado",
            notes: `Lead criado automaticamente via N8N WhatsApp.\nPrimeira mensagem: "${input.message}"`,
            n8nConversas: [newMessage] as any,
            lastMessageAt: new Date(),
          })
          .returning();

        return {
          success: true,
          action: "created_lead",
          entityType: "lead",
          entityId: newLead.id,
          entityName: newLead.name,
          message: `Novo lead criado automaticamente: ${newLead.name}`,
          isNewLead: true,
        };

      } catch (error: any) {
        console.error("[Webhook] Erro ao processar mensagem:", error);
        throw new Error(`Falha ao processar mensagem: ${error.message}`);
      }
    }),

  /**
   * Buscar histórico de conversas de um Lead/Owner
   */
  getConversationHistory: publicProcedure
    .input(z.object({
      entityType: z.enum(["lead", "owner"]),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      if (input.entityType === "lead") {
        const [lead] = await db
          .select()
          .from(leads)
          .where(eq(leads.id, input.entityId))
          .limit(1);

        if (!lead) {
          throw new Error("Lead não encontrado");
        }

        return {
          entityType: "lead",
          entityId: lead.id,
          entityName: lead.name,
          conversations: lead.n8nConversas || [],
          lastMessageAt: lead.lastMessageAt,
        };
      } else {
        const [owner] = await db
          .select()
          .from(owners)
          .where(eq(owners.id, input.entityId))
          .limit(1);

        if (!owner) {
          throw new Error("Proprietário não encontrado");
        }

        return {
          entityType: "owner",
          entityId: owner.id,
          entityName: owner.name,
          conversations: owner.n8nConversas || [],
          lastMessageAt: owner.lastMessageAt,
        };
      }
    }),

  /**
   * Buscar Lead/Owner por telefone
   */
  findByPhone: publicProcedure
    .input(z.object({
      phone: z.string().min(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const normalizedPhone = input.phone.replace(/\D/g, "");

      // Buscar em leads
      const existingLeads = await db
        .select()
        .from(leads)
        .where(
          or(
            sql`REGEXP_REPLACE(${leads.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`,
            sql`REGEXP_REPLACE(${leads.whatsapp}, '[^0-9]', '', 'g') = ${normalizedPhone}`
          )
        )
        .limit(1);

      if (existingLeads.length > 0) {
        return {
          found: true,
          entityType: "lead",
          entity: existingLeads[0],
        };
      }

      // Buscar em owners
      const existingOwners = await db
        .select()
        .from(owners)
        .where(
          or(
            sql`REGEXP_REPLACE(${owners.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`,
            sql`REGEXP_REPLACE(${owners.whatsapp}, '[^0-9]', '', 'g') = ${normalizedPhone}`
          )
        )
        .limit(1);

      if (existingOwners.length > 0) {
        return {
          found: true,
          entityType: "owner",
          entity: existingOwners[0],
        };
      }

      return {
        found: false,
        entityType: null,
        entity: null,
      };
    }),

  /**
   * Health check do webhook
   */
  healthCheck: publicProcedure.query(() => {
    return {
      status: "ok",
      service: "n8n-webhook",
      timestamp: new Date().toISOString(),
      message: "Webhook N8N operacional",
    };
  }),
});
