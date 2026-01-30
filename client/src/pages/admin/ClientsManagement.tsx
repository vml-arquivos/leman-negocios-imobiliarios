import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils-types";
import {
  Users,
  UserPlus,
  Home,
  ShoppingCart,
  Building2,
  DollarSign,
  Search,
  Edit,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  MessageSquare,
  FileText,
  Loader2,
  User,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

// Tipo para cliente unificado
interface UnifiedClient {
  id: number;
  entityType: 'lead' | 'landlord' | 'tenant';
  name: string;
  email: string | null;
  phone: string | null;
  clientType: string;
  source: string;
  status: string;
  qualification: string | null;
  score: number | null;
  lastInteraction: Date | null;
  createdAt: Date;
}

export default function ClientsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientType, setSelectedClientType] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<UnifiedClient | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Buscar clientes unificados via tRPC
  const { data: clientsData, isLoading: isLoadingClients, refetch } = trpc.clients.getAll.useQuery({
    limit: 100,
    search: searchTerm || undefined,
    type: selectedClientType !== 'all' ? selectedClientType : undefined,
    source: selectedSource !== 'all' ? selectedSource : undefined,
  });

  // Buscar estatísticas
  const { data: stats } = trpc.clients.getStats.useQuery();

  // Buscar perfil do cliente selecionado
  const { data: clientProfile, isLoading: isLoadingProfile } = trpc.clients.getProfile.useQuery(
    { entityType: selectedClient?.entityType || 'lead', id: selectedClient?.id || 0 },
    { enabled: !!selectedClient }
  );

  // Buscar dados financeiros do cliente
  const { data: clientFinancials, isLoading: isLoadingFinancials } = trpc.clients.getFinancials.useQuery(
    { entityType: selectedClient?.entityType || 'lead', id: selectedClient?.id || 0 },
    { enabled: !!selectedClient }
  );

  // Buscar imóveis do cliente
  const { data: clientProperties, isLoading: isLoadingProperties } = trpc.clients.getProperties.useQuery(
    { entityType: selectedClient?.entityType || 'lead', id: selectedClient?.id || 0 },
    { enabled: !!selectedClient }
  );

  // Buscar interações do cliente
  const { data: clientInteractions, isLoading: isLoadingInteractions } = trpc.clients.getInteractions.useQuery(
    { entityType: selectedClient?.entityType || 'lead', id: selectedClient?.id || 0 },
    { enabled: !!selectedClient }
  );

  const clients = clientsData?.items || [];

  const getClientTypeBadge = (type: string) => {
    const variants: Record<string, { icon: any; color: string; label: string }> = {
      'Proprietário': { icon: Home, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", label: "Proprietário" },
      'Comprador': { icon: ShoppingCart, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", label: "Comprador" },
      'Locatário': { icon: Users, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", label: "Locatário" },
      'Lead': { icon: TrendingUp, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", label: "Lead" },
    };
    const variant = variants[type] || variants['Lead'];
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      whatsapp: "bg-green-500 text-white",
      instagram: "bg-pink-500 text-white",
      facebook: "bg-blue-600 text-white",
      site: "bg-gray-500 text-white",
      indicacao: "bg-orange-500 text-white",
      cadastro: "bg-slate-500 text-white",
    };
    return <Badge className={colors[source] || "bg-gray-500 text-white"}>{source}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      novo: { color: "bg-blue-100 text-blue-700", icon: Clock },
      contato_inicial: { color: "bg-yellow-100 text-yellow-700", icon: MessageSquare },
      qualificado: { color: "bg-green-100 text-green-700", icon: CheckCircle },
      visita_agendada: { color: "bg-purple-100 text-purple-700", icon: Calendar },
      proposta: { color: "bg-orange-100 text-orange-700", icon: FileText },
      fechado_ganho: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
      fechado_perdido: { color: "bg-red-100 text-red-700", icon: XCircle },
      ativo: { color: "bg-green-100 text-green-700", icon: CheckCircle },
      inativo: { color: "bg-gray-100 text-gray-700", icon: AlertCircle },
    };
    const config = statusConfig[status] || statusConfig.novo;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const handleClientClick = (client: UnifiedClient) => {
    setSelectedClient(client);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">CRM 360º</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Gestão unificada de clientes, proprietários e leads
            </p>
          </div>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl md:text-3xl font-bold">{stats?.totalLeads || 0}</div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Proprietários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl md:text-3xl font-bold">{stats?.totalLandlords || 0}</div>
              <Home className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Locatários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl md:text-3xl font-bold">{stats?.totalTenants || 0}</div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Novos este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl md:text-3xl font-bold">{stats?.newThisMonth || 0}</div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClientType} onValueChange={setSelectedClientType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo de Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="proprietário">Proprietário</SelectItem>
                <SelectItem value="comprador">Comprador</SelectItem>
                <SelectItem value="locatário">Locatário</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="site">Site</SelectItem>
                <SelectItem value="indicacao">Indicação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ({clients.length})</CardTitle>
          <CardDescription>
            Clique em um cliente para ver o perfil completo 360º
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingClients ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead className="min-w-[180px]">Contato</TableHead>
                    <TableHead className="min-w-[120px]">Tipo</TableHead>
                    <TableHead className="min-w-[100px]">Origem</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Última Interação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length > 0 ? (
                    clients.map((client: UnifiedClient) => (
                      <TableRow 
                        key={`${client.entityType}-${client.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleClientClick(client)}
                      >
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            {client.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getClientTypeBadge(client.clientType)}</TableCell>
                        <TableCell>{getSourceBadge(client.source)}</TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {client.lastInteraction 
                            ? new Date(client.lastInteraction).toLocaleDateString("pt-BR")
                            : "-"
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet de Perfil 360º */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil 360º
            </SheetTitle>
            <SheetDescription>
              Visão completa do cliente
            </SheetDescription>
          </SheetHeader>

          {selectedClient && (
            <div className="mt-6 space-y-6">
              {/* Cabeçalho do Perfil */}
              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedClient.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getClientTypeBadge(selectedClient.clientType)}
                    {getSourceBadge(selectedClient.source)}
                  </div>
                </div>
              </div>

              {/* Tabs do Perfil */}
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile" className="text-xs">Perfil</TabsTrigger>
                  <TabsTrigger value="properties" className="text-xs">Imóveis</TabsTrigger>
                  <TabsTrigger value="financial" className="text-xs">Financeiro</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
                </TabsList>

                {/* Aba Perfil */}
                <TabsContent value="profile" className="space-y-4 mt-4">
                  {isLoadingProfile ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedClient.email || "-"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{selectedClient.phone || "-"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Status</p>
                          {getStatusBadge(selectedClient.status)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Cadastro</p>
                          <p className="font-medium">
                            {new Date(selectedClient.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      
                      {selectedClient.score !== null && (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Score de Qualificação</p>
                          <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold text-primary">{selectedClient.score}</div>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${selectedClient.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Aba Imóveis */}
                <TabsContent value="properties" className="space-y-4 mt-4">
                  {isLoadingProperties ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : clientProperties && clientProperties.length > 0 ? (
                    <div className="space-y-3">
                      {clientProperties.map((property: any) => (
                        <Card key={property.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Building2 className="h-10 w-10 text-primary p-2 bg-primary/10 rounded" />
                              <div className="flex-1">
                                <h4 className="font-medium">{property.title}</h4>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {property.neighborhood}, {property.city}
                                </div>
                                {property.rentPrice && (
                                  <p className="text-sm font-medium text-green-600 mt-1">
                                    {formatCurrency(property.rentPrice)}/mês
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum imóvel vinculado</p>
                    </div>
                  )}
                </TabsContent>

                {/* Aba Financeiro */}
                <TabsContent value="financial" className="space-y-4 mt-4">
                  {isLoadingFinancials ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : clientFinancials?.summary ? (
                    <div className="space-y-4">
                      {/* Cards de Resumo Financeiro */}
                      <div className="grid grid-cols-2 gap-3">
                        {selectedClient.entityType === 'landlord' && (
                          <>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Total Recebido</p>
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(clientFinancials.summary.totalReceived || 0)}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Total Despesas</p>
                                <p className="text-lg font-bold text-red-600">
                                  {formatCurrency(clientFinancials.summary.totalExpenses || 0)}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Repassado</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {formatCurrency(clientFinancials.summary.totalTransferred || 0)}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Pendente</p>
                                <p className="text-lg font-bold text-yellow-600">
                                  {formatCurrency(clientFinancials.summary.pendingTransfer || 0)}
                                </p>
                              </CardContent>
                            </Card>
                          </>
                        )}
                        {selectedClient.entityType === 'tenant' && (
                          <>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Total Pago</p>
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(clientFinancials.summary.totalPaid || 0)}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Pendente</p>
                                <p className="text-lg font-bold text-yellow-600">
                                  {formatCurrency(clientFinancials.summary.totalPending || 0)}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="col-span-2">
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Em Atraso</p>
                                <p className="text-lg font-bold text-red-600">
                                  {formatCurrency(clientFinancials.summary.totalOverdue || 0)}
                                </p>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>

                      {/* Lista de Pagamentos */}
                      {clientFinancials.payments && clientFinancials.payments.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Últimos Pagamentos</h4>
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {clientFinancials.payments.slice(0, 5).map((payment: any) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded">
                                  <div>
                                    <p className="font-medium text-sm">{payment.referenceMonth}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Venc: {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(payment.totalAmount)}</p>
                                    <Badge className={
                                      payment.status === 'pago' ? 'bg-green-100 text-green-700' :
                                      payment.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }>
                                      {payment.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Sem dados financeiros</p>
                    </div>
                  )}
                </TabsContent>

                {/* Aba Histórico */}
                <TabsContent value="history" className="space-y-4 mt-4">
                  {isLoadingInteractions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : clientInteractions && clientInteractions.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {clientInteractions.map((interaction: any) => (
                          <div key={interaction.id} className="flex gap-3 p-3 bg-muted rounded">
                            <MessageSquare className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">{interaction.type}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(interaction.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              {interaction.subject && (
                                <p className="font-medium mt-1">{interaction.subject}</p>
                              )}
                              {interaction.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {interaction.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma interação registrada</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
