/**
 * AI AGENT — Leman Negócios Imobiliários
 *
 * Responsabilidades:
 * 1. Analisar mensagens do WhatsApp e extrair dados estruturados do cliente
 * 2. Gerar resposta automática contextualizada (opcional)
 * 3. Calcular score de qualificação do lead
 * 4. Identificar intenção: compra, locação, financiamento, informação
 * 5. Salvar histórico de conversa e atualizar lead no banco
 *
 * Provedor de IA: Google Gemini (GEMINI_API_KEY)
 * Instância lazy — o servidor NÃO crasha no boot se a key estiver ausente.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDb } from "./db";
import {
  leads,
  interactions,
  aiContextStatus,
  leadInsights,
  clientInterests,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ─── Cliente Gemini (lazy — instanciado apenas quando chamado) ────────────────
function getGeminiModel(modelName = "gemini-1.5-flash") {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: modelName });
}

// ─── Helper: chama Gemini e extrai JSON da resposta ──────────────────────────
async function callGeminiJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });
  return result.response.text();
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ExtractedClientData {
  name?: string;
  email?: string;
  cpf?: string;
  intent?: "compra" | "locacao" | "financiamento" | "informacao" | "outro";
  propertyType?: string;           // apartamento, casa, sala, terreno, etc.
  budgetMin?: number;              // em centavos
  budgetMax?: number;              // em centavos
  desiredLocation?: string;
  bedrooms?: number;
  parking?: number;
  suites?: number;
  financingInterest?: boolean;
  downPaymentAvailable?: number;   // em centavos
  urgency?: "imediato" | "1_3_meses" | "3_6_meses" | "6_mais" | null;
  sentiment?: "positivo" | "neutro" | "negativo";
  score?: number;                  // 0–100
  aiSummary?: string;
  suggestedAction?: string;
  isQualified?: boolean;
}

export interface AgentResult {
  extracted: ExtractedClientData;
  leadId: number | null;
  isNewLead: boolean;
  historyLength: number;
}

// ─── Prompt do sistema ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é um assistente especializado em análise de conversas imobiliárias da empresa Leman Negócios Imobiliários (Brasília/DF).

Sua tarefa é analisar o histórico de conversa do WhatsApp e extrair dados estruturados do cliente.

RETORNE APENAS um JSON válido com os seguintes campos (omita campos que não foram mencionados):
{
  "name": "nome completo do cliente se mencionado",
  "email": "email se mencionado",
  "cpf": "CPF se mencionado (apenas números)",
  "intent": "compra|locacao|financiamento|informacao|outro",
  "propertyType": "apartamento|casa|sala|terreno|galpao|cobertura|studio|outro",
  "budgetMin": número em reais (sem centavos),
  "budgetMax": número em reais (sem centavos),
  "desiredLocation": "bairro ou região desejada",
  "bedrooms": número de quartos desejados,
  "parking": número de vagas desejadas,
  "suites": número de suítes desejadas,
  "financingInterest": true|false,
  "downPaymentAvailable": número em reais (valor de entrada disponível),
  "urgency": "imediato|1_3_meses|3_6_meses|6_mais",
  "sentiment": "positivo|neutro|negativo",
  "score": número de 0 a 100 (qualificação: 100 = cliente pronto para comprar),
  "aiSummary": "resumo em 1-2 frases do perfil e necessidade do cliente",
  "suggestedAction": "ação recomendada para o corretor (ex: 'Ligar hoje, cliente com entrada disponível e urgência imediata')",
  "isQualified": true|false (true se score >= 60)
}

Critérios de score:
- Mencionou valor/orçamento: +20
- Mencionou localização específica: +15
- Mencionou tipo de imóvel: +10
- Mencionou prazo/urgência: +15
- Mencionou entrada disponível: +20
- Sentimento positivo: +10
- Perguntou sobre financiamento: +10
- Forneceu nome: +5
- Forneceu email/CPF: +5 cada

Seja preciso e conciso. Não invente dados que não foram mencionados.`;

// ─── Função principal do agente ───────────────────────────────────────────────
export async function processWhatsAppMessage(
  phone: string,
  message: string,
  senderName?: string,
  sessionId?: string
): Promise<AgentResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedPhone = phone.replace(/\D/g, "");
  const sid = sessionId ?? `wa_${normalizedPhone}`;

  // 1. Salvar mensagem do usuário no histórico
  await db.insert(aiContextStatus).values({
    session_id: sid,
    phone: normalizedPhone,
    message,
    role: "user",
  } as any);

  // 2. Buscar histórico completo da conversa (últimas 30 mensagens)
  const history = await db
    .select()
    .from(aiContextStatus)
    .where(eq(aiContextStatus.phone, normalizedPhone))
    .orderBy(desc(aiContextStatus.created_at))
    .limit(30);

  const chronological = history.reverse();

  // 3. Montar prompt para o Gemini
  const userPrompt = `Analise o histórico de conversa abaixo e extraia os dados estruturados do cliente.\n\nTelefone: ${normalizedPhone}\nNome informado pelo sistema: ${senderName ?? "desconhecido"}\n\nHISTÓRICO:\n${chronological
    .map((m: any) => `[${m.role === "user" ? "CLIENTE" : "ASSISTENTE"}]: ${m.message}`)
    .join("\n")}`;

  // 4. Chamar o Gemini para extração de dados
  let extracted: ExtractedClientData = {};
  try {
    const raw = await callGeminiJson(SYSTEM_PROMPT, userPrompt);
    extracted = JSON.parse(raw);
  } catch (err) {
    console.error("[AI Agent] Extraction error:", err);
    extracted = { sentiment: "neutro", score: 10, aiSummary: "Erro na análise automática" };
  }

  // 5. Converter orçamento para centavos (a IA retorna em reais)
  if (extracted.budgetMin) extracted.budgetMin = Math.round(extracted.budgetMin * 100);
  if (extracted.budgetMax) extracted.budgetMax = Math.round(extracted.budgetMax * 100);
  if (extracted.downPaymentAvailable) extracted.downPaymentAvailable = Math.round(extracted.downPaymentAvailable * 100);

  // 6. Buscar ou criar lead no banco
  const existingLeads = await db
    .select()
    .from(leads)
    .where(eq(leads.telefone, normalizedPhone))
    .limit(1);

  let leadId: number | null = null;
  let isNewLead = false;

  const leadData: any = {
    telefone: normalizedPhone,
    updated_at: new Date(),
    ultima_interacao: new Date(),
  };

  if (extracted.name && extracted.name !== "desconhecido") leadData.name = extracted.name;
  if (extracted.email) leadData.email = extracted.email;
  if (extracted.budgetMin) leadData.orcamento_min = extracted.budgetMin;
  if (extracted.budgetMax) leadData.orcamento_max = extracted.budgetMax;
  if (extracted.desiredLocation) leadData.regioes_interesse = [extracted.desiredLocation];
  if (extracted.bedrooms) leadData.quartos = extracted.bedrooms;
  if (extracted.score) leadData.score = extracted.score;
  if (extracted.intent) {
    leadData.status = extracted.isQualified ? "qualificado" : "novo";
    leadData.stage = extracted.isQualified ? "qualificado" : "contato_inicial";
  }
  leadData.origem = "whatsapp";
  leadData.metadata = {
    ...(existingLeads[0]?.metadata as any ?? {}),
    ai_last_intent: extracted.intent,
    ai_last_sentiment: extracted.sentiment,
    ai_last_summary: extracted.aiSummary,
    ai_suggested_action: extracted.suggestedAction,
    ai_urgency: extracted.urgency,
    ai_financing_interest: extracted.financingInterest,
    ai_updated_at: new Date().toISOString(),
  };

  if (existingLeads.length > 0) {
    leadId = existingLeads[0].id;
    await db.update(leads).set(leadData).where(eq(leads.id, leadId));
  } else {
    isNewLead = true;
    leadData.name = extracted.name ?? senderName ?? `WhatsApp ${normalizedPhone}`;
    leadData.stage = "novo";
    leadData.status = "novo";
    const [newLead] = await db.insert(leads).values(leadData).returning();
    leadId = newLead.id;
  }

  // 7. Salvar interação no histórico do lead
  if (leadId) {
    await db.insert(interactions).values({
      lead_id: leadId,
      tipo: "whatsapp",
      canal: "whatsapp",
      assunto: `Mensagem WhatsApp — ${extracted.intent ?? "geral"}`,
      descricao: message.slice(0, 500),
      resultado: extracted.sentiment,
      metadata: {
        extracted,
        phone: normalizedPhone,
        session_id: sid,
      },
    } as any);

    // 8. Atualizar lead_insights
    const existingInsights = await db
      .select()
      .from(leadInsights)
      .where(eq(leadInsights.lead_id, leadId))
      .limit(1);

    if (existingInsights.length > 0) {
      await db.update(leadInsights).set({
        sentiment_score: extracted.score ?? 0,
        ai_summary: extracted.aiSummary ?? "",
        last_interaction: new Date(),
        updated_at: new Date(),
      } as any).where(eq(leadInsights.lead_id, leadId));
    } else {
      await db.insert(leadInsights).values({
        lead_id: leadId,
        sentiment_score: extracted.score ?? 0,
        ai_summary: extracted.aiSummary ?? "",
        last_interaction: new Date(),
      } as any);
    }

    // 9. Salvar interesse do cliente se houver dados suficientes
    if (extracted.propertyType || extracted.budgetMin || extracted.desiredLocation) {
      await db.insert(clientInterests).values({
        client_id: leadId,
        property_type: extracted.propertyType,
        interest_type: extracted.intent === "locacao" ? "locacao" : extracted.intent === "compra" ? "venda" : "ambos",
        budget_min: extracted.budgetMin,
        budget_max: extracted.budgetMax,
        preferred_neighborhoods: extracted.desiredLocation,
        notes: extracted.aiSummary,
      } as any);
    }
  }

  return {
    extracted,
    leadId,
    isNewLead,
    historyLength: chronological.length,
  };
}

// ─── Função para gerar resumo de custo-benefício de uma conversa ──────────────
export async function generateConversationAnalysis(phone: string): Promise<{
  summary: string;
  score: number;
  intent: string;
  suggestedAction: string;
  financialProfile: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedPhone = phone.replace(/\D/g, "");

  const history = await db
    .select()
    .from(aiContextStatus)
    .where(eq(aiContextStatus.phone, normalizedPhone))
    .orderBy(aiContextStatus.created_at)
    .limit(50);

  if (history.length === 0) {
    return {
      summary: "Sem histórico de conversa",
      score: 0,
      intent: "desconhecido",
      suggestedAction: "Aguardar contato",
      financialProfile: "Não identificado",
    };
  }

  const analysisSystemPrompt = `Você é um analista imobiliário. Analise a conversa e retorne JSON com:
{
  "summary": "resumo executivo em 2-3 frases",
  "score": número 0-100 de qualificação,
  "intent": "compra|locacao|financiamento|informacao|outro",
  "suggestedAction": "ação concreta para o corretor",
  "financialProfile": "perfil financeiro resumido (ex: 'Entrada de R$100k disponível, busca financiamento SBPE, orçamento até R$500k')"
}`;

  const conversationText = `Conversa WhatsApp (${normalizedPhone}):\n${history
    .map((m: any) => `[${m.role === "user" ? "CLIENTE" : "IA"}]: ${m.message}`)
    .join("\n")}`;

  try {
    const raw = await callGeminiJson(analysisSystemPrompt, conversationText);
    return JSON.parse(raw);
  } catch (err) {
    console.error("[AI Agent] Analysis error:", err);
    return {
      summary: "Erro na análise",
      score: 0,
      intent: "desconhecido",
      suggestedAction: "Revisar manualmente",
      financialProfile: "Não identificado",
    };
  }
}
