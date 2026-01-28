import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Home, 
  Building2, 
  MapPin, 
  BedDouble, 
  Bath, 
  Car, 
  Maximize2,
  Sparkles,
  Filter
} from "lucide-react";

export interface PropertyFilters {
  transactionType: string;
  propertyType: string;
  neighborhood: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  parkingSpots: string;
  minArea: number;
  maxArea: number;
  features: string[];
  searchQuery: string;
}

interface PropertyFilterBarProps {
  onFilterChange: (filters: PropertyFilters) => void;
  resultCount?: number;
}

// Bairros focados no DF - Médio e Alto Padrão
const BAIRROS_DF = [
  { value: "vicente-pires", label: "Vicente Pires", premium: true },
  { value: "aguas-claras", label: "Águas Claras", premium: true },
  { value: "park-way", label: "Park Way", premium: true },
  { value: "arniqueiras", label: "Arniqueiras", premium: true },
  { value: "sudoeste", label: "Sudoeste", premium: true },
  { value: "guara", label: "Guará", premium: false },
  { value: "guara-i", label: "Guará I", premium: false },
  { value: "guara-ii", label: "Guará II", premium: false },
  { value: "taguatinga", label: "Taguatinga", premium: false },
  { value: "taguatinga-norte", label: "Taguatinga Norte", premium: false },
  { value: "taguatinga-sul", label: "Taguatinga Sul", premium: false },
];

const PROPERTY_TYPES = [
  { value: "apartamento", label: "Apartamento", icon: Building2 },
  { value: "casa", label: "Casa", icon: Home },
  { value: "cobertura", label: "Cobertura", icon: Building2 },
  { value: "casa-condominio", label: "Casa em Condomínio", icon: Home },
  { value: "terreno", label: "Terreno", icon: MapPin },
  { value: "loft", label: "Loft/Studio", icon: Building2 },
  { value: "sobrado", label: "Sobrado", icon: Home },
];

const FEATURES = [
  { value: "piscina", label: "Piscina", category: "lazer" },
  { value: "churrasqueira", label: "Churrasqueira", category: "lazer" },
  { value: "academia", label: "Academia", category: "lazer" },
  { value: "playground", label: "Playground", category: "lazer" },
  { value: "salao-festas", label: "Salão de Festas", category: "lazer" },
  { value: "quadra", label: "Quadra Esportiva", category: "lazer" },
  { value: "sauna", label: "Sauna", category: "lazer" },
  { value: "spa", label: "Spa/Jacuzzi", category: "lazer" },
  { value: "portaria-24h", label: "Portaria 24h", category: "seguranca" },
  { value: "cameras", label: "Câmeras de Segurança", category: "seguranca" },
  { value: "cerca-eletrica", label: "Cerca Elétrica", category: "seguranca" },
  { value: "alarme", label: "Sistema de Alarme", category: "seguranca" },
  { value: "varanda", label: "Varanda/Sacada", category: "imovel" },
  { value: "varanda-gourmet", label: "Varanda Gourmet", category: "imovel" },
  { value: "closet", label: "Closet", category: "imovel" },
  { value: "suite-master", label: "Suíte Master", category: "imovel" },
  { value: "cozinha-americana", label: "Cozinha Americana", category: "imovel" },
  { value: "ar-condicionado", label: "Ar Condicionado", category: "imovel" },
  { value: "piso-porcelanato", label: "Piso Porcelanato", category: "imovel" },
  { value: "mobiliado", label: "Mobiliado", category: "imovel" },
];

