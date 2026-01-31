import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit, Eye, DollarSign, User, Phone, Mail, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Landlords() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cpfCnpj: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    bankName: "",
    pixKey: "",
    notes: "",
  });

  const { data: owners, isLoading, refetch } = trpc.owners.list.useQuery();
  const createOwner = trpc.owners.create.useMutation({
    onSuccess: () => {
      toast.success("Proprietário cadastrado com sucesso!");
      setShowModal(false);
      setFormData({
        name: "",
        cpfCnpj: "",
        email: "",
        phone: "",
        whatsapp: "",
        address: "",
        city: "",
        state: "",
        bankName: "",
        pixKey: "",
        notes: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    await createOwner.mutateAsync({
      name: formData.name,
      cpfCnpj: formData.cpfCnpj || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      whatsapp: formData.whatsapp || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      bankName: formData.bankName || undefined,
      pixKey: formData.pixKey || undefined,
      notes: formData.notes || undefined,
    });
  };

  const filteredOwners = owners?.filter((owner: any) =>
    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.cpfCnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Estatísticas
  const stats = {
    total: owners?.length || 0,
    active: owners?.filter((o: any) => o.active !== false).length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Carregando proprietários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Proprietários</h1>
            <p className="text-muted-foreground">
              Gestão de proprietários de imóveis
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Novo Proprietário
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Proprietários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Proprietários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Imóveis Gerenciados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Mensal Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">-</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, CPF/CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Proprietários</CardTitle>
            <CardDescription>
              {filteredOwners.length} proprietário(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.length > 0 ? (
                    filteredOwners.map((owner: any) => (
                      <TableRow key={owner.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{owner.name}</div>
                              <div className="text-sm text-muted-foreground">{owner.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {owner.cpfCnpj || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {owner.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {owner.phone}
                              </div>
                            )}
                            {owner.whatsapp && (
                              <div className="flex items-center gap-1 text-sm text-green-600">
                                <Phone className="h-3 w-3" />
                                {owner.whatsapp}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={owner.active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                            {owner.active !== false ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" title="Ver Detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              title="Relatório Financeiro"
                              onClick={() => setLocation('/admin/financial')}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum proprietário encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Cadastro */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Proprietário</DialogTitle>
            <DialogDescription>
              Cadastre um novo proprietário no sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankName">Banco</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Nome do banco"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="Chave PIX"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createOwner.isPending}>
                {createOwner.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Cadastrar Proprietário"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
