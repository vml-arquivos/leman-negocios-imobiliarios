import { trpc } from "@/lib/trpc";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Bot } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";


export default function PropertyNew() {
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "casa",
    purpose: "venda",
    salePrice: "",
    rentPrice: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    address: "",
    neighborhood: "",
    city: "Brasília",
    state: "DF",
    zipCode: "",
    referenceCode: "",
    ownerId: "",
    status: "disponivel",
    featured: false,
  });

  
  const { data: owners } = trpc.owners.list.useQuery();

const createMutation = trpc.properties.create.useMutation({
    onSuccess: async (property) => {
      if (images.length > 0) {
        setUploading(true);
        try {
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const formData = new FormData();
            formData.append('file', img.file);
            formData.append('propertyId', property.id.toString());
            formData.append('displayOrder', i.toString());
            formData.append('isPrimary', (i === 0).toString());
            
            const response = await fetch('/api/properties/upload-image', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Erro no upload');
            }
          }
          toast.success("Imóvel cadastrado com sucesso!");
          setLocation("/admin/properties");
        } catch (error) {
          toast.error("Erro ao fazer upload das imagens");
        } finally {
          setUploading(false);
        }
      } else {
        toast.success("Imóvel cadastrado com sucesso!");
        setLocation("/admin/properties");
      }
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar imóvel: ${error.message}`);
    },
  });



  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      propertyType: formData.propertyType as any,
      transactionType: formData.purpose as any,
      salePrice: formData.salePrice ? Math.round(parseFloat(formData.salePrice) * 100) : undefined,
      rentPrice: formData.rentPrice ? Math.round(parseFloat(formData.rentPrice) * 100) : undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      totalArea: formData.area ? parseFloat(formData.area) : undefined,
      address: formData.address || undefined,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      referenceCode: formData.referenceCode || undefined,
      ownerId: formData.ownerId && formData.ownerId !== "none" ? Number(formData.ownerId) : undefined,
      status: formData.status as any,
      featured: formData.featured,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin/properties")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Novo Imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Casa Luxuosa no Lago Sul"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!formData.title || !formData.propertyType) {
                          toast.error("Preencha o título e tipo do imóvel primeiro");
                          return;
                        }
                        toast.info("🤖 Gerando descrição com IA...");
                        // Simulação de IA - em produção, chamar API OpenAI
                        setTimeout(() => {
                          const aiDescription = `${formData.title} - Um imóvel excepcional que combina conforto, sofisticação e localização privilegiada. Este ${formData.propertyType} oferece acabamento de primeira qualidade, ambientes amplos e bem iluminados, além de toda a infraestrutura necessária para proporcionar qualidade de vida e bem-estar para você e sua família. Ideal para quem busca excelência em cada detalhe.`;
                          setFormData({ ...formData, description: aiDescription });
                          toast.success("✅ Descrição gerada! Você pode editar conforme necessário.");
                        }, 1500);
                      }}
                      className="gap-2"
                    >
                      <Bot className="h-4 w-4" />
                      Gerar com IA
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o imóvel em detalhes ou use o botão 'Gerar com IA'..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="purpose">Finalidade</Label>
                    <Select
                      value={formData.purpose}
                      onValueChange={(value) => setFormData({ ...formData, purpose: value })}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rentPrice">Preço de Locação (R$/mês)</Label>
                    <Input
                      id="rentPrice"
                      type="number"
                      step="0.01"
                      value={formData.rentPrice}
                      onChange={(e) => setFormData({ ...formData, rentPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Características */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Características</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Quartos</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Banheiros</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">Área (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Localização</h3>
                
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Ex: Lago Sul"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Outros */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Outros</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referenceCode">Código de Referência</Label>
                    <Input
                      id="referenceCode"
                      value={formData.referenceCode}
                      onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
                      placeholder="Ex: IMV-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
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

                <div>
                  <Label htmlFor="ownerId">Proprietário (interno)</Label>
                  <Select
                    value={formData.ownerId && formData.ownerId !== "none" ? String(formData.ownerId) : "none"}
                    onValueChange={(value) => setFormData({ ...formData, ownerId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="ownerId">
                      <SelectValue placeholder="Sem proprietário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem proprietário</SelectItem>
                      {(owners ?? []).map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    ⭐ Marcar como Imóvel em Destaque (aparecerá na página principal)
                  </Label>
                </div>
              </div>

              {/* Upload de Imagens */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fotos do Imóvel</h3>
                
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar imagens ou arraste aqui
                    </p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || uploading}
                  className="flex-1"
                >
                  {uploading ? "Fazendo upload..." : createMutation.isPending ? "Salvando..." : "Cadastrar Imóvel"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin/properties")}
                  disabled={createMutation.isPending || uploading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
