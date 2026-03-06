/**
 * PropertyCard.tsx — Card de Imóvel — Elite Property Profile v2
 *
 * Exibe badge de score (PREMIUM/BOM), destaques do imóvel (até 2),
 * ícones de vídeo/tour quando disponíveis. Retrocompatível com dados antigos.
 */
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Heart,
  Share2,
  Car,
  Sparkles,
  MessageCircle,
  Trophy,
  Star,
  Video,
  Compass,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCompare } from "@/contexts/CompareContext";
import { toast } from "sonner";
import { normalizeFeatures, computeListingQuality } from "@/constants/propertyFeatures";

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  transactionType: "venda" | "aluguel";
  propertyType: string;
  neighborhood: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  garageSpaces: number;
  images: string[];
  featured: boolean;
  createdAt: Date;
}

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const p = property as any;

  const displayPrice =
    p?.sale_price ?? p?.salePrice ?? p?.rent_price ?? p?.rentPrice ?? p?.price ?? 0;
  const isRent = !!(
    (p?.rent_price ?? p?.rentPrice) && !(p?.sale_price ?? p?.salePrice)
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addProperty, removeProperty, isSelected, canAddMore } = useCompare();
  const selected = isSelected(property.id);

  const handleCompareToggle = (checked: boolean) => {
    if (checked) {
      if (!canAddMore) {
        toast.error("Você pode comparar no máximo 3 imóveis");
        return;
      }
      addProperty(property.id);
      toast.success("Imóvel adicionado à comparação");
    } else {
      removeProperty(property.id);
      toast.info("Imóvel removido da comparação");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const message = encodeURIComponent(
      `Olá! Tenho interesse no imóvel: ${property.title}\n\nPreço: ${formatPrice(displayPrice)}\nLocalização: ${property.neighborhood}, ${property.city}\n\nGostaria de mais informações.`
    );
    window.open(`https://wa.me/5561998687245?text=${message}`, "_blank");
  };

  const tx = p.transaction_type ?? property.transactionType;
  const isVenda = tx === "venda";
  const coverImage =
    (typeof p.main_image === "string" && p.main_image ? p.main_image : null) ??
    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ??
    (property.images && property.images.length > 0 ? property.images[0] : null) ??
    "/logo-leman.jpg";
  const imageCount = Array.isArray(p.images) ? p.images.length : property.images?.length ?? 0;

  // ── Features V2 ──
  const featuresV2 = useMemo(() => {
    let raw = p.features;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = null; }
    }
    return normalizeFeatures(raw);
  }, [p.features]);

  // ── Destaques (até 2) ──
  const destaques: string[] = useMemo(
    () => (Array.isArray(featuresV2.destaques) ? featuresV2.destaques.slice(0, 2) : []),
    [featuresV2.destaques]
  );

  // ── Score de qualidade ──
  const quality = useMemo(() => {
    return computeListingQuality({
      title: p.title,
      description: p.description,
      images: Array.isArray(p.images) ? p.images : [],
      video_url: p.video_url || featuresV2.midia?.youtube_url,
      tour_virtual_url: p.tour_virtual_url ?? p.tourVirtualUrl ?? featuresV2.midia?.tour_3d_url,
      total_area: p.total_area ?? p.totalArea,
      built_area: p.built_area ?? p.builtArea,
      address: p.address,
      neighborhood: p.neighborhood,
      city: p.city,
      state: p.state,
      features: featuresV2,
    });
  }, [p, featuresV2]);

  const hasVideo = !!(p.video_url || featuresV2.midia?.youtube_url || featuresV2.midia?.video_direto_url);
  const hasTour  = !!(p.tour_virtual_url ?? p.tourVirtualUrl ?? featuresV2.midia?.tour_3d_url);

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white rounded-xl">
      {/* Image Container */}
      <Link href={`/imoveis/${property.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1f3c]">
          <img
            src={imageError ? "/logo-leman.jpg" : coverImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f3c]/80 via-transparent to-transparent" />

          {/* Compare Checkbox */}
          <div className="absolute bottom-3 left-3 z-10">
            <label
              className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md cursor-pointer hover:bg-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={handleCompareToggle}
                disabled={!selected && !canAddMore}
                className="border-2 border-[#1a1f3c] data-[state=checked]:bg-[#c9a962] data-[state=checked]:border-[#c9a962]"
              />
              <span className="text-sm font-medium text-[#1a1f3c]">Comparar</span>
            </label>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge
              className={`font-semibold ${
                isVenda
                  ? "bg-[#c9a962] text-[#1a1f3c] hover:bg-[#b8944f]"
                  : "bg-[#1a1f3c] text-[#c9a962] hover:bg-[#151933]"
              }`}
            >
              {isVenda ? "Venda" : "Aluguel"}
            </Badge>
            {property.featured && (
              <Badge className="bg-white/90 text-[#1a1f3c] hover:bg-white">
                <Sparkles className="w-3 h-3 mr-1 text-[#c9a962]" />
                Destaque
              </Badge>
            )}
            {quality.status === "PREMIUM" && (
              <Badge className="bg-amber-500/90 text-white gap-1">
                <Trophy className="w-3 h-3" /> Premium
              </Badge>
            )}
          </div>

          {/* Media indicators */}
          {(hasVideo || hasTour) && (
            <div className="absolute top-3 right-3 flex gap-1">
              {hasVideo && (
                <span title="Vídeo disponível" className="bg-black/60 text-white p-1.5 rounded-full">
                  <Video className="h-3.5 w-3.5" />
                </span>
              )}
              {hasTour && (
                <span title="Tour virtual disponível" className="bg-black/60 text-white p-1.5 rounded-full">
                  <Compass className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          )}

          {/* Action Buttons (hover) */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
                toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-[#1a1f3c]"}`} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(window.location.origin + `/imoveis/${property.id}`);
                toast.success("Link copiado!");
              }}
            >
              <Share2 className="w-4 h-4 text-[#1a1f3c]" />
            </Button>
          </div>

          {/* Image Counter */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#1a1f3c]/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm">
              +{imageCount - 1} fotos
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <CardContent className="p-5">
        {/* Price */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-[#1a1f3c]">
            {formatPrice(displayPrice)}
            {isRent && <span className="text-sm text-gray-500 font-normal">/mês</span>}
          </p>
          {!isRent && displayPrice > 100000000 && (
            <p className="text-xs text-gray-500 mt-1">
              Parcelas a partir de {formatPrice(displayPrice / 360)}/mês*
            </p>
          )}
        </div>

        {/* Title */}
        <Link href={`/imoveis/${property.id}`}>
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-[#1a1f3c] hover:text-[#c9a962] transition-colors">
            {property.title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0 text-[#c9a962]" />
          <span className="truncate">
            {property.neighborhood}, {property.city}
          </span>
        </div>

        {/* Destaques (até 2) */}
        {destaques.length > 0 && (
          <div className="mb-3 space-y-1">
            {destaques.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700">
                <Star className="h-3 w-3 flex-shrink-0 text-amber-500" />
                <span className="truncate">{d}</span>
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1.5" title="Quartos">
              <Bed className="w-4 h-4 text-[#c9a962]" />
              <span className="font-medium">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1.5" title="Banheiros">
              <Bath className="w-4 h-4 text-[#c9a962]" />
              <span className="font-medium">{property.bathrooms}</span>
            </div>
          )}
          {property.area > 0 && (
            <div className="flex items-center gap-1.5" title="Área">
              <Maximize className="w-4 h-4 text-[#c9a962]" />
              <span className="font-medium">{property.area}m²</span>
            </div>
          )}
          {property.garageSpaces > 0 && (
            <div className="flex items-center gap-1.5" title="Vagas">
              <Car className="w-4 h-4 text-[#c9a962]" />
              <span className="font-medium">{property.garageSpaces}</span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 mt-4">
          <Link href={`/imoveis/${property.id}`} className="flex-1">
            <Button className="w-full bg-[#1a1f3c] hover:bg-[#151933] text-white">
              Ver Detalhes
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
            onClick={handleWhatsApp}
            title="Falar no WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
