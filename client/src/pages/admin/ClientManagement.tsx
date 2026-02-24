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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Trash2,
  Eye,
  Building2,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Home,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

// Tipos unificados para clientes
type ClientType = 'lead' | 'owner';

interface UnifiedClient {
  id: number;
  type: ClientType;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  interest_type?: string | null;
  stage?: string | null;
  source?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  // Owner specific
  cpfCnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  bankName?: string | null;
  pixKey?: string | null;
  active?: boolean | null;
}

const formatCurrency = (value: number | null | undefined) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

export default function ClientManagement() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // States — declarados ANTES de qualquer uso (evita TDZ no bundle minificado)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UnifiedClient | null>(null);
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'leads' | 'owners'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Queries
  const { data: leads, refetch: refetchLeads, isLoading: leadsLoading } = trpc.leads.list.useQuery();
  const ownersQuery = trpc.owners.list.useQuery();
  const owners = ownersQuery.data ?? [];
  const refetchOwners = ownersQuery.refetch;
  const ownersLoading = ownersQuery.isLoading;
  const { data: properties } = trpc.properties.list.useQuery();
  const selectedOwnerId = selectedClient?.type === 'owner' ? selectedClient.id : undefined;
  const ownerPropertiesQuery = trpc.properties.listAdmin.useQuery(
    { ownerId: selectedOwnerId },
    { enabled: !!selectedOwnerId && isDetailsSheetOpen }
  );
  const availablePropertiesQuery = trpc.properties.listAdmin.useQuery(
    { ownerId: null },
    { enabled: !!selectedOwnerId && isDetailsSheetOpen }
  );

  // Mutations
  const createLead = trpc.leads.create.useMutation();
  const updateLead = trpc.leads.update.useMutation();
  const deleteLead = trpc.leads.delete.useMutation();
  const createOwner = trpc.owners.create.useMutation();
  const updateOwner = trpc.owners.update.useMutation();
  const deleteOwner = trpc.owners.delete.useMutation();
  const assignOwner = trpc.properties.assignOwner.useMutation({
    onSuccess: async () => {
      await utils.properties.listAdmin.invalidate();
      setSelectedPropertyId('');
      toast.success('Vínculo atualizado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar vínculo: ${error.message}`);
    },
  });
  
  const [formData, setFormData] = useState({
    type: 'lead' as ClientType,
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    interest_type: "comprador",
    stage: "novo",
    notes: "",
    // Lead perfil/intenção
    finalidade: "",
    interesse: "",
    tipo_imovel: "",
    orcamento_min: "",
    orcamento_max: "",
    regioes_interesse: "",
    // Owner perfil
    perfil_owner: "",
    // Owner fields
    cpfCnpj: "",
    address: "",
    city: "",
    state: "",
    bankName: "",
    pixKey: "",
  });

  // Unificar leads e owners em uma lista única
  const unifiedClients = useMemo(() => {
    const clients: UnifiedClient[] = [];
    
    if (leads) {
      leads.forEach(lead => {
        clients.push({
          id: lead.id,
          type: 'lead',
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          interest_type: lead.interest_type,
          stage: lead.stage,
          source: lead.source,
          notes: lead.notes,
          createdAt: lead.created_at,
          updatedAt: lead.updatedAt,
        });
      });
    }
    
    owners.forEach((owner: any) => {
        clients.push({
          id: owner.id,
          type: 'owner',
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          whatsapp: owner.whatsapp,
          cpfCnpj: owner.cpfCnpj,
          address: owner.address,
          city: owner.city,
          state: owner.state,
          bankName: owner.bankName,
          pixKey: owner.pixKey,
          notes: owner.notes,
          active: owner.active,
          createdAt: owner.created_at,
          updatedAt: owner.updatedAt,
        });
      });

    return clients.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [leads, owners]);

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    let result = unifiedClients;
    
    if (clientTypeFilter === 'leads') {
      result = result.filter(c => c.type === 'lead');
    } else if (clientTypeFilter === 'owners') {
      result = result.filter(c => c.type === 'owner');
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.cpfCnpj?.includes(term)
      );
    }
    
    return result;
  }, [unifiedClients, clientTypeFilter, searchTerm]);

  // Segmentação de leads
  const newClients = leads?.filter(lead => {
    const createdDate = new Date(lead.created_at);
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreated <= 7;
  }) || [];

  const hotClients = leads?.filter(lead => lead.stage === 'quente') || [];
  const warmClients = leads?.filter(lead => lead.stage === 'morno') || [];
  const coldClients = leads?.filter(lead => lead.stage === 'frio') || [];

  // Handlers
  const handleOpenDialog = (client?: UnifiedClient) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        type: client.type,
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        whatsapp: client.whatsapp || "",
        interest_type: client.interest_type || "comprador",
        stage: client.stage || "novo",
        notes: client.notes || "",
        finalidade: (client as any).finalidade || "",
        interesse: (client as any).interesse || "",
        tipo_imovel: (client as any).tipo_imovel || "",
        orcamento_min: (client as any).orcamento_min ? String((client as any).orcamento_min) : "",
        orcamento_max: (client as any).orcamento_max ? String((client as any).orcamento_max) : "",
        regioes_interesse: (client as any).regioes_interesse || "",
        // Owner: extrair PERFIL_OWNER de notes
        perfil_owner: (() => { const m = (client.notes || "").match(/PERFIL_OWNER=(\w+)/); return m ? m[1] : ""; })(),
        cpfCnpj: client.cpfCnpj || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        bankName: client.bankName || "",
        pixKey: client.pixKey || "",
      });
    } else {
      setSelectedClient(null);
      setFormData({
        type: 'lead',
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        interest_type: "comprador",
        stage: "novo",
        notes: "",
        finalidade: "",
        interesse: "",
        tipo_imovel: "",
        orcamento_min: "",
        orcamento_max: "",
        regioes_interesse: "",
        perfil_owner: "",
        cpfCnpj: "",
        address: "",
        city: "",
        state: "",
        bankName: "",
        pixKey: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenDetails = (client: UnifiedClient) => {
    setSelectedClient(client);
    setIsDetailsSheetOpen(true);
  };

  const handleSaveClient = async () => {
    try {
      if (formData.type === 'lead') {
        if (selectedClient && selectedClient.type === 'lead') {
          await updateLead.mutateAsync({
            id: selectedClient.id,
            data: {
              name: formData.name,
              email: formData.email || undefined,
              phone: formData.phone || undefined,
              whatsapp: formData.whatsapp || undefined,
              notes: formData.notes || undefined,
              source: formData.finalidade || undefined,
              preferredNeighborhoods: formData.regioes_interesse || undefined,
              preferredPropertyTypes: formData.tipo_imovel || undefined,
              budgetMin: formData.orcamento_min ? Number(formData.orcamento_min) : undefined,
              budgetMax: formData.orcamento_max ? Number(formData.orcamento_max) : undefined,
            },
          });
          toast.success("Lead atualizado com sucesso!");
        } else {
          await createLead.mutateAsync({
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            whatsapp: formData.whatsapp || undefined,
            notes: formData.notes || undefined,
          });
          toast.success("Lead criado com sucesso!");
        }
        refetchLeads();
      } else {
        if (selectedClient && selectedClient.type === 'owner') {
          // Mesclar PERFIL_OWNER em notes sem criar nova coluna
          const ownerNotes = (() => {
            const base = formData.notes || "";
            const tag = formData.perfil_owner ? `PERFIL_OWNER=${formData.perfil_owner}` : "";
            if (!tag) return base;
            const cleaned = base.replace(/PERFIL_OWNER=\w+/g, "").trim();
            return cleaned ? `${cleaned}\n${tag}` : tag;
          })();
          await updateOwner.mutateAsync({
            id: selectedClient.id,
            data: {
              name: formData.name,
              email: formData.email || undefined,
              phone: formData.phone || undefined,
              whatsapp: formData.whatsapp || undefined,
              cpfCnpj: formData.cpfCnpj || undefined,
              address: formData.address || undefined,
              city: formData.city || undefined,
              state: formData.state || undefined,
              bankName: formData.bankName || undefined,
              pixKey: formData.pixKey || undefined,
              notes: ownerNotes || undefined,
            },
          });
          toast.success("Proprietário atualizado com sucesso!");
        } else {
          await createOwner.mutateAsync({
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            whatsapp: formData.whatsapp || undefined,
            cpfCnpj: formData.cpfCnpj || undefined,
            address: formData.address || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            bankName: formData.bankName || undefined,
            pixKey: formData.pixKey || undefined,
            notes: formData.notes || undefined,
          });
          toast.success("Proprietário criado com sucesso!");
        }
        refetchOwners();
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    if (deleteConfirmText !== 'EXCLUIR') {
      toast.error("Digite EXCLUIR para confirmar");
      return;
    }
    
    try {
      if (selectedClient.type === 'lead') {
        await deleteLead.mutateAsync({ id: selectedClient.id });
        refetchLeads();
      } else {
        await deleteOwner.mutateAsync({ id: selectedClient.id });
        refetchOwners();
      }
      toast.success("Cliente excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
      setDeleteConfirmText('');
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    }
  };

  const getQualificationBadge = (stage: string | null | undefined) => {
    const variants: Record<string, { icon: any; color: string; label: string }> = {
      quente: { icon: Flame, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Quente" },
      morno: { icon: Thermometer, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Morno" },
      frio: { icon: Snowflake, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Frio" },
      nao_qualificado: { icon: Clock, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", label: "Não Qualificado" },
    };
    const variant = variants[stage || 'nao_qualificado'] || variants.nao_qualificado;
    const Icon = variant.icon;
    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: ClientType) => {
    if (type === 'lead') {
      return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"><UserPlus className="h-3 w-3 mr-1" />Lead</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><Briefcase className="h-3 w-3 mr-1" />Proprietário</Badge>;
  };

  // Obter imóveis do proprietário
  const getOwnerProperties = (ownerId: number) => {
    // Por enquanto retorna lista vazia - será implementado com relação no backend
    return properties?.filter((p: any) => p.ownerId === ownerId) || [];
  };

  // Loading state
  if (leadsLoading || ownersLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Clientes 360°</h1>
            <p className="text-muted-foreground">
              Visão unificada de Leads e Proprietários
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleOpenDialog()} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setClientTypeFilter('all')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{unifiedClients.length}</div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setClientTypeFilter('leads')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads (Interessados)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">{leads?.length || 0}</div>
                <UserPlus className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setClientTypeFilter('owners')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Proprietários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-emerald-600">{owners.length}</div>
                <Briefcase className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads Quentes
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
                Novos (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{newClients.length}</div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={clientTypeFilter} onValueChange={(v: any) => setClientTypeFilter(v)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  <SelectItem value="leads">Apenas Leads</SelectItem>
                  <SelectItem value="owners">Apenas Proprietários</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela Unificada */}
        <Card>
          <CardHeader>
            <CardTitle>Base de Clientes ({filteredClients.length})</CardTitle>
            <CardDescription>
              Lista unificada de leads e proprietários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <TableRow key={`${client.type}-${client.id}`}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleOpenDetails(client)}
                            className="hover:underline text-left flex items-center gap-2"
                          >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">{client.name}</div>
                              {client.cpfCnpj && (
                                <div className="text-xs text-muted-foreground">{client.cpfCnpj}</div>
                              )}
                            </div>
                          </button>
                        </TableCell>
                        <TableCell>{getTypeBadge(client.type)}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {client.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {client.phone}
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{client.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.type === 'lead' ? (
                            getQualificationBadge(client.stage)
                          ) : (
                            <Badge className={client.active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                              {client.active !== false ? "Ativo" : "Inativo"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(client.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDetails(client)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDialog(client)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedClient(client);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Excluir"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheet de Detalhes do Cliente */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              {selectedClient?.name}
            </SheetTitle>
            <SheetDescription>
              {getTypeBadge(selectedClient?.type || 'lead')}
            </SheetDescription>
          </SheetHeader>
          
          {selectedClient && (
            <Tabs defaultValue="dados" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              </TabsList>
              
              {/* Aba 1: Dados Pessoais */}
              <TabsContent value="dados" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Informações de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedClient.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.whatsapp && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span>{selectedClient.whatsapp} (WhatsApp)</span>
                      </div>
                    )}
                    {selectedClient.cpfCnpj && (
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>CPF/CNPJ: {selectedClient.cpfCnpj}</span>
                      </div>
                    )}
                    {(selectedClient.address || selectedClient.city) && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[selectedClient.address, selectedClient.city, selectedClient.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {selectedClient.type === 'lead' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Status do Lead</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Qualificação:</span>
                        {getQualificationBadge(selectedClient.stage)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Estágio:</span>
                        <Badge variant="outline" className="capitalize">
                          {selectedClient.stage?.replace('_', ' ') || 'Novo'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Origem:</span>
                        <span className="capitalize">{selectedClient.source || 'Site'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedClient.type === 'owner' && selectedClient.bankName && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Dados Bancários</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Banco:</span>
                        <span>{selectedClient.bankName}</span>
                      </div>
                      {selectedClient.pixKey && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Chave PIX:</span>
                          <span className="font-mono text-sm">{selectedClient.pixKey}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {selectedClient.notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedClient.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Histórico</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cadastrado em:</span>
                      <span>{formatDate(selectedClient.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Última atualização:</span>
                      <span>{formatDate(selectedClient.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Aba 2: Imóveis */}
              <TabsContent value="imoveis" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {selectedClient.type === 'owner' ? 'Imóveis do Proprietário' : 'Imóveis de Interesse'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedClient.type === 'owner' ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um imóvel sem proprietário" />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePropertiesQuery.data?.map((property: any) => (
                                <SelectItem key={property.id} value={String(property.id)}>
                                  {property.title} {property.neighborhood ? `- ${property.neighborhood}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => {
                              if (!selectedPropertyId || !selectedOwnerId) return;
                              assignOwner.mutate({ propertyId: Number(selectedPropertyId), ownerId: selectedOwnerId });
                            }}
                            disabled={!selectedPropertyId || assignOwner.isPending}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Vincular imóvel
                          </Button>
                        </div>

                        {ownerPropertiesQuery.data && ownerPropertiesQuery.data.length > 0 ? (
                          <div className="space-y-2">
                            {ownerPropertiesQuery.data.map((property: any) => (
                              <div key={property.id} className="flex items-center justify-between rounded border p-3">
                                <div>
                                  <p className="font-medium">{property.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {[property.neighborhood, property.city].filter(Boolean).join(', ') || 'Sem localização'}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => assignOwner.mutate({ propertyId: property.id, ownerId: null })}
                                  disabled={assignOwner.isPending}
                                >
                                  Desvincular
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhum imóvel vinculado a este proprietário</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum imóvel visitado registrado
                        </p>
                        <Button variant="outline" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Visita
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Aba 3: Financeiro */}
              <TabsContent value="financeiro" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedClient.type === 'owner' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-xs text-muted-foreground">Aluguéis Recebidos</p>
                              <p className="text-lg font-bold text-green-600">R$ 0,00</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-xs text-muted-foreground">Pendente Repasse</p>
                              <p className="text-lg font-bold text-yellow-600">R$ 0,00</p>
                            </CardContent>
                          </Card>
                        </div>
                        <Separator />
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            Nenhuma transação financeira registrada
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Sem registros financeiros para leads
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="mt-6 flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setIsDetailsSheetOpen(false);
                handleOpenDialog(selectedClient!);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => {
                setIsDetailsSheetOpen(false);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Criar/Editar Cliente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {selectedClient ? "Atualize as informações do cliente" : "Preencha os dados do novo cliente"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Tipo de Cliente */}
            {!selectedClient && (
              <div className="grid gap-2">
                <Label>Tipo de Cliente *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ClientType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead (Interessado)</SelectItem>
                    <SelectItem value="owner">Proprietário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Campos Comuns */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            {/* Campos específicos de Lead: perfil/intenção */}
            {formData.type === 'lead' && (
              <>
                <Separator />
                <p className="text-sm font-medium">Perfil / Intenção de Compra</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="finalidade">Finalidade *</Label>
                    <Select
                      value={formData.finalidade}
                      onValueChange={(v) => setFormData({ ...formData, finalidade: v })}
                    >
                      <SelectTrigger id="finalidade">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprar">Comprar</SelectItem>
                        <SelectItem value="alugar">Alugar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interesse">Interesse *</Label>
                    <Select
                      value={formData.interesse}
                      onValueChange={(v) => setFormData({ ...formData, interesse: v })}
                    >
                      <SelectTrigger id="interesse">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="locacao">Locação</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tipo_imovel">Tipo de Imóvel</Label>
                    <Input
                      id="tipo_imovel"
                      value={formData.tipo_imovel}
                      onChange={(e) => setFormData({ ...formData, tipo_imovel: e.target.value })}
                      placeholder="Ex: apartamento, casa"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="orcamento_min">Orçamento Mín. (R$)</Label>
                    <Input
                      id="orcamento_min"
                      type="number"
                      value={formData.orcamento_min}
                      onChange={(e) => setFormData({ ...formData, orcamento_min: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="orcamento_max">Orçamento Máx. (R$)</Label>
                    <Input
                      id="orcamento_max"
                      type="number"
                      value={formData.orcamento_max}
                      onChange={(e) => setFormData({ ...formData, orcamento_max: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="regioes_interesse">Regiões de Interesse</Label>
                  <Input
                    id="regioes_interesse"
                    value={formData.regioes_interesse}
                    onChange={(e) => setFormData({ ...formData, regioes_interesse: e.target.value })}
                    placeholder="Ex: Asa Sul, Lago Norte"
                  />
                </div>
              </>
            )}

            {/* Campos específicos de Proprietário */}
            {formData.type === 'owner' && (
              <>
                <Separator />
                <p className="text-sm font-medium">Perfil do Proprietário</p>
                <div className="grid gap-2">
                  <Label htmlFor="perfil_owner">Tipo de Proprietário *</Label>
                  <Select
                    value={formData.perfil_owner}
                    onValueChange={(v) => setFormData({ ...formData, perfil_owner: v })}
                  >
                    <SelectTrigger id="perfil_owner">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="locador">Locador</SelectItem>
                      <SelectItem value="ambos">Vendedor e Locador</SelectItem>
                      <SelectItem value="investidor">Investidor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bankName">Banco</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Nome do banco"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pixKey">Chave PIX</Label>
                    <Input
                      id="pixKey"
                      value={formData.pixKey}
                      onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                      placeholder="Chave PIX"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o cliente..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveClient}
              disabled={
                !formData.name ||
                (formData.type === 'lead' && (!formData.finalidade || !formData.interesse)) ||
                (formData.type === 'owner' && !formData.perfil_owner)
              }
            >
              {selectedClient ? "Salvar Alterações" : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão (Dupla Confirmação) */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setDeleteConfirmText('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está prestes a excluir permanentemente o cliente{" "}
                <strong>{selectedClient?.name}</strong>.
              </p>
              <p className="text-red-600 font-medium">
                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </p>
              <div className="mt-4">
                <Label htmlFor="confirmDelete" className="text-sm">
                  Digite <strong>EXCLUIR</strong> para confirmar:
                </Label>
                <Input
                  id="confirmDelete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="EXCLUIR"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirmText !== 'EXCLUIR'}
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
