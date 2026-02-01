/**
 * Seed de Demonstração - Leman Negócios Imobiliários
 * Popula o banco com imóveis fictícios e artigos de blog
 */

import postgres from "postgres";
import { hashPassword } from "../server/auth";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://leman_user:leman_secure_password_2026@localhost:6543/leman_imoveis";

async function seedDatabase() {
  console.log("🌱 Iniciando seed de dados - Leman Negócios Imobiliários\n");

  const connection = postgres(DATABASE_URL);

  try {
    // =============================================
    // 1. CRIAR USUÁRIO ADMIN
    // =============================================
    console.log("👤 Criando usuário administrador...");
    const adminPassword = await hashPassword("leman@2026");
    
    await connection.execute(`
      INSERT INTO users (name, email, password, role, createdAt)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, ["Administrador Leman", "admin@lemannegocios.com.br", adminPassword, "admin"]);
    
    console.log("   ✅ Admin: admin@lemannegocios.com.br / leman@2026\n");

    // =============================================
    // 2. CRIAR IMÓVEIS DE DEMONSTRAÇÃO
    // =============================================
    console.log("🏠 Criando imóveis de demonstração...\n");

    const imoveis = [
      // VICENTE PIRES
      {
        title: "Casa de Alto Padrão em Vicente Pires",
        description: "Espetacular casa com 4 suítes, piscina aquecida, churrasqueira gourmet e jardim paisagístico. Acabamento de primeira linha com porcelanato importado, iluminação em LED e automação residencial completa. Garagem para 4 carros.",
        type: "casa",
        transactionType: "venda",
        salePrice: 1850000,
        rentPrice: null,
        bedrooms: 4,
        suites: 4,
        bathrooms: 5,
        garageSpaces: 4,
        totalArea: 450,
        builtArea: 380,
        neighborhood: "Vicente Pires",
        city: "Brasília",
        state: "DF",
        address: "Rua das Palmeiras, Chácara 45",
        mainImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800", caption: "Fachada" },
          { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", caption: "Área externa" },
          { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", caption: "Piscina" }
        ]),
        featured: true,
        status: "disponivel"
      },
      {
        title: "Sobrado Moderno em Vicente Pires",
        description: "Lindo sobrado com arquitetura contemporânea, 3 suítes amplas, closet planejado, cozinha americana integrada à sala. Área gourmet com churrasqueira e forno de pizza. Excelente localização próximo a escolas e comércio.",
        type: "casa",
        transactionType: "venda",
        salePrice: 980000,
        rentPrice: null,
        bedrooms: 3,
        suites: 3,
        bathrooms: 4,
        garageSpaces: 2,
        totalArea: 280,
        builtArea: 220,
        neighborhood: "Vicente Pires",
        city: "Brasília",
        state: "DF",
        address: "Rua 8, Lote 15",
        mainImage: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", caption: "Fachada" }
        ]),
        featured: true,
        status: "disponivel"
      },

      // ÁGUAS CLARAS
      {
        title: "Apartamento 3 Quartos em Águas Claras",
        description: "Excelente apartamento com 3 quartos sendo 1 suíte, varanda gourmet com churrasqueira, armários planejados em todos os cômodos. Prédio com área de lazer completa: piscina, academia, salão de festas e playground.",
        type: "apartamento",
        transactionType: "venda",
        salePrice: 650000,
        rentPrice: null,
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        garageSpaces: 2,
        totalArea: 95,
        builtArea: 95,
        neighborhood: "Águas Claras",
        city: "Brasília",
        state: "DF",
        address: "Rua 25 Norte, Lote 5",
        mainImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", caption: "Sala" }
        ]),
        featured: true,
        status: "disponivel"
      },
      {
        title: "Cobertura Duplex em Águas Claras",
        description: "Magnífica cobertura duplex com vista panorâmica, 4 suítes, piscina privativa, churrasqueira e espaço gourmet. Acabamento premium com mármore e granito. Prédio de alto padrão com segurança 24h.",
        type: "cobertura",
        transactionType: "venda",
        salePrice: 1450000,
        rentPrice: null,
        bedrooms: 4,
        suites: 4,
        bathrooms: 5,
        garageSpaces: 3,
        totalArea: 280,
        builtArea: 280,
        neighborhood: "Águas Claras",
        city: "Brasília",
        state: "DF",
        address: "Avenida das Araucárias, Ed. Premium",
        mainImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", caption: "Terraço" }
        ]),
        featured: true,
        status: "disponivel"
      },
      {
        title: "Apartamento para Aluguel - Águas Claras",
        description: "Apartamento de 2 quartos totalmente mobiliado, pronto para morar. Cozinha equipada, ar condicionado em todos os cômodos. Condomínio com piscina e academia. Próximo ao metrô.",
        type: "apartamento",
        transactionType: "locacao",
        salePrice: null,
        rentPrice: 2800,
        bedrooms: 2,
        suites: 1,
        bathrooms: 2,
        garageSpaces: 1,
        totalArea: 68,
        builtArea: 68,
        neighborhood: "Águas Claras",
        city: "Brasília",
        state: "DF",
        address: "Rua 12 Sul, Bloco A",
        mainImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", caption: "Quarto" }
        ]),
        featured: false,
        status: "disponivel"
      },

      // PARK WAY
      {
        title: "Mansão no Park Way",
        description: "Espetacular mansão em terreno de 2.500m² com casa principal de 600m², casa de hóspedes, piscina olímpica, quadra de tênis, campo de futebol e paisagismo assinado. 6 suítes, cinema, adega climatizada e elevador.",
        type: "casa",
        transactionType: "venda",
        salePrice: 4500000,
        rentPrice: null,
        bedrooms: 6,
        suites: 6,
        bathrooms: 8,
        garageSpaces: 6,
        totalArea: 2500,
        builtArea: 600,
        neighborhood: "Park Way",
        city: "Brasília",
        state: "DF",
        address: "SMPW Quadra 26, Conjunto 3",
        mainImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", caption: "Vista aérea" }
        ]),
        featured: true,
        status: "disponivel"
      },

      // SUDOESTE
      {
        title: "Apartamento Reformado no Sudoeste",
        description: "Apartamento totalmente reformado com projeto de arquitetura moderno. 3 quartos, sendo 1 suíte master com closet. Cozinha gourmet integrada, varanda com vista livre. Prédio com portaria 24h e área de lazer.",
        type: "apartamento",
        transactionType: "venda",
        salePrice: 890000,
        rentPrice: null,
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        garageSpaces: 2,
        totalArea: 110,
        builtArea: 110,
        neighborhood: "Sudoeste",
        city: "Brasília",
        state: "DF",
        address: "SQSW 303, Bloco B",
        mainImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", caption: "Sala integrada" }
        ]),
        featured: false,
        status: "disponivel"
      },

      // GUARÁ
      {
        title: "Casa Térrea no Guará II",
        description: "Casa térrea com 3 quartos, sendo 1 suíte. Sala ampla, cozinha planejada, área de serviço coberta e quintal com churrasqueira. Rua tranquila, próximo a escolas e comércio. Documentação em dia.",
        type: "casa",
        transactionType: "venda",
        salePrice: 580000,
        rentPrice: null,
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        garageSpaces: 2,
        totalArea: 200,
        builtArea: 140,
        neighborhood: "Guará",
        city: "Brasília",
        state: "DF",
        address: "QE 40, Conjunto H",
        mainImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", caption: "Fachada" }
        ]),
        featured: false,
        status: "disponivel"
      },
      {
        title: "Apartamento para Aluguel - Guará I",
        description: "Apartamento de 2 quartos com armários, sala com varanda, cozinha com armários planejados. Prédio com portaria e garagem coberta. Excelente localização próximo ao metrô.",
        type: "apartamento",
        transactionType: "locacao",
        salePrice: null,
        rentPrice: 1800,
        bedrooms: 2,
        suites: 0,
        bathrooms: 1,
        garageSpaces: 1,
        totalArea: 60,
        builtArea: 60,
        neighborhood: "Guará",
        city: "Brasília",
        state: "DF",
        address: "QI 9, Bloco F",
        mainImage: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", caption: "Sala" }
        ]),
        featured: false,
        status: "disponivel"
      },

      // TAGUATINGA
      {
        title: "Apartamento 3 Quartos em Taguatinga",
        description: "Ótimo apartamento com 3 quartos, sala ampla, cozinha com armários, área de serviço. Prédio com elevador, portaria 24h e vaga de garagem. Próximo ao Shopping Taguatinga e estação do metrô.",
        type: "apartamento",
        transactionType: "venda",
        salePrice: 420000,
        rentPrice: null,
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        garageSpaces: 1,
        totalArea: 85,
        builtArea: 85,
        neighborhood: "Taguatinga",
        city: "Brasília",
        state: "DF",
        address: "CSB 11, Lote 8",
        mainImage: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800", caption: "Sala" }
        ]),
        featured: false,
        status: "disponivel"
      },
      {
        title: "Loja Comercial em Taguatinga Centro",
        description: "Excelente loja comercial com 120m² em ponto estratégico de Taguatinga. Ampla vitrine, banheiro, copa e depósito. Ideal para diversos segmentos. Alto fluxo de pessoas.",
        type: "comercial",
        transactionType: "locacao",
        salePrice: null,
        rentPrice: 4500,
        bedrooms: 0,
        suites: 0,
        bathrooms: 2,
        garageSpaces: 0,
        totalArea: 120,
        builtArea: 120,
        neighborhood: "Taguatinga",
        city: "Brasília",
        state: "DF",
        address: "CNB 2, Lote 15",
        mainImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800", caption: "Interior" }
        ]),
        featured: false,
        status: "disponivel"
      },

      // ARNIQUEIRAS
      {
        title: "Chácara em Arniqueiras",
        description: "Linda chácara com 5.000m² de terreno, casa principal com 4 quartos, casa de caseiro, piscina, campo de futebol, pomar e horta. Ideal para quem busca qualidade de vida e contato com a natureza.",
        type: "rural",
        transactionType: "venda",
        salePrice: 1200000,
        rentPrice: null,
        bedrooms: 4,
        suites: 2,
        bathrooms: 3,
        garageSpaces: 4,
        totalArea: 5000,
        builtArea: 250,
        neighborhood: "Arniqueiras",
        city: "Brasília",
        state: "DF",
        address: "Chácara 85, Colônia Agrícola",
        mainImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        images: JSON.stringify([
          { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", caption: "Vista geral" }
        ]),
        featured: true,
        status: "disponivel"
      }
    ];

    for (const imovel of imoveis) {
      await connection.execute(`
        INSERT INTO properties (
          title, description, propertyType, transactionType, salePrice, rentPrice,
          bedrooms, suites, bathrooms, parkingSpaces, totalArea, builtArea,
          neighborhood, city, state, address, mainImage, images, featured, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        imovel.title, imovel.description, imovel.type, imovel.transactionType,
        imovel.salePrice, imovel.rentPrice, imovel.bedrooms, imovel.suites,
        imovel.bathrooms, imovel.garageSpaces, imovel.totalArea, imovel.builtArea,
        imovel.neighborhood, imovel.city, imovel.state, imovel.address,
        imovel.mainImage, imovel.images, imovel.featured ? 1 : 0, imovel.status
      ]);
      console.log(`   ✅ ${imovel.title}`);
    }

    console.log(`\n   Total: ${imoveis.length} imóveis criados\n`);

    // =============================================
    // 3. CRIAR ARTIGOS DE BLOG
    // =============================================
    console.log("📝 Criando artigos de blog...\n");

    const artigos = [
      {
        title: "Guia Completo: Como Comprar seu Primeiro Imóvel no DF",
        slug: "guia-comprar-primeiro-imovel-df",
        excerpt: "Descubra o passo a passo para realizar o sonho da casa própria no Distrito Federal, desde a escolha do bairro até a assinatura do contrato.",
        content: `
# Guia Completo: Como Comprar seu Primeiro Imóvel no DF

Comprar o primeiro imóvel é um dos momentos mais importantes na vida de qualquer pessoa. No Distrito Federal, com suas características únicas de mercado imobiliário, é fundamental estar bem informado antes de tomar essa decisão.

## 1. Planejamento Financeiro

Antes de começar a busca pelo imóvel ideal, é essencial fazer um planejamento financeiro detalhado:

- **Entrada**: Geralmente entre 20% e 30% do valor do imóvel
- **Parcelas**: Não devem comprometer mais de 30% da renda familiar
- **Custos adicionais**: ITBI, registro, escritura e mudança

## 2. Escolha do Bairro

O DF oferece diversas opções de bairros, cada um com suas características:

### Vicente Pires
Ideal para famílias que buscam casas com quintal e ambiente mais tranquilo. Ótima infraestrutura de comércio e serviços.

### Águas Claras
Perfeito para quem prefere apartamentos modernos com acesso ao metrô. Vida urbana com todas as comodidades.

### Park Way
Para quem busca exclusividade e contato com a natureza, com lotes grandes e mansões de alto padrão.

## 3. Documentação Necessária

- RG e CPF
- Comprovante de renda
- Comprovante de residência
- Certidões negativas
- Declaração de Imposto de Renda

## 4. Financiamento Imobiliário

As principais opções de financiamento no Brasil são:

- **SBPE**: Sistema Brasileiro de Poupança e Empréstimo
- **FGTS**: Pode ser usado para entrada ou amortização
- **Consórcio**: Alternativa sem juros, mas com prazo maior

## Conclusão

A compra do primeiro imóvel exige pesquisa, planejamento e paciência. Conte com a Leman Negócios Imobiliários para encontrar o imóvel ideal para você e sua família.
        `,
        author: "Leman Negócios Imobiliários",
        featuredImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
        published: true
      },
      {
        title: "Os Melhores Bairros para Investir em Brasília em 2026",
        slug: "melhores-bairros-investir-brasilia-2026",
        excerpt: "Análise completa dos bairros com maior potencial de valorização no Distrito Federal para investidores imobiliários.",
        content: `
# Os Melhores Bairros para Investir em Brasília em 2026

O mercado imobiliário de Brasília continua aquecido, com excelentes oportunidades de investimento. Confira nossa análise dos bairros mais promissores.

## 1. Vicente Pires - Crescimento Consolidado

Vicente Pires se consolidou como um dos bairros mais valorizados do DF. Com infraestrutura completa e qualidade de vida, oferece:

- Valorização média de 8% ao ano
- Alta demanda por casas de médio e alto padrão
- Excelente liquidez para venda e locação

## 2. Águas Claras - O Polo Urbano

Com o metrô e infraestrutura moderna, Águas Claras atrai:

- Jovens profissionais
- Famílias em busca de praticidade
- Investidores de apartamentos compactos

## 3. Arniqueiras - A Nova Fronteira

Região em expansão com preços ainda acessíveis:

- Potencial de valorização de até 15% ao ano
- Chácaras e casas com terrenos grandes
- Proximidade com Vicente Pires

## 4. Sudoeste - Tradição e Qualidade

Bairro consolidado com público de alto poder aquisitivo:

- Demanda constante por locação
- Apartamentos de alto padrão
- Proximidade com Plano Piloto

## Dicas para Investidores

1. **Diversifique**: Não coloque todos os recursos em um único imóvel
2. **Pesquise**: Conheça bem a região antes de investir
3. **Pense no longo prazo**: Imóveis são investimentos de médio a longo prazo
4. **Conte com profissionais**: Uma imobiliária de confiança faz toda diferença

## Conclusão

O Distrito Federal oferece excelentes oportunidades para investidores imobiliários. A Leman Negócios Imobiliários está pronta para ajudá-lo a encontrar as melhores opções de investimento.
        `,
        author: "Leman Negócios Imobiliários",
        featuredImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
        published: true
      },
      {
        title: "Checklist: O que Verificar Antes de Alugar um Imóvel",
        slug: "checklist-verificar-antes-alugar-imovel",
        excerpt: "Lista completa de itens para verificar antes de assinar um contrato de aluguel e evitar dores de cabeça.",
        content: `
# Checklist: O que Verificar Antes de Alugar um Imóvel

Alugar um imóvel exige atenção a diversos detalhes. Use este checklist para não esquecer de nada importante.

## Documentação

- [ ] Contrato de locação revisado por advogado
- [ ] Laudo de vistoria detalhado com fotos
- [ ] Comprovante de propriedade do locador
- [ ] Certidões negativas do imóvel

## Estrutura do Imóvel

- [ ] Instalações elétricas funcionando
- [ ] Encanamento sem vazamentos
- [ ] Portas e janelas em bom estado
- [ ] Pintura e acabamentos
- [ ] Piso sem rachaduras ou defeitos

## Condomínio (se aplicável)

- [ ] Valor da taxa de condomínio
- [ ] O que está incluso na taxa
- [ ] Regras do condomínio
- [ ] Áreas de lazer disponíveis
- [ ] Horário de funcionamento da portaria

## Localização

- [ ] Proximidade de transporte público
- [ ] Comércio e serviços na região
- [ ] Segurança do bairro
- [ ] Estacionamento disponível

## Custos Totais

- [ ] Valor do aluguel
- [ ] Condomínio
- [ ] IPTU
- [ ] Seguro fiança ou caução
- [ ] Taxa de administração

## Conclusão

Uma vistoria bem feita evita problemas futuros. A Leman Negócios Imobiliários oferece suporte completo em todo o processo de locação.
        `,
        author: "Leman Negócios Imobiliários",
        featuredImage: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800",
        published: true
      },
      {
        title: "Financiamento Imobiliário: Tudo que Você Precisa Saber",
        slug: "financiamento-imobiliario-guia-completo",
        excerpt: "Entenda como funciona o financiamento imobiliário, taxas de juros, prazos e como conseguir as melhores condições.",
        content: `
# Financiamento Imobiliário: Tudo que Você Precisa Saber

O financiamento imobiliário é a forma mais comum de adquirir um imóvel no Brasil. Entenda como funciona e como conseguir as melhores condições.

## Como Funciona

O banco empresta o valor necessário para a compra do imóvel, e você paga em parcelas mensais ao longo de até 35 anos. O imóvel fica como garantia (alienação fiduciária).

## Tipos de Financiamento

### Sistema Financeiro de Habitação (SFH)
- Imóveis de até R$ 1,5 milhão
- Taxas de juros limitadas
- Pode usar FGTS

### Sistema de Financiamento Imobiliário (SFI)
- Imóveis acima de R$ 1,5 milhão
- Taxas de juros livres
- Mais flexibilidade nas condições

## Taxas de Juros em 2026

As taxas variam entre os bancos:

| Banco | Taxa Mínima | Taxa Máxima |
|-------|-------------|-------------|
| Caixa | 8,99% a.a.  | 9,99% a.a.  |
| BB    | 9,15% a.a.  | 10,25% a.a. |
| Itaú  | 9,50% a.a.  | 10,99% a.a. |

## Documentos Necessários

- RG e CPF
- Comprovante de renda (3 últimos meses)
- Comprovante de residência
- Declaração de IR
- Certidão de casamento (se aplicável)

## Dicas para Aprovação

1. **Mantenha o nome limpo**: Sem restrições no CPF
2. **Comprove renda**: Formal ou informal
3. **Tenha entrada**: Quanto maior, melhores as condições
4. **Compare bancos**: As taxas variam bastante

## Conclusão

O financiamento imobiliário é uma excelente ferramenta para realizar o sonho da casa própria. A Leman Negócios Imobiliários pode ajudá-lo a encontrar as melhores condições.
        `,
        author: "Leman Negócios Imobiliários",
        featuredImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
        published: true
      }
    ];

    for (const artigo of artigos) {
      await connection.execute(`
        INSERT INTO blog_posts (
          title, slug, excerpt, content, featuredImage, authorId, published, publishedAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
      `, [
        artigo.title, artigo.slug, artigo.excerpt, artigo.content,
        artigo.featuredImage, artigo.published ? 1 : 0
      ]);
      console.log(`   ✅ ${artigo.title}`);
    }

    console.log(`\n   Total: ${artigos.length} artigos criados\n`);

    // =============================================
    // 4. CRIAR LEADS DE EXEMPLO
    // =============================================
    console.log("👥 Criando leads de exemplo...\n");

    const leads = [
      { name: "João Silva", email: "joao@email.com", phone: "(61) 99999-1111", source: "site", stage: "novo" },
      { name: "Maria Santos", email: "maria@email.com", phone: "(61) 99999-2222", source: "instagram", stage: "qualificado" },
      { name: "Carlos Oliveira", email: "carlos@email.com", phone: "(61) 99999-3333", source: "indicacao", stage: "negociacao" },
      { name: "Ana Costa", email: "ana@email.com", phone: "(61) 99999-4444", source: "whatsapp", stage: "novo" },
      { name: "Pedro Ferreira", email: "pedro@email.com", phone: "(61) 99999-5555", source: "site", stage: "qualificado" }
    ];

    for (const lead of leads) {
      await connection.execute(`
        INSERT INTO leads (name, email, phone, source, stage, createdAt)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [lead.name, lead.email, lead.phone, lead.source, lead.stage]);
    }

    console.log(`   ✅ ${leads.length} leads criados\n`);

    // =============================================
    // 5. CRIAR CONFIGURAÇÕES DO SITE
    // =============================================
    console.log("⚙️ Configurando site...\n");

    await connection.execute(`
      INSERT INTO site_settings (
        companyName, companyDescription, primaryColor,
        heroTitle, heroSubtitle, phone, email, whatsapp, instagram,
        address, siteTitle, siteDescription
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE companyName = VALUES(companyName)
    `, [
      "Leman Negócios Imobiliários",
      "Sua imobiliária de confiança no Distrito Federal. Especializada em imóveis de médio e alto padrão em Vicente Pires, Águas Claras, Park Way, Arniqueiras, Sudoeste, Guará e Taguatinga.",
      "#1a1f3c",
      "Encontre Seu Imóvel no DF",
      "A Leman Negócios Imobiliários oferece as melhores opções de imóveis de médio e alto padrão no Distrito Federal.",
      "(61) 99868-7245",
      "contato@lemannegocios.com.br",
      "5561998687245",
      "@leman.negociosimob",
      "Brasília - DF",
      "Leman Negócios Imobiliários - Imóveis de Alto Padrão no DF",
      "Imóveis de médio e alto padrão no Distrito Federal. Casas, apartamentos e coberturas em Vicente Pires, Águas Claras, Park Way e mais."
    ]);

    console.log("   ✅ Configurações do site salvas\n");

    // =============================================
    // RESUMO FINAL
    // =============================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("✅ SEED CONCLUÍDO COM SUCESSO!");
    console.log("═══════════════════════════════════════════════════════════════\n");
    
    console.log("📊 DADOS INSERIDOS:");
    console.log(`   • 1 Usuário Admin`);
    console.log(`   • ${imoveis.length} Imóveis`);
    console.log(`   • ${artigos.length} Artigos de Blog`);
    console.log(`   • ${leads.length} Leads`);
    console.log(`   • Configurações do Site\n`);

    console.log("🔐 CREDENCIAIS DE LOGIN:");
    console.log(`   • Email: admin@lemannegocios.com.br`);
    console.log(`   • Senha: leman@2026\n`);

    console.log("🌐 ACESSE O SITE:");
    console.log(`   • http://localhost:5005\n`);

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await connection.end();
  }
}

seedDatabase();
