import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Eye, Search, Building2, Share2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function PropertiesAdmin() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: properties, refetch } = trpc.properties.listAdmin.useQuery();


  const deleteMutation = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("Imóvel excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir imóvel: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este imóvel?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredProperties = properties?.filter(
    (property) =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      disponivel: "bg-green-100 text-green-700",
      reservado: "bg-yellow-100 text-yellow-700",
      vendido: "bg-red-100 text-red-700",
      alugado: "bg-blue-100 text-blue-700",
      inativo: "bg-gray-100 text-gray-700",
      geladeira: "bg-purple-100 text-purple-700",
    };
    return variants[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      disponivel: "Disponível",
      reservado: "Reservado",
      vendido: "Vendido",
      alugado: "Alugado",
      inativo: "Inativo",
      geladeira: "Geladeira",
    };
    return labels[status] || status;
  };

  // Estatísticas rápidas
  const stats = {
    total: properties?.length || 0,
    disponivel: properties?.filter(p => p.status === 'disponivel').length || 0,
    vendido: properties?.filter(p => p.status === 'vendido').length || 0,
    alugado: properties?.filter(p => p.status === 'alugado').length || 0,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestão de Imóveis</h1>
            <p className="text-muted-foreground">
              Gerencie todos os imóveis cadastrados no sistema
            </p>
          </div>
          <Button onClick={() => setLocation("/admin/properties/new")} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Novo Imóvel
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Imóveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.total}</div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{stats.disponivel}</div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                  ✓
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">{stats.vendido}</div>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                  $
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alugados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">{stats.alugado}</div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  🏠
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, bairro ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProperties && filteredProperties.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                  <TableHead>Proprietário</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-mono text-sm">
                          {(property as any).reference_code || property.referenceCode || `#${property.id}`}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {((property as any).main_image || (Array.isArray((property as any).images) && (property as any).images[0])) && (
                              <img
                                src={(property as any).main_image || (property as any).images[0]}
                                alt={property.title}
                                className="w-12 h-10 object-cover rounded flex-shrink-0"
                              />
                            )}
                            <span className="line-clamp-1">{property.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {property.propertyType}
                        </TableCell>
                        <TableCell>
                          {property.neighborhood}, {property.city}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const sp = (property as any).sale_price ?? property.salePrice;
                            const rp = (property as any).rent_price ?? property.rentPrice;
                            if (sp) return `R$ ${Number(sp).toLocaleString('pt-BR')}`;
                            if (rp) return `R$ ${Number(rp).toLocaleString('pt-BR')}/mês`;
                            return 'N/A';
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(property.status)}>
                            {getStatusLabel(property.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{property.ownerName || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/imoveis/${property.id}`);
                                toast.success('Link copiado!');
                              }}
                              title="Copiar link público"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/imoveis/${property.id}`)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/admin/properties/${property.id}`)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(property.id)}
                              title="Excluir"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Nenhum imóvel encontrado" : "Nenhum imóvel cadastrado"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "Tente buscar com outros termos"
                    : "Comece cadastrando seu primeiro imóvel"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setLocation("/admin/properties/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Imóvel
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
