import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Save, Loader2, Star, MapPin, DollarSign, Home, Building2,
  Video, Image as ImageIcon, Search, CheckCircle2, AlertCircle, Info,
  Wifi, Car, Dumbbell, Trees, Shield, Waves, ChefHat, Baby
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import PropertyImageUpload from "@/components/PropertyImageUpload";

// ─── Listas de amenidades ────────────────────────────────────────────────────
const AMENITIES_UNIT = [
  { id: "ar_condicionado", label: "Ar-condicionado", icon: "❄️" },
  { id: "varanda", label: "Varanda / Sacada", icon: "🌿" },
  { id: "varanda_gourmet", label: "Varanda gourmet", icon: "🍖" },
  { id: "churrasqueira_varanda", label: "Churrasqueira na varanda", icon: "🔥" },
  { id: "piscina_privativa", label: "Piscina privativa", icon: "🏊" },
  { id: "jardim_privativo", label: "Jardim privativo", icon: "🌳" },
  { id: "quintal", label: "Quintal", icon: "🏡" },
  { id: "closet", label: "Closet", icon: "👗" },
  { id: "home_office", label: "Home office", icon: "💻" },
  { id: "cozinha_americana", label: "Cozinha americana", icon: "🍳" },
  { id: "despensa", label: "Despensa", icon: "📦" },
  { id: "lavanderia_interna", label: "Lavanderia interna", icon: "🧺" },
  { id: "armarios_embutidos", label: "Armários embutidos", icon: "🗄️" },
  { id: "ambientes_integrados", label: "Ambientes integrados", icon: "🔗" },
  { id: "piso_madeira", label: "Piso de madeira", icon: "🪵" },
  { id: "piso_porcelanato", label: "Piso porcelanato", icon: "⬜" },
  { id: "piso_marmore", label: "Piso mármore", icon: "🏛️" },
  { id: "aquecimento_gas", label: "Aquecimento a gás", icon: "🔥" },
  { id: "energia_solar", label: "Energia solar", icon: "☀️" },
  { id: "gerador", label: "Gerador", icon: "⚡" },
  { id: "poco_artesiano", label: "Poço artesiano", icon: "💧" },
  { id: "automacao_residencial", label: "Automação residencial", icon: "🤖" },
  { id: "fibra_optica", label: "Fibra óptica", icon: "🌐" },
  { id: "aceita_animais", label: "Aceita animais", icon: "🐾" },
  { id: "vista_mar", label: "Vista para o mar", icon: "🌊" },
  { id: "vista_cidade", label: "Vista para a cidade", icon: "🏙️" },
  { id: "deposito_box", label: "Depósito / Box", icon: "📦" },
  { id: "portao_eletronico", label: "Portão eletrônico", icon: "🚪" },
];

const AMENITIES_CONDO = [
  { id: "piscina", label: "Piscina", icon: "🏊" },
  { id: "piscina_infantil", label: "Piscina infantil", icon: "👶" },
  { id: "academia", label: "Academia / Fitness", icon: "🏋️" },
  { id: "salao_festas", label: "Salão de festas", icon: "🎉" },
  { id: "salao_jogos", label: "Salão de jogos", icon: "🎮" },
  { id: "espaco_gourmet", label: "Espaço gourmet", icon: "🍽️" },
  { id: "churrasqueira", label: "Churrasqueira", icon: "🔥" },
  { id: "playground", label: "Playground", icon: "🛝" },
  { id: "brinquedoteca", label: "Brinquedoteca", icon: "🧸" },
  { id: "cinema", label: "Cinema / Home theater", icon: "🎬" },
  { id: "coworking", label: "Coworking", icon: "💼" },
  { id: "lavanderia_coletiva", label: "Lavanderia coletiva", icon: "🧺" },
  { id: "quadra_poliesportiva", label: "Quadra poliesportiva", icon: "⚽" },
  { id: "quadra_tenis", label: "Quadra de tênis", icon: "🎾" },
  { id: "quadra_squash", label: "Quadra de squash", icon: "🏸" },
  { id: "campo_futebol", label: "Campo de futebol", icon: "⚽" },
  { id: "espaco_pet", label: "Espaço pet", icon: "🐕" },
  { id: "bicicletario", label: "Bicicletário", icon: "🚲" },
  { id: "area_lazer", label: "Área de lazer", icon: "🌿" },
  { id: "jardim", label: "Jardim / Área verde", icon: "🌳" },
  { id: "portaria_24h", label: "Portaria 24h", icon: "👮" },
  { id: "portao_eletronico_condo", label: "Portão eletrônico", icon: "🚪" },
  { id: "cameras_seguranca", label: "Câmeras de segurança", icon: "📹" },
  { id: "condominio_fechado", label: "Condomínio fechado", icon: "🔒" },
  { id: "acessibilidade", label: "Acessibilidade", icon: "♿" },
  { id: "elevador", label: "Elevador", icon: "🛗" },
  { id: "gerador_condo", label: "Gerador", icon: "⚡" },
  { id: "energia_solar_condo", label: "Energia solar", icon: "☀️" },
  { id: "spa_sauna", label: "Spa / Sauna", icon: "🧖" },
  { id: "rooftop", label: "Rooftop", icon: "🏙️" },
  { id: "heliponto", label: "Heliponto", icon: "🚁" },
  { id: "car_sharing", label: "Car sharing", icon: "🚗" },
  { id: "mini_market", label: "Mini market 24h", icon: "🛒" },
];

