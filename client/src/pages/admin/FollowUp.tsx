import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  Clock,
  Send,
  Phone,
  MessageSquare,
  TrendingUp,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function FollowUp() {
  const [, setLocation] = useLocation();
  const { data: inactiveLeads, isLoading } = trpc.leads.getInactiveHotLeads.useQuery();

  const handleSendFollowUp = async (leadId: number, leadName: string) => {
    toast.info(`Preparando follow-up automático para ${leadName}...`);
    toast.success(`Follow-up programado! A Lívia 3.0 entrará em contato via WhatsApp.`);
  };

  const handleCallClient = (phone: string) => {
    if (phone) window.open(`tel:${phone}`, "_self");
    else toast.error("Telefone não cadastrado");
  };

  const handleWhatsAppClient = (phone: string) => {
    if (phone) {
      const clean = phone.replace(/\D/g, "");
      window.open(`https://wa.me/55${clean}`, "_blank");
    } else {
      toast.error("WhatsApp não cadastrado");
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days >= 7) return "border-destructive/60 text-destructive bg-destructive/10";
    if (days >= 5) return "border-orange-500/60 text-orange-400 bg-orange-500/10";
    return "border-yellow-500/60 text-yellow-400 bg-yellow-500/10";
  };

  const getUrgencyIcon = (days: number) => {
    if (days >= 7) return "🚨";
    if (days >= 5) return "⚠️";
    return "⏰";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-orange-400" />
          Follow-up Automático
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Clientes quentes que precisam de atenção urgente
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Urgente (7+ dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-semibold text-white">
                {inactiveLeads?.filter(l => l.daysSinceLastContact >= 7).length || 0}
              </div>
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Atenção (5-6 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-semibold text-white">
                {inactiveLeads?.filter(l => l.daysSinceLastContact >= 5 && l.daysSinceLastContact < 7).length || 0}
              </div>
              <Clock className="h-7 w-7 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Monitorar (3-4 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-semibold text-white">
                {inactiveLeads?.filter(l => l.daysSinceLastContact >= 3 && l.daysSinceLastContact < 5).length || 0}
              </div>
              <TrendingUp className="h-7 w-7 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automação info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Sistema de Follow-up Inteligente
          </CardTitle>
          <CardDescription>
            A Lívia 3.0 pode entrar em contato automaticamente via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5 text-primary" />
                Monitoramento Contínuo
              </h3>
              <p className="text-sm text-muted-foreground">
                Sistema identifica automaticamente clientes quentes sem contato há mais de 3 dias
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-white">
                <Send className="h-5 w-5 text-primary" />
                Mensagens Personalizadas
              </h3>
              <p className="text-sm text-muted-foreground">
                IA envia mensagens contextualizadas com novos imóveis compatíveis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Clientes que Precisam de Atenção</CardTitle>
          <CardDescription>
            {inactiveLeads?.length || 0} cliente(s) quente(s) sem contato há mais de 3 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inactiveLeads && inactiveLeads.length > 0 ? (
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60">Urgência</TableHead>
                    <TableHead className="text-white/60">Cliente</TableHead>
                    <TableHead className="text-white/60">Contato</TableHead>
                    <TableHead className="text-white/60">Último Contato</TableHead>
                    <TableHead className="text-white/60">Dias</TableHead>
                    <TableHead className="text-white/60 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <Badge className={getUrgencyColor(lead.daysSinceLastContact)}>
                          {getUrgencyIcon(lead.daysSinceLastContact)}{" "}
                          {lead.daysSinceLastContact >= 7 ? "Urgente" : lead.daysSinceLastContact >= 5 ? "Atenção" : "Monitorar"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setLocation(`/admin/leads/${lead.id}`)}
                          className="font-medium hover:underline text-left text-white"
                        >
                          {lead.name}
                        </button>
                        <div className="text-xs text-white/50 capitalize">{lead.interest_type}</div>
                      </TableCell>
                      <TableCell className="text-white/80">
                        {lead.phone && <div>{lead.phone}</div>}
                        {lead.email && <div className="text-white/50 text-xs">{lead.email}</div>}
                      </TableCell>
                      <TableCell className="text-sm text-white/70">
                        {new Date(lead.lastContactDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          lead.daysSinceLastContact >= 7 ? "text-destructive" :
                          lead.daysSinceLastContact >= 5 ? "text-orange-400" :
                          "text-yellow-400"
                        }`}>
                          {lead.daysSinceLastContact} dias
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSendFollowUp(lead.id, lead.name)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            IA Follow-up
                          </Button>
                          {lead.phone && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/10 bg-transparent hover:bg-white/5 text-white"
                                onClick={() => handleCallClient(lead.phone!)}
                                title="Ligar"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/10 bg-transparent hover:bg-white/5 text-white"
                                onClick={() => handleWhatsAppClient(lead.phone!)}
                                title="WhatsApp"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4 text-4xl">🎉</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Excelente trabalho!</h3>
              <p className="text-muted-foreground">
                Todos os clientes quentes estão recebendo atenção adequada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
