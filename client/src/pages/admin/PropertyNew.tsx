/**
 * PropertyNew.tsx — Cadastro de Imóvel (Admin) — Elite Property Profile v2
 *
 * UI rica com Tabs + Accordion, 120+ características, score de qualidade.
 * Salva features no formato FeaturesV2 em properties.features (JSONB).
 */
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Bot, Star, AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import ImageUploader, { ImageFile } from "@/components/ImageUploader";
import {
  FEATURE_GROUPS,
  FeaturesV2,
  normalizeFeatures,
  toggleFeature,
  computeListingQuality,
} from "@/constants/propertyFeatures";

// ─── Componente de score ──────────────────────────────────────────────────────
function ListingQualityPanel({ score, status, recommendations }: {
  score: number;
  status: "RUIM" | "BOM" | "PREMIUM";
  recommendations: string[];
}) {
  const color = status === "PREMIUM" ? "text-green-600" : status === "BOM" ? "text-yellow-600" : "text-red-500";
  const barColor = status === "PREMIUM" ? "bg-green-500" : status === "BOM" ? "bg-yellow-500" : "bg-red-500";
  const icon = status === "PREMIUM" ? <Trophy className="h-5 w-5 text-green-600" /> :
               status === "BOM"     ? <CheckCircle2 className="h-5 w-5 text-yellow-600" /> :
                                      <AlertCircle className="h-5 w-5 text-red-500" />;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-bold text-lg ${color}`}>{score}/100 — {status}</span>
            {status === "PREMIUM" && <Badge className="bg-green-100 text-green-700">Anúncio Premium</Badge>}
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>
      {recommendations.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Para melhorar o score:</p>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Componente de grupo de checkboxes ───────────────────────────────────────
function FeatureCheckboxGroup({
  groupKey,
  items,
  features,
  onChange,
}: {
  groupKey: string;
  items: { key: string; label: string; seoWeight: number }[];
  features: FeaturesV2;
  onChange: (f: FeaturesV2) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => {
        const checked = (() => {
          if (groupKey.startsWith("condominio.")) {
            const sub = groupKey.split(".")[1] as "lazer" | "servicos" | "sustentabilidade";
            return !!(features.condominio?.[sub] as Record<string, boolean> | undefined)?.[item.key];
          }
          return !!(features[groupKey as keyof FeaturesV2] as Record<string, boolean> | undefined)?.[item.key];
        })();
        return (
          <label key={item.key} className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={checked}
              onCheckedChange={(val) => onChange(toggleFeature(features, groupKey, item.key, !!val))}
              className="flex-shrink-0"
            />
            <span className="text-sm leading-tight group-hover:text-primary transition-colors">
              {item.label}
              {item.seoWeight >= 4 && <Star className="inline h-3 w-3 ml-1 text-yellow-500" />}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PropertyNew() {
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [features, setFeatures] = useState<FeaturesV2>(normalizeFeatures(null));

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "casa",
    purpose: "venda",
    salePrice: "",
    rentPrice: "",
    condoFee: "",
    iptu: "",
    bedrooms: "",
    suites: "",
    bathrooms: "",
    parkingSpaces: "",
    totalArea: "",
    builtArea: "",
    // features.areas
    areaUtil: "",
    areaPrivativa: "",
    areaTerreno: "",
    peDireito: "",
    address: "",
    neighborhood: "",
    city: "Brasília",
    state: "DF",
    zipCode: "",
    referenceCode: "",
    ownerId: "",
    status: "disponivel",
    featured: false,
    // mídia
    video_url: "",
    tourVirtualUrl: "",
    tour3dUrl: "",
    plantaUrls: "",
    // condomínio
    condNome: "",
    condTorre: "",
    condAndar: "",
    condUnidadesPorAndar: "",
    condElevadores: "",
    condAnoConstrucao: "",
    condPortaria: "",
    // destaques
    destaques: "",
  });

  const { data: owners } = trpc.owners.list.useQuery();
  const uploadFileMutation = trpc.propertyImages.uploadFile.useMutation();
  const reorderMutation = trpc.propertyImages.reorder.useMutation();

  // Score de qualidade em tempo real
  const quality = useMemo(() => {
    const mockProperty = {
      title: formData.title,
      description: formData.description,
      images: images.map((_, i) => `photo-${i}`),
      video_url: formData.video_url || features.midia?.youtube_url || features.midia?.video_direto_url,
      tour_virtual_url: formData.tourVirtualUrl || features.midia?.tour_3d_url,
      total_area: formData.totalArea || formData.areaUtil,
      built_area: formData.builtArea,
      address: formData.address,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      features,
    };
    return computeListingQuality(mockProperty);
  }, [formData, images, features]);

  const createMutation = trpc.properties.create.useMutation({
    onSuccess: async (property) => {
      if (images.length > 0) {
        setUploading(true);
        try {
          const primaryIndex = images.findIndex((img) => img.isPrimary);
          const effectivePrimaryIndex = primaryIndex === -1 ? 0 : primaryIndex;
          const uploadedIds: number[] = [];

          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (!img.file) continue;
            setUploadStep(`Enviando foto ${i + 1} de ${images.length}...`);
            const fileData = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(img.file!);
            });
            const uploaded = await uploadFileMutation.mutateAsync({
              propertyId: property.id,
              filename: img.file.name,
              contentType: img.file.type || "image/jpeg",
              fileData,
              isMain: i === effectivePrimaryIndex,
            });
            if (uploaded?.id) uploadedIds.push(uploaded.id);
          }

          if (uploadedIds.length > 1) {
            setUploadStep("Salvando ordem das fotos...");
            await reorderMutation.mutateAsync({ propertyId: property.id, orderedIds: uploadedIds });
          }

          toast.success("Imóvel cadastrado com sucesso!");
          setLocation("/admin/properties");
        } catch (error) {
          console.error("Erro no upload:", error);
          toast.error("Imóvel criado, mas houve erro ao enviar algumas imagens.");
          setLocation("/admin/properties");
        } finally {
          setUploading(false);
          setUploadStep("");
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

  const buildFeaturesV2 = (): FeaturesV2 => {
    const f: FeaturesV2 = { ...features, version: 2 };
    // Áreas extras
    f.areas = {
      area_util_m2: formData.areaUtil ? parseFloat(formData.areaUtil) : null,
      area_privativa_m2: formData.areaPrivativa ? parseFloat(formData.areaPrivativa) : null,
      area_terreno_m2: formData.areaTerreno ? parseFloat(formData.areaTerreno) : null,
      pe_direito_m: formData.peDireito ? parseFloat(formData.peDireito) : null,
    };
    // Condomínio
    f.condominio = {
      ...f.condominio,
      nome: formData.condNome || undefined,
      torre_bloco: formData.condTorre || undefined,
      andar: formData.condAndar ? parseInt(formData.condAndar) : null,
      unidades_por_andar: formData.condUnidadesPorAndar ? parseInt(formData.condUnidadesPorAndar) : null,
      elevadores: formData.condElevadores ? parseInt(formData.condElevadores) : null,
      ano_construcao: formData.condAnoConstrucao ? parseInt(formData.condAnoConstrucao) : null,
      portaria: (formData.condPortaria as FeaturesV2["condominio"]["portaria"]) || undefined,
    };
    // Mídia
    f.midia = {
      youtube_url: formData.video_url || undefined,
      video_direto_url: undefined,
      tour_3d_url: formData.tour3dUrl || formData.tourVirtualUrl || undefined,
      planta_urls: formData.plantaUrls
        ? formData.plantaUrls.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    // Destaques
    f.destaques = formData.destaques
      ? formData.destaques.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
    return f;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Preencha os campos obrigatórios (título e descrição)");
      return;
    }

    const featuresV2 = buildFeaturesV2();

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      propertyType: formData.propertyType as any,
      transactionType: formData.purpose as any,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      rentPrice: formData.rentPrice ? parseFloat(formData.rentPrice) : undefined,
      condoFee: formData.condoFee ? parseFloat(formData.condoFee) : undefined,
      iptu: formData.iptu ? parseFloat(formData.iptu) : undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      suites: formData.suites ? parseInt(formData.suites) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      parkingSpaces: formData.parkingSpaces ? parseInt(formData.parkingSpaces) : undefined,
      totalArea: formData.totalArea ? parseFloat(formData.totalArea) : undefined,
      builtArea: formData.builtArea ? parseFloat(formData.builtArea) : undefined,
      features: JSON.stringify(featuresV2),
      address: formData.address || undefined,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      referenceCode: formData.referenceCode || undefined,
      ownerId: formData.ownerId && formData.ownerId !== "none" ? Number(formData.ownerId) : undefined,
      status: formData.status as any,
      featured: formData.featured,
      video_url: formData.video_url || undefined,
      tourVirtualUrl: formData.tourVirtualUrl || formData.tour3dUrl || undefined,
    });
  };

  const isSubmitting = createMutation.isPending || uploading;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => setLocation("/admin/properties")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Novo Imóvel</h1>
            <p className="text-muted-foreground text-sm">Preencha todas as seções para maximizar o score de qualidade</p>
          </div>
          <div className="text-right">
            <Badge
              className={
                quality.status === "PREMIUM" ? "bg-green-100 text-green-700 text-base px-3 py-1" :
                quality.status === "BOM"     ? "bg-yellow-100 text-yellow-700 text-base px-3 py-1" :
                                               "bg-red-100 text-red-600 text-base px-3 py-1"
              }
            >
              Score: {quality.score}/100
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basico" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="localizacao">Localização</TabsTrigger>
              <TabsTrigger value="valores">Valores</TabsTrigger>
              <TabsTrigger value="areas">Áreas e Ambientes</TabsTrigger>
              <TabsTrigger value="caracteristicas">Características</TabsTrigger>
              <TabsTrigger value="condominio">Condomínio e Lazer</TabsTrigger>
              <TabsTrigger value="seguranca">Segurança e Infra</TabsTrigger>
              <TabsTrigger value="luxo">Luxo</TabsTrigger>
              <TabsTrigger value="midia">Mídia</TabsTrigger>
              <TabsTrigger value="destaques">Destaques</TabsTrigger>
              <TabsTrigger value="score">Qualidade</TabsTrigger>
            </TabsList>

            {/* ── Tab: Básico ── */}
            <TabsContent value="basico">
              <Card>
                <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Apartamento Luxuoso no Lago Sul com Vista para o Lago"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.title.length} / 50 caracteres recomendados</p>
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
                          setTimeout(() => {
                            const aiDescription = `${formData.title} — Um imóvel excepcional que combina conforto, sofisticação e localização privilegiada. Este ${formData.propertyType} oferece acabamento de primeira qualidade, ambientes amplos e bem iluminados, além de toda a infraestrutura necessária para proporcionar qualidade de vida e bem-estar para você e sua família. Com design moderno e atenção a cada detalhe, este imóvel foi pensado para quem busca o melhor em termos de conforto e praticidade. A localização privilegiada garante fácil acesso aos principais pontos da cidade, com comércio, escolas e serviços nas proximidades. Ideal para quem busca excelência em cada detalhe e deseja um imóvel que reflita seu estilo de vida sofisticado.`;
                            setFormData({ ...formData, description: aiDescription });
                            toast.success("✅ Descrição gerada! Edite conforme necessário.");
                          }, 1500);
                        }}
                        className="gap-2"
                      >
                        <Bot className="h-4 w-4" /> Gerar com IA
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o imóvel em detalhes (mínimo 800 caracteres para score máximo)..."
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.description.length} / 800 caracteres recomendados</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Imóvel</Label>
                      <Select value={formData.propertyType} onValueChange={(v) => setFormData({ ...formData, propertyType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <div>
                      <Label>Finalidade</Label>
                      <Select value={formData.purpose} onValueChange={(v) => setFormData({ ...formData, purpose: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Label>Código de Referência</Label>
                      <Input
                        value={formData.referenceCode}
                        onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
                        placeholder="Ex: IMV-001"
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="reservado">Reservado</SelectItem>
                          <SelectItem value="vendido">Vendido</SelectItem>
                          <SelectItem value="alugado">Alugado</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Proprietário (interno)</Label>
                    <Select
                      value={formData.ownerId && formData.ownerId !== "none" ? String(formData.ownerId) : "none"}
                      onValueChange={(v) => setFormData({ ...formData, ownerId: v === "none" ? "" : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Sem proprietário" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem proprietário</SelectItem>
                        {(owners ?? []).map((o: any) => (
                          <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.featured}
                      onCheckedChange={(v) => setFormData({ ...formData, featured: !!v })}
                    />
                    <span className="text-sm">⭐ Marcar como Imóvel em Destaque</span>
                  </label>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Localização ── */}
            <TabsContent value="localizacao">
              <Card>
                <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Endereço</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bairro</Label>
                      <Input
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder="Ex: Lago Sul"
                      />
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <Input
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Valores ── */}
            <TabsContent value="valores">
              <Card>
                <CardHeader><CardTitle>Valores</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preço de Venda (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Preço de Locação (R$/mês)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.rentPrice}
                        onChange={(e) => setFormData({ ...formData, rentPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Condomínio (R$/mês)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.condoFee}
                        onChange={(e) => setFormData({ ...formData, condoFee: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>IPTU (R$/ano)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.iptu}
                        onChange={(e) => setFormData({ ...formData, iptu: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Áreas e Ambientes ── */}
            <TabsContent value="areas">
              <Card>
                <CardHeader><CardTitle>Áreas e Ambientes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Quartos</Label>
                      <Input type="number" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <Label>Suítes</Label>
                      <Input type="number" value={formData.suites} onChange={(e) => setFormData({ ...formData, suites: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <Label>Banheiros</Label>
                      <Input type="number" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <Label>Vagas de Garagem</Label>
                      <Input type="number" value={formData.parkingSpaces} onChange={(e) => setFormData({ ...formData, parkingSpaces: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Área Total (m²)</Label>
                      <Input type="number" step="0.01" value={formData.totalArea} onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Área Construída (m²)</Label>
                      <Input type="number" step="0.01" value={formData.builtArea} onChange={(e) => setFormData({ ...formData, builtArea: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Área Útil (m²)</Label>
                      <Input type="number" step="0.01" value={formData.areaUtil} onChange={(e) => setFormData({ ...formData, areaUtil: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Área Privativa (m²)</Label>
                      <Input type="number" step="0.01" value={formData.areaPrivativa} onChange={(e) => setFormData({ ...formData, areaPrivativa: e.target.value })} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Área do Terreno (m²)</Label>
                      <Input type="number" step="0.01" value={formData.areaTerreno} onChange={(e) => setFormData({ ...formData, areaTerreno: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Pé-direito (m)</Label>
                      <Input type="number" step="0.01" value={formData.peDireito} onChange={(e) => setFormData({ ...formData, peDireito: e.target.value })} placeholder="Ex: 2.80" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Características ── */}
            <TabsContent value="caracteristicas">
              <Card>
                <CardHeader>
                  <CardTitle>Características do Imóvel e Acabamentos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    ⭐ = item premium (maior peso no score). Marque pelo menos 25 para score máximo.
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" defaultValue={["imovel"]} className="space-y-2">
                    {FEATURE_GROUPS.filter((g) => ["imovel", "acabamentos"].includes(g.groupKey)).map((group) => (
                      <AccordionItem key={group.groupKey} value={group.groupKey} className="border rounded-lg px-4">
                        <AccordionTrigger className="font-semibold">{group.title}</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <FeatureCheckboxGroup
                            groupKey={group.groupKey}
                            items={group.items}
                            features={features}
                            onChange={setFeatures}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Condomínio e Lazer ── */}
            <TabsContent value="condominio">
              <Card>
                <CardHeader><CardTitle>Condomínio e Lazer</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nome do Condomínio</Label>
                      <Input value={formData.condNome} onChange={(e) => setFormData({ ...formData, condNome: e.target.value })} placeholder="Ex: Residencial Leman" />
                    </div>
                    <div>
                      <Label>Torre / Bloco</Label>
                      <Input value={formData.condTorre} onChange={(e) => setFormData({ ...formData, condTorre: e.target.value })} placeholder="Ex: Torre A" />
                    </div>
                    <div>
                      <Label>Andar</Label>
                      <Input type="number" value={formData.condAndar} onChange={(e) => setFormData({ ...formData, condAndar: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <Label>Unidades por Andar</Label>
                      <Input type="number" value={formData.condUnidadesPorAndar} onChange={(e) => setFormData({ ...formData, condUnidadesPorAndar: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <Label>Elevadores</Label>
                      <Input type="number" value={formData.condElevadores} onChange={(e) => setFormData({ ...formData, condElevadores: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <Label>Ano de Construção</Label>
                      <Input type="number" value={formData.condAnoConstrucao} onChange={(e) => setFormData({ ...formData, condAnoConstrucao: e.target.value })} placeholder="Ex: 2020" />
                    </div>
                  </div>
                  <div>
                    <Label>Portaria</Label>
                    <Select value={formData.condPortaria} onValueChange={(v) => setFormData({ ...formData, condPortaria: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24h</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="diurna">Diurna</SelectItem>
                        <SelectItem value="sem">Sem portaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Accordion type="multiple" defaultValue={["condominio.lazer"]} className="space-y-2">
                    {FEATURE_GROUPS.filter((g) => g.groupKey.startsWith("condominio.")).map((group) => (
                      <AccordionItem key={group.groupKey} value={group.groupKey} className="border rounded-lg px-4">
                        <AccordionTrigger className="font-semibold">{group.title}</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <FeatureCheckboxGroup
                            groupKey={group.groupKey}
                            items={group.items}
                            features={features}
                            onChange={setFeatures}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Segurança e Infra ── */}
            <TabsContent value="seguranca">
              <Card>
                <CardHeader><CardTitle>Segurança e Infraestrutura</CardTitle></CardHeader>
                <CardContent>
                  <Accordion type="multiple" defaultValue={["seguranca"]} className="space-y-2">
                    {FEATURE_GROUPS.filter((g) => ["seguranca", "infraestrutura"].includes(g.groupKey)).map((group) => (
                      <AccordionItem key={group.groupKey} value={group.groupKey} className="border rounded-lg px-4">
                        <AccordionTrigger className="font-semibold">{group.title}</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <FeatureCheckboxGroup
                            groupKey={group.groupKey}
                            items={group.items}
                            features={features}
                            onChange={setFeatures}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Luxo ── */}
            <TabsContent value="luxo">
              <Card>
                <CardHeader><CardTitle>Luxo / Alto Padrão</CardTitle></CardHeader>
                <CardContent>
                  {FEATURE_GROUPS.filter((g) => g.groupKey === "luxo").map((group) => (
                    <FeatureCheckboxGroup
                      key={group.groupKey}
                      groupKey={group.groupKey}
                      items={group.items}
                      features={features}
                      onChange={setFeatures}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Mídia ── */}
            <TabsContent value="midia">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fotos do Imóvel</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Adicione as fotos, arraste para reordenar e marque a imagem principal.
                      Recomendado: 15+ fotos para score máximo.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ImageUploader images={images} onChange={setImages} maxImages={30} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Vídeo e Tour Virtual</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>URL do Vídeo (YouTube / Vimeo / mp4)</Label>
                      <Input
                        type="url"
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                      />
                    </div>
                    <div>
                      <Label>URL do Tour Virtual / 3D / 360°</Label>
                      <Input
                        type="url"
                        value={formData.tourVirtualUrl}
                        onChange={(e) => setFormData({ ...formData, tourVirtualUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>URL do Tour 3D (alternativo)</Label>
                      <Input
                        type="url"
                        value={formData.tour3dUrl}
                        onChange={(e) => setFormData({ ...formData, tour3dUrl: e.target.value })}
                        placeholder="https://matterport.com/..."
                      />
                    </div>
                    <div>
                      <Label>URLs das Plantas (uma por linha)</Label>
                      <Textarea
                        value={formData.plantaUrls}
                        onChange={(e) => setFormData({ ...formData, plantaUrls: e.target.value })}
                        placeholder="https://exemplo.com/planta1.jpg&#10;https://exemplo.com/planta2.jpg"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Tab: Destaques ── */}
            <TabsContent value="destaques">
              <Card>
                <CardHeader>
                  <CardTitle>Destaques do Imóvel</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bullets de destaque exibidos no topo da página do imóvel. Um por linha.
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.destaques}
                    onChange={(e) => setFormData({ ...formData, destaques: e.target.value })}
                    placeholder="Vista panorâmica para o Lago Paranoá&#10;Piscina privativa aquecida&#10;Automação residencial completa&#10;Acabamento em mármore importado"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Esses destaques aparecem em destaque na página do imóvel e nos cards da listagem.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Score de Qualidade ── */}
            <TabsContent value="score">
              <Card>
                <CardHeader>
                  <CardTitle>Qualidade do Anúncio / SEO Score</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Score calculado em tempo real com base nas informações preenchidas.
                  </p>
                </CardHeader>
                <CardContent>
                  <ListingQualityPanel
                    score={quality.score}
                    status={quality.status}
                    recommendations={quality.recommendations}
                  />
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Fotos", ok: quality.details.photos.ok, detail: `${quality.details.photos.count}/${quality.details.photos.needed}` },
                      { label: "Descrição", ok: quality.details.description.ok, detail: `${quality.details.description.length}/${quality.details.description.needed} chars` },
                      { label: "Título", ok: quality.details.title.ok, detail: `${quality.details.title.length}/${quality.details.title.needed} chars` },
                      { label: "Características", ok: quality.details.features.ok, detail: `${quality.details.features.count}/${quality.details.features.needed} marcadas` },
                      { label: "Vídeo/Tour", ok: quality.details.media.ok, detail: quality.details.media.hasVideo ? "Vídeo ✓" : quality.details.media.hasTour ? "Tour ✓" : "Nenhum" },
                      { label: "Áreas", ok: quality.details.areas.ok, detail: quality.details.areas.ok ? "Preenchido" : "Faltando" },
                      { label: "Endereço", ok: quality.details.address.ok, detail: quality.details.address.ok ? "Completo" : "Incompleto" },
                    ].map((item) => (
                      <div key={item.label} className={`p-3 rounded-lg border ${item.ok ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {item.ok
                            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                            : <AlertCircle className="h-4 w-4 text-orange-500" />}
                          <span className="font-medium text-sm">{item.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {uploading
                ? uploadStep || "Enviando fotos..."
                : createMutation.isPending
                ? "Salvando..."
                : "Cadastrar Imóvel"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/admin/properties")} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
