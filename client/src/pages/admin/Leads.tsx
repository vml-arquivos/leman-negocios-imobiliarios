import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Calculator,
  Users,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

// ─── Kanban stages ───────────────────────────────────────────────────────────
const STAGES = [
  { id: "novo",            label: "Novo",            color: "bg-blue-100 text-blue-700" },
  { id: "contato_inicial", label: "Contato Inicial", color: "bg-purple-100 text-purple-700" },
  { id: "qualificado",     label: "Qualificado",     color: "bg-green-100 text-green-700" },
  { id: "visita_agendada", label: "Visita Agendada", color: "bg-yellow-100 text-yellow-700" },
  { id: "proposta",        label: "Proposta",        color: "bg-orange-100 text-orange-700" },
  { id: "fechado_ganho",   label: "Fechado",         color: "bg-primary/10 text-primary" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBRL = (cents: number | null | undefined) => {
  if (!cents) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(cents) / 100
  );
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LeadsAdmin() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [simSearch, setSimSearch] = useState("");
  const [simFilter, setSimFilter] = useState<"all" | "pending" | "contacted">("all");
  const [selectedSim, setSelectedSim] = useState<any>(null);

  // ── Leads ──────────────────────────────────────────────────────────────────
  const { data: allLeads, refetch: refetchLeads } = trpc.leads.list.useQuery();

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => { toast.success("Lead excluído!"); refetchLeads(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => { toast.success("Lead atualizado!"); refetchLeads(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  // ── Simulações ─────────────────────────────────────────────────────────────
  const { data: simulations, refetch: refetchSims } = trpc.financing.listWithLeads.useQuery();

  const markContacted = trpc.financing.markContacted.useMutation({
    onSuccess: () => { toast.success("Marcado como contatado!"); refetchSims(); setSelectedSim(null); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  // ── Filtros simulações ─────────────────────────────────────────────────────
  const filteredSims = (simulations ?? []).filter((s: any) => {
    const matchSearch =
      !simSearch ||
      s.name?.toLowerCase().includes(simSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(simSearch.toLowerCase()) ||
      s.phone?.includes(simSearch);
    const matchFilter =
      simFilter === "all" ||
      (simFilter === "pending" && !s.contacted) ||
      (simFilter === "contacted" && s.contacted);
    return matchSearch && matchFilter;
  });

  const pendingCount = (simulations ?? []).filter((s: any) => !s.contacted).length;
  const totalSims = (simulations ?? []).length;

  // ── Kanban helpers ─────────────────────────────────────────────────────────
  const getLeadsByStage = (stage: string) =>
    (allLeads ?? []).filter((lead: any) => (lead.stage ?? lead.status) === stage);

  const buildWhatsappUrl = (s: any) => {
    const msg = encodeURIComponent(
      `Olá ${s.name}! Vi que você fez uma simulação de financiamento no nosso site.\n\n` +
      `🏦 Banco: ${s.selected_bank ?? "—"}\n` +
      `🏠 Valor: ${fmtBRL(s.property_value)}\n` +
      `💰 Entrada: ${fmtBRL(s.down_payment)}\n` +
      `📅 Prazo: ${s.term_months} meses\n` +
      `💵 1ª parcela: ${fmtBRL(s.first_installment)}\n\n` +
      `Posso te ajudar a encontrar o melhor financiamento?`
    );
    const phone = s.phone?.replace(/\D/g, "");
    return `https://wa.me/55${phone}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">Leads & Simulações</h1>
            <p className="text-muted-foreground">Gerencie seu pipeline e leads quentes do simulador</p>
          </div>
          <Button onClick={() => setLocation("/admin/leads/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{allLeads?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total de Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calculator className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{totalSims}</p>
                <p className="text-xs text-muted-foreground">Simulações</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Aguardando Contato</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {totalSims > 0 ? Math.round(((totalSims - pendingCount) / totalSims) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Taxa de Contato</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="simulations" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Simulações
              {pendingCount > 0 && (
                <Badge className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── ABA LEADS ───────────────────────────────────────────────────── */}
          <TabsContent value="leads" className="mt-6">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "default" : "outline"}
                onClick={() => setViewMode("kanban")}
              >
                Kanban
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                Lista
              </Button>
            </div>

            {viewMode === "kanban" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {STAGES.map((stage) => {
                  const stageLeads = getLeadsByStage(stage.id);
                  return (
                    <Card key={stage.id} className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span>{stage.label}</span>
                          <Badge variant="secondary">{stageLeads.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {stageLeads.length > 0 ? (
                          stageLeads.map((lead: any) => (
                            <Card key={lead.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(lead.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{lead.name}</p>
                                    <p className="text-xs text-muted-foreground">{lead.origem ?? lead.source}</p>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {STAGES.map((s) => (
                                      <DropdownMenuItem
                                        key={s.id}
                                        onClick={() => updateMutation.mutate({ id: lead.id, data: { stage: s.id as any } })}
                                      >
                                        Mover para {s.label}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem onClick={() => setLocation(`/admin/leads/edit/${lead.id}`)}>
                                      <Pencil className="mr-2 h-3 w-3" />Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => { if (confirm("Excluir lead?")) deleteMutation.mutate({ id: lead.id }); }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-3 w-3" />Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="space-y-1 text-xs">
                                {lead.email && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="h-3 w-3" /><span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                                {(lead.telefone ?? lead.phone) && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" /><span>{lead.telefone ?? lead.phone}</span>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))
                        ) : (
                          <p className="text-center text-xs text-muted-foreground py-4">Nenhum lead</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(allLeads ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum lead encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        (allLeads ?? []).map((lead: any) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 text-sm">
                                {lead.email && <span className="text-muted-foreground">{lead.email}</span>}
                                {(lead.telefone ?? lead.phone) && (
                                  <a href={`tel:${lead.telefone ?? lead.phone}`} className="flex items-center gap-1 hover:text-primary">
                                    <Phone className="h-3 w-3" />{lead.telefone ?? lead.phone}
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{lead.origem ?? lead.source ?? "—"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={STAGES.find(s => s.id === (lead.stage ?? lead.status))?.color ?? "bg-gray-100 text-gray-700"}>
                                {STAGES.find(s => s.id === (lead.stage ?? lead.status))?.label ?? (lead.stage ?? lead.status ?? "—")}
                              </Badge>
                            </TableCell>
                            <TableCell>{lead.score ?? 0}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{fmtDate(lead.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setLocation(`/admin/leads/edit/${lead.id}`)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── ABA SIMULAÇÕES ───────────────────────────────────────────────── */}
          <TabsContent value="simulations" className="mt-6 space-y-4">

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={simSearch}
                  onChange={(e) => setSimSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "pending", "contacted"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={simFilter === f ? "default" : "outline"}
                    onClick={() => setSimFilter(f)}
                  >
                    {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Contatados"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tabela */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Valor Imóvel</TableHead>
                      <TableHead>1ª Parcela</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSims.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Nenhuma simulação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSims.map((s: any) => (
                        <TableRow key={s.id} className={!s.contacted ? "bg-orange-50/40 dark:bg-orange-950/10" : ""}>
                          <TableCell>
                            {s.contacted ? (
                              <Badge variant="outline" className="text-green-600 border-green-400/40 gap-1">
                                <CheckCircle className="h-3 w-3" />Contatado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-500 border-orange-400/40 gap-1">
                                <Clock className="h-3 w-3" />Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-sm">
                              {s.phone && (
                                <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-primary">
                                  <Phone className="h-3 w-3" />{s.phone}
                                </a>
                              )}
                              {s.email && (
                                <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-primary">
                                  <Mail className="h-3 w-3" />{s.email}
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{s.selected_bank ?? "—"}</TableCell>
                          <TableCell>{fmtBRL(s.property_value)}</TableCell>
                          <TableCell className="font-semibold text-amber-600">{fmtBRL(s.first_installment)}</TableCell>
                          <TableCell>{s.term_months ? `${s.term_months}m` : "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSim(s)} title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {s.phone && (
                              <a
                                href={buildWhatsappUrl(s)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Contatar via WhatsApp"
                              >
                                <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            {!s.contacted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700"
                                title="Marcar como contatado"
                                onClick={() => markContacted.mutate({ id: s.id })}
                                disabled={markContacted.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de detalhes da simulação */}
      <Dialog open={!!selectedSim} onOpenChange={(o) => !o && setSelectedSim(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Simulação #{selectedSim?.id}</DialogTitle>
            <DialogDescription>
              {selectedSim?.name} — {fmtDate(selectedSim?.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedSim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {selectedSim.email ?? "—"}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {selectedSim.phone ?? "—"}</div>
                <div><span className="text-muted-foreground">Banco:</span> {selectedSim.selected_bank ?? "—"}</div>
                <div><span className="text-muted-foreground">Sistema:</span> {selectedSim.amortization_system ?? "—"}</div>
                <div><span className="text-muted-foreground">Tipo imóvel:</span> {selectedSim.property_type ?? "—"}</div>
                <div><span className="text-muted-foreground">Localização:</span> {selectedSim.desired_location ?? "—"}</div>
                <div><span className="text-muted-foreground">Valor imóvel:</span> {fmtBRL(selectedSim.property_value)}</div>
                <div><span className="text-muted-foreground">Entrada:</span> {fmtBRL(selectedSim.down_payment)}</div>
                <div><span className="text-muted-foreground">Financiado:</span> {fmtBRL(selectedSim.financed_amount)}</div>
                <div><span className="text-muted-foreground">Prazo:</span> {selectedSim.term_months} meses</div>
                <div><span className="text-muted-foreground">1ª parcela:</span> {fmtBRL(selectedSim.first_installment)}</div>
                <div><span className="text-muted-foreground">Última parcela:</span> {fmtBRL(selectedSim.last_installment)}</div>
                <div><span className="text-muted-foreground">Parcela média:</span> {fmtBRL(selectedSim.average_installment)}</div>
                <div><span className="text-muted-foreground">Total pago:</span> {fmtBRL(selectedSim.total_amount)}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Total juros:</span> {fmtBRL(selectedSim.total_interest)}</div>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedSim.phone && (
                  <a href={buildWhatsappUrl(selectedSim)} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contatar no WhatsApp
                    </Button>
                  </a>
                )}
                {!selectedSim.contacted && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => markContacted.mutate({ id: selectedSim.id })}
                    disabled={markContacted.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar Contatado
                  </Button>
                )}
              </div>

              {selectedSim.lead_id && (
                <p className="text-xs text-muted-foreground text-center">
                  Lead #{selectedSim.lead_id} · Status: {selectedSim.lead_status ?? "—"} · Score: {selectedSim.lead_score ?? 0}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