export default function PropertyFilterBar({ onFilterChange, resultCount }: PropertyFilterBarProps) {
  const [filters, setFilters] = useState<PropertyFilters>({
    transactionType: "venda",
    propertyType: "",
    neighborhood: "",
    minPrice: 0,
    maxPrice: 10000000,
    bedrooms: "",
    bathrooms: "",
    parkingSpots: "",
    minArea: 0,
    maxArea: 1000,
    features: [],
    searchQuery: "",
  });

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 1000]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter((f) => f !== feature)
      : [...filters.features, feature];
    updateFilter("features", newFeatures);
  };

  const clearFilters = () => {
    const defaultFilters: PropertyFilters = {
      transactionType: "venda",
      propertyType: "",
      neighborhood: "",
      minPrice: 0,
      maxPrice: 10000000,
      bedrooms: "",
      bathrooms: "",
      parkingSpots: "",
      minArea: 0,
      maxArea: 1000,
      features: [],
      searchQuery: "",
    };
    setFilters(defaultFilters);
    setPriceRange([0, 10000000]);
    setAreaRange([0, 1000]);
    onFilterChange(defaultFilters);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)} mil`;
    }
    return `R$ ${value}`;
  };

  const activeFiltersCount = [
    filters.propertyType,
    filters.neighborhood,
    filters.bedrooms,
    filters.bathrooms,
    filters.parkingSpots,
    ...filters.features,
  ].filter(Boolean).length + (filters.minPrice > 0 || filters.maxPrice < 10000000 ? 1 : 0);

  // Componente de filtros avançados
  const AdvancedFilters = () => (
    <div className="space-y-6">
      {/* Faixa de Preço */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#1a1f3c]">
          <span className="text-[#c9a962]">R$</span> Faixa de Preço
        </h4>
        <Slider
          min={0}
          max={10000000}
          step={50000}
          value={priceRange}
          onValueChange={(value) => {
            setPriceRange(value as [number, number]);
            updateFilter("minPrice", value[0]);
            updateFilter("maxPrice", value[1]);
          }}
          className="mb-3"
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Área */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#1a1f3c]">
          <Maximize2 className="h-4 w-4 text-[#c9a962]" /> Área (m²)
        </h4>
        <Slider
          min={0}
          max={1000}
          step={10}
          value={areaRange}
          onValueChange={(value) => {
            setAreaRange(value as [number, number]);
            updateFilter("minArea", value[0]);
            updateFilter("maxArea", value[1]);
          }}
          className="mb-3"
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{areaRange[0]} m²</span>
          <span>{areaRange[1]} m²</span>
        </div>
      </div>

      {/* Banheiros */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#1a1f3c]">
          <Bath className="h-4 w-4 text-[#c9a962]" /> Banheiros
        </h4>
        <div className="flex gap-2 flex-wrap">
          {["1+", "2+", "3+", "4+", "5+"].map((num) => (
            <Button
              key={num}
              variant={filters.bathrooms === num ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("bathrooms", filters.bathrooms === num ? "" : num)}
              className={filters.bathrooms === num ? "bg-[#c9a962] hover:bg-[#b8944f] text-[#1a1f3c]" : ""}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {/* Vagas */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#1a1f3c]">
          <Car className="h-4 w-4 text-[#c9a962]" /> Vagas de Garagem
        </h4>
        <div className="flex gap-2 flex-wrap">
          {["1+", "2+", "3+", "4+"].map((num) => (
            <Button
              key={num}
              variant={filters.parkingSpots === num ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("parkingSpots", filters.parkingSpots === num ? "" : num)}
              className={filters.parkingSpots === num ? "bg-[#c9a962] hover:bg-[#b8944f] text-[#1a1f3c]" : ""}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {/* Características - Lazer */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#1a1f3c]">
          <Sparkles className="h-4 w-4 text-[#c9a962]" /> Lazer e Comodidades
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.filter(f => f.category === "lazer").map((feature) => (
            <div key={feature.value} className="flex items-center space-x-2">
              <Checkbox
                id={feature.value}
                checked={filters.features.includes(feature.value)}
                onCheckedChange={() => toggleFeature(feature.value)}
              />
              <Label htmlFor={feature.value} className="text-sm cursor-pointer">
                {feature.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Características - Segurança */}
      <div>
        <h4 className="font-semibold mb-3 text-[#1a1f3c]">Segurança</h4>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.filter(f => f.category === "seguranca").map((feature) => (
            <div key={feature.value} className="flex items-center space-x-2">
              <Checkbox
                id={feature.value}
                checked={filters.features.includes(feature.value)}
                onCheckedChange={() => toggleFeature(feature.value)}
              />
              <Label htmlFor={feature.value} className="text-sm cursor-pointer">
                {feature.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Características - Imóvel */}
      <div>
        <h4 className="font-semibold mb-3 text-[#1a1f3c]">Características do Imóvel</h4>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.filter(f => f.category === "imovel").map((feature) => (
            <div key={feature.value} className="flex items-center space-x-2">
              <Checkbox
                id={feature.value}
                checked={filters.features.includes(feature.value)}
                onCheckedChange={() => toggleFeature(feature.value)}
              />
              <Label htmlFor={feature.value} className="text-sm cursor-pointer">
                {feature.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="sticky top-20 z-40 shadow-xl border-0" style={{ backgroundColor: '#1a1f3c' }}>
      <CardContent className="p-4 md:p-6">
        {/* Transaction Type Tabs - Estilo QuintoAndar */}
        <div className="flex gap-1 mb-6 bg-[#151933] p-1 rounded-lg">
          <Button
            variant="ghost"
            className={`flex-1 rounded-md transition-all ${
              filters.transactionType === "venda" 
                ? "bg-[#c9a962] text-[#1a1f3c] hover:bg-[#b8944f]" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => updateFilter("transactionType", "venda")}
          >
            <Home className="w-4 h-4 mr-2" />
            Comprar
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-md transition-all ${
              filters.transactionType === "aluguel" 
                ? "bg-[#c9a962] text-[#1a1f3c] hover:bg-[#b8944f]" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => updateFilter("transactionType", "aluguel")}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Alugar
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Busque por bairro, condomínio ou características..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#c9a962]"
          />
        </div>

        {/* Main Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {/* Property Type */}
          <Select value={filters.propertyType} onValueChange={(value) => updateFilter("propertyType", value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Neighborhood */}
          <Select value={filters.neighborhood} onValueChange={(value) => updateFilter("neighborhood", value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Bairro" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Alto Padrão</div>
              {BAIRROS_DF.filter(b => b.premium).map((bairro) => (
                <SelectItem key={bairro.value} value={bairro.value}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-[#c9a962]" />
                    {bairro.label}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs text-gray-500 font-semibold mt-2">Outras Regiões</div>
              {BAIRROS_DF.filter(b => !b.premium).map((bairro) => (
                <SelectItem key={bairro.value} value={bairro.value}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {bairro.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bedrooms */}
          <Select value={filters.bedrooms} onValueChange={(value) => updateFilter("bedrooms", value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Quartos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1+">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> 1+ Quarto
                </div>
              </SelectItem>
              <SelectItem value="2+">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> 2+ Quartos
                </div>
              </SelectItem>
              <SelectItem value="3+">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> 3+ Quartos
                </div>
              </SelectItem>
              <SelectItem value="4+">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> 4+ Quartos
                </div>
              </SelectItem>
              <SelectItem value="5+">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" /> 5+ Quartos
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Price Range Quick Select */}
          <Select 
            value={`${filters.minPrice}-${filters.maxPrice}`}
            onValueChange={(value) => {
              const [min, max] = value.split("-").map(Number);
              setPriceRange([min, max]);
              updateFilter("minPrice", min);
              updateFilter("maxPrice", max);
            }}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Preço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-500000">Até R$ 500 mil</SelectItem>
              <SelectItem value="500000-1000000">R$ 500 mil - R$ 1M</SelectItem>
              <SelectItem value="1000000-2000000">R$ 1M - R$ 2M</SelectItem>
              <SelectItem value="2000000-5000000">R$ 2M - R$ 5M</SelectItem>
              <SelectItem value="5000000-10000000">Acima de R$ 5M</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters - Desktop */}
          <div className="hidden md:block">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-[#c9a962]/50 text-[#c9a962] hover:bg-[#c9a962]/10 hover:border-[#c9a962]"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-[#c9a962] text-[#1a1f3c]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[70vh] overflow-y-auto" align="end">
                <AdvancedFilters />
              </PopoverContent>
            </Popover>
          </div>

          {/* Advanced Filters - Mobile */}
          <div className="md:hidden col-span-2">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-[#c9a962]/50 text-[#c9a962] hover:bg-[#c9a962]/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Mais Filtros
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 bg-[#c9a962] text-[#1a1f3c]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-[#1a1f3c]">Filtros Avançados</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <AdvancedFilters />
                </div>
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6">
                  <Button 
                    className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-[#1a1f3c]"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Results Count & Clear Filters */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70">
            {resultCount !== undefined && (
              <span>
                <strong className="text-[#c9a962]">{resultCount}</strong> {resultCount === 1 ? "imóvel encontrado" : "imóveis encontrados"}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.propertyType && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30" 
                onClick={() => updateFilter("propertyType", "")}
              >
                {PROPERTY_TYPES.find((t) => t.value === filters.propertyType)?.label}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.neighborhood && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30" 
                onClick={() => updateFilter("neighborhood", "")}
              >
                {BAIRROS_DF.find((b) => b.value === filters.neighborhood)?.label}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.bedrooms && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30" 
                onClick={() => updateFilter("bedrooms", "")}
              >
                {filters.bedrooms} Quartos
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.bathrooms && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30" 
                onClick={() => updateFilter("bathrooms", "")}
              >
                {filters.bathrooms} Banheiros
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.parkingSpots && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30" 
                onClick={() => updateFilter("parkingSpots", "")}
              >
                {filters.parkingSpots} Vagas
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {(filters.minPrice > 0 || filters.maxPrice < 10000000) && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30" 
                onClick={() => {
                  setPriceRange([0, 10000000]);
                  updateFilter("minPrice", 0);
                  updateFilter("maxPrice", 10000000);
                }}
              >
                {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.features.map((feature) => (
              <Badge
                key={feature}
                variant="secondary"
                className="cursor-pointer bg-[#c9a962]/20 text-[#c9a962] hover:bg-[#c9a962]/30"
                onClick={() => toggleFeature(feature)}
              >
                {FEATURES.find((f) => f.value === feature)?.label}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
