import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Bed, Bath, Maximize, MapPin, Car, Home,
  Phone, Mail, MessageSquare, Share2,
  ChevronLeft, ChevronRight, X,
  Building2, DollarSign, Layers, Hash, CheckCircle2,
} from "lucide-react";
import { Link, useParams } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

// ─── helpers ────────────────────────────────────────────────────────────────
function fmtCurrency(val: number | string | null | undefined): string {
  if (!val) return "";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n) || n === 0) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}
function fmtArea(val: number | string | null | undefined): string {
  if (!val) return "";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n) || n === 0) return "";
  return `${n.toLocaleString("pt-BR")} m²`;
}

// ─── FeatureItem ─────────────────────────────────────────────────────────────
function FeatureItem({
  icon, value, label, wide,
}: {
  icon: React.ReactNode; value: string; label: string; wide?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">{icon}</div>
      <div>
        <div className="font-semibold text-sm leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────
export default function PropertyDetail() {
  const params = useParams();
  const propertyId = params.id ? parseInt(params.id) : 0;

  const { data: property, isLoading } = trpc.properties.getById.useQuery(
    { id: propertyId },
    { enabled: !!propertyId }
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    message: "Olá! Tenho interesse neste imóvel e gostaria de mais informações.",
  });

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => toast.error("Erro ao enviar mensagem. Tente novamente."),
  });

  // ── images ──
  const rawImages: string[] = Array.isArray((property as any)?.images) ? (property as any).images : [];
  const mainImg: string | undefined =
    typeof (property as any)?.main_image === "string" && (property as any).main_image
      ? (property as any).main_image
      : typeof (property as any)?.coverImage === "string" && (property as any).coverImage
      ? (property as any).coverImage
      : undefined;
  const allImages: string[] = rawImages.length > 0 ? rawImages : mainImg ? [mainImg] : [];

  const goNext = () => setCurrentIdx((p) => (p + 1) % allImages.length);
  const goPrev = () => setCurrentIdx((p) => (p - 1 + allImages.length) % allImages.length);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate({
      name: formData.name, email: formData.email, phone: formData.phone,
      notes: formData.message, source: "site", interestedPropertyId: propertyId,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: (property as any)?.title || "", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  // ── loading / not found ──
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
        <Footer />
      </>
    );
  }
  if (!property) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Imóvel não encontrado</h1>
            <Link href="/imoveis"><Button>Voltar para Imóveis</Button></Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const p = property as any;

  // ── derived values ──
  const salePrice     = p.sale_price  ?? p.salePrice;
  const rentPrice     = p.rent_price  ?? p.rentPrice;
  const condoFee      = p.condo_fee   ?? p.condoFee;
  const iptu          = p.iptu;
  const totalArea     = p.total_area  ?? p.totalArea;
  const builtArea     = p.built_area  ?? p.builtArea;
  const parkingSpaces = p.parking_spaces ?? p.parkingSpaces;
  const refCode       = p.reference_code ?? p.referenceCode;
  const lat           = p.latitude  ? parseFloat(p.latitude)  : null;
  const lng           = p.longitude ? parseFloat(p.longitude) : null;

  const priceDisplay =
    salePrice  ? fmtCurrency(salePrice)
    : rentPrice ? `${fmtCurrency(rentPrice)}/mês`
    : "Consulte";

  const fullAddress = [p.address, p.neighborhood, p.city, p.state].filter(Boolean).join(", ");

  const mapSrc =
    lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`
      : fullAddress
      ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&z=16&output=embed`
      : null;

  const whatsappMsg = encodeURIComponent(
    `Olá! Tenho interesse no imóvel "${p.title}"${refCode ? ` (Cód: ${refCode})` : ""}. Gostaria de mais informações.`
  );
  const whatsappUrl = `https://wa.me/5561998687245?text=${whatsappMsg}`;

  // SEO
  const seoTitle = `${p.title} - Leman Negócios Imobiliários`;
  const seoDesc  = p.description?.substring(0, 160) ||
    `Imóvel para ${p.transaction_type || p.transactionType} em ${p.neighborhood}, ${p.city}. ${priceDisplay}.`;
  const seoImage = allImages[0] || "https://placehold.co/1200x630";
  const seoUrl   = `https://lemannegocios.com.br/imovel/${p.id}`;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={seoUrl} />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content={seoUrl} />
        <meta property="og:title"       content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image"       content={seoImage} />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:url"         content={seoUrl} />
        <meta name="twitter:title"       content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image"       content={seoImage} />
      </Helmet>

      <Header />

      <div className="min-h-screen bg-background">
        {/* ── Gallery ── */}
        <section className="relative bg-black/90">
          {allImages.length > 0 ? (
            <>
              {/* Main image — object-contain (sem corte) */}
              <div
                className="w-full aspect-[16/9] flex items-center justify-center cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={allImages[currentIdx]}
                  alt={`${p.title} - Foto ${currentIdx + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                    {currentIdx + 1} / {allImages.length}
                  </div>
                </>
              )}

              <div className="absolute top-4 right-4">
                <Button variant="secondary" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" /> Compartilhar
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Home className="h-24 w-24 text-muted-foreground" />
            </div>
          )}

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="container py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentIdx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Lightbox ── */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-screen-xl w-full h-[90vh] p-0 bg-black border-none flex items-center justify-center">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            {allImages.length > 1 && (
              <>
                <button onClick={goPrev} className="absolute left-4 z-50 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full">
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button onClick={goNext} className="absolute right-4 z-50 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full">
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            <img
              src={allImages[currentIdx]}
              alt={`${p.title} - Foto ${currentIdx + 1}`}
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentIdx + 1} / {allImages.length}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Content ── */}
        <section className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Main */}
              <div className="lg:col-span-2 space-y-8">

                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="capitalize">{p.property_type || p.propertyType}</span>
                    <span>•</span>
                    <span className="capitalize">{p.transaction_type || p.transactionType}</span>
                    {refCode && <><span>•</span><span>Cód: {refCode}</span></>}
                    {p.status && <><span>•</span><span className="capitalize">{p.status}</span></>}
                  </div>
                  <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">{p.title}</h1>
                  {fullAddress && (
                    <p className="text-muted-foreground flex items-center gap-2 text-base mb-4">
                      <MapPin className="h-4 w-4 flex-shrink-0" />{fullAddress}
                    </p>
                  )}
                  <div className="text-3xl font-bold text-primary">{priceDisplay}</div>
                </div>

                {/* Características completas */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-heading text-xl font-bold mb-5">Características</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                      {p.bedrooms     ? <FeatureItem icon={<Bed className="h-5 w-5" />}          value={String(p.bedrooms)}         label="Quartos" /> : null}
                      {p.bathrooms    ? <FeatureItem icon={<Bath className="h-5 w-5" />}         value={String(p.bathrooms)}        label="Banheiros" /> : null}
                      {p.suites       ? <FeatureItem icon={<Bed className="h-5 w-5" />}          value={String(p.suites)}           label="Suítes" /> : null}
                      {parkingSpaces  ? <FeatureItem icon={<Car className="h-5 w-5" />}          value={String(parkingSpaces)}      label="Vagas" /> : null}
                      {totalArea      ? <FeatureItem icon={<Maximize className="h-5 w-5" />}     value={fmtArea(totalArea)}         label="Área Total" /> : null}
                      {builtArea      ? <FeatureItem icon={<Layers className="h-5 w-5" />}       value={fmtArea(builtArea)}         label="Área Construída" /> : null}
                      {salePrice      ? <FeatureItem icon={<DollarSign className="h-5 w-5" />}   value={fmtCurrency(salePrice)}     label="Preço de Venda" wide /> : null}
                      {rentPrice      ? <FeatureItem icon={<DollarSign className="h-5 w-5" />}   value={`${fmtCurrency(rentPrice)}/mês`} label="Aluguel" wide /> : null}
                      {condoFee       ? <FeatureItem icon={<Building2 className="h-5 w-5" />}    value={fmtCurrency(condoFee)}      label="Condomínio" wide /> : null}
                      {iptu           ? <FeatureItem icon={<DollarSign className="h-5 w-5" />}   value={fmtCurrency(iptu)}          label="IPTU/ano" wide /> : null}
                      {refCode        ? <FeatureItem icon={<Hash className="h-5 w-5" />}         value={refCode}                    label="Código" /> : null}
                      {p.status       ? <FeatureItem icon={<CheckCircle2 className="h-5 w-5" />} value={p.status}                   label="Status" /> : null}
                    </div>
                  </CardContent>
                </Card>

                {/* Descrição */}
                {p.description && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="font-heading text-xl font-bold mb-4">Descrição</h2>
                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{p.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Mapa embed */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-heading text-xl font-bold mb-4">Localização</h2>
                    {mapSrc ? (
                      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border">
                        <iframe
                          title="Mapa do imóvel"
                          src={mapSrc}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <MapPin className="h-10 w-10 mx-auto mb-2" />
                          <p>{fullAddress || "Endereço não informado"}</p>
                        </div>
                      </div>
                    )}
                    {fullAddress && (
                      <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {fullAddress}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <div className="text-2xl font-bold text-primary mb-1">{priceDisplay}</div>
                    <p className="text-sm text-muted-foreground mb-5">{p.title}</p>

                    {/* CTAs diretos */}
                    <div className="space-y-3 mb-6">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                      >
                        <MessageSquare className="h-5 w-5" /> Falar no WhatsApp
                      </a>
                      <a
                        href="tel:+5561998687245"
                        className="flex items-center justify-center gap-2 w-full border border-border hover:bg-muted text-foreground font-semibold py-3 px-4 rounded-lg transition-colors"
                      >
                        <Phone className="h-5 w-5" /> (61) 99868-7245
                      </a>
                      <a
                        href="mailto:contato@lemannegocios.com.br"
                        className="flex items-center justify-center gap-2 w-full border border-border hover:bg-muted text-foreground font-semibold py-3 px-4 rounded-lg transition-colors"
                      >
                        <Mail className="h-5 w-5" /> Enviar e-mail
                      </a>
                    </div>

                    {/* Formulário */}
                    <div className="border-t pt-5">
                      <h3 className="font-heading font-semibold mb-4">Deixe seu contato</h3>
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                          <Label htmlFor="name">Nome *</Label>
                          <Input id="name" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail *</Label>
                          <Input id="email" type="email" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone *</Label>
                          <Input id="phone" value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="message">Mensagem</Label>
                          <Textarea id="message" rows={3} value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                        </div>
                        <Button type="submit" className="w-full" disabled={createLeadMutation.isPending}>
                          {createLeadMutation.isPending ? "Enviando..." : "Enviar Mensagem"}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
