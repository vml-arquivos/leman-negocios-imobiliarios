/**
 * WEBHOOKS ROUTER
 * 
 * Endpoints para receber webhooks do N8N (WhatsApp, automações, etc.)
 * Usa as tabelas nativas do Supabase: n8n_conversas, n8n_mensagens
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { leads } from "../../drizzle/schema";
import { eq, or, sql } from "drizzle-orm";
import {
  getOrCreateConversa,
  saveMensagem,
  addToFilaMensagens,
  findClientByPhone,
  logAutomacao,
  notifyN8NNewLead,
} from "../n8n-integration";

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const whatsappMessageSchema = z.object({
  phone: z.string().min(10).max(20),
  message: z.string().min(1),
  direction: z.enum(["in", "out"]),
  timestamp: z.union([z.string(), z.date()]),
  messageId: z.string().optional(),
  senderName: z.string().optional(),
});

const phoneSchema = z.object({
  phone: z.string().min(10).max(20),
});

// ============================================
// ROUTER
// ============================================

export const webhooksRouter = router({
  /**
   * ENDPOINT PRINCIPAL: Receber mensagens do WhatsApp via N8N
   * 
   * Fluxo:
   * 1. Busca ou cria conversa na tabela n8n_conversas
   * 2. Busca Lead/Owner pelo telefone
   * 3. Vincula conversa ao Lead/Owner se encontrado
   * 4. Salva mensagem na tabela n8n_mensagens
   * 5. Adiciona à fila de processamento (n8n_fila_mensagens)
   * 6. Se não encontrar cliente, cria Lead automaticamente
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
        // 1. BUSCAR CLIENTE PELO TELEFONE
        const client = await findClientByPhone(input.phone);

        let leadId: number | null = null;
        let clientName: string | null = input.senderName || null;
        let isNewLead = false;

        if (client) {
          // Cliente encontrado
          if (client.type === 'lead') {
            leadId = client.client.id;
            clientName = client.client.name;
          }
        } else {
          // Cliente não encontrado - criar Lead automaticamente
          const [newLead] = await db
            .insert(leads)
            .values({
              name: input.senderName || `Lead ${normalizedPhone}`,
              phone: input.phone,
              whatsapp: input.phone,
              source: "whatsapp",
              stage: "novo",
              clientType: "comprador",
              qualification: "nao_qualificado",
              notes: `Lead criado automaticamente via WhatsApp em ${new Date().toISOString()}`,
            })
            .returning();

          leadId = newLead.id;
          clientName = newLead.name;
          isNewLead = true;

          // Notificar N8N sobre novo lead
          await notifyN8NNewLead(newLead);
        }

        // 2. BUSCAR OU CRIAR CONVERSA
        const conversa = await getOrCreateConversa({
          telefone: input.phone,
          nome: clientName || undefined,
          leadId: leadId || undefined,
        });

        // 3. SALVAR MENSAGEM NO HISTÓRICO
        const mensagem = await saveMensagem({
          conversaId: conversa.id,
          telefone: input.phone,
          mensagem: input.message,
          tipo: 'texto',
          direcao: input.direction === 'in' ? 'recebida' : 'enviada',
          metadata: {
            messageId: input.messageId,
            senderName: input.senderName,
            timestamp: input.timestamp,
          },
        });

        // 4. ADICIONAR À FILA DE PROCESSAMENTO
        if (input.direction === 'in') {
          await addToFilaMensagens({
            telefone: input.phone,
            idMensagem: input.messageId || `msg_${Date.now()}`,
            mensagem: input.message,
          });
        }

        // 5. REGISTRAR LOG DE AUTOMAÇÃO
        await logAutomacao({
          workflowId: 'whatsapp_webhook',
          workflowName: 'WhatsApp Message Received',
          leadId: leadId || undefined,
          acao: 'receive_message',
          resultado: 'success',
          metadata: {
            conversaId: conversa.id,
            mensagemId: mensagem.id,
            isNewLead,
          },
        });

        return {
          success: true,
          action: isNewLead ? 'created_lead' : 'updated_conversation',
          conversaId: conversa.id,
          mensagemId: mensagem.id,
          leadId,
          clientName,
          isNewLead,
          message: isNewLead 
            ? `Novo lead criado: ${clientName}` 
            : `Mensagem adicionada à conversa de ${clientName}`,
        };

      } catch (error: any) {
        console.error("[Webhook] Erro ao processar mensagem:", error);

        // Registrar erro no log
        await logAutomacao({
          workflowId: 'whatsapp_webhook',
          workflowName: 'WhatsApp Message Received',
          acao: 'receive_message',
          resultado: 'error',
          erro: error.message,
          metadata: {
            phone: input.phone,
            message: input.message,
          },
        });

        throw new Error(`Erro ao processar mensagem: ${error.message}`);
      }
    }),

  /**
   * Buscar histórico de conversas por telefone
   */
  getConversationHistory: publicProcedure
    .input(phoneSchema.extend({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const { getChatHistory } = await import("../n8n-integration");
      const messages = await getChatHistory(input.phone, input.limit);

      return {
        phone: input.phone,
        total: messages.length,
        messages,
      };
    }),

  /**
   * Buscar Lead/Owner por telefone
   */
  findByPhone: publicProcedure
    .input(phoneSchema)
    .query(async ({ input }) => {
      const client = await findClientByPhone(input.phone);

      if (!client) {
        return {
          found: false,
          phone: input.phone,
          message: "Cliente não encontrado",
        };
      }

      return {
        found: true,
        phone: input.phone,
        type: client.type,
        client: client.client,
      };
    }),

  /**
   * Health check do webhook
   */
  healthCheck: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "webhooks",
    };
  }),
});
