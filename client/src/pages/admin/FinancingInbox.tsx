import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Search, Phone, Mail, CheckCircle, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function FinancingInbox() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: simulations = [], isLoading } = trpc.financing.list.useQuery();

  const markContacted = trpc.financing.markContacted.useMutation({
    onSuccess: () => {
      toast.success("Marcado como contatado!");
      utils.financing.list.invalidate();
      if (selected) setSelected({ ...selected, contacted: true, status: "contacted" });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const filtered = simulations.filter((s: any) =>
    (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? "").includes(search)
  );

  const pending = simulations.filter((s: any) => !s.contacted).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Simulações de Financiamento</h1>
          <p className="text-muted-foreground">Leads que simularam financiamento no site</p>
        </div>
        {pending > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {pending} pendente{pending > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{simulations.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-400">{pending}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Contatados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-400">{simulations.length - pending}</p></CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>Valor Imóvel</TableHead>
              <TableHead>Parcela Média</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma simulação encontrada</TableCell></TableRow>
            ) : filtered.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell>
                  {s.contacted
                    ? <Badge variant="outline" className="text-green-400 border-green-400/40"><CheckCircle className="h-3 w-3 mr-1" />Contatado</Badge>
                    : <Badge variant="outline" className="text-orange-400 border-orange-400/40"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>}
                </TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-sm">
                    {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3" />{s.phone}</a>}
                    {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{s.email}</a>}
                  </div>
                </TableCell>
                <TableCell>{s.selected_bank ?? "—"}</TableCell>
                <TableCell>{fmt(s.property_value)}</TableCell>
                <TableCell>{fmt(s.average_installment)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => setSelected(s)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!s.contacted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markContacted.mutate({ id: s.id })}
                      disabled={markContacted.isPending}
                    >
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Simulação</DialogTitle>
            <DialogDescription>{selected?.name} — {fmtDate(selected?.created_at)}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {selected.phone}</div>
                <div><span className="text-muted-foreground">Banco:</span> {selected.selected_bank ?? "—"}</div>
                <div><span className="text-muted-foreground">Sistema:</span> {selected.amortization_system}</div>
                <div><span className="text-muted-foreground">Valor imóvel:</span> {fmt(selected.property_value)}</div>
                <div><span className="text-muted-foreground">Entrada:</span> {fmt(selected.down_payment)}</div>
                <div><span className="text-muted-foreground">Financiado:</span> {fmt(selected.financed_amount)}</div>
                <div><span className="text-muted-foreground">Prazo:</span> {selected.term_months} meses</div>
                <div><span className="text-muted-foreground">1ª parcela:</span> {fmt(selected.first_installment)}</div>
                <div><span className="text-muted-foreground">Última parcela:</span> {fmt(selected.last_installment)}</div>
                <div><span className="text-muted-foreground">Parcela média:</span> {fmt(selected.average_installment)}</div>
                <div><span className="text-muted-foreground">Total pago:</span> {fmt(selected.total_amount)}</div>
                <div><span className="text-muted-foreground">Total juros:</span> {fmt(selected.total_interest)}</div>
                <div><span className="text-muted-foreground">Localização:</span> {selected.desired_location ?? "—"}</div>
              </div>
              {!selected.contacted && (
                <Button
                  className="w-full mt-2"
                  onClick={() => markContacted.mutate({ id: selected.id })}
                  disabled={markContacted.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Contatado
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
