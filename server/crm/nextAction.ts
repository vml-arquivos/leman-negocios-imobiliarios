/**
 * Next-Action Engine (rule-based, sem IA)
 * Retorna a próxima ação recomendada para um lead com base no status,
 * score, última interação e dados de perfil.
 */

export interface NextAction {
  action: string;       // Texto da ação recomendada
  channel: "whatsapp" | "email" | "phone" | "visit" | "internal";
  urgency: "baixa" | "media" | "alta" | "urgente";
  message?: string;     // Mensagem sugerida (para copiar/enviar)
  whatsappUrl?: string; // Link direto para abrir WhatsApp
}

const DAYS_MS = 24 * 60 * 60 * 1000;

function daysSince(date: string | Date | null | undefined): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / DAYS_MS);
}

export function computeNextAction(lead: any, lastInteractionDate?: string | null): NextAction {
  const status = (lead.status || lead.stage || "novo").toLowerCase();
  const score: number = lead.score ?? 0;
  const phone: string = lead.telefone || lead.phone || lead.whatsapp || "";
  const cleanPhone = phone.replace(/\D/g, "");
  const waBase = cleanPhone ? `https://wa.me/55${cleanPhone}` : undefined;
  const dias = daysSince(lastInteractionDate ?? lead.ultima_interacao);

  // 1. Lead novo sem nenhuma interação
  if (status === "novo" && dias >= 0) {
    const msg = `Olá ${lead.name?.split(" ")[0] || ""}! Vi que você tem interesse em imóveis em Brasília. Posso te ajudar a encontrar a opção ideal? 😊`;
    return {
      action: "Primeiro contato — apresentar-se e qualificar",
      channel: "whatsapp",
      urgency: score >= 60 ? "alta" : "media",
      message: msg,
      whatsappUrl: waBase ? `${waBase}?text=${encodeURIComponent(msg)}` : undefined,
    };
  }

  // 2. Lead qualificado sem contato há mais de 3 dias
  if ((status === "qualificado" || status === "quente") && dias >= 3) {
    const msg = `Olá ${lead.name?.split(" ")[0] || ""}! Temos novidades de imóveis que combinam com o seu perfil. Posso te enviar as opções?`;
    return {
      action: `Retomar contato — ${dias} dia(s) sem interação`,
      channel: "whatsapp",
      urgency: dias >= 7 ? "urgente" : "alta",
      message: msg,
      whatsappUrl: waBase ? `${waBase}?text=${encodeURIComponent(msg)}` : undefined,
    };
  }

  // 3. Lead em negociação — agendar visita ou enviar proposta
  if (status === "negociacao" || status === "proposta") {
    const msg = `Olá ${lead.name?.split(" ")[0] || ""}! Gostaria de confirmar os próximos passos da nossa negociação. Quando podemos conversar?`;
    return {
      action: "Avançar negociação — confirmar próximos passos",
      channel: "whatsapp",
      urgency: "alta",
      message: msg,
      whatsappUrl: waBase ? `${waBase}?text=${encodeURIComponent(msg)}` : undefined,
    };
  }

  // 4. Lead sem orçamento definido
  if (!lead.orcamento_min && !lead.orcamento_max) {
    return {
      action: "Qualificar — perguntar orçamento e preferências",
      channel: "whatsapp",
      urgency: "media",
      message: `Olá ${lead.name?.split(" ")[0] || ""}! Para te indicar as melhores opções, qual seria o valor que você está pensando em investir?`,
      whatsappUrl: waBase
        ? `${waBase}?text=${encodeURIComponent(`Olá ${lead.name?.split(" ")[0] || ""}! Para te indicar as melhores opções, qual seria o valor que você está pensando em investir?`)}`
        : undefined,
    };
  }

  // 5. Lead sem região de interesse
  if (!lead.regioes_interesse || (Array.isArray(lead.regioes_interesse) && lead.regioes_interesse.length === 0)) {
    return {
      action: "Qualificar — perguntar regiões de interesse",
      channel: "whatsapp",
      urgency: "media",
      message: `Olá ${lead.name?.split(" ")[0] || ""}! Quais regiões de Brasília você prefere? Isso vai me ajudar a filtrar as melhores opções para você.`,
      whatsappUrl: waBase
        ? `${waBase}?text=${encodeURIComponent(`Olá ${lead.name?.split(" ")[0] || ""}! Quais regiões de Brasília você prefere?`)}`
        : undefined,
    };
  }

  // 6. Lead frio — reengajamento
  if (status === "frio" || dias >= 14) {
    const msg = `Olá ${lead.name?.split(" ")[0] || ""}! Passamos um tempo sem falar. Ainda está buscando imóvel em Brasília? Temos ótimas novidades! 🏡`;
    return {
      action: "Reengajar lead frio",
      channel: "whatsapp",
      urgency: "baixa",
      message: msg,
      whatsappUrl: waBase ? `${waBase}?text=${encodeURIComponent(msg)}` : undefined,
    };
  }

  // 7. Padrão — manter contato
  return {
    action: "Manter contato — enviar novidades de imóveis",
    channel: "whatsapp",
    urgency: "baixa",
    message: `Olá ${lead.name?.split(" ")[0] || ""}! Temos novidades que podem te interessar. Posso te enviar?`,
    whatsappUrl: waBase
      ? `${waBase}?text=${encodeURIComponent(`Olá ${lead.name?.split(" ")[0] || ""}! Temos novidades que podem te interessar. Posso te enviar?`)}`
      : undefined,
  };
}
