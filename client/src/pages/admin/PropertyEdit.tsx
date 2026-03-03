import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PropertyImageUpload from "@/components/PropertyImageUpload";

export default function PropertyEdit() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const propertyId = params.id ? parseInt(params.id) : null;
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    propertyType: "casa" | "apartamento" | "cobertura" | "terreno" | "comercial" | "rural" | "lancamento";
    transactionType: "venda" | "locacao" | "ambos";
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    salePrice: number;
    rentPrice: number;
    condoFee: number;
    iptu: number;
    bedrooms: number;
    bathrooms: number;
    suites: number;
    parkingSpaces: number;
    totalArea: number;
    builtArea: number;
    video_url: string;
    tourVirtualUrl: string;
    status: "disponivel" | "reservado" | "vendido" | "alugado" | "inativo" | "geladeira";
    featured: boolean;
    ownerId: number | null;
  }>({
    title: "",
    description: "",
    propertyType: "casa",
    transactionType: "venda",
    address: "",
    neighborhood: "",
    city: "Brasília",
    state: "DF",
    zipCode: "",
    salePrice: 0,
    rentPrice: 0,
    condoFee: 0,
    iptu: 0,
    bedrooms: 0,
    bathrooms: 0,
    suites: 0,
    parkingSpaces: 0,
    totalArea: 0,
    builtArea: 0,
    video_url: "",
    tourVirtualUrl: "",
    status: "disponivel",
    featured: false,
    ownerId: null,
  });

  const { data: property, isLoading: loadingProperty } = trpc.properties.getById.useQuery(
    { id: propertyId! },
    { enabled: !!propertyId }
  );

  const ownersQuery = trpc.owners.list.useQuery();
  const owners = ownersQuery.data ?? [];

  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Imóvel atualizado com sucesso!");
      utils.properties.listAdmin.invalidate();
      utils.properties.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar imóvel: ${error.message}`);
    },
  });

  useEffect(() => {
    if (property) {
      const p = property as any;
      setFormData({
        title: p.title || "",
        description: p.description || "",
        // snake_case tem prioridade, fallback para camelCase
        propertyType: (p.property_type ?? p.propertyType) || "casa",
        transactionType: (p.transaction_type ?? p.transactionType) || "venda",
        address: p.address || "",
        neighborhood: p.neighborhood || "",
        city: p.city || "Brasília",
        state: p.state || "DF",
        zipCode: (p.zip_code ?? p.zipCode) || "",
        salePrice: parseFloat(p.sale_price ?? p.salePrice ?? 0) || 0,
        rentPrice: parseFloat(p.rent_price ?? p.rentPrice ?? 0) || 0,
        condoFee: parseFloat(p.condo_fee ?? p.condoFee ?? 0) || 0,
        iptu: parseFloat(p.iptu ?? 0) || 0,
        bedrooms: parseInt(p.bedrooms ?? 0) || 0,
        bathrooms: parseInt(p.bathrooms ?? 0) || 0,
        suites: parseInt(p.suites ?? 0) || 0,
        parkingSpaces: parseInt(p.parking_spaces ?? p.parkingSpaces ?? 0) || 0,
        totalArea: parseFloat(p.total_area ?? p.totalArea ?? 0) || 0,
        builtArea: parseFloat(p.built_area ?? p.builtArea ?? 0) || 0,
        video_url: p.video_url || "",
        tourVirtualUrl: (p.tour_virtual_url ?? p.tourVirtualUrl) || "",
        status: (p.status || "disponivel") as any,
        featured: p.featured ? true : false,
        ownerId: p.owner_id ? Number(p.owner_id) : (p.ownerId ? Number(p.ownerId) : null),
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    await updateMutation.mutateAsync({
      id: propertyId,
      data: {
        ...formData,
        featured: formData.featured,
      },
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingProperty) {
    return (
<div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
);
  }

  if (!propertyId || !property) {
    return (
<div className="text-center py-12">
          <p className="text-muted-foreground">Imóvel não encontrado</p>
          <Button onClick={() => setLocation('/admin/properties')} className="mt-4">
            Voltar para Imóveis
          </Button>
        </div>
);
  }

  const p = property as any;

  return (
<div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin/properties')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Editar Imóvel</h1>
              <p className="text-muted-foreground">
                {(p.reference_code ?? p.referenceCode) || `ID: ${p.id}`}
              </p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="images">Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Tipo de Imóvel *</Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => handleChange('propertyType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casa">Casa</SelectItem>
                          <SelectItem value="apartamento">Apartamento</SelectItem>
                          <SelectItem value="cobertura">Cobertura</SelectItem>
                          <SelectItem value="terreno">Terreno</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="rural">Rural</SelectItem>
                          <SelectItem value="lancamento">Lançamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="transactionType">Finalidade *</Label>
                      <Select
                        value={formData.transactionType}
                        onValueChange={(value) => handleChange('transactionType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="locacao">Locação</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Proprietário (interno)</Label>
                      <Select
                        value={formData.ownerId != null ? String(formData.ownerId) : "none"}
                        onValueChange={(value) => {
                          if (!value || value === "none") handleChange('ownerId', null);
                          else handleChange('ownerId', Number(value));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um proprietário..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem proprietário</SelectItem>
                          {owners.map((o: any) => (
                            <SelectItem key={o.id} value={String(o.id)}>
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Campo interno (não aparece no site). Usado para relatórios e repasses.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="reservado">Reservado</SelectItem>
                          <SelectItem value="vendido">Vendido</SelectItem>
                          <SelectItem value="alugado">Alugado</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="geladeira">Geladeira</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Ex: SQN 210, Bloco A, Apt 101"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => handleChange('neighborhood', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleChange('zipCode', e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        maxLength={2}
                        placeholder="DF"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valores */}
              <Card>
                <CardHeader>
                  <CardTitle>Valores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => handleChange('salePrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rentPrice">Preço de Locação (R$/mês)</Label>
                      <Input
                        id="rentPrice"
                        type="number"
                        value={formData.rentPrice}
                        onChange={(e) => handleChange('rentPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condoFee">Condomínio (R$/mês)</Label>
                      <Input
                        id="condoFee"
                        type="number"
                        value={formData.condoFee}
                        onChange={(e) => handleChange('condoFee', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iptu">IPTU (R$/ano)</Label>
                      <Input
                        id="iptu"
                        type="number"
                        value={formData.iptu}
                        onChange={(e) => handleChange('iptu', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Características */}
              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Quartos</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => handleChange('bedrooms', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suites">Suítes</Label>
                      <Input
                        id="suites"
                        type="number"
                        value={formData.suites}
                        onChange={(e) => handleChange('suites', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Banheiros</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => handleChange('bathrooms', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parkingSpaces">Vagas de Garagem</Label>
                      <Input
                        id="parkingSpaces"
                        type="number"
                        value={formData.parkingSpaces}
                        onChange={(e) => handleChange('parkingSpaces', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="totalArea">Área Total (m²)</Label>
                      <Input
                        id="totalArea"
                        type="number"
                        value={formData.totalArea}
                        onChange={(e) => handleChange('totalArea', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="builtArea">Área Construída (m²)</Label>
                      <Input
                        id="builtArea"
                        type="number"
                        value={formData.builtArea}
                        onChange={(e) => handleChange('builtArea', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mídia */}
              <Card>
                <CardHeader>
                  <CardTitle>Mídia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video_url">URL do Vídeo</Label>
                    <Input
                      id="video_url"
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => handleChange('video_url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Suporta YouTube, Vimeo ou link direto (.mp4, .webm)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tourVirtualUrl">URL do Tour Virtual (360°)</Label>
                    <Input
                      id="tourVirtualUrl"
                      type="url"
                      value={formData.tourVirtualUrl}
                      onChange={(e) => handleChange('tourVirtualUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>

            </form>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Galeria de Fotos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Faça upload de fotos do imóvel. A primeira imagem será definida como principal.
                </p>
              </CardHeader>
              <CardContent>
                <PropertyImageUpload propertyId={propertyId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
);
}
