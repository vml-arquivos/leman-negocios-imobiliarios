import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Flame, 
  Thermometer, 
  Snowflake, 
  Users, 
  Send, 
  Bot,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ClientManagement() {
  const [, setLocation] = useLocation();
  const { data: leads, refetch } = trpc.leads.list.useQuery();
  const createLead = trpc.leads.create.useMutation();
  const updateLead = trpc.leads.update.useMutation();
  const deleteLead = trpc.leads.delete.useMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    clientType: "comprador",
    qualification: "nao_qualificado",
    stage: "novo",
  });

  // Segmentação de clientes
  const newClients = leads?.filter(lead => {
    const createdDate = new Date(lead.createdAt);
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated <= 7;
  }) || [];

  const hotClients = leads?.filter(lead => lead.qualification === 'quente') || [];
  const warmClients = leads?.filter(lead => lead.qualification === 'morno') || [];
  const coldClients = leads?.filter(lead => lead.qualification === 'frio') || [];

  const handleOpenDialog = (lead?: any) => {
    if (lead) {
      setSelectedLead(lead);
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        clientType: lead.clientType || "comprador",
        qualification: lead.qualification || "nao_qualificado",
        stage: lead.stage || "novo",
      });
    } else {
      setSelectedLead(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        clientType: "comprador",
        qualification: "nao_qualificado",
        stage: "novo",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveClient = async () => {
    try {
      if (selectedLead) {
        await updateLead.mutateAsync({
          id: selectedLead.id,
          ...formData,
        });
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await createLead.mutateAsync(formData);
        toast.success("Cliente criado com sucesso!");
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedLead) return;
    
    try {
      await deleteLead.mutateAsync({ id: selectedLead.id });
      toast.success("Cliente excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedLead(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    }
  };

  const handleSendProperties = async (leadId: number) => {
    try {
      const lead = leads?.find(l => l.id === leadId);
      if (!lead) {
        toast.error("Lead não encontrado");
        return;
      }

      const response = await fetch(`/api/trpc/leads.matchProperties?input=${encodeURIComponent(JSON.stringify({ leadId }))}`);
      const data = await response.json();
      const properties = data.result?.data || [];

      if (properties.length === 0) {
        toast.info(`Nenhum imóvel compatível encontrado para ${lead.name}`);
        return;
      }

      toast.success(`${properties.length} imóveis compatíveis encontrados para ${lead.name}! Envio via WhatsApp será implementado com N8N.`);
    } catch (error) {
      toast.error("Erro ao buscar imóveis compatíveis");
    }
  };

  const handleScheduleMessage = (leadId: number) => {
    toast.info("Agendamento de mensagem será implementado com N8N");
  };

  const getQualificationBadge = (qualification: string) => {
    const variants: Record<string, { icon: any; color: string; label: string }> = {
      quente: { icon: Flame, color: "bg-red-100 text-red-700", label: "Quente" },
      morno: { icon: Thermometer, color: "bg-yellow-100 text-yellow-700", label: "Morno" },
      frio: { icon: Snowflake, color: "bg-blue-100 text-blue-700", label: "Frio" },
      nao_qualificado: { icon: Clock, color: "bg-gray-100 text-gray-700", label: "Não Qualificado" },
    };
    const variant = variants[qualification] || variants.nao_qualificado;
    const Icon = variant.icon;
    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const ClientTable = ({ clients, showActions = true }: { clients: any[], showActions?: boolean }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Qualificação</TableHead>
            <TableHead>Estágio</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length > 0 ? (
            clients.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">
                  <button
                    onClick={() => setLocation(`/admin/leads/${lead.id}`)}
                    className="hover:underline text-left"
                  >
                    {lead.name}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {lead.phone && <div>{lead.phone}</div>}
                    {lead.email && <div className="text-muted-foreground">{lead.email}</div>}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{lead.clientType}</TableCell>
                <TableCell>{getQualificationBadge(lead.qualification)}</TableCell>
                <TableCell className="capitalize text-sm">{lead.stage?.replace('_', ' ')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {showActions && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendProperties(lead.id)}
                          title="Enviar imóveis compatíveis"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleMessage(lead.id)}
                          title="Programar mensagem"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(lead)}
                      title="Editar cliente"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="Excluir cliente"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhum cliente nesta categoria
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestão Inteligente de Clientes</h1>
            <p className="text-muted-foreground">
              Segmentação automática e envio de imóveis pela IA
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Novos (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{newClients.length}</div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Quentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">{hotClients.length}</div>
                <Flame className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Mornos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-yellow-600">{warmClients.length}</div>
                <Thermometer className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Frios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{coldClients.length}</div>
                <Snowflake className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Automáticas da IA */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-purple-600" />
              Ações Automáticas da IA (Lívia 3.0)
            </CardTitle>
            <CardDescription>
              Sistema inteligente de análise e envio de imóveis compatíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Análise Contínua</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  IA monitora perfil dos clientes e identifica oportunidades automaticamente
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Envio Inteligente</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Imóveis compatíveis são enviados automaticamente via WhatsApp
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Follow-up Automático</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sistema mantém contato regular e nutre relacionamento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Segmentação */}
        <Card>
          <CardHeader>
            <CardTitle>Base de Clientes Segmentada</CardTitle>
            <CardDescription>
              Organize e gerencie seus clientes por temperatura e status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="new">
                  Novos ({newClients.length})
                </TabsTrigger>
                <TabsTrigger value="hot">
                  🔥 Quentes ({hotClients.length})
                </TabsTrigger>
                <TabsTrigger value="warm">
                  🌡️ Mornos ({warmClients.length})
                </TabsTrigger>
                <TabsTrigger value="cold">
                  ❄️ Frios ({coldClients.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  Todos ({leads?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-6">
                <ClientTable clients={newClients} />
              </TabsContent>

              <TabsContent value="hot" className="mt-6">
                <ClientTable clients={hotClients} />
              </TabsContent>

              <TabsContent value="warm" className="mt-6">
                <ClientTable clients={warmClients} />
              </TabsContent>

              <TabsContent value="cold" className="mt-6">
                <ClientTable clients={coldClients} />
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <ClientTable clients={leads || []} showActions={false} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Criar/Editar Cliente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedLead ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {selectedLead ? "Atualize as informações do cliente" : "Preencha os dados do novo cliente"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clientType">Tipo de Cliente</Label>
              <Select
                value={formData.clientType}
                onValueChange={(value) => setFormData({ ...formData, clientType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprador">Comprador</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="locador">Locador</SelectItem>
                  <SelectItem value="locatario">Locatário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qualification">Qualificação</Label>
              <Select
                value={formData.qualification}
                onValueChange={(value) => setFormData({ ...formData, qualification: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quente">🔥 Quente</SelectItem>
                  <SelectItem value="morno">🌡️ Morno</SelectItem>
                  <SelectItem value="frio">❄️ Frio</SelectItem>
                  <SelectItem value="nao_qualificado">Não Qualificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage">Estágio</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contato_inicial">Contato Inicial</SelectItem>
                  <SelectItem value="qualificacao">Qualificação</SelectItem>
                  <SelectItem value="visita_agendada">Visita Agendada</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="negociacao">Negociação</SelectItem>
                  <SelectItem value="fechamento">Fechamento</SelectItem>
                  <SelectItem value="pos_venda">Pós-venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveClient} disabled={!formData.name}>
              {selectedLead ? "Salvar Alterações" : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{selectedLead?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
