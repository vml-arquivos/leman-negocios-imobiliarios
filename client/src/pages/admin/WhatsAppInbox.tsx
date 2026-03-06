/**
 * WhatsApp Inbox — Painel Inteligente com Agente de IA
 *
 * Funcionalidades:
 * - Lista de conversas enriquecida com dados extraídos pela IA
 * - Histórico completo de mensagens por telefone
 * - Perfil automático do lead (nome, orçamento, intenção, urgência)
 * - Análise de custo-benefício gerada por IA
 * - Score de qualificação visual
 * - Ações rápidas: abrir no CRM, contatar via WhatsApp, analisar com IA
 * - Estatísticas do inbox
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Phone,
  User,
  RefreshCw,
  CheckCheck,
  Brain,
  TrendingUp,
  Home,
  DollarSign,
  MapPin,
  Clock,
  Star,
  Search,
  ExternalLink,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBRL = (cents: number | null | undefined) => {
  if (!cents) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(cents) / 100
  );
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "";
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR });
  } catch {
    return "";
  }
};

function scoreColor(score: number | null | undefined): string {
  const s = Number(score ?? 0);
  if (s >= 80) return "text-red-400 bg-red-500/20 border-red-500/30";
  if (s >= 60) return "text-amber-400 bg-amber-500/20 border-amber-500/30";
  if (s >= 40) return "text-blue-400 bg-blue-500/20 border-blue-500/30";
  return "text-slate-400 bg-slate-500/20 border-slate-500/30";
}

function scoreLabel(score: number | null | undefined): string {
  const s = Number(score ?? 0);
  if (s >= 80) return "Urgente";
  if (s >= 60) return "Qualificado";
  if (s >= 40) return "Em análise";
  return "Novo";
}

function intentIcon(metadata: any) {
  const intent = metadata?.ai_last_intent;
  if (intent === "compra") return <Home className="h-3 w-3" />;
  if (intent === "locacao") return <Home className="h-3 w-3 text-blue-400" />;
  if (intent === "financiamento") return <DollarSign className="h-3 w-3 text-green-400" />;
  return <MessageSquare className="h-3 w-3" />;
}

function intentLabel(metadata: any): string {
  const map: Record<string, string> = {
    compra: "Compra",
    locacao: "Locação",
    financiamento: "Financiamento",
    informacao: "Informação",
    outro: "Outro",
  };
  return map[metadata?.ai_last_intent] ?? "Geral";
}

function sentimentColor(metadata: any): string {
  const s = metadata?.ai_last_sentiment;
  if (s === "positivo") return "text-green-400";
  if (s === "negativo") return "text-red-400";
  return "text-slate-400";
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function WhatsAppInbox() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "profile" | "analysis">("messages");

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: conversations = [],
    refetch: refetchConversations,
    isLoading,
  } = trpc.whatsappInbox.listConversationsEnriched.useQuery(
    { limit: 100 },
    { refetchInterval: 20_000 }
  );

  const { data: stats } = trpc.whatsappInbox.getStats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: aiThread = [], refetch: refetchThread } =
    trpc.whatsappInbox.getAiThread.useQuery(
      { phone: selectedPhone!, limit: 200 },
      { enabled: !!selectedPhone, refetchInterval: 15_000 }
    );

  const { data: leadProfile, refetch: refetchProfile } =
    trpc.whatsappInbox.getLeadProfile.useQuery(
      { phone: selectedPhone! },
      { enabled: !!selectedPhone }
    );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const analyzeConversation = trpc.whatsappInbox.analyzeConversation.useMutation({
    onSuccess: (data) => {
      toast.success("Análise de IA concluída!");
      setActiveTab("analysis");
      setAnalysisResult(data);
    },
    onError: (e) => toast.error(`Erro na análise: ${e.message}`),
  });

  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // ── Filtro de busca ────────────────────────────────────────────────────────
  const filtered = conversations.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.lead_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.lead_email?.toLowerCase().includes(q) ||
      c.ai_summary?.toLowerCase().includes(q)
    );
  });

  const selectedConv = conversations.find((c: any) => c.phone === selectedPhone);
  const meta = (selectedConv?.lead_metadata as any) ?? {};

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-80px)] gap-0">

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 bg-white/2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <MessageSquare className="h-3.5 w-3.5 text-green-400" />
            <span className="font-semibold text-white">{stats?.totalConversations ?? 0}</span>
            conversas
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-semibold text-white">{stats?.totalMessages ?? 0}</span>
            mensagens
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-white">{stats?.qualifiedLeads ?? 0}</span>
            leads qualificados
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-white/40">
            <Brain className="h-3.5 w-3.5 text-purple-400" />
            Agente IA ativo
          </div>
        </div>

        {/* ── Layout principal ───────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Sidebar: lista de conversas ──────────────────────────────── */}
          <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col">
            {/* Header */}
            <div className="p-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-400" />
                <h2 className="font-semibold text-sm">WhatsApp Inbox</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => refetchConversations()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Busca */}
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-white/30" />
                <Input
                  placeholder="Buscar conversa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-7 text-xs bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Lista */}
            <ScrollArea className="flex-1">
              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <p className="p-4 text-xs text-white/40 text-center">
                  {search ? "Nenhuma conversa encontrada" : "Nenhuma mensagem recebida ainda."}
                </p>
              )}
              {filtered.map((conv: any) => {
                const convMeta = (conv.lead_metadata as any) ?? {};
                const isSelected = selectedPhone === conv.phone;
                const score = Number(conv.lead_score ?? conv.sentiment_score ?? 0);
                return (
                  <button
                    key={conv.phone}
                    className={`w-full text-left p-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                      isSelected ? "bg-white/10 border-l-2 border-l-green-500" : ""
                    }`}
                    onClick={() => {
                      setSelectedPhone(conv.phone);
                      setActiveTab("messages");
                      setAnalysisResult(null);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Avatar com score color */}
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border ${scoreColor(score)}`}>
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conv.lead_name || conv.phone}
                          </p>
                          <p className="text-xs text-white/40 truncate">{conv.phone}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${scoreColor(score)}`}>
                          {score > 0 ? score : "—"}
                        </span>
                        <span className="text-xs text-white/30">{fmtDate(conv.last_at)}</span>
                      </div>
                    </div>

                    {/* Resumo IA */}
                    {conv.ai_summary && (
                      <p className="text-xs text-white/50 mt-1.5 truncate flex items-center gap-1">
                        <Brain className="h-2.5 w-2.5 text-purple-400 flex-shrink-0" />
                        {conv.ai_summary}
                      </p>
                    )}

                    {/* Tags de intenção + orçamento */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {convMeta.ai_last_intent && (
                        <span className="flex items-center gap-0.5 text-xs bg-white/5 px-1.5 py-0.5 rounded text-white/60">
                          {intentIcon(convMeta)}
                          {intentLabel(convMeta)}
                        </span>
                      )}
                      {conv.orcamento_max && (
                        <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">
                          até {fmtBRL(conv.orcamento_max)}
                        </span>
                      )}
                      {convMeta.ai_urgency === "imediato" && (
                        <span className="text-xs bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Zap className="h-2.5 w-2.5" />
                          Urgente
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </ScrollArea>
          </div>

          {/* ── Área principal ────────────────────────────────────────────── */}
          {!selectedPhone ? (
            <div className="flex-1 flex items-center justify-center text-white/20">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Selecione uma conversa</p>
                <p className="text-xs mt-1 opacity-60">O agente de IA extrai dados automaticamente</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Header da conversa */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center border ${scoreColor(selectedConv?.lead_score ?? selectedConv?.sentiment_score)}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {selectedConv?.lead_name || selectedPhone}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Phone className="h-3 w-3" />
                      {selectedPhone}
                      {selectedConv?.lead_score > 0 && (
                        <span className={`px-1.5 py-0.5 rounded border text-xs ${scoreColor(selectedConv.lead_score)}`}>
                          {scoreLabel(selectedConv.lead_score)} · {selectedConv.lead_score}pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => analyzeConversation.mutate({ phone: selectedPhone })}
                        disabled={analyzeConversation.isPending}
                      >
                        {analyzeConversation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Brain className="h-3.5 w-3.5 text-purple-400" />
                        )}
                        Analisar IA
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Gerar análise de custo-benefício com IA</TooltipContent>
                  </Tooltip>

                  {selectedConv?.lead_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => window.open(`/admin/leads`, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      CRM
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-green-400 hover:text-green-300"
                    onClick={() =>
                      window.open(`https://wa.me/${selectedPhone.replace(/\D/g, "")}`, "_blank")
                    }
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 flex-shrink-0">
                {(["messages", "profile", "analysis"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
                      activeTab === tab
                        ? "border-green-500 text-green-400"
                        : "border-transparent text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab === "messages" && "Mensagens"}
                    {tab === "profile" && "Perfil do Lead"}
                    {tab === "analysis" && "Análise IA"}
                  </button>
                ))}
              </div>

              {/* ── Aba: Mensagens ─────────────────────────────────────────── */}
              {activeTab === "messages" && (
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2 max-w-2xl">
                    {aiThread.length === 0 && (
                      <p className="text-sm text-white/30 text-center py-8">
                        Nenhuma mensagem nesta conversa.
                      </p>
                    )}
                    {aiThread.map((msg: any, idx: number) => {
                      const isUser = msg.role === "user";
                      return (
                        <div
                          key={msg.id ?? idx}
                          className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                              isUser
                                ? "bg-white/8 border border-white/10 text-white/90 rounded-tl-sm"
                                : "bg-green-600/20 border border-green-500/20 text-green-100 rounded-tr-sm"
                            }`}
                          >
                            <p className="leading-relaxed">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isUser ? "text-white/30" : "text-green-400/50"}`}>
                              {isUser ? "Cliente" : "IA"} · {fmtDate(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* ── Aba: Perfil do Lead ────────────────────────────────────── */}
              {activeTab === "profile" && (
                <ScrollArea className="flex-1 p-4">
                  {!leadProfile ? (
                    <div className="text-center py-8 text-white/30">
                      <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Lead não identificado ainda</p>
                      <p className="text-xs mt-1">O agente de IA criará o perfil automaticamente na próxima mensagem</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-lg">
                      {/* Dados básicos */}
                      <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-400" />
                            Dados do Cliente
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-white/40">Nome</p>
                              <p className="font-medium">{leadProfile.lead.name ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40">Telefone</p>
                              <p>{leadProfile.lead.telefone ?? "—"}</p>
                            </div>
                            {leadProfile.lead.email && (
                              <div className="col-span-2">
                                <p className="text-xs text-white/40">Email</p>
                                <p>{leadProfile.lead.email}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-white/40">Status</p>
                              <Badge variant="outline" className="text-xs mt-0.5">
                                {leadProfile.lead.status ?? "novo"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-white/40">Score</p>
                              <p className={`font-bold ${scoreColor(leadProfile.lead.score).split(" ")[0]}`}>
                                {leadProfile.lead.score ?? 0} pts
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Intenção e perfil financeiro (extraído pela IA) */}
                      <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-400" />
                            Dados Extraídos pela IA
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-white/40">Intenção</p>
                              <p className="flex items-center gap-1">
                                {intentIcon(meta)}
                                {intentLabel(meta)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40">Urgência</p>
                              <p>{meta.ai_urgency?.replace("_", " ") ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40">Orçamento mín.</p>
                              <p>{fmtBRL(leadProfile.lead.orcamento_min) ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40">Orçamento máx.</p>
                              <p>{fmtBRL(leadProfile.lead.orcamento_max) ?? "—"}</p>
                            </div>
                            {leadProfile.lead.regioes_interesse?.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-xs text-white/40">Regiões de interesse</p>
                                <p>{(leadProfile.lead.regioes_interesse as string[]).join(", ")}</p>
                              </div>
                            )}
                            {leadProfile.lead.quartos && (
                              <div>
                                <p className="text-xs text-white/40">Quartos</p>
                                <p>{leadProfile.lead.quartos}</p>
                              </div>
                            )}
                            {meta.ai_financing_interest && (
                              <div>
                                <p className="text-xs text-white/40">Financiamento</p>
                                <p className="text-green-400 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Interesse confirmado
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Resumo IA */}
                          {leadProfile.insights?.ai_summary && (
                            <div className="mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                              <p className="text-xs text-purple-300 flex items-center gap-1 mb-1">
                                <Brain className="h-3 w-3" />
                                Resumo IA
                              </p>
                              <p className="text-xs text-white/80">{leadProfile.insights.ai_summary}</p>
                            </div>
                          )}

                          {/* Ação sugerida */}
                          {meta.ai_suggested_action && (
                            <div className="mt-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                              <p className="text-xs text-amber-300 flex items-center gap-1 mb-1">
                                <Zap className="h-3 w-3" />
                                Ação sugerida
                              </p>
                              <p className="text-xs text-white/80">{meta.ai_suggested_action}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Interesses cadastrados */}
                      {leadProfile.interests.length > 0 && (
                        <Card className="bg-white/5 border-white/10">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Home className="h-4 w-4 text-amber-400" />
                              Interesses Imobiliários
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 pb-3 space-y-2">
                            {leadProfile.interests.map((interest: any, i: number) => (
                              <div key={i} className="text-xs p-2 bg-white/5 rounded border border-white/10">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{interest.property_type ?? "Imóvel"}</span>
                                  <Badge variant="outline" className="text-xs">{interest.interest_type}</Badge>
                                </div>
                                {(interest.budget_min || interest.budget_max) && (
                                  <p className="text-white/60">
                                    {fmtBRL(interest.budget_min) ?? "—"} — {fmtBRL(interest.budget_max) ?? "—"}
                                  </p>
                                )}
                                {interest.preferred_neighborhoods && (
                                  <p className="text-white/60 flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {interest.preferred_neighborhoods}
                                  </p>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Histórico de interações */}
                      {leadProfile.recentInteractions.length > 0 && (
                        <Card className="bg-white/5 border-white/10">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-400" />
                              Histórico de Interações
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 pb-3 space-y-1.5">
                            {leadProfile.recentInteractions.map((int: any) => (
                              <div key={int.id} className="flex items-start gap-2 text-xs">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/80 truncate">{int.descricao ?? int.assunto ?? "Interação"}</p>
                                  <p className="text-white/30">{fmtDate(int.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </ScrollArea>
              )}

              {/* ── Aba: Análise IA ────────────────────────────────────────── */}
              {activeTab === "analysis" && (
                <ScrollArea className="flex-1 p-4">
                  {!analysisResult && !analyzeConversation.isPending ? (
                    <div className="text-center py-8 text-white/30">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Análise não gerada ainda</p>
                      <p className="text-xs mt-1 mb-4">Clique em "Analisar IA" para gerar a análise de custo-benefício</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeConversation.mutate({ phone: selectedPhone })}
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Gerar Análise
                      </Button>
                    </div>
                  ) : analyzeConversation.isPending ? (
                    <div className="flex items-center justify-center py-12 gap-3 text-white/50">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                      <p className="text-sm">Analisando conversa com IA...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-lg">
                      {/* Score */}
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-amber-400" />
                              <span className="font-semibold">Score de Qualificação</span>
                            </div>
                            <span className={`text-2xl font-bold ${scoreColor(analysisResult.score).split(" ")[0]}`}>
                              {analysisResult.score ?? 0}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-green-500 transition-all"
                              style={{ width: `${analysisResult.score ?? 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-white/40 mt-1 text-right">
                            {scoreLabel(analysisResult.score)}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Resumo */}
                      <Card className="bg-purple-500/10 border-purple-500/20">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-sm flex items-center gap-2 text-purple-300">
                            <Brain className="h-4 w-4" />
                            Resumo Executivo
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          <p className="text-sm text-white/80 leading-relaxed">
                            {analysisResult.summary ?? "Sem resumo disponível"}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Perfil financeiro */}
                      {analysisResult.financialProfile && (
                        <Card className="bg-green-500/10 border-green-500/20">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2 text-green-300">
                              <DollarSign className="h-4 w-4" />
                              Perfil Financeiro
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 pb-3">
                            <p className="text-sm text-white/80">{analysisResult.financialProfile}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Ação sugerida */}
                      {analysisResult.suggestedAction && (
                        <Card className="bg-amber-500/10 border-amber-500/20">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2 text-amber-300">
                              <Zap className="h-4 w-4" />
                              Próxima Ação Recomendada
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 pb-3">
                            <p className="text-sm text-white/80 font-medium">{analysisResult.suggestedAction}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Botão de ação */}
                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/${selectedPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contatar Agora
                          </Button>
                        </a>
                        <Button
                          variant="outline"
                          className="flex-1 text-sm border-purple-500/30 text-purple-400"
                          onClick={() => analyzeConversation.mutate({ phone: selectedPhone })}
                          disabled={analyzeConversation.isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reanalisar
                        </Button>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
