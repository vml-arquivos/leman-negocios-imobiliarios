import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle, Bell, Building2, Clock, Eye, FileText, Filter,
  Handshake, Home, Key, MessageSquare, MoreVertical, Pencil,
  Phone, Plus, Search, Star, Users, XCircle, Zap,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// ─── Constantes ───────────────────────────────────────────────────────────────

const FINALIDADES = [
  { id: "comprador",            label: "Compradores",           icon: Home,      color: "bg-blue-500",   lightColor: "bg-blue-50 text-blue-700 border-blue-200",      description: "Quer comprar um imóvel" },
  { id: "locatario",            label: "Locatários",            icon: Key,       color: "bg-purple-500", lightColor: "bg-purple-50 text-purple-700 border-purple-200", description: "Quer alugar um imóvel" },
  { id: "proprietario_venda",   label: "Proprietários (Venda)", icon: Building2, color: "bg-orange-500", lightColor: "bg-orange-50 text-orange-700 border-orange-200", description: "Quer vender seu imóvel" },
  { id: "proprietario_locacao", label: "Proprietários (Loc.)",  icon: Handshake, color: "bg-green-500",  lightColor: "bg-green-50 text-green-700 border-green-200",   description: "Quer alugar seu imóvel" },
  { id: "assessoria",           label: "Assessoria",            icon: Star,      color: "bg-yellow-500", lightColor: "bg-yellow-50 text-yellow-700 border-yellow-200", description: "Busca assessoria" },
];

const JORNADAS: Record<string, { id: string; label: string; color: string }[]> = {
  comprador: [
    { id: "novo",             label: "Novo",             color: "bg-slate-100 text-slate-700" },
    { id: "contato_inicial",  label: "Contato Inicial",  color: "bg-blue-100 text-blue-700" },
    { id: "qualificado",      label: "Qualificado",      color: "bg-indigo-100 text-indigo-700" },
    { id: "visita_agendada",  label: "Visita Agendada",  color: "bg-yellow-100 text-yellow-700" },
    { id: "visita_realizada", label: "Visita Realizada", color: "bg-orange-100 text-orange-700" },
    { id: "proposta",         label: "Proposta",         color: "bg-pink-100 text-pink-700" },
    { id: "negociacao",       label: "Negociação",       color: "bg-red-100 text-red-700" },
    { id: "fechado_ganho",    label: "Fechado ✓",        color: "bg-green-100 text-green-700" },
  ],
  locatario: [
    { id: "novo",             label: "Novo",                color: "bg-slate-100 text-slate-700" },
    { id: "contato_inicial",  label: "Contato Inicial",     color: "bg-purple-100 text-purple-700" },
    { id: "qualificado",      label: "Qualificado",         color: "bg-indigo-100 text-indigo-700" },
    { id: "visita_agendada",  label: "Visita Agendada",     color: "bg-yellow-100 text-yellow-700" },
    { id: "visita_realizada", label: "Visita Realizada",    color: "bg-orange-100 text-orange-700" },
    { id: "proposta",         label: "Proposta",            color: "bg-pink-100 text-pink-700" },
    { id: "fechado_ganho",    label: "Contrato Assinado ✓", color: "bg-green-100 text-green-700" },
  ],
  proprietario_venda: [
    { id: "novo",             label: "Novo",              color: "bg-slate-100 text-slate-700" },
    { id: "contato_inicial",  label: "Contato Inicial",   color: "bg-orange-100 text-orange-700" },
    { id: "qualificado",      label: "Avaliação",         color: "bg-yellow-100 text-yellow-700" },
    { id: "visita_agendada",  label: "Captação Agendada", color: "bg-amber-100 text-amber-700" },
    { id: "visita_realizada", label: "Imóvel Captado",    color: "bg-lime-100 text-lime-700" },
    { id: "proposta",         label: "Em Divulgação",     color: "bg-teal-100 text-teal-700" },
    { id: "negociacao",       label: "Negociação",        color: "bg-red-100 text-red-700" },
    { id: "fechado_ganho",    label: "Vendido ✓",         color: "bg-green-100 text-green-700" },
  ],
  proprietario_locacao: [
    { id: "novo",             label: "Novo",              color: "bg-slate-100 text-slate-700" },
    { id: "contato_inicial",  label: "Contato Inicial",   color: "bg-green-100 text-green-700" },
    { id: "qualificado",      label: "Avaliação",         color: "bg-yellow-100 text-yellow-700" },
    { id: "visita_agendada",  label: "Captação Agendada", color: "bg-amber-100 text-amber-700" },
    { id: "visita_realizada", label: "Imóvel Captado",    color: "bg-lime-100 text-lime-700" },
    { id: "proposta",         label: "Em Divulgação",     color: "bg-teal-100 text-teal-700" },
    { id: "fechado_ganho",    label: "Alugado ✓",         color: "bg-green-100 text-green-700" },
  ],
  assessoria: [
    { id: "novo",            label: "Novo",         color: "bg-slate-100 text-slate-700" },
    { id: "contato_inicial", label: "Contato",      color: "bg-yellow-100 text-yellow-700" },
    { id: "qualificado",     label: "Reunião",      color: "bg-amber-100 text-amber-700" },
    { id: "proposta",        label: "Proposta",     color: "bg-orange-100 text-orange-700" },
    { id: "fechado_ganho",   label: "Contratado ✓", color: "bg-green-100 text-green-700" },
  ],
  default: [
    { id: "novo",             label: "Novo",            color: "bg-slate-100 text-slate-700" },
    { id: "contato_inicial",  label: "Contato Inicial", color: "bg-blue-100 text-blue-700" },
    { id: "qualificado",      label: "Qualificado",     color: "bg-green-100 text-green-700" },
    { id: "visita_agendada",  label: "Visita Agendada", color: "bg-yellow-100 text-yellow-700" },
    { id: "proposta",         label: "Proposta",        color: "bg-orange-100 text-orange-700" },
    { id: "fechado_ganho",    label: "Fechado ✓",       color: "bg-green-100 text-green-700" },
  ],
};