// ─── Função de cálculo do SEO Score ─────────────────────────────────────────
function calcSeoScore(form: any, images: any[]): { score: number; items: { label: string; ok: boolean; points: number }[] } {
  const items = [
    { label: "Título preenchido (mín. 30 chars)", ok: (form.title || "").length >= 30, points: 15 },
    { label: "Descrição rica (mín. 150 chars)", ok: (form.description || "").length >= 150, points: 20 },
    { label: "Ao menos 5 fotos", ok: images.length >= 5, points: 15 },
    { label: "Ao menos 10 fotos (ideal)", ok: images.length >= 10, points: 5 },
    { label: "Vídeo do YouTube/Vimeo", ok: !!(form.videoUrl || form.video_url), points: 10 },
    { label: "Tour virtual 360°", ok: !!form.tourVirtualUrl, points: 5 },
    { label: "Endereço completo", ok: !!(form.address && form.neighborhood && form.city), points: 10 },
    { label: "Preço preenchido", ok: !!(form.salePrice || form.rentPrice), points: 10 },
    { label: "Área total informada", ok: !!(form.totalArea), points: 5 },
    { label: "Meta título (SEO)", ok: (form.metaTitle || "").length >= 20, points: 5 },
  ];
  const score = items.reduce((acc, i) => acc + (i.ok ? i.points : 0), 0);
  return { score, items };
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function PropertyEdit() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const propertyId = params.id ? parseInt(params.id) : null;
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<Record<string, any>>({
    title: "", description: "", referenceCode: "",
    propertyType: "apartamento", transactionType: "venda",
    propertySubtype: "residencial", propertyCondition: "usado",
    address: "", neighborhood: "", city: "Brasília", state: "DF", zipCode: "",
    latitude: "", longitude: "",
    // Preços
    salePrice: 0, rentPrice: 0, condoFee: 0, iptu: 0, fireInsurance: 0,
    // Características
    bedrooms: 0, bathrooms: 0, suites: 0, lavabos: 0, parkingSpaces: 0,
    // Áreas
    totalArea: 0, builtArea: 0, usefulArea: 0, landArea: 0, serviceArea: 0,
    // Detalhes
    floorNumber: 0, totalFloors: 0, unitsPerFloor: 0, unitNumber: "", block: "",
    yearBuilt: 0, sunPosition: "", furnishedStatus: "sem_mobilia",
    // Financeiro
    acceptsFinancing: true, acceptsFgts: false, acceptsExchange: false,
    // Condomínio
    condoName: "", condoUnits: 0, condoAdministrator: "", builder: "",
    // Localização extra
    nearbySubway: false, subwayDistanceM: 0,
    // Amenidades
    amenitiesUnit: [] as string[], amenitiesCondo: [] as string[],
    // Mídia
    videoUrl: "", tourVirtualUrl: "",
    // Status
    status: "disponivel", featured: false, published: true,
    // SEO
    metaTitle: "", metaDescription: "", seoKeywords: "", slug: "",
    ownerId: null,
  });

  const [propertyImages, setPropertyImages] = useState<any[]>([]);

  const { data: property, isLoading: loadingProperty } = trpc.properties.getById.useQuery(
    { id: propertyId! },
    { enabled: !!propertyId }
  );

  // Pré-carregar dados do imóvel no formulário
  useEffect(() => {
    if (!property) return;
    setFormData({
      title:              property.title ?? "",
      description:        property.description ?? "",
      referenceCode:      property.reference_code ?? "",
      propertyType:       property.property_type ?? "apartamento",
      transactionType:    property.transaction_type ?? "venda",
      propertySubtype:    property.property_subtype ?? "residencial",
      propertyCondition:  property.property_condition ?? "usado",
      address:            property.address ?? "",
      neighborhood:       property.neighborhood ?? "",
      city:               property.city ?? "Brasília",
      state:              property.state ?? "DF",
      zipCode:            property.zip_code ?? "",
      latitude:           property.latitude ?? "",
      longitude:          property.longitude ?? "",
      salePrice:          Number(property.sale_price) || 0,
      rentPrice:          Number(property.rent_price) || 0,
      condoFee:           Number(property.condo_fee) || 0,
      iptu:               Number(property.iptu) || 0,
      fireInsurance:      Number(property.fire_insurance) || 0,
      bedrooms:           property.bedrooms ?? 0,
      bathrooms:          property.bathrooms ?? 0,
      suites:             property.suites ?? 0,
      lavabos:            property.lavabos ?? 0,
      parkingSpaces:      property.parking_spaces ?? 0,
      totalArea:          Number(property.total_area) || 0,
      builtArea:          Number(property.built_area) || 0,
      usefulArea:         Number(property.useful_area) || 0,
      landArea:           Number(property.land_area) || 0,
      serviceArea:        Number(property.service_area) || 0,
      floorNumber:        property.floor_number ?? 0,
      totalFloors:        property.total_floors ?? 0,
      unitsPerFloor:      property.units_per_floor ?? 0,
      unitNumber:         property.unit_number ?? "",
      block:              property.block ?? "",
      yearBuilt:          property.year_built ?? 0,
      sunPosition:        property.sun_position ?? "",
      furnishedStatus:    property.furnished_status ?? "sem_mobilia",
      acceptsFinancing:   property.accepts_financing ?? true,
      acceptsFgts:        property.accepts_fgts ?? false,
      acceptsExchange:    property.accepts_exchange ?? false,
      condoName:          property.condo_name ?? "",
      condoUnits:         property.condo_units ?? 0,
      condoAdministrator: property.condo_administrator ?? "",
      builder:            property.builder ?? "",
      nearbySubway:       property.nearby_subway ?? false,
      subwayDistanceM:    property.subway_distance_m ?? 0,
      amenitiesUnit:      (property.amenities_unit as string[]) ?? [],
      amenitiesCondo:     (property.amenities_condo as string[]) ?? [],
      videoUrl:           property.video_url ?? "",
      tourVirtualUrl:     property.tour_virtual_url ?? "",
      status:             property.status ?? "disponivel",
      featured:           property.featured ?? false,
      published:          property.published ?? true,
      metaTitle:          property.meta_title ?? "",
      metaDescription:    property.meta_description ?? "",
      seoKeywords:        property.seo_keywords ?? "",
      slug:               property.slug ?? "",
      ownerId:            property.owner_id ?? null,
    });
    if (property.images && Array.isArray(property.images)) {
      setPropertyImages(property.images.map((url: string, i: number) => ({ url, id: i })));
    }
  }, [property]);

  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Imóvel atualizado com sucesso!");
      utils.properties.getById.invalidate({ id: propertyId! });
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message),
  });

  const seo = useMemo(() => calcSeoScore(formData, propertyImages), [formData, propertyImages]);

  const set = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const toggleAmenity = (list: "amenitiesUnit" | "amenitiesCondo", id: string) => {
    setFormData(prev => {
      const arr: string[] = prev[list] ?? [];
      return {
        ...prev,
        [list]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id],
      };
    });
  };

  const handleSave = () => {
    if (!propertyId) return;
    updateMutation.mutate({
      id: propertyId,
      data: {
        ...formData,
        seoScore: seo.score,
      } as any,
    });
  };

  if (loadingProperty) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const seoColor = seo.score >= 80 ? "text-green-600" : seo.score >= 50 ? "text-yellow-600" : "text-red-500";
  const seoLabel = seo.score >= 80 ? "Excelente" : seo.score >= 50 ? "Regular" : "Fraco";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/properties")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Imóvel</h1>
            <p className="text-sm text-muted-foreground">
              {formData.referenceCode ? `Ref: ${formData.referenceCode}` : `ID: ${propertyId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* SEO Score Badge */}
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">SEO:</span>
            <span className={`text-sm font-bold ${seoColor}`}>{seo.score}/100</span>
            <Badge variant={seo.score >= 80 ? "default" : seo.score >= 50 ? "secondary" : "destructive"} className="text-xs">
              {seoLabel}
            </Badge>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* SEO Score Progress */}
      <Card className="border-l-4" style={{ borderLeftColor: seo.score >= 80 ? "#16a34a" : seo.score >= 50 ? "#ca8a04" : "#dc2626" }}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Qualidade do Anúncio</span>
            <span className={`text-sm font-bold ${seoColor}`}>{seo.score}% — {seoLabel}</span>
          </div>
          <Progress value={seo.score} className="h-2 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {seo.items.map(item => (
              <div key={item.label} className="flex items-start gap-1.5">
                {item.ok
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />}
                <span className={`text-xs leading-tight ${item.ok ? "text-muted-foreground" : "text-red-500"}`}>
                  {item.label} (+{item.points}pts)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs principais */}
      <Tabs defaultValue="identificacao">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="identificacao" className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5" />Identificação</TabsTrigger>
          <TabsTrigger value="localizacao" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Localização</TabsTrigger>
          <TabsTrigger value="valores" className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Valores</TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />Áreas</TabsTrigger>
          <TabsTrigger value="detalhes" className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />Detalhes</TabsTrigger>
          <TabsTrigger value="amenidades" className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />Amenidades</TabsTrigger>
          <TabsTrigger value="midia" className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5" />Mídia</TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5" />SEO</TabsTrigger>
        </TabsList>

        {/* ── ABA: IDENTIFICAÇÃO ─────────────────────────────────────────────── */}
        <TabsContent value="identificacao">
          <Card>
            <CardHeader><CardTitle>Identificação do Imóvel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Título do Anúncio *</Label>
                  <Input
                    value={formData.title}
                    onChange={e => set("title", e.target.value)}
                    placeholder="Ex: Apartamento 3 quartos com suíte no Lago Sul"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">{formData.title.length}/100 chars — ideal: 50-80</p>
                </div>
                <div className="space-y-2">
                  <Label>Código de Referência</Label>
                  <Input value={formData.referenceCode} onChange={e => set("referenceCode", e.target.value)} placeholder="Ex: AP-001" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição Completa</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Descreva o imóvel com detalhes: localização, diferenciais, acabamentos, entorno..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">{(formData.description || "").length} chars — ideal: 300+</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Imóvel *</Label>
                  <Select value={formData.propertyType} onValueChange={v => set("propertyType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                      <SelectItem value="lancamento">Lançamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subtipo</Label>
                  <Select value={formData.propertySubtype} onValueChange={v => set("propertySubtype", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residencial">Residencial</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transação *</Label>
                  <Select value={formData.transactionType} onValueChange={v => set("transactionType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                      <SelectItem value="ambos">Venda e Locação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condição</Label>
                  <Select value={formData.propertyCondition} onValueChange={v => set("propertyCondition", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="usado">Usado</SelectItem>
                      <SelectItem value="na_planta">Na planta</SelectItem>
                      <SelectItem value="em_construcao">Em construção</SelectItem>
                      <SelectItem value="em_reforma">Em reforma</SelectItem>
                      <SelectItem value="pronto_morar">Pronto para morar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => set("status", v)}>
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
                <div className="space-y-2">
                  <Label>Mobília</Label>
                  <Select value={formData.furnishedStatus} onValueChange={v => set("furnishedStatus", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_mobilia">Sem mobília</SelectItem>
                      <SelectItem value="semimobiliado">Semimobiliado</SelectItem>
                      <SelectItem value="mobiliado">Mobiliado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={formData.featured} onCheckedChange={v => set("featured", v)} id="featured" />
                  <Label htmlFor="featured">Destaque</Label>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={formData.published} onCheckedChange={v => set("published", v)} id="published" />
                  <Label htmlFor="published">Publicado</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: LOCALIZAÇÃO ──────────────────────────────────────────────── */}
        <TabsContent value="localizacao">
          <Card>
            <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Endereço (Rua, número, complemento)</Label>
                  <Input value={formData.address} onChange={e => set("address", e.target.value)} placeholder="Ex: Rua das Flores, 123, Apto 42" />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={formData.zipCode} onChange={e => set("zipCode", e.target.value)} placeholder="00000-000" maxLength={9} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={formData.neighborhood} onChange={e => set("neighborhood", e.target.value)} placeholder="Ex: Asa Norte" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={formData.city} onChange={e => set("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={formData.state} onChange={e => set("state", e.target.value)} maxLength={2} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input value={formData.latitude} onChange={e => set("latitude", e.target.value)} placeholder="-15.7801" />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input value={formData.longitude} onChange={e => set("longitude", e.target.value)} placeholder="-47.9292" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch checked={formData.nearbySubway} onCheckedChange={v => set("nearbySubway", v)} id="subway" />
                  <Label htmlFor="subway">Próximo ao metrô/trem</Label>
                </div>
                {formData.nearbySubway && (
                  <div className="space-y-2">
                    <Label>Distância da estação (metros)</Label>
                    <Input type="number" value={formData.subwayDistanceM || ""} onChange={e => set("subwayDistanceM", Number(e.target.value))} placeholder="500" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: VALORES ──────────────────────────────────────────────────── */}
        <TabsContent value="valores">
          <Card>
            <CardHeader><CardTitle>Valores e Financeiro</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Venda (R$)</Label>
                  <Input type="number" value={formData.salePrice || ""} onChange={e => set("salePrice", Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Preço de Locação (R$/mês)</Label>
                  <Input type="number" value={formData.rentPrice || ""} onChange={e => set("rentPrice", Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Condomínio (R$/mês)</Label>
                  <Input type="number" value={formData.condoFee || ""} onChange={e => set("condoFee", Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>IPTU (R$/ano)</Label>
                  <Input type="number" value={formData.iptu || ""} onChange={e => set("iptu", Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Seguro Incêndio (R$/mês)</Label>
                  <Input type="number" value={formData.fireInsurance || ""} onChange={e => set("fireInsurance", Number(e.target.value))} placeholder="0" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Condições de Negociação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.acceptsFinancing} onCheckedChange={v => set("acceptsFinancing", v)} id="financing" />
                    <Label htmlFor="financing">Aceita financiamento bancário</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.acceptsFgts} onCheckedChange={v => set("acceptsFgts", v)} id="fgts" />
                    <Label htmlFor="fgts">Aceita FGTS</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.acceptsExchange} onCheckedChange={v => set("acceptsExchange", v)} id="exchange" />
                    <Label htmlFor="exchange">Aceita permuta</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: ÁREAS ────────────────────────────────────────────────────── */}
        <TabsContent value="areas">
          <Card>
            <CardHeader><CardTitle>Áreas e Dimensões (m²)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Área Total (m²)</Label>
                  <Input type="number" value={formData.totalArea || ""} onChange={e => set("totalArea", Number(e.target.value))} placeholder="0" />
                  <p className="text-xs text-muted-foreground">Área total do imóvel</p>
                </div>
                <div className="space-y-2">
                  <Label>Área Útil / Privativa (m²)</Label>
                  <Input type="number" value={formData.usefulArea || ""} onChange={e => set("usefulArea", Number(e.target.value))} placeholder="0" />
                  <p className="text-xs text-muted-foreground">Área interna utilizável</p>
                </div>
                <div className="space-y-2">
                  <Label>Área Construída (m²)</Label>
                  <Input type="number" value={formData.builtArea || ""} onChange={e => set("builtArea", Number(e.target.value))} placeholder="0" />
                  <p className="text-xs text-muted-foreground">Área total construída</p>
                </div>
                <div className="space-y-2">
                  <Label>Área do Terreno (m²)</Label>
                  <Input type="number" value={formData.landArea || ""} onChange={e => set("landArea", Number(e.target.value))} placeholder="0" />
                  <p className="text-xs text-muted-foreground">Para casas e terrenos</p>
                </div>
                <div className="space-y-2">
                  <Label>Área de Serviço (m²)</Label>
                  <Input type="number" value={formData.serviceArea || ""} onChange={e => set("serviceArea", Number(e.target.value))} placeholder="0" />
                </div>
              </div>
              {/* Preço por m² calculado */}
              {formData.salePrice > 0 && formData.totalArea > 0 && (
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Preço por m²: <strong>R$ {(formData.salePrice / formData.totalArea).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/m²</strong>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: DETALHES ─────────────────────────────────────────────────── */}
        <TabsContent value="detalhes">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Cômodos e Características</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: "bedrooms", label: "Quartos" },
                    { key: "suites", label: "Suítes" },
                    { key: "bathrooms", label: "Banheiros" },
                    { key: "lavabos", label: "Lavabos" },
                    { key: "parkingSpaces", label: "Vagas de Garagem" },
                  ].map(f => (
                    <div key={f.key} className="space-y-2">
                      <Label>{f.label}</Label>
                      <Input type="number" min={0} value={formData[f.key] || ""} onChange={e => set(f.key, Number(e.target.value))} placeholder="0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Detalhes do Edifício / Condomínio</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Andar do Imóvel</Label>
                    <Input type="number" value={formData.floorNumber || ""} onChange={e => set("floorNumber", Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total de Andares</Label>
                    <Input type="number" value={formData.totalFloors || ""} onChange={e => set("totalFloors", Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidades por Andar</Label>
                    <Input type="number" value={formData.unitsPerFloor || ""} onChange={e => set("unitsPerFloor", Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Número da Unidade</Label>
                    <Input value={formData.unitNumber} onChange={e => set("unitNumber", e.target.value)} placeholder="Ex: 42" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bloco / Torre</Label>
                    <Input value={formData.block} onChange={e => set("block", e.target.value)} placeholder="Ex: Bloco A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ano de Construção</Label>
                    <Input type="number" value={formData.yearBuilt || ""} onChange={e => set("yearBuilt", Number(e.target.value))} placeholder="2020" />
                  </div>
                  <div className="space-y-2">
                    <Label>Posição Solar</Label>
                    <Select value={formData.sunPosition || ""} onValueChange={v => set("sunPosition", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="norte">Norte</SelectItem>
                        <SelectItem value="sul">Sul</SelectItem>
                        <SelectItem value="leste">Leste</SelectItem>
                        <SelectItem value="oeste">Oeste</SelectItem>
                        <SelectItem value="nordeste">Nordeste</SelectItem>
                        <SelectItem value="noroeste">Noroeste</SelectItem>
                        <SelectItem value="sudeste">Sudeste</SelectItem>
                        <SelectItem value="sudoeste">Sudoeste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Dados do Empreendimento</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Condomínio / Empreendimento</Label>
                    <Input value={formData.condoName} onChange={e => set("condoName", e.target.value)} placeholder="Ex: Residencial Park View" />
                  </div>
                  <div className="space-y-2">
                    <Label>Construtora / Incorporadora</Label>
                    <Input value={formData.builder} onChange={e => set("builder", e.target.value)} placeholder="Ex: MRV Engenharia" />
                  </div>
                  <div className="space-y-2">
                    <Label>Administradora do Condomínio</Label>
                    <Input value={formData.condoAdministrator} onChange={e => set("condoAdministrator", e.target.value)} placeholder="Ex: Administradora Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total de Unidades no Condomínio</Label>
                    <Input type="number" value={formData.condoUnits || ""} onChange={e => set("condoUnits", Number(e.target.value))} placeholder="0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ABA: AMENIDADES ───────────────────────────────────────────────── */}
        <TabsContent value="amenidades">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Características da Unidade
                  <Badge variant="secondary">{(formData.amenitiesUnit || []).length} selecionadas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AMENITIES_UNIT.map(a => (
                    <label key={a.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${(formData.amenitiesUnit || []).includes(a.id) ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}>
                      <Checkbox
                        checked={(formData.amenitiesUnit || []).includes(a.id)}
                        onCheckedChange={() => toggleAmenity("amenitiesUnit", a.id)}
                      />
                      <span className="text-sm">{a.icon} {a.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Características do Condomínio
                  <Badge variant="secondary">{(formData.amenitiesCondo || []).length} selecionadas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AMENITIES_CONDO.map(a => (
                    <label key={a.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${(formData.amenitiesCondo || []).includes(a.id) ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}>
                      <Checkbox
                        checked={(formData.amenitiesCondo || []).includes(a.id)}
                        onCheckedChange={() => toggleAmenity("amenitiesCondo", a.id)}
                      />
                      <span className="text-sm">{a.icon} {a.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ABA: MÍDIA ────────────────────────────────────────────────────── */}
        <TabsContent value="midia">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Galeria de Fotos
                  <Badge variant={propertyImages.length >= 10 ? "default" : propertyImages.length >= 5 ? "secondary" : "destructive"}>
                    {propertyImages.length} foto{propertyImages.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {propertyId && <PropertyImageUpload propertyId={propertyId} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Vídeo e Tour Virtual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Vídeo (YouTube ou Vimeo)</Label>
                  <Input
                    value={formData.videoUrl || formData.video_url || ""}
                    onChange={e => set("videoUrl", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">Cole o link do YouTube, Vimeo ou qualquer URL de vídeo. O sistema converte automaticamente para embed.</p>
                </div>
                {(formData.videoUrl || formData.video_url) && (
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">Vídeo configurado — +10 pts no SEO score</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>URL do Tour Virtual 360°</Label>
                  <Input
                    value={formData.tourVirtualUrl}
                    onChange={e => set("tourVirtualUrl", e.target.value)}
                    placeholder="https://matterport.com/... ou https://tour.example.com/..."
                  />
                  <p className="text-xs text-muted-foreground">Suporta Matterport, iGuide, Kuula, ou qualquer link de tour virtual.</p>
                </div>
                {formData.tourVirtualUrl && (
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">Tour virtual configurado — +5 pts no SEO score</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ABA: SEO ──────────────────────────────────────────────────────── */}
        <TabsContent value="seo">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Score de Qualidade do Anúncio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-5xl font-bold ${seoColor}`}>{seo.score}</div>
                  <div>
                    <div className={`text-lg font-semibold ${seoColor}`}>{seoLabel}</div>
                    <div className="text-sm text-muted-foreground">de 100 pontos possíveis</div>
                  </div>
                  <div className="flex-1">
                    <Progress value={seo.score} className="h-3" />
                  </div>
                </div>
                <div className="space-y-2">
                  {seo.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {item.ok
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <AlertCircle className="h-4 w-4 text-red-400" />}
                        <span className={`text-sm ${item.ok ? "" : "text-red-500"}`}>{item.label}</span>
                      </div>
                      <Badge variant={item.ok ? "default" : "outline"}>+{item.points} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Metadados SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta Título (para Google)</Label>
                  <Input
                    value={formData.metaTitle}
                    onChange={e => set("metaTitle", e.target.value)}
                    placeholder="Ex: Apartamento 3 quartos à venda no Lago Sul, Brasília"
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground">{(formData.metaTitle || "").length}/70 chars — ideal: 50-60</p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Descrição (para Google)</Label>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={e => set("metaDescription", e.target.value)}
                    placeholder="Apartamento espaçoso com 3 quartos, 2 suítes, varanda gourmet e 2 vagas no Lago Sul..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">{(formData.metaDescription || "").length}/160 chars — ideal: 120-155</p>
                </div>
                <div className="space-y-2">
                  <Label>Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    value={formData.seoKeywords}
                    onChange={e => set("seoKeywords", e.target.value)}
                    placeholder="apartamento lago sul, 3 quartos brasília, imóvel alto padrão"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL amigável)</Label>
                  <Input
                    value={formData.slug}
                    onChange={e => set("slug", e.target.value)}
                    placeholder="apartamento-3-quartos-lago-sul"
                  />
                  <p className="text-xs text-muted-foreground">Usado na URL: /imoveis/<strong>{formData.slug || "slug-do-imovel"}</strong></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botão salvar fixo no rodapé */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setLocation("/admin/properties")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Imóvel
        </Button>
      </div>
    </div>
  );
}
