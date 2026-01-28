/**
 * Seed completo para Leman Negócios Imobiliários
 * Imóveis de médio e alto padrão no Distrito Federal
 * Regiões: Vicente Pires, Águas Claras, Park Way, Arniqueiras, Sudoeste, Guará, Taguatinga
 */

import { db } from "../server/db";
import { 
  users, 
  properties, 
  propertyImages,
  leads, 
  blogPosts, 
  blogCategories,
  siteSettings 
} from "../drizzle/schema";
import bcrypt from "bcryptjs";

// Função para gerar slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Função para gerar código de referência
function generateRefCode(type: string, index: number): string {
  const prefix = type.substring(0, 3).toUpperCase();
  return `LMN-${prefix}-${String(index).padStart(4, "0")}`;
}

async function seed() {
  console.log("🌱 Iniciando seed da Leman Negócios Imobiliários...\n");

  // ==========================================
  // 1. CRIAR USUÁRIO ADMIN
  // ==========================================
  console.log("👤 Criando usuário administrador...");
  
  const hashedPassword = await bcrypt.hash("leman@2026", 10);
  
  await db.insert(users).values({
    name: "Administrador Leman",
    email: "admin@lemannegocios.com.br",
    password: hashedPassword,
    loginMethod: "local",
    role: "admin",
  }).onDuplicateKeyUpdate({ set: { name: "Administrador Leman" } });

  console.log("✅ Usuário admin criado: admin@lemannegocios.com.br\n");

  // ==========================================
  // 2. CONFIGURAÇÕES DO SITE
  // ==========================================
  console.log("⚙️ Configurando site...");
  
  await db.insert(siteSettings).values({
    companyName: "Leman Negócios Imobiliários",
    companySlogan: "Excelência em Negócios Imobiliários no DF",
    phone: "(61) 99868-7245",
    whatsapp: "5561998687245",
    email: "contato@lemannegocios.com.br",
    address: "Brasília - Distrito Federal",
    instagram: "https://instagram.com/leman.negociosimob",
    primaryColor: "#c9a962",
    secondaryColor: "#1a1f3c",
  }).onDuplicateKeyUpdate({ set: { companyName: "Leman Negócios Imobiliários" } });

  console.log("✅ Configurações do site atualizadas\n");

  // ==========================================
  // 3. IMÓVEIS FICTÍCIOS - ALTO PADRÃO DF
  // ==========================================
  console.log("🏠 Cadastrando imóveis de alto padrão...\n");

  const imoveis = [
    // VICENTE PIRES
    {
      title: "Casa de Alto Padrão em Vicente Pires - 4 Suítes",
      description: `Espetacular casa de alto padrão localizada em uma das melhores ruas de Vicente Pires. 
      
Esta residência exclusiva oferece:
- 4 suítes amplas com armários planejados
- Suíte master com closet e banheira de hidromassagem
- Sala de estar e jantar integradas com pé direito duplo
- Cozinha gourmet totalmente equipada
- Área de lazer completa com piscina aquecida
- Churrasqueira com espaço gourmet
- 4 vagas de garagem cobertas
- Sistema de segurança com câmeras
- Energia solar instalada

Acabamento de primeira linha com porcelanato, iluminação em LED, ar condicionado split em todos os ambientes.
Localização privilegiada, próximo a escolas, supermercados e fácil acesso às principais vias do DF.`,
      propertyType: "casa" as const,
      transactionType: "venda" as const,
      neighborhood: "Vicente Pires",
      city: "Brasília",
      state: "DF",
      salePrice: 289000000, // R$ 2.890.000
      bedrooms: 4,
      bathrooms: 5,
      suites: 4,
      parkingSpaces: 4,
      totalArea: 450,
      builtArea: 380,
      features: JSON.stringify(["piscina", "churrasqueira", "varanda-gourmet", "closet", "suite-master", "ar-condicionado", "piso-porcelanato", "portaria-24h", "cameras"]),
      mainImage: "/imoveis/casa-moderna-1.jpg",
      featured: true,
      status: "disponivel" as const,
    },
    {
      title: "Sobrado Moderno em Vicente Pires - Condomínio Fechado",
      description: `Lindo sobrado em condomínio fechado de alto padrão em Vicente Pires.

Características:
- 3 suítes sendo 1 master com closet
- Sala ampla com lareira ecológica
- Cozinha americana com ilha
- Área gourmet com churrasqueira
- Piscina privativa
- Jardim paisagístico
- 3 vagas de garagem

Condomínio com segurança 24h, área de lazer completa e localização privilegiada.`,
      propertyType: "casa" as const,
      transactionType: "venda" as const,
      neighborhood: "Vicente Pires",
      city: "Brasília",
      state: "DF",
      salePrice: 185000000, // R$ 1.850.000
      bedrooms: 3,
      bathrooms: 4,
      suites: 3,
      parkingSpaces: 3,
      totalArea: 350,
      builtArea: 280,
      features: JSON.stringify(["piscina", "churrasqueira", "closet", "cozinha-americana", "portaria-24h", "cameras", "cerca-eletrica"]),
      mainImage: "/imoveis/casa-luxo-2.jpg",
      featured: true,
      status: "disponivel" as const,
    },

    // ÁGUAS CLARAS
    {
      title: "Apartamento de Luxo em Águas Claras - 3 Suítes",
      description: `Apartamento de alto padrão no coração de Águas Claras, em edifício com infraestrutura completa.

O apartamento oferece:
- 3 suítes com armários planejados
- Sala ampla para 3 ambientes
- Varanda gourmet com churrasqueira
- Cozinha planejada com eletrodomésticos embutidos
- Área de serviço
- 2 vagas de garagem cobertas

Edifício com:
- Piscina adulto e infantil
- Academia completa
- Salão de festas
- Playground
- Brinquedoteca
- Portaria 24h

Localização privilegiada, próximo ao metrô, shopping e todas as conveniências.`,
      propertyType: "apartamento" as const,
      transactionType: "venda" as const,
      neighborhood: "Águas Claras",
      city: "Brasília",
      state: "DF",
      salePrice: 125000000, // R$ 1.250.000
      condoFee: 180000, // R$ 1.800
      bedrooms: 3,
      bathrooms: 4,
      suites: 3,
      parkingSpaces: 2,
      totalArea: 140,
      builtArea: 140,
      features: JSON.stringify(["varanda-gourmet", "churrasqueira", "piscina", "academia", "salao-festas", "playground", "portaria-24h", "elevador"]),
      mainImage: "/imoveis/sala-moderna-1.jpg",
      featured: true,
      status: "disponivel" as const,
    },
    {
      title: "Cobertura Duplex em Águas Claras - Vista Panorâmica",
      description: `Espetacular cobertura duplex com vista panorâmica para o Parque Ecológico.

Pavimento inferior:
- Sala ampla com pé direito duplo
- 2 suítes
- Cozinha gourmet
- Lavabo

Pavimento superior:
- Suíte master com closet e banheira
- Terraço com piscina privativa
- Espaço gourmet com churrasqueira

4 vagas de garagem. Edifício com lazer completo.`,
      propertyType: "cobertura" as const,
      transactionType: "venda" as const,
      neighborhood: "Águas Claras",
      city: "Brasília",
      state: "DF",
      salePrice: 245000000, // R$ 2.450.000
      condoFee: 250000, // R$ 2.500
      bedrooms: 3,
      bathrooms: 5,
      suites: 3,
      parkingSpaces: 4,
      totalArea: 280,
      builtArea: 280,
      features: JSON.stringify(["piscina", "churrasqueira", "varanda-gourmet", "closet", "suite-master", "spa", "sauna", "academia", "portaria-24h"]),
      mainImage: "/imoveis/sala-contemporanea-3.jpg",
      featured: true,
      status: "disponivel" as const,
    },
    {
      title: "Apartamento 2 Quartos em Águas Claras - Próximo ao Metrô",
      description: `Excelente apartamento de 2 quartos, sendo 1 suíte, em localização privilegiada de Águas Claras.

- 2 quartos sendo 1 suíte
- Sala ampla
- Cozinha americana
- Varanda
- 1 vaga de garagem

Prédio com piscina, academia e salão de festas. A 5 minutos do metrô.`,
      propertyType: "apartamento" as const,
      transactionType: "venda" as const,
      neighborhood: "Águas Claras",
      city: "Brasília",
      state: "DF",
      salePrice: 62000000, // R$ 620.000
      condoFee: 85000, // R$ 850
      bedrooms: 2,
      bathrooms: 2,
      suites: 1,
      parkingSpaces: 1,
      totalArea: 72,
      builtArea: 72,
      features: JSON.stringify(["varanda", "cozinha-americana", "piscina", "academia", "salao-festas", "portaria-24h"]),
      mainImage: "/imoveis/sala-luxo-2.jpg",
      featured: false,
      status: "disponivel" as const,
    },

    // PARK WAY
    {
      title: "Mansão no Park Way - Terreno de 2.500m²",
      description: `Magnífica mansão em um dos endereços mais nobres de Brasília - Park Way.

Esta propriedade única oferece:
- 5 suítes amplas com closet
- Suíte master com 80m², closet e banheiro com banheira
- Sala de estar com lareira
- Sala de jantar para 12 pessoas
- Home theater
- Escritório
- Cozinha gourmet industrial
- Adega climatizada
- Área de lazer completa com piscina de borda infinita
- Quadra de tênis
- Campo de futebol society
- Casa de caseiro
- 8 vagas de garagem

Terreno totalmente paisagístico com árvores frutíferas.
Segurança 24h com monitoramento por câmeras.`,
      propertyType: "casa" as const,
      transactionType: "venda" as const,
      neighborhood: "Park Way",
      city: "Brasília",
      state: "DF",
      salePrice: 850000000, // R$ 8.500.000
      bedrooms: 5,
      bathrooms: 8,
      suites: 5,
      parkingSpaces: 8,
      totalArea: 2500,
      builtArea: 650,
      features: JSON.stringify(["piscina", "churrasqueira", "quadra", "sauna", "spa", "closet", "suite-master", "portaria-24h", "cameras", "cerca-eletrica"]),
      mainImage: "/imoveis/casa-alto-padrao-3.jpg",
      featured: true,
      status: "disponivel" as const,
    },
    {
      title: "Casa Contemporânea no Park Way - Projeto Arquitetônico",
      description: `Casa com projeto arquitetônico assinado, design contemporâneo e sustentável.

- 4 suítes com closet
- Sala integrada com jardim interno
- Cozinha gourmet
- Piscina com deck
- Energia solar
- Captação de água da chuva
- Automação residencial completa

Terreno de 1.200m² com paisagismo tropical.`,
      propertyType: "casa" as const,
      transactionType: "venda" as const,
      neighborhood: "Park Way",
      city: "Brasília",
      state: "DF",
      salePrice: 420000000, // R$ 4.200.000
      bedrooms: 4,
      bathrooms: 5,
      suites: 4,
      parkingSpaces: 4,
      totalArea: 1200,
      builtArea: 400,
      features: JSON.stringify(["piscina", "churrasqueira", "varanda-gourmet", "closet", "ar-condicionado", "piso-porcelanato", "cameras"]),
      mainImage: "/imoveis/area-lazer-1.jpg",
      featured: false,
      status: "disponivel" as const,
    },

    // SUDOESTE
    {
      title: "Apartamento de Alto Padrão no Sudoeste - 4 Quartos",
      description: `Apartamento impecável em uma das quadras mais valorizadas do Sudoeste.

- 4 quartos sendo 2 suítes
- Sala ampla para 3 ambientes
- Varanda gourmet
- Cozinha planejada
- Dependência completa
- 2 vagas de garagem

Vista livre e permanente. Prédio com lazer completo.`,
      propertyType: "apartamento" as const,
      transactionType: "venda" as const,
      neighborhood: "Sudoeste",
      city: "Brasília",
      state: "DF",
      salePrice: 195000000, // R$ 1.950.000
      condoFee: 220000, // R$ 2.200
      bedrooms: 4,
      bathrooms: 4,
      suites: 2,
      parkingSpaces: 2,
      totalArea: 180,
      builtArea: 180,
      features: JSON.stringify(["varanda-gourmet", "churrasqueira", "piscina", "academia", "salao-festas", "portaria-24h", "elevador"]),
      mainImage: "/imoveis/quarto-master-2.jpg",
      featured: true,
      status: "disponivel" as const,
    },
    {
      title: "Cobertura Linear no Sudoeste - Terraço com Piscina",
      description: `Cobertura linear exclusiva com terraço privativo e piscina.

- 3 suítes com armários
- Suíte master com closet e banheira
- Sala com pé direito duplo
- Cozinha gourmet
- Terraço de 100m² com piscina e churrasqueira
- 3 vagas de garagem

Acabamento de altíssimo padrão. Vista panorâmica.`,
      propertyType: "cobertura" as const,
      transactionType: "venda" as const,
      neighborhood: "Sudoeste",
      city: "Brasília",
      state: "DF",
      salePrice: 320000000, // R$ 3.200.000
      condoFee: 280000, // R$ 2.800
      bedrooms: 3,
      bathrooms: 5,
      suites: 3,
      parkingSpaces: 3,
      totalArea: 320,
      builtArea: 220,
      features: JSON.stringify(["piscina", "churrasqueira", "varanda-gourmet", "closet", "suite-master", "spa", "academia", "portaria-24h"]),
      mainImage: "/imoveis/condominio-piscina-1.jpg",
      featured: true,
      status: "disponivel" as const,
    },

    // ARNIQUEIRAS
    {
      title: "Casa em Condomínio Fechado em Arniqueiras",
      description: `Linda casa em condomínio fechado com excelente infraestrutura.

- 3 suítes
- Sala ampla
- Cozinha americana
- Área gourmet
- Piscina
- Jardim
- 3 vagas

Condomínio com portaria 24h, área verde e playground.`,
      propertyType: "casa" as const,
      transactionType: "venda" as const,
      neighborhood: "Arniqueiras",
      city: "Brasília",
      state: "DF",
      salePrice: 145000000, // R$ 1.450.000
      condoFee: 80000, // R$ 800
      bedrooms: 3,
      bathrooms: 4,
      suites: 3,
      parkingSpaces: 3,
      totalArea: 300,
      builtArea: 220,
      features: JSON.stringify(["piscina", "churrasqueira", "cozinha-americana", "portaria-24h", "playground", "cameras"]),
      mainImage: "/imoveis/cozinha-moderna-2.jpg",
      featured: false,
      status: "disponivel" as const,
    },

    // GUARÁ
    {
      title: "Apartamento Reformado no Guará II - 3 Quartos",
      description: `Apartamento totalmente reformado em excelente localização no Guará II.

- 3 quartos sendo 1 suíte
- Sala ampla
- Cozinha planejada
- Área de serviço
- 1 vaga de garagem

Próximo a comércios, escolas e transporte público.`,
      propertyType: "apartamento" as const,
      transactionType: "venda" as const,
      neighborhood: "Guará II",
      city: "Brasília",
      state: "DF",
      salePrice: 58000000, // R$ 580.000
      condoFee: 65000, // R$ 650
      bedrooms: 3,
      bathrooms: 2,
      suites: 1,
      parkingSpaces: 1,
      totalArea: 90,
      builtArea: 90,
      features: JSON.stringify(["piso-porcelanato", "ar-condicionado", "portaria-24h"]),
      mainImage: "/imoveis/cozinha-gourmet-1.jpg",
      featured: false,
      status: "disponivel" as const,
    },
    {
      title: "Casa no Guará I - Ótima Localização",
      description: `Casa bem localizada no Guará I, próximo ao Polo de Modas.

- 4 quartos sendo 2 suítes
- Sala ampla
- Cozinha
- Área de serviço
- Quintal
- 2 vagas de garagem

Ideal para família. Rua tranquila e arborizada.`,
      propertyType: "casa" as const,
      transactionType: "venda" as const,
      neighborhood: "Guará I",
      city: "Brasília",
      state: "DF",
      salePrice: 89000000, // R$ 890.000
      bedrooms: 4,
      bathrooms: 3,
      suites: 2,
      parkingSpaces: 2,
      totalArea: 250,
      builtArea: 180,
      features: JSON.stringify(["churrasqueira", "varanda"]),
      mainImage: "/imoveis/quarto-suite-3.jpg",
      featured: false,
      status: "disponivel" as const,
    },

    // TAGUATINGA
    {
      title: "Apartamento Novo em Taguatinga Sul - 2 Suítes",
      description: `Apartamento novo, nunca habitado, em condomínio moderno de Taguatinga Sul.

- 2 suítes com armários
- Sala com varanda
- Cozinha americana
- Área de serviço
- 1 vaga de garagem

Prédio com piscina, academia e salão de festas.`,
      propertyType: "apartamento" as const,
      transactionType: "venda" as const,
      neighborhood: "Taguatinga Sul",
      city: "Brasília",
      state: "DF",
      salePrice: 48000000, // R$ 480.000
      condoFee: 55000, // R$ 550
      bedrooms: 2,
      bathrooms: 2,
      suites: 2,
      parkingSpaces: 1,
      totalArea: 65,
      builtArea: 65,
      features: JSON.stringify(["varanda", "cozinha-americana", "piscina", "academia", "salao-festas", "portaria-24h"]),
      mainImage: "/imoveis/banheiro-luxo-2.jpg",
      featured: false,
      status: "disponivel" as const,
    },
    {
      title: "Sobrado em Taguatinga Norte - 4 Quartos",
      description: `Amplo sobrado em Taguatinga Norte, ideal para família grande.

- 4 quartos sendo 1 suíte
- 2 salas
- Cozinha ampla
- Área de serviço
- Quintal com churrasqueira
- 3 vagas de garagem

Casa bem conservada em rua tranquila.`,
      propertyType: "casa" as const,
      transactionType: "venda" as const,
      neighborhood: "Taguatinga Norte",
      city: "Brasília",
      state: "DF",
      salePrice: 72000000, // R$ 720.000
      bedrooms: 4,
      bathrooms: 3,
      suites: 1,
      parkingSpaces: 3,
      totalArea: 200,
      builtArea: 180,
      features: JSON.stringify(["churrasqueira", "varanda"]),
      mainImage: "/imoveis/cozinha-luxo-3.jpg",
      featured: false,
      status: "disponivel" as const,
    },

    // IMÓVEIS PARA ALUGUEL
    {
      title: "Apartamento para Alugar em Águas Claras - Mobiliado",
      description: `Apartamento totalmente mobiliado e decorado, pronto para morar.

- 2 quartos sendo 1 suíte
- Sala com sofá e TV
- Cozinha equipada
- Varanda
- 1 vaga de garagem

Aluguel inclui condomínio. Contrato mínimo de 12 meses.`,
      propertyType: "apartamento" as const,
      transactionType: "locacao" as const,
      neighborhood: "Águas Claras",
      city: "Brasília",
      state: "DF",
      rentPrice: 350000, // R$ 3.500
      condoFee: 0, // Incluso
      bedrooms: 2,
      bathrooms: 2,
      suites: 1,
      parkingSpaces: 1,
      totalArea: 70,
      builtArea: 70,
      features: JSON.stringify(["mobiliado", "varanda", "piscina", "academia", "portaria-24h"]),
      mainImage: "/imoveis/quarto-luxo-1.jpg",
      featured: true,
      status: "disponivel" as const,
    },
    {
      title: "Casa para Alugar em Vicente Pires - 3 Quartos",
      description: `Casa ampla para aluguel em Vicente Pires, em rua tranquila.

- 3 quartos sendo 1 suíte
- Sala ampla
- Cozinha
- Área de serviço
- Quintal com churrasqueira
- 2 vagas de garagem

Aceita pets. Disponível para visitas.`,
      propertyType: "casa" as const,
      transactionType: "locacao" as const,
      neighborhood: "Vicente Pires",
      city: "Brasília",
      state: "DF",
      rentPrice: 450000, // R$ 4.500
      bedrooms: 3,
      bathrooms: 2,
      suites: 1,
      parkingSpaces: 2,
      totalArea: 200,
      builtArea: 150,
      features: JSON.stringify(["churrasqueira", "varanda"]),
      mainImage: "/imoveis/banheiro-marmore-1.jpg",
      featured: false,
      status: "disponivel" as const,
    },
  ];

  // Inserir imóveis
  for (let i = 0; i < imoveis.length; i++) {
    const imovel = imoveis[i];
    const refCode = generateRefCode(imovel.propertyType, i + 1);
    const slug = generateSlug(imovel.title);

    await db.insert(properties).values({
      ...imovel,
      referenceCode: refCode,
      slug: slug,
      metaTitle: imovel.title,
      metaDescription: imovel.description.substring(0, 160),
      published: true,
    }).onDuplicateKeyUpdate({ set: { title: imovel.title } });

    console.log(`✅ Imóvel cadastrado: ${imovel.title.substring(0, 50)}...`);
  }

  console.log(`\n📊 Total de ${imoveis.length} imóveis cadastrados\n`);

  // ==========================================
  // 4. CATEGORIAS DO BLOG
  // ==========================================
  console.log("📝 Criando categorias do blog...");

  const categorias = [
    { name: "Mercado Imobiliário", slug: "mercado-imobiliario", description: "Notícias e análises do mercado imobiliário do DF" },
    { name: "Dicas de Investimento", slug: "dicas-investimento", description: "Dicas para investir em imóveis" },
    { name: "Guia de Bairros", slug: "guia-bairros", description: "Conheça os melhores bairros do DF" },
    { name: "Financiamento", slug: "financiamento", description: "Tudo sobre financiamento imobiliário" },
    { name: "Decoração", slug: "decoracao", description: "Dicas de decoração e design de interiores" },
  ];

  for (const cat of categorias) {
    await db.insert(blogCategories).values(cat).onDuplicateKeyUpdate({ set: { name: cat.name } });
  }

  console.log("✅ Categorias criadas\n");

  // ==========================================
  // 5. ARTIGOS DO BLOG
  // ==========================================
  console.log("📰 Criando artigos do blog...");

  const artigos = [
    {
      title: "Vicente Pires: O Bairro que Mais Valoriza no DF",
      slug: "vicente-pires-bairro-mais-valoriza-df",
      excerpt: "Descubra por que Vicente Pires se tornou um dos endereços mais desejados de Brasília e como investir na região.",
      content: `
# Vicente Pires: O Bairro que Mais Valoriza no DF

Vicente Pires tem se destacado como uma das regiões que mais valorizam no Distrito Federal. Com uma localização privilegiada e infraestrutura em constante desenvolvimento, o bairro atrai cada vez mais famílias e investidores.

## Por que Vicente Pires?

### Localização Estratégica
Vicente Pires está situado entre Taguatinga e o Plano Piloto, oferecendo fácil acesso às principais vias do DF. Em poucos minutos, é possível chegar ao centro de Brasília ou aos grandes centros comerciais da região.

### Qualidade de Vida
O bairro oferece um ambiente mais tranquilo comparado às áreas centrais, com ruas arborizadas e menor densidade populacional. É ideal para quem busca qualidade de vida sem abrir mão da praticidade.

### Valorização Constante
Nos últimos 5 anos, os imóveis em Vicente Pires valorizaram em média 40%, superando a média do DF. Essa tendência deve continuar com os novos investimentos em infraestrutura previstos para a região.

## Tipos de Imóveis Disponíveis

Em Vicente Pires, você encontra desde casas em condomínios fechados até terrenos para construção. Os preços variam de acordo com a localização e características do imóvel.

### Faixa de Preços (2026)
- **Casas de 3 quartos:** R$ 800.000 a R$ 1.500.000
- **Casas de 4 quartos:** R$ 1.500.000 a R$ 3.000.000
- **Terrenos:** R$ 300.000 a R$ 800.000

## Conclusão

Vicente Pires é uma excelente opção para quem busca morar bem ou investir em imóveis no DF. A Leman Negócios Imobiliários possui diversas opções na região. Entre em contato conosco!
      `,
      categoryId: 3,
      featuredImage: "/imoveis/casa-moderna-1.jpg",
      published: true,
    },
    {
      title: "Águas Claras: Guia Completo do Bairro Vertical de Brasília",
      slug: "aguas-claras-guia-completo-bairro-vertical",
      excerpt: "Tudo o que você precisa saber sobre Águas Claras: infraestrutura, transporte, lazer e mercado imobiliário.",
      content: `
# Águas Claras: Guia Completo do Bairro Vertical de Brasília

Águas Claras é conhecida como a "cidade vertical" do DF, com seus imponentes edifícios e infraestrutura completa. Neste guia, vamos explorar tudo sobre esse bairro que não para de crescer.

## História e Desenvolvimento

Águas Claras começou a ser desenvolvida na década de 1990 e hoje é uma das regiões mais populosas do DF. O planejamento urbano moderno garantiu ruas largas, áreas verdes e uma excelente infraestrutura.

## Infraestrutura

### Transporte
- **Metrô:** 4 estações ao longo da região
- **Ônibus:** Diversas linhas para todo o DF
- **Acesso rodoviário:** EPTG e Estrutural

### Comércio e Serviços
- Shopping Águas Claras
- Diversos supermercados
- Hospitais e clínicas
- Escolas públicas e particulares

## Mercado Imobiliário

### Apartamentos
Águas Claras oferece apartamentos para todos os perfis, desde studios até coberturas de luxo.

### Faixa de Preços
- **1 quarto:** R$ 250.000 a R$ 400.000
- **2 quartos:** R$ 400.000 a R$ 700.000
- **3 quartos:** R$ 700.000 a R$ 1.500.000
- **Coberturas:** R$ 1.500.000 a R$ 3.000.000

## Qualidade de Vida

O bairro oferece diversas opções de lazer, incluindo o Parque Ecológico de Águas Claras, academias, restaurantes e vida noturna.

## Conclusão

Águas Claras é uma excelente opção para quem busca praticidade e qualidade de vida. Consulte nossos especialistas para encontrar o imóvel ideal!
      `,
      categoryId: 3,
      featuredImage: "/imoveis/sala-moderna-1.jpg",
      published: true,
    },
    {
      title: "Como Financiar seu Imóvel em 2026: Guia Completo",
      slug: "como-financiar-imovel-2026-guia-completo",
      excerpt: "Entenda as melhores opções de financiamento imobiliário disponíveis em 2026 e como conseguir as melhores taxas.",
      content: `
# Como Financiar seu Imóvel em 2026: Guia Completo

O sonho da casa própria está mais acessível do que nunca. Neste guia, vamos explicar todas as opções de financiamento disponíveis em 2026.

## Tipos de Financiamento

### 1. Sistema Financeiro de Habitação (SFH)
- Taxa de juros limitada
- Uso do FGTS
- Imóveis até R$ 1,5 milhão

### 2. Sistema de Financiamento Imobiliário (SFI)
- Sem limite de valor
- Taxas de mercado
- Maior flexibilidade

### 3. Consórcio Imobiliário
- Sem juros
- Parcelas menores
- Contemplação por sorteio ou lance

## Documentação Necessária

Para solicitar um financiamento, você precisará de:
- RG e CPF
- Comprovante de renda
- Comprovante de residência
- Certidões negativas
- Declaração de IR

## Dicas para Conseguir Melhores Taxas

1. **Mantenha o nome limpo:** Score alto significa taxas menores
2. **Dê uma entrada maior:** Quanto maior a entrada, menor o risco para o banco
3. **Compare diferentes bancos:** As taxas variam significativamente
4. **Considere a portabilidade:** Você pode transferir seu financiamento

## Simulação

Exemplo de financiamento de R$ 500.000:
- Entrada: R$ 100.000 (20%)
- Valor financiado: R$ 400.000
- Prazo: 360 meses
- Taxa: 9% a.a.
- Parcela inicial: aproximadamente R$ 4.200

## Conclusão

Com planejamento e as informações certas, é possível realizar o sonho da casa própria. A Leman Negócios Imobiliários pode ajudar você em todo o processo!
      `,
      categoryId: 4,
      featuredImage: "/imoveis/sala-luxo-2.jpg",
      published: true,
    },
    {
      title: "5 Dicas para Investir em Imóveis no Distrito Federal",
      slug: "5-dicas-investir-imoveis-distrito-federal",
      excerpt: "Aprenda as melhores estratégias para investir em imóveis no DF e obter excelentes retornos.",
      content: `
# 5 Dicas para Investir em Imóveis no Distrito Federal

O mercado imobiliário do DF oferece excelentes oportunidades de investimento. Confira nossas dicas para fazer bons negócios.

## 1. Conheça as Regiões em Valorização

Algumas regiões do DF estão em franco crescimento:
- **Vicente Pires:** Valorização de 40% em 5 anos
- **Águas Claras:** Demanda constante por aluguel
- **Sudoeste:** Alto padrão com liquidez garantida
- **Park Way:** Exclusividade e valorização

## 2. Analise o Potencial de Aluguel

O retorno com aluguel no DF varia de 0,4% a 0,6% ao mês. Considere:
- Proximidade de universidades
- Acesso ao metrô
- Infraestrutura do condomínio

## 3. Fique Atento aos Lançamentos

Comprar na planta pode significar economia de 20% a 30%. Pesquise:
- Histórico da construtora
- Localização do empreendimento
- Condições de pagamento

## 4. Diversifique seus Investimentos

Não coloque todo seu capital em um único imóvel. Considere:
- Diferentes tipos de imóveis
- Diferentes regiões
- Imóveis para venda e aluguel

## 5. Conte com Profissionais

Um corretor experiente pode:
- Identificar as melhores oportunidades
- Negociar melhores condições
- Evitar problemas jurídicos

## Conclusão

Investir em imóveis no DF é uma estratégia sólida para construir patrimônio. Entre em contato com a Leman Negócios Imobiliários para conhecer as melhores oportunidades!
      `,
      categoryId: 2,
      featuredImage: "/imoveis/casa-luxo-2.jpg",
      published: true,
    },
    {
      title: "Tendências de Decoração para Apartamentos em 2026",
      slug: "tendencias-decoracao-apartamentos-2026",
      excerpt: "Descubra as principais tendências de decoração para apartamentos e como aplicá-las no seu lar.",
      content: `
# Tendências de Decoração para Apartamentos em 2026

A decoração de interiores está em constante evolução. Confira as principais tendências para este ano.

## 1. Minimalismo Aconchegante

O minimalismo continua em alta, mas com um toque mais acolhedor:
- Cores neutras e quentes
- Móveis funcionais
- Menos é mais

## 2. Integração de Ambientes

Espaços integrados são a preferência:
- Cozinha americana
- Sala de estar e jantar unificadas
- Varanda gourmet

## 3. Natureza em Casa

Elementos naturais trazem vida ao ambiente:
- Plantas de interior
- Materiais naturais (madeira, pedra)
- Iluminação natural

## 4. Home Office Integrado

O trabalho remoto veio para ficar:
- Cantinho de trabalho bem planejado
- Móveis ergonômicos
- Boa iluminação

## 5. Tecnologia Invisível

Automação residencial discreta:
- Iluminação inteligente
- Assistentes virtuais
- Eletrodomésticos conectados

## Dicas de Aplicação

### Para Apartamentos Pequenos
- Use espelhos para ampliar
- Móveis multifuncionais
- Cores claras nas paredes

### Para Apartamentos Grandes
- Defina bem os ambientes
- Invista em peças de destaque
- Crie pontos focais

## Conclusão

Uma boa decoração valoriza seu imóvel e melhora sua qualidade de vida. Ao comprar um apartamento, considere o potencial de personalização!
      `,
      categoryId: 5,
      featuredImage: "/imoveis/sala-contemporanea-3.jpg",
      published: true,
    },
  ];

  for (const artigo of artigos) {
    await db.insert(blogPosts).values({
      ...artigo,
      authorId: 1,
      metaTitle: artigo.title,
      metaDescription: artigo.excerpt,
      publishedAt: new Date(),
    }).onDuplicateKeyUpdate({ set: { title: artigo.title } });

    console.log(`✅ Artigo criado: ${artigo.title.substring(0, 50)}...`);
  }

  console.log(`\n📊 Total de ${artigos.length} artigos criados\n`);

  // ==========================================
  // 6. LEADS DE EXEMPLO
  // ==========================================
  console.log("👥 Criando leads de exemplo...");

  const leadsExemplo = [
    {
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "(61) 99999-1111",
      whatsapp: "5561999991111",
      source: "site" as const,
      stage: "qualificado" as const,
      clientType: "comprador" as const,
      qualification: "quente" as const,
      buyerProfile: "primeira_casa" as const,
      urgencyLevel: "alta" as const,
      transactionInterest: "venda" as const,
      budgetMin: 50000000,
      budgetMax: 80000000,
      preferredNeighborhoods: JSON.stringify(["Águas Claras", "Vicente Pires"]),
      notes: "Interessado em apartamento de 3 quartos. Tem aprovação de crédito.",
    },
    {
      name: "Maria Santos",
      email: "maria.santos@email.com",
      phone: "(61) 99999-2222",
      whatsapp: "5561999992222",
      source: "instagram" as const,
      stage: "contato_inicial" as const,
      clientType: "comprador" as const,
      qualification: "morno" as const,
      buyerProfile: "investidor" as const,
      urgencyLevel: "media" as const,
      transactionInterest: "venda" as const,
      budgetMin: 100000000,
      budgetMax: 200000000,
      preferredNeighborhoods: JSON.stringify(["Sudoeste", "Park Way"]),
      notes: "Investidora. Busca imóveis com bom potencial de valorização.",
    },
    {
      name: "Carlos Oliveira",
      email: "carlos.oliveira@email.com",
      phone: "(61) 99999-3333",
      whatsapp: "5561999993333",
      source: "whatsapp" as const,
      stage: "visita_agendada" as const,
      clientType: "locatario" as const,
      qualification: "quente" as const,
      urgencyLevel: "urgente" as const,
      transactionInterest: "locacao" as const,
      budgetMin: 250000,
      budgetMax: 400000,
      preferredNeighborhoods: JSON.stringify(["Águas Claras"]),
      notes: "Precisa de apartamento mobiliado para mudança imediata.",
    },
  ];

  for (const lead of leadsExemplo) {
    await db.insert(leads).values(lead).onDuplicateKeyUpdate({ set: { name: lead.name } });
    console.log(`✅ Lead criado: ${lead.name}`);
  }

  console.log(`\n📊 Total de ${leadsExemplo.length} leads criados\n`);

  // ==========================================
  // FINALIZAÇÃO
  // ==========================================
  console.log("🎉 Seed concluído com sucesso!");
  console.log("\n📋 Resumo:");
  console.log(`   - 1 usuário administrador`);
  console.log(`   - ${imoveis.length} imóveis cadastrados`);
  console.log(`   - ${categorias.length} categorias de blog`);
  console.log(`   - ${artigos.length} artigos publicados`);
  console.log(`   - ${leadsExemplo.length} leads de exemplo`);
  console.log("\n🔐 Credenciais de acesso:");
  console.log("   Email: admin@lemannegocios.com.br");
  console.log("   Senha: leman@2026");
  console.log("\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Erro no seed:", error);
  process.exit(1);
});