const ORIGENS: Record<string, string> = {
  site: "Site", whatsapp: "WhatsApp", simulador: "Simulador",
  instagram: "Instagram", facebook: "Facebook", indicacao: "Indicação",
  portal_zap: "ZAP", portal_vivareal: "Viva Real", portal_olx: "OLX",
  google: "Google", outro: "Outro",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number | null | undefined) => {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtRelative = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
};

const getInitials = (name: string) =>
  (name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-yellow-600 bg-yellow-50";
  if (score >= 40) return "text-orange-600 bg-orange-50";
  return "text-slate-500 bg-slate-50";
};

const getAlertBorder = (days: number) => {
  if (days >= 7) return "border-red-300";
  if (days >= 3) return "border-orange-300";
  return "border-slate-200";
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Leads() {
  const [, setLocation] = useLocation();
  const [activeFinalidade, setActiveFinalidade] = useState("todos");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");

  const [actionDialog, setActionDialog] = useState<{
    open: boolean; lead: any | null; type: string;
  }>({ open: false, lead: null, type: "nota" });
  const [actionForm, setActionForm] = useState({
    description: "", nextAction: "", nextActionDate: "", newStage: "",
  });

  const [qualifyDialog, setQualifyDialog] = useState<{ open: boolean; lead: any | null }>({
    open: false, lead: null,
  });
  const [qualifyForm, setQualifyForm] = useState({ finalidade: "", notes: "" });

  const [detailDialog, setDetailDialog] = useState<{ open: boolean; lead: any | null }>({
    open: false, lead: null,
  });

  const { data: leads = [], refetch } = trpc.leads.listEnriched.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: stats } = trpc.leads.getStats.useQuery(undefined, { refetchInterval: 30000 });

  const addInteractionMutation = trpc.leads.addQuickInteraction.useMutation({
    onSuccess: () => {
      toast.success("Interação registrada!");
      refetch();
      setActionDialog({ open: false, lead: null, type: "nota" });
      setActionForm({ description: "", nextAction: "", nextActionDate: "", newStage: "" });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const qualifyMutation = trpc.leads.qualify.useMutation({
    onSuccess: () => {
      toast.success("Lead qualificado!");
      refetch();
      setQualifyDialog({ open: false, lead: null });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Lead removido."); },
  });

  const filteredLeads = useMemo(() => {
    let result = [...(leads as any[])];
    if (activeFinalidade !== "todos") {
      result = result.filter((l: any) => l.finalidade === activeFinalidade);
    }
    if (stageFilter !== "todos") {
      result = result.filter((l: any) => l.status === stageFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((l: any) =>
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.telefone?.includes(s)
      );
    }
    return result;
  }, [leads, activeFinalidade, stageFilter, search]);

  const currentJornada = JORNADAS[activeFinalidade] ?? JORNADAS.default;

  const leadsByStage = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of currentJornada) {
      map[s.id] = filteredLeads.filter((l: any) => l.status === s.id);
    }
    const mapped = new Set(currentJornada.map((s) => s.id));
    const unmapped = filteredLeads.filter((l: any) => !mapped.has(l.status));
    if (unmapped.length) map["novo"] = [...(map["novo"] ?? []), ...unmapped];
    return map;
  }, [filteredLeads, currentJornada]);

  const openAction = (lead: any, type: string) => {
    setActionDialog({ open: true, lead, type });
    setActionForm({ description: "", nextAction: "", nextActionDate: "", newStage: "" });
  };

  const openWhatsApp = (lead: any) => {
    const phone = lead.telefone?.replace(/\D/g, "");
    if (!phone) return toast.error("Telefone não cadastrado");
    const msg = encodeURIComponent(
      `Olá ${lead.name?.split(" ")[0] ?? ""}! Sou da Leman Negócios Imobiliários. Como posso ajudá-lo?`
    );
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
    addInteractionMutation.mutate({
      leadId: lead.id,
      type: "whatsapp",
      description: "Contato iniciado pelo admin via WhatsApp",
    });
  };

  const actionLabels: Record<string, string> = {
    ligacao: "📞 Registrar Ligação",
    whatsapp: "💬 Registrar WhatsApp",
    email: "📧 Registrar E-mail",
    visita: "🏠 Registrar Visita",
    reuniao: "🤝 Registrar Reunião",
    proposta: "📄 Registrar Proposta",
    nota: "📝 Adicionar Nota",
    status_change: "🔄 Mudar Status",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM — Gestão de Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            Jornada completa · Qualificação inteligente · Sem perder nenhum lead
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"
            onClick={() => setViewMode(viewMode === "kanban" ? "lista" : "kanban")}>
            {viewMode === "kanban" ? "Vista Lista" : "Vista Kanban"}
          </Button>
          <Button size="sm" onClick={() => setLocation("/admin/leads/new")}>
            <Plus className="w-4 h-4 mr-1" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          {(stats as any).alertas?.novosHoje > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Bell className="w-4 h-4" />
              <span><strong>{(stats as any).alertas.novosHoje}</strong> novo{(stats as any).alertas.novosHoje > 1 ? "s" : ""} lead{(stats as any).alertas.novosHoje > 1 ? "s" : ""} hoje</span>
            </div>
          )}
          {(stats as any).alertas?.semContato3Dias > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              <span><strong>{(stats as any).alertas.semContato3Dias}</strong> lead{(stats as any).alertas.semContato3Dias > 1 ? "s" : ""} sem contato há +3 dias</span>
            </div>
          )}
          {(stats as any).alertas?.quentes > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <Zap className="w-4 h-4" />
              <span><strong>{(stats as any).alertas.quentes}</strong> lead{(stats as any).alertas.quentes > 1 ? "s" : ""} quente{(stats as any).alertas.quentes > 1 ? "s" : ""} (score ≥ 60)</span>
            </div>
          )}
        </div>
      )}

      {/* Métricas por finalidade */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <Card
          className={`cursor-pointer border-2 transition-all ${activeFinalidade === "todos" ? "border-primary bg-primary/5" : "border-transparent hover:border-slate-200"}`}
          onClick={() => setActiveFinalidade("todos")}
        >
          <div className="p-3 text-center">
            <div className="text-2xl font-bold">{(stats as any)?.total ?? (leads as any[]).length}</div>
            <div className="text-xs text-slate-500 mt-1">Todos</div>
          </div>
        </Card>
        {FINALIDADES.map((f) => {
          const Icon = f.icon;
          return (
            <Card
              key={f.id}
              className={`cursor-pointer border-2 transition-all ${activeFinalidade === f.id ? "border-primary bg-primary/5" : "border-transparent hover:border-slate-200"}`}
              onClick={() => setActiveFinalidade(f.id)}
            >
              <div className="p-3 text-center">
                <div className="flex justify-center mb-1">
                  <div className={`w-6 h-6 rounded-full ${f.color} flex items-center justify-center`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-xl font-bold">{(stats as any)?.byFinalidade?.[f.id] ?? 0}</div>
                <div className="text-xs text-slate-500 leading-tight">{f.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Estágio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estágios</SelectItem>
            {currentJornada.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-slate-500">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Kanban */}
      {viewMode === "kanban" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${currentJornada.length * 272}px` }}>
            {currentJornada.map((stage) => {
              const stageLeads = leadsByStage[stage.id] ?? [];
              return (
                <div key={stage.id} className="flex-shrink-0 w-64">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${stage.color}`}>
                    <span className="text-sm font-semibold">{stage.label}</span>
                    <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                  </div>
                  <div className="bg-slate-50 rounded-b-lg min-h-[200px] p-2 space-y-2 border border-t-0 border-slate-200">
                    {stageLeads.length === 0 && (
                      <div className="text-center text-xs text-slate-400 py-8">Nenhum lead</div>
                    )}
                    {stageLeads.map((lead: any) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onView={() => setDetailDialog({ open: true, lead })}
                        onEdit={() => setLocation(`/admin/leads/${lead.id}`)}
                        onWhatsApp={() => openWhatsApp(lead)}
                        onAction={(type) => openAction(lead, type)}
                        onQualify={() => {
                          setQualifyDialog({ open: true, lead });
                          setQualifyForm({ finalidade: lead.finalidade ?? "", notes: "" });
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-slate-400">Nenhum lead encontrado.</div>
          )}
          {filteredLeads.map((lead: any) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onView={() => setDetailDialog({ open: true, lead })}
              onEdit={() => setLocation(`/admin/leads/${lead.id}`)}
              onWhatsApp={() => openWhatsApp(lead)}
              onAction={(type) => openAction(lead, type)}
              onQualify={() => {
                setQualifyDialog({ open: true, lead });
                setQualifyForm({ finalidade: lead.finalidade ?? "", notes: "" });
              }}
              onDelete={() => {
                if (confirm("Remover este lead?")) deleteMutation.mutate({ id: lead.id });
              }}
            />
          ))}
        </div>
      )}

      {/* Dialog: Ação Rápida */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(o) => setActionDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{actionLabels[actionDialog.type] ?? "Registrar Interação"}</DialogTitle>
          </DialogHeader>
          {actionDialog.lead && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-2">
              <strong>{actionDialog.lead.name}</strong> · {actionDialog.lead.telefone ?? "sem telefone"}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>Descrição / Observação</Label>
              <Textarea
                placeholder="O que aconteceu nesta interação?"
                value={actionForm.description}
                onChange={(e) => setActionForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label>Próxima Ação</Label>
              <Input
                placeholder="Ex: Ligar amanhã, Agendar visita..."
                value={actionForm.nextAction}
                onChange={(e) => setActionForm((p) => ({ ...p, nextAction: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data da Próxima Ação</Label>
              <Input
                type="datetime-local"
                value={actionForm.nextActionDate}
                onChange={(e) => setActionForm((p) => ({ ...p, nextActionDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Avançar para Estágio</Label>
              <Select
                value={actionForm.newStage}
                onValueChange={(v) => setActionForm((p) => ({ ...p, newStage: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Manter estágio atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Manter estágio atual</SelectItem>
                  {currentJornada.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, lead: null, type: "nota" })}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!actionDialog.lead) return;
                addInteractionMutation.mutate({
                  leadId: actionDialog.lead.id,
                  type: actionDialog.type as any,
                  description: actionForm.description || undefined,
                  nextAction: actionForm.nextAction || undefined,
                  nextActionDate: actionForm.nextActionDate || undefined,
                  newStage: (actionForm.newStage || undefined) as any,
                });
              }}
              disabled={addInteractionMutation.isPending}
            >
              {addInteractionMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Qualificar */}
      <Dialog
        open={qualifyDialog.open}
        onOpenChange={(o) => setQualifyDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Qualificar Lead</DialogTitle></DialogHeader>
          {qualifyDialog.lead && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-2">
              <strong>{qualifyDialog.lead.name}</strong> · {qualifyDialog.lead.telefone ?? "sem telefone"}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label className="mb-2 block">O que este cliente busca? *</Label>
              <div className="grid grid-cols-1 gap-2">
                {FINALIDADES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setQualifyForm((p) => ({ ...p, finalidade: f.id }))}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        qualifyForm.finalidade === f.id
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${f.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{f.label}</div>
                        <div className="text-xs text-slate-500">{f.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Detalhes da qualificação..."
                value={qualifyForm.notes}
                onChange={(e) => setQualifyForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQualifyDialog({ open: false, lead: null })}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!qualifyDialog.lead || !qualifyForm.finalidade) return;
                qualifyMutation.mutate({
                  id: qualifyDialog.lead.id,
                  finalidade: qualifyForm.finalidade as any,
                  notes: qualifyForm.notes || undefined,
                });
              }}
              disabled={!qualifyForm.finalidade || qualifyMutation.isPending}
            >
              {qualifyMutation.isPending ? "Salvando..." : "Qualificar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(o) => setDetailDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Lead</DialogTitle></DialogHeader>
          {detailDialog.lead && <LeadDetail lead={detailDialog.lead} />}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialog({ open: false, lead: null })}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setDetailDialog({ open: false, lead: null });
                setLocation(`/admin/leads/${detailDialog.lead?.id}`);
              }}
            >
              <Pencil className="w-4 h-4 mr-1" /> Editar Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── LeadCard ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead, onView, onEdit, onWhatsApp, onAction, onQualify,
}: {
  lead: any; onView: () => void; onEdit: () => void;
  onWhatsApp: () => void; onAction: (t: string) => void; onQualify: () => void;
}) {
  const fin = FINALIDADES.find((f) => f.id === lead.finalidade);
  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm border space-y-2 ${getAlertBorder(lead.daysSinceContact ?? 0)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarFallback className="text-xs">{getInitials(lead.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{lead.name}</div>
            <div className="text-xs text-slate-500 truncate">{lead.telefone ?? lead.email ?? "—"}</div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0">
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}><Eye className="w-3 h-3 mr-2" />Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}><Pencil className="w-3 h-3 mr-2" />Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onWhatsApp}><MessageSquare className="w-3 h-3 mr-2" />WhatsApp</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("ligacao")}><Phone className="w-3 h-3 mr-2" />Ligar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("visita")}><Home className="w-3 h-3 mr-2" />Visita</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("proposta")}><FileText className="w-3 h-3 mr-2" />Proposta</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onQualify}><Star className="w-3 h-3 mr-2" />Qualificar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-1">
        {!lead.finalidade && (
          <button
            onClick={onQualify}
            className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors"
          >
            ⚡ Qualificar
          </button>
        )}
        {fin && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${fin.lightColor}`}>
            {fin.label}
          </span>
        )}
        {lead.origem && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {ORIGENS[lead.origem] ?? lead.origem}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getScoreColor(lead.score ?? 0)}`}>
          Score {lead.score ?? 0}
        </span>
        {(lead.daysSinceContact ?? 0) >= 3 && (
          <span className="text-xs text-orange-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />{lead.daysSinceContact}d
          </span>
        )}
      </div>
      {lead.nextAction?.action && (
        <div className="text-xs text-slate-500 bg-slate-50 rounded p-1.5 truncate">
          → {lead.nextAction.action}
        </div>
      )}
      <div className="flex gap-1 pt-1">
        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={onWhatsApp}>
          <MessageSquare className="w-3 h-3 mr-1" />WhatsApp
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => onAction("nota")}>
          <FileText className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={onEdit}>
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── LeadRow ──────────────────────────────────────────────────────────────────

function LeadRow({
  lead, onView, onEdit, onWhatsApp, onAction, onQualify, onDelete,
}: {
  lead: any; onView: () => void; onEdit: () => void; onWhatsApp: () => void;
  onAction: (t: string) => void; onQualify: () => void; onDelete: () => void;
}) {
  const fin = FINALIDADES.find((f) => f.id === lead.finalidade);
  return (
    <div className={`flex items-center gap-3 bg-white rounded-lg p-3 border hover:shadow-sm transition-shadow ${getAlertBorder(lead.daysSinceContact ?? 0)}`}>
      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarFallback className="text-sm">{getInitials(lead.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{lead.name}</div>
          <div className="text-xs text-slate-500 truncate">{lead.telefone ?? lead.email ?? "—"}</div>
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          {fin ? (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${fin.lightColor}`}>{fin.label}</span>
          ) : (
            <button
              onClick={onQualify}
              className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200"
            >
              ⚡ Qualificar
            </button>
          )}
          {lead.origem && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {ORIGENS[lead.origem] ?? lead.origem}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getScoreColor(lead.score ?? 0)}`}>
            {lead.score ?? 0}pts
          </span>
          {(lead.daysSinceContact ?? 0) >= 3 && (
            <span className="text-xs text-orange-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />{lead.daysSinceContact}d
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {lead.nextAction?.action ?? fmtRelative(lead.ultima_interacao ?? lead.created_at)}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={onWhatsApp} title="WhatsApp">
          <MessageSquare className="w-4 h-4 text-green-600" />
        </Button>
        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={onView} title="Ver detalhes">
          <Eye className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="w-8 h-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Pencil className="w-3 h-3 mr-2" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("ligacao")}><Phone className="w-3 h-3 mr-2" />Ligar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("visita")}><Home className="w-3 h-3 mr-2" />Visita</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("proposta")}><FileText className="w-3 h-3 mr-2" />Proposta</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("nota")}><FileText className="w-3 h-3 mr-2" />Nota</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onQualify}><Star className="w-3 h-3 mr-2" />Qualificar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <XCircle className="w-3 h-3 mr-2" />Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── LeadDetail ───────────────────────────────────────────────────────────────

function LeadDetail({ lead }: { lead: any }) {
  const fin = FINALIDADES.find((f) => f.id === lead.finalidade);
  const Icon = fin?.icon ?? Users;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="text-base">{getInitials(lead.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{lead.name}</div>
          <div className="text-sm text-slate-500">{lead.email ?? "—"}</div>
          <div className="text-sm text-slate-500">{lead.telefone ?? "—"}</div>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-lg font-bold px-3 py-1 rounded-lg ${getScoreColor(lead.score ?? 0)}`}>
            {lead.score ?? 0}pts
          </div>
          <div className="text-xs text-slate-500 mt-1">Score</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Intenção</div>
          {fin ? (
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full ${fin.color} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium">{fin.label}</span>
            </div>
          ) : (
            <span className="text-amber-600">Não qualificado</span>
          )}
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Origem</div>
          <div className="font-medium">{ORIGENS[lead.origem] ?? lead.origem ?? "—"}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Orçamento</div>
          <div className="font-medium text-xs">
            {lead.orcamento_min || lead.orcamento_max
              ? `${fmtBRL(lead.orcamento_min)} – ${fmtBRL(lead.orcamento_max)}`
              : "—"}
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Sem contato</div>
          <div className={`font-medium ${(lead.daysSinceContact ?? 0) >= 3 ? "text-orange-600" : ""}`}>
            {lead.daysSinceContact ?? 0} dia{lead.daysSinceContact !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
      {lead.nextAction?.action && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-semibold mb-1">Próxima Ação Recomendada</div>
          <div className="text-sm text-blue-800">{lead.nextAction.action}</div>
        </div>
      )}
      {lead.observacoes && (
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Observações</div>
          <div className="text-sm">{lead.observacoes}</div>
        </div>
      )}
      <div className="text-xs text-slate-400 flex justify-between">
        <span>Criado: {fmtDate(lead.created_at)}</span>
        <span>{lead.interactionCount ?? 0} interaç{(lead.interactionCount ?? 0) !== 1 ? "ões" : "ão"}</span>
      </div>
    </div>
  );
}
