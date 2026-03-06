/**
 * PropertyEdit.tsx — Edição de Imóvel (Admin) — Elite Property Profile v2
 *
 * UI rica com Tabs + Accordion, 120+ características, score de qualidade.
 * Carrega features do banco, normaliza para V2, salva de volta como JSON.
 */
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Star, AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import PropertyImageUpload from "@/components/PropertyImageUpload";
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
export default function PropertyEdit() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const propertyId = params.id ? parseInt(params.id) : null;
  const utils = trpc.useUtils();

  const [features, setFeatures] = useState<FeaturesV2>(normalizeFeatures(null));

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    propertyType: string;
    transactionType: string;
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
    suites: number;
    bathrooms: number;
    parkingSpaces: number;
    totalArea: number;
    builtArea: number;
    areaUtil: number;
    areaPrivativa: number;
    areaTerreno: number;
    peDireito: number;
    video_url: string;
    tourVirtualUrl: string;
    tour3dUrl: string;
    plantaUrls: string;
    condNome: string;
    condTorre: string;
    condAndar: number;
    condUnidadesPorAndar: number;
    condElevadores: number;
    condAnoConstrucao: number;
    condPortaria: string;
    destaques: string;
    status: string;
    featured: boolean;
    ownerId: number | null;
    referenceCode: string;
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
    suites: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    totalArea: 0,
    builtArea: 0,
    areaUtil: 0,
    areaPrivativa: 0,
    areaTerreno: 0,
    peDireito: 0,
    video_url: "",
    tourVirtualUrl: "",
    tour3dUrl: "",
    plantaUrls: "",
    condNome: "",
    condTorre: "",
    condAndar: 0,
    condUnidadesPorAndar: 0,
    condElevadores: 0,
    condAnoConstrucao: 0,
    condPortaria: "",
    destaques: "",
    status: "disponivel",
    featured: false,
    ownerId: null,
    referenceCode: "",
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

      // Normalizar features para V2
      let rawFeatures = p.features;
      if (typeof rawFeatures === "string") {
        try { rawFeatures = JSON.parse(rawFeatures); } catch { rawFeatures = null; }
      }
      const featV2 = normalizeFeatures(rawFeatures);
      setFeatures(featV2);

      setFormData({
        title: p.title || "",
        description: p.description || "",
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
        suites: parseInt(p.suites ?? 0) || 0,
        bathrooms: parseInt(p.bathrooms ?? 0) || 0,
        parkingSpaces: parseInt(p.parking_spaces ?? p.parkingSpaces ?? 0) || 0,
        totalArea: parseFloat(p.total_area ?? p.totalArea ?? 0) || 0,
        builtArea: parseFloat(p.built_area ?? p.builtArea ?? 0) || 0,
        areaUtil: parseFloat(featV2.areas?.area_util_m2 ?? 0) || 0,
        areaPrivativa: parseFloat(featV2.areas?.area_privativa_m2 as any ?? 0) || 0,
        areaTerreno: parseFloat(featV2.areas?.area_terreno_m2 as any ?? 0) || 0,
        peDireito: parseFloat(featV2.areas?.pe_direito_m as any ?? 0) || 0,
        video_url: p.video_url || featV2.midia?.youtube_url || featV2.midia?.video_direto_url || "",
        tourVirtualUrl: (p.tour_virtual_url ?? p.tourVirtualUrl) || "",
        tour3dUrl: featV2.midia?.tour_3d_url || "",
        plantaUrls: (featV2.midia?.planta_urls ?? []).join("\n"),
        condNome: featV2.condominio?.nome || "",
        condTorre: featV2.condominio?.torre_bloco || "",
        condAndar: featV2.condominio?.andar ?? 0,
        condUnidadesPorAndar: featV2.condominio?.unidades_por_andar ?? 0,
        condElevadores: featV2.condominio?.elevadores ?? 0,
        condAnoConstrucao: featV2.condominio?.ano_construcao ?? 0,
        condPortaria: featV2.condominio?.portaria || "",
        destaques: (featV2.destaques ?? []).join("\n"),
        status: (p.status || "disponivel") as any,
        featured: p.featured ? true : false,
        ownerId: p.owner_id ? Number(p.owner_id) : (p.ownerId ? Number(p.ownerId) : null),
        referenceCode: (p.reference_code ?? p.referenceCode) || "",
      });
    }
  }, [property]);

  // Score de qualidade em tempo real
  const quality = useMemo(() => {
    const imgCount = Array.isArray((property as any)?.images) ? (property as any).images.length : 0;
    const mockProperty = {
      title: formData.title,
      description: formData.description,
      images: Array.from({ length: imgCount }, (_, i) => `photo-${i}`),
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
  }, [formData, features, property]);

  const buildFeaturesV2 = (): FeaturesV2 => {
    const f: FeaturesV2 = { ...features, version: 2 };
    f.areas = {
      area_util_m2: formData.areaUtil || null,
      area_privativa_m2: formData.areaPrivativa || null,
      area_terreno_m2: formData.areaTerreno || null,
      pe_direito_m: formData.peDireito || null,
    };
    f.condominio = {
      ...f.condominio,
      nome: formData.condNome || undefined,
      torre_bloco: formData.condTorre || undefined,
      andar: formData.condAndar || null,
      unidades_por_andar: formData.condUnidadesPorAndar || null,
      elevadores: formData.condElevadores || null,
      ano_construcao: formData.condAnoConstrucao || null,
      portaria: (formData.condPortaria as FeaturesV2["condominio"]["portaria"]) || undefined,
    };
    f.midia = {
      youtube_url: formData.video_url || undefined,
      video_direto_url: undefined,
      tour_3d_url: formData.tour3dUrl || formData.tourVirtualUrl || undefined,
      planta_urls: formData.plantaUrls
        ? formData.plantaUrls.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    f.destaques = formData.destaques
      ? formData.destaques.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
    return f;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!propertyId) return;

    const featuresV2 = buildFeaturesV2();

    await updateMutation.mutateAsync({
      id: propertyId,
      data: {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType as any,
        transactionType: formData.transactionType as any,
        address: formData.address,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        salePrice: formData.salePrice || undefined,
        rentPrice: formData.rentPrice || undefined,
        condoFee: formData.condoFee || undefined,
        iptu: formData.iptu || undefined,
        bedrooms: formData.bedrooms || undefined,
        suites: formData.suites || undefined,
        bathrooms: formData.bathrooms || undefined,
        parkingSpaces: formData.parkingSpaces || undefined,
        totalArea: formData.totalArea || undefined,
        builtArea: formData.builtArea || undefined,
        features: JSON.stringify(featuresV2),
        video_url: formData.video_url || undefined,
        tourVirtualUrl: formData.tourVirtualUrl || formData.tour3dUrl || undefined,
        status: formData.status as any,
        featured: formData.featured,
        ownerId: formData.ownerId,
        referenceCode: formData.referenceCode || undefined,
      },
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        <Button onClick={() => setLocation("/admin/properties")} className="mt-4">
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
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/properties")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Imóvel</h1>
            <p className="text-muted-foreground">
              {(p.reference_code ?? p.referenceCode) || `ID: ${p.id}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              quality.status === "PREMIUM" ? "bg-green-100 text-green-700 text-base px-3 py-1" :
              quality.status === "BOM"     ? "bg-yellow-100 text-yellow-700 text-base px-3 py-1" :
                                             "bg-red-100 text-red-600 text-base px-3 py-1"
            }
          >
            Score: {quality.score}/100
          </Badge>
          <Button onClick={() => handleSubmit()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basico" className="w-full">
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
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
        </TabsList>

        {/* ── Tab: Básico ── */}
        <TabsContent value="basico" className="space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">{formData.title.length} / 50 chars recomendados</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Código de Referência</Label>
                    <Input
                      value={formData.referenceCode}
                      onChange={(e) => handleChange("referenceCode", e.target.value)}
                      placeholder="Ex: IMV-001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">{formData.description.length} / 800 chars recomendados</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Imóvel *</Label>
                    <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
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
                  <div className="space-y-2">
                    <Label>Finalidade *</Label>
                    <Select value={formData.transactionType} onValueChange={(v) => handleChange("transactionType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="locacao">Locação</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
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

                <div className="space-y-2">
                  <Label>Proprietário (interno)</Label>
                  <Select
                    value={formData.ownerId != null ? String(formData.ownerId) : "none"}
                    onValueChange={(v) => handleChange("ownerId", v === "none" ? null : Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Sem proprietário" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem proprietário</SelectItem>
                      {owners.map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.featured}
                    onCheckedChange={(v) => handleChange("featured", !!v)}
                  />
                  <span className="text-sm">⭐ Marcar como Imóvel em Destaque</span>
                </label>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* ── Tab: Localização ── */}
        <TabsContent value="localizacao">
          <Card>
            <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Rua, número, complemento" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={formData.neighborhood} onChange={(e) => handleChange("neighborhood", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={formData.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={formData.state} onChange={(e) => handleChange("state", e.target.value)} maxLength={2} />
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
                <div className="space-y-2">
                  <Label>Preço de Venda (R$)</Label>
                  <Input type="number" value={formData.salePrice} onChange={(e) => handleChange("salePrice", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Preço de Locação (R$/mês)</Label>
                  <Input type="number" value={formData.rentPrice} onChange={(e) => handleChange("rentPrice", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condomínio (R$/mês)</Label>
                  <Input type="number" value={formData.condoFee} onChange={(e) => handleChange("condoFee", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>IPTU (R$/ano)</Label>
                  <Input type="number" value={formData.iptu} onChange={(e) => handleChange("iptu", parseFloat(e.target.value) || 0)} />
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
                <div className="space-y-2">
                  <Label>Quartos</Label>
                  <Input type="number" value={formData.bedrooms} onChange={(e) => handleChange("bedrooms", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Suítes</Label>
                  <Input type="number" value={formData.suites} onChange={(e) => handleChange("suites", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Banheiros</Label>
                  <Input type="number" value={formData.bathrooms} onChange={(e) => handleChange("bathrooms", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Vagas de Garagem</Label>
                  <Input type="number" value={formData.parkingSpaces} onChange={(e) => handleChange("parkingSpaces", parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Área Total (m²)</Label>
                  <Input type="number" step="0.01" value={formData.totalArea} onChange={(e) => handleChange("totalArea", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Área Construída (m²)</Label>
                  <Input type="number" step="0.01" value={formData.builtArea} onChange={(e) => handleChange("builtArea", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Área Útil (m²)</Label>
                  <Input type="number" step="0.01" value={formData.areaUtil} onChange={(e) => handleChange("areaUtil", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Área Privativa (m²)</Label>
                  <Input type="number" step="0.01" value={formData.areaPrivativa} onChange={(e) => handleChange("areaPrivativa", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área do Terreno (m²)</Label>
                  <Input type="number" step="0.01" value={formData.areaTerreno} onChange={(e) => handleChange("areaTerreno", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Pé-direito (m)</Label>
                  <Input type="number" step="0.01" value={formData.peDireito} onChange={(e) => handleChange("peDireito", parseFloat(e.target.value) || 0)} />
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
              <p className="text-sm text-muted-foreground">⭐ = item premium (maior peso no score)</p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={["imovel"]} className="space-y-2">
                {FEATURE_GROUPS.filter((g) => ["imovel", "acabamentos"].includes(g.groupKey)).map((group) => (
                  <AccordionItem key={group.groupKey} value={group.groupKey} className="border rounded-lg px-4">
                    <AccordionTrigger className="font-semibold">{group.title}</AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <FeatureCheckboxGroup groupKey={group.groupKey} items={group.items} features={features} onChange={setFeatures} />
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
                <div className="space-y-2">
                  <Label>Nome do Condomínio</Label>
                  <Input value={formData.condNome} onChange={(e) => handleChange("condNome", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Torre / Bloco</Label>
                  <Input value={formData.condTorre} onChange={(e) => handleChange("condTorre", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Andar</Label>
                  <Input type="number" value={formData.condAndar} onChange={(e) => handleChange("condAndar", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Unidades por Andar</Label>
                  <Input type="number" value={formData.condUnidadesPorAndar} onChange={(e) => handleChange("condUnidadesPorAndar", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Elevadores</Label>
                  <Input type="number" value={formData.condElevadores} onChange={(e) => handleChange("condElevadores", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Ano de Construção</Label>
                  <Input type="number" value={formData.condAnoConstrucao} onChange={(e) => handleChange("condAnoConstrucao", parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Portaria</Label>
                <Select value={formData.condPortaria} onValueChange={(v) => handleChange("condPortaria", v)}>
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
                      <FeatureCheckboxGroup groupKey={group.groupKey} items={group.items} features={features} onChange={setFeatures} />
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
                      <FeatureCheckboxGroup groupKey={group.groupKey} items={group.items} features={features} onChange={setFeatures} />
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
                <FeatureCheckboxGroup key={group.groupKey} groupKey={group.groupKey} items={group.items} features={features} onChange={setFeatures} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Mídia ── */}
        <TabsContent value="midia">
          <Card>
            <CardHeader><CardTitle>Vídeo e Tour Virtual</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Vídeo (YouTube / Vimeo / mp4)</Label>
                <Input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => handleChange("video_url", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL do Tour Virtual / 3D / 360°</Label>
                <Input
                  type="url"
                  value={formData.tourVirtualUrl}
                  onChange={(e) => handleChange("tourVirtualUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL do Tour 3D (alternativo)</Label>
                <Input
                  type="url"
                  value={formData.tour3dUrl}
                  onChange={(e) => handleChange("tour3dUrl", e.target.value)}
                  placeholder="https://matterport.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>URLs das Plantas (uma por linha)</Label>
                <Textarea
                  value={formData.plantaUrls}
                  onChange={(e) => handleChange("plantaUrls", e.target.value)}
                  rows={3}
                  placeholder="https://exemplo.com/planta1.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Destaques ── */}
        <TabsContent value="destaques">
          <Card>
            <CardHeader>
              <CardTitle>Destaques do Imóvel</CardTitle>
              <p className="text-sm text-muted-foreground">Um destaque por linha. Exibidos no topo da página do imóvel.</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.destaques}
                onChange={(e) => handleChange("destaques", e.target.value)}
                rows={6}
                placeholder="Vista panorâmica para o Lago Paranoá&#10;Piscina privativa aquecida&#10;Automação residencial completa"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Score de Qualidade ── */}
        <TabsContent value="score">
          <Card>
            <CardHeader>
              <CardTitle>Qualidade do Anúncio / SEO Score</CardTitle>
              <p className="text-sm text-muted-foreground">Score calculado em tempo real.</p>
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

        {/* ── Tab: Fotos ── */}
        <TabsContent value="fotos">
          <Card>
            <CardHeader>
              <CardTitle>Galeria de Fotos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Faça upload de fotos. A primeira imagem marcada será a principal.
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
