/**
 * Lead Scoring determinístico (sem IA)
 * Score 0–100 baseado em campos reais da tabela leads.
 * Priority armazenada em metadata.priority (campo jsonb já existente).
 */

export type Priority = "baixa" | "media" | "alta" | "urgente";

export interface ScoreResult {
  score: number;
  priority: Priority;
  reasons: string[];
}

const URGENCY_WORDS = [
  "urgente", "hoje", "esta semana", "essa semana", "visita", "proposta",
  "quero comprar", "quero alugar", "fechar", "já", "agora",
];

export function computeLeadScore(lead: any, lastMessage?: string): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // +15 se telefone/whatsapp presente
  if (lead.telefone || lead.phone || lead.whatsapp) {
    score += 15;
    reasons.push("Telefone presente (+15)");
  }

  // +20 se interesse/finalidade definida
  if (lead.interesse || lead.finalidade) {
    score += 20;
    reasons.push("Intenção de compra definida (+20)");
  }

  // +20 se orçamento min ou max preenchido
  if (lead.orcamento_min != null || lead.orcamento_max != null) {
    score += 20;
    reasons.push("Orçamento informado (+20)");
  }

  // +15 se regiões de interesse preenchido
  const regioes = lead.regioes_interesse;
  if (regioes && (Array.isArray(regioes) ? regioes.length > 0 : String(regioes).trim().length > 0)) {
    score += 15;
    reasons.push("Regiões de interesse (+15)");
  }

  // +10 se tipo de imóvel preenchido
  if (lead.tipo_imovel) {
    score += 10;
    reasons.push("Tipo de imóvel (+10)");
  }

  // +20 se mensagem contém palavras de urgência
  const msg = (lastMessage || lead.observacoes || lead.message || "").toLowerCase();
  if (URGENCY_WORDS.some((w) => msg.includes(w))) {
    score += 20;
    reasons.push("Urgência detectada na mensagem (+20)");
  }

  // Clamp 0..100
  score = Math.min(100, Math.max(0, score));

  // Priority
  let priority: Priority;
  if (score >= 80) priority = "urgente";
  else if (score >= 60) priority = "alta";
  else if (score >= 40) priority = "media";
  else priority = "baixa";

  return { score, priority, reasons };
}
