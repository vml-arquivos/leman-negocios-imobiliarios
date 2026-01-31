import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { webhooksRouter } from "./routers/webhooks";
import { z } from "zod";
import * as db from "./db";
import * as rentalMgmt from "./rental-management";
import { getDb } from "./db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { analyticsEvents, campaignSources, transactions, commissions, reviews, financingSimulations, leads, interactions, landlords, tenants, rentalPayments, propertyExpenses, landlordTransfers, rentalContracts, properties } from "../drizzle/schema";

// ============================================
// AUTH ROUTER
// ============================================

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Senha obrigatória"),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log("[Auth] Tentativa de login:", input.email);
      
      const { verifyPassword, validateEmail } = await import("./auth");
      const { createToken } = await import("./_core/jwt");
      
      // Validar email
      if (!validateEmail(input.email)) {
        throw new Error("Email inválido");
      }
      
      // Buscar usuário por email
      const user = await db.db.getUserByEmail(input.email);
      if (!user) {
        console.log("[Auth] Usuário não encontrado:", input.email);
        throw new Error("Email ou senha incorretos");
      }
      
      // Verificar senha
      if (!user.password) {
        console.log("[Auth] Usuário sem senha:", input.email);
        throw new Error("Usuário não possui senha configurada");
      }
      
      const isValid = await verifyPassword(input.password, user.password);
      if (!isValid) {
        console.log("[Auth] Senha incorreta:", input.email);
        throw new Error("Email ou senha incorretos");
      }
      
      // Criar token JWT simples
      const token = createToken({
        userId: user.id,
        email: user.email,
        name: user.name || "",
        role: user.role,
      });
      
      console.log("[Auth] Token criado com sucesso para:", input.email);
      
      // Setar cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
      });
      
      // Atualizar lastSignedIn
      await db.db.updateUserLastSignIn(user.id);
      
      console.log("[Auth] Login bem-sucedido:", input.email);
      
      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),
  
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { hashPassword, validatePassword, validateEmail } = await import("./auth");
      const { createToken } = await import("./_core/jwt");
      
      // Validar email
      if (!validateEmail(input.email)) {
        throw new Error("Email inválido");
      }
      
      // Validar senha
      const passwordValidation = validatePassword(input.password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.error || "Senha inválida");
      }
      
      // Verificar se email já existe
      const existingUser = await db.db.getUserByEmail(input.email);
      if (existingUser) {
        throw new Error("Email já cadastrado");
      }
      
      // Hash da senha
      const hashedPassword = await hashPassword(input.password);
      
      // Criar usuário
      const user = await db.db.createUser({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        loginMethod: "local",
        role: "user",
      });
      
      // Criar token JWT simples
      const token = createToken({
        userId: user.id,
        email: user.email,
        name: user.name || "",
        role: user.role,
      });
      
      // Setar cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
      });
      
      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),
});

// ============================================
// PROPERTIES ROUTER
// ============================================

const propertiesRouter = router({
  // Listar todos os imóveis (público)
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      transactionType: z.string().optional(),
      propertyType: z.string().optional(),
      neighborhood: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      minArea: z.number().optional(),
      maxArea: z.number().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const result = await db.listProperties(input || {});
      return result.items;
    }),

  // Listar imóveis em destaque (público)
  featured: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const result = await db.listProperties({ limit: input?.limit || 6 });
      return result.items.filter((p: any) => p.featured);
    }),

  // Obter um imóvel por ID (público)
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getPropertyById(input.id);
    }),

  // Criar imóvel (protegido - apenas admin)
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      referenceCode: z.string().optional(),
      propertyType: z.enum(["casa", "apartamento", "cobertura", "terreno", "comercial", "rural", "lancamento"]),
      transactionType: z.enum(["venda", "locacao", "ambos"]),
      address: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      salePrice: z.number().optional(),
      rentPrice: z.number().optional(),
      condoFee: z.number().optional(),
      iptu: z.number().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      suites: z.number().optional(),
      parkingSpaces: z.number().optional(),
      totalArea: z.number().optional(),
      builtArea: z.number().optional(),
      features: z.string().optional(),
      images: z.string().optional(),
      mainImage: z.string().optional(),
      status: z.enum(["disponivel", "reservado", "vendido", "alugado", "inativo", "geladeira"]).optional(),
      featured: z.boolean().optional(),
      published: z.boolean().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      slug: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar imóveis');
      }
      return await db.createProperty({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  // Atualizar imóvel (protegido - apenas admin)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        referenceCode: z.string().optional(),
        propertyType: z.enum(["casa", "apartamento", "cobertura", "terreno", "comercial", "rural", "lancamento"]).optional(),
        transactionType: z.enum(["venda", "locacao", "ambos"]).optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        salePrice: z.number().optional(),
        rentPrice: z.number().optional(),
        condoFee: z.number().optional(),
        iptu: z.number().optional(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        suites: z.number().optional(),
        parkingSpaces: z.number().optional(),
        totalArea: z.number().optional(),
        builtArea: z.number().optional(),
        features: z.string().optional(),
        images: z.string().optional(),
        mainImage: z.string().optional(),
        status: z.enum(["disponivel", "reservado", "vendido", "alugado", "inativo", "geladeira"]).optional(),
        featured: z.boolean().optional(),
        published: z.boolean().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        slug: z.string().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem atualizar imóveis');
      }
      await db.updateProperty(input.id, input.data);
      return { success: true };
    }),

  // Deletar imóvel (protegido - apenas admin)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar imóveis');
      }
      await db.deleteProperty(input.id);
      return { success: true };
    }),
});

// ============================================
// LEADS ROUTER
// ============================================

const leadsRouter = router({
  // Listar todos os leads (protegido)
  list: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
      source: z.string().optional(),
      assignedTo: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getAllLeads(input);
    }),

  // Obter lead por ID (protegido)
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getLeadById(input.id);
    }),

  // Obter leads por estágio (protegido)
  getByStage: protectedProcedure
    .input(z.object({
      stage: z.string(),
    }))
    .query(async ({ input }) => {
      return await db.getLeadsByStage(input.stage);
    }),

  // Criar lead (público - formulário de contato)
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      source: z.enum(["site", "whatsapp", "instagram", "facebook", "indicacao", "portal_zap", "portal_vivareal", "portal_olx", "google", "outro"]).optional(),
      interestedPropertyId: z.number().optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      preferredNeighborhoods: z.string().optional(),
      preferredPropertyTypes: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createLead({
        ...input,
        stage: "novo",
      });
    }),

  // Atualizar lead (protegido)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        source: z.enum(["site", "whatsapp", "instagram", "facebook", "indicacao", "portal_zap", "portal_vivareal", "portal_olx", "google", "outro"]).optional(),
        stage: z.enum(["novo", "contato_inicial", "qualificado", "visita_agendada", "visita_realizada", "proposta", "negociacao", "fechado_ganho", "fechado_perdido", "sem_interesse"]).optional(),
        buyerProfile: z.enum(["investidor", "primeira_casa", "upgrade", "curioso", "indeciso"]).optional(),
        interestedPropertyId: z.number().optional(),
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
        preferredNeighborhoods: z.string().optional(),
        preferredPropertyTypes: z.string().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
        assignedTo: z.number().optional(),
        score: z.number().optional(),
        priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
        lastContactedAt: z.date().optional(),
        convertedAt: z.date().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateLead(input.id, input.data);
      return { success: true };
    }),

  // Salvar lead do simulador de financiamento (público - lead magnet)
  saveFromSimulator: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      whatsapp: z.string(),
      loanAmount: z.number().optional(),
      propertyType: z.string().optional(),
      financingMethod: z.enum(["SAC", "PRICE"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const lead = await db.createLead({
        name: input.name,
        email: input.email,
        whatsapp: input.whatsapp,
        source: "simulador",
        stage: "novo",
        notes: `Lead do Simulador - Valor: R$ ${input.loanAmount}, Tipo: ${input.propertyType}, Método: ${input.financingMethod}`,
      });
      return { success: true, leadId: lead.id };
    }),

  // Deletar lead (protegido - apenas admin)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar leads');
      }
      await db.deleteLead(input.id);
      return { success: true };
    }),

  // Buscar imóveis compatíveis com o perfil do lead (protegido)
  matchProperties: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      const lead = await db.getLeadById(input.leadId);
      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      // Buscar imóveis com base no perfil do lead
      const filters: any = {
        status: 'disponivel',
      };

      // Filtrar por tipo de transação
      if (lead.transactionInterest) {
        filters.transactionType = lead.transactionInterest;
      }

      // Filtrar por orçamento
      if (lead.budgetMin) {
        filters.minPrice = lead.budgetMin;
      }
      if (lead.budgetMax) {
        filters.maxPrice = lead.budgetMax;
      }

      // Filtrar por bairros preferidos
      if (lead.preferredNeighborhoods) {
        filters.neighborhood = lead.preferredNeighborhoods.split(',')[0].trim();
      }

      // Filtrar por tipo de imóvel
      if (lead.preferredPropertyTypes) {
        filters.propertyType = lead.preferredPropertyTypes.split(',')[0].trim();
      }

      const result = await db.listProperties(filters);
      return result.items.slice(0, 5); // Retornar até 5 imóveis compatíveis
    }),

  // Buscar clientes quentes sem interação há mais de 3 dias (protegido)
  getInactiveHotLeads: protectedProcedure
    .query(async () => {
      const allLeads = await db.getAllLeads();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Filtrar clientes quentes
      const hotLeads = allLeads.filter(lead => lead.qualification === 'quente');

      // Para cada lead quente, verificar última interação
      const inactiveLeads = [];
      for (const lead of hotLeads) {
        const interactions = await db.getInteractionsByLeadId(lead.id);
        
        if (interactions.length === 0) {
          // Sem interações, verificar data de criação
          const createdDate = new Date(lead.createdAt);
          if (createdDate < threeDaysAgo) {
            inactiveLeads.push({
              ...lead,
              daysSinceLastContact: Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)),
              lastContactDate: lead.createdAt,
            });
          }
        } else {
          // Com interações, verificar a mais recente
          const lastInteraction = interactions.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          const lastContactDate = new Date(lastInteraction.createdAt);
          
          if (lastContactDate < threeDaysAgo) {
            inactiveLeads.push({
              ...lead,
              daysSinceLastContact: Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)),
              lastContactDate: lastInteraction.createdAt,
            });
          }
        }
      }

      // Ordenar por dias sem contato (maior primeiro)
      return inactiveLeads.sort((a, b) => b.daysSinceLastContact - a.daysSinceLastContact);
    }),
});


// ============================================
// INTERACTIONS ROUTER
// ============================================

const interactionsRouter = router({
  // Obter interações por lead ID (protegido)
  getByLeadId: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getInteractionsByLeadId(input.leadId);
    }),

  // Criar interação (protegido)
  create: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      type: z.enum(["ligacao", "whatsapp", "email", "visita", "reuniao", "proposta", "nota", "status_change"]),
      subject: z.string().optional(),
      description: z.string().optional(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await db.createInteraction({
        ...input,
        userId: ctx.user.id,
      });
    }),
});

// ============================================
// BLOG ROUTER
// ============================================

const blogRouter = router({
  // Listar posts publicados (público)
  published: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const result = await db.listBlogPosts({ published: true, limit: input?.limit || 10 });
      return result.items;
    }),

  // Listar todos os posts (protegido - admin)
  list: protectedProcedure
    .input(z.object({
      published: z.boolean().optional(),
      categoryId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem listar todos os posts');
      }
      const result = await db.listBlogPosts(input || {});
      return result.items;
    }),

  // Obter post por ID (público)
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getBlogPostById(input.id);
    }),

  // Obter post por slug (público)
  getPostBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      return await db.getBlogPostBySlug(input.slug);
    }),

  // Criar post (protegido - admin)
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      slug: z.string(),
      excerpt: z.string().optional(),
      content: z.string(),
      featuredImage: z.string().optional(),
      categoryId: z.number().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      published: z.boolean().optional(),
      publishedAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar posts');
      }
      return await db.createBlogPost({
        ...input,
        authorId: ctx.user.id,
      });
    }),

  // Atualizar post (protegido - admin)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        featuredImage: z.string().optional(),
        categoryId: z.number().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        published: z.boolean().optional(),
        publishedAt: z.date().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem atualizar posts');
      }
      await db.updateBlogPost(input.id, input.data);
      return { success: true };
    }),

  // Deletar post (protegido - admin)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar posts');
      }
      await db.deleteBlogPost(input.id);
      return { success: true };
    }),

  // Listar categorias (público)
  categories: publicProcedure.query(async () => {
    return await db.getAllBlogCategories();
  }),

  // Criar categoria (protegido - admin)
  createCategory: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar categorias');
      }
      return await db.createBlogCategory(input);
    }),
});

// ============================================
// SITE SETTINGS ROUTER
// ============================================

const settingsRouter = router({
  // Obter configurações (público)
  get: publicProcedure.query(async () => {
    return await db.getSiteSettings();
  }),

  // Atualizar configurações (protegido - admin)
  update: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      companyDescription: z.string().optional(),
      companyLogo: z.string().optional(),
      realtorName: z.string().optional(),
      realtorPhoto: z.string().optional(),
      realtorBio: z.string().optional(),
      realtorCreci: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
      tiktok: z.string().optional(),
      linkedin: z.string().optional(),
      siteTitle: z.string().optional(),
      siteDescription: z.string().optional(),
      siteKeywords: z.string().optional(),
      googleAnalyticsId: z.string().optional(),
      facebookPixelId: z.string().optional(),
      // Customização Visual
      themeStyle: z.enum(["modern", "classic"]).optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), // Hex color
      heroTitle: z.string().optional(),
      heroSubtitle: z.string().optional(),
      heroBackgroundImage: z.string().optional(),
      aboutSectionTitle: z.string().optional(),
      aboutSectionContent: z.string().optional(),
      aboutSectionImage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem atualizar configurações');
      }
      await db.updateSiteSettings(input);
      return { success: true };
    }),
});

// ============================================
// PROPERTY IMAGES ROUTER
// ============================================

const propertyImagesRouter = router({
  // Listar imagens de um imóvel (público)
  list: publicProcedure
    .input(z.object({
      propertyId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getPropertyImages(input.propertyId);
    }),

  // Upload de imagem (protegido - admin)
  upload: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      imageUrl: z.string(),
      imageKey: z.string(),
      isPrimary: z.number().optional(),
      displayOrder: z.number().optional(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem fazer upload de imagens');
      }
      return await db.createPropertyImage(input);
    }),

  // Deletar imagem (protegido - admin)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar imagens');
      }
      await db.deletePropertyImage(input.id);
      return { success: true };
    }),

  // Definir imagem principal (protegido - admin)
  setPrimary: protectedProcedure
    .input(z.object({
      imageId: z.number(),
      propertyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem definir imagem principal');
      }
      await db.setPrimaryImage(input.imageId, input.propertyId);
      return { success: true };
    }),

  // Atualizar ordem da imagem (protegido - admin)
  updateOrder: protectedProcedure
    .input(z.object({
      imageId: z.number(),
      displayOrder: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem atualizar ordem das imagens');
      }
      await db.updateImageOrder(input.imageId, input.displayOrder);
      return { success: true };
    }),
});

// ============================================
// INTEGRATION ROUTER (WhatsApp / N8N)
// ============================================

const integrationRouter = router({
  // Webhook para receber mensagens do WhatsApp
  whatsappWebhook: publicProcedure
    .input(z.object({
      phone: z.string(),
      messageId: z.string(),
      content: z.string(),
      type: z.enum(["incoming", "outgoing"]),
      timestamp: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const message = await db.createMessageBuffer({
        phone: input.phone,
        messageId: input.messageId,
        content: input.content,
        type: input.type,
        timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
        processed: 0,
      });
      
      // Log webhook
      await db.createWebhookLog({
        source: "whatsapp",
        event: "message_received",
        payload: JSON.stringify(input),
        response: JSON.stringify({ success: true, messageId: message.id }),
        status: "success",
      });
      
      return { success: true, messageId: message.id };
    }),

  // Salvar lead do WhatsApp (chamado pelo N8N)
  saveLeadFromWhatsApp: publicProcedure
    .input(z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().optional(),
      message: z.string().optional(),
      propertyInterest: z.string().optional(),
      budgetRange: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const lead = await db.upsertLeadFromWhatsApp(input);
      
      // Log webhook
      await db.createWebhookLog({
        source: "n8n",
        event: "lead_saved",
        payload: JSON.stringify(input),
        response: JSON.stringify({ success: true, leadId: lead.id }),
        status: "success",
      });
      
      return { success: true, lead };
    }),

  // Salvar contexto de IA
  saveAiContext: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      phone: z.string(),
      message: z.string(), // JSON string: {type: 'ai'|'user', content: string}
      role: z.enum(["user", "assistant", "system"]),
    }))
    .mutation(async ({ input }) => {
      const context = await db.saveAiContext(input);
      return { success: true, contextId: context.id };
    }),

  // Buscar histórico de conversa
  getHistory: publicProcedure
    .input(z.object({
      sessionId: z.string().optional(),
      phone: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      if (input.sessionId) {
        return await db.getAiHistoryBySession(input.sessionId);
      } else if (input.phone) {
        return await db.getAiHistoryByPhone(input.phone, input.limit || 50);
      }
      return [];
    }),

  // Webhook do N8N para atualizar análise de IA do lead (POST /api/hooks/n8n/lead-update)
  n8nLeadUpdate: publicProcedure
    .input(z.object({
      leadId: z.number(),
      sentimentScore: z.number().min(0).max(100).optional(),
      aiSummary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      recommendedAction: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Atualizar lead insights
      const leadInsight = await db.db.insert(db.leadInsights).values({
        leadId: input.leadId,
        sentimentScore: input.sentimentScore,
        aiSummary: input.aiSummary,
      }).onDuplicateKeyUpdate({
        set: {
          sentimentScore: input.sentimentScore,
          aiSummary: input.aiSummary,
        },
      });
      
      // Log webhook
      await db.createWebhookLog({
        source: "n8n",
        event: "lead_update",
        payload: JSON.stringify(input),
        response: JSON.stringify({ success: true, leadId: input.leadId }),
        status: "success",
      });
      
      return { success: true, leadId: input.leadId };
    }),

  // Salvar interesse do cliente
  saveClientInterest: publicProcedure
    .input(z.object({
      clientId: z.number(),
      propertyType: z.string().optional(),
      interestType: z.enum(["venda", "locacao", "ambos"]).optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      preferredNeighborhoods: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const interest = await db.createClientInterest(input);
      return { success: true, interest };
    }),

  // Listar logs de webhook
  getWebhookLogs: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getWebhookLogs(input?.limit || 100);
    }),

  // Buscar imóveis compatíveis para enviar ao cliente (N8N)
  matchPropertiesForClient: publicProcedure
    .input(z.object({
      phone: z.string(),
      transactionType: z.enum(["venda", "locacao", "ambos"]).optional(),
      propertyType: z.string().optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      neighborhood: z.string().optional(),
      limit: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Buscar lead pelo telefone
        const allLeads = await db.getAllLeads();
        const lead = allLeads.find(l => l.phone === input.phone);

        if (!lead) {
          await db.createWebhookLog({
            source: "n8n",
            event: "property_match_failed",
            payload: JSON.stringify(input),
            response: JSON.stringify({ error: "Lead não encontrado" }),
            status: "error",
            errorMessage: "Lead não encontrado com o telefone fornecido",
          });
          return { success: false, error: "Lead não encontrado", properties: [] };
        }

        // Construir filtros de busca
        const filters: any = {
          status: 'disponivel',
        };

        if (input.transactionType) {
          filters.transactionType = input.transactionType;
        } else if (lead.transactionInterest) {
          filters.transactionType = lead.transactionInterest;
        }

        if (input.propertyType) {
          filters.propertyType = input.propertyType;
        }

        if (input.budgetMin || lead.budgetMin) {
          filters.minPrice = input.budgetMin || lead.budgetMin;
        }

        if (input.budgetMax || lead.budgetMax) {
          filters.maxPrice = input.budgetMax || lead.budgetMax;
        }

        if (input.neighborhood) {
          filters.neighborhood = input.neighborhood;
        } else if (lead.preferredNeighborhoods) {
          const neighborhoods = lead.preferredNeighborhoods.split(',');
          if (neighborhoods.length > 0) {
            filters.neighborhood = neighborhoods[0].trim();
          }
        }

        // Buscar imóveis
        const result = await db.listProperties(filters);
        const limit = input.limit || 5;
        const matchedProperties = result.items.slice(0, limit);

        // Log webhook
        await db.createWebhookLog({
          source: "n8n",
          event: "properties_matched",
          payload: JSON.stringify(input),
          response: JSON.stringify({ 
            success: true, 
            leadId: lead.id, 
            propertiesCount: matchedProperties.length 
          }),
          status: "success",
        });

        return { 
          success: true, 
          lead: {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            qualification: lead.qualification,
          },
          properties: matchedProperties.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            propertyType: p.propertyType,
            transactionType: p.transactionType,
            salePrice: p.salePrice,
            rentPrice: p.rentPrice,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            totalArea: p.totalArea,
            address: p.address,
            neighborhood: p.neighborhood,
            city: p.city,
            state: p.state,
            mainImage: p.mainImage,
            referenceCode: p.referenceCode,
            url: `https://lemannegocios.com.br/imovel/${p.id}`,
          })),
        };
      } catch (error: any) {
        await db.createWebhookLog({
          source: "n8n",
          event: "property_match_error",
          payload: JSON.stringify(input),
          response: JSON.stringify({ error: error.message }),
          status: "error",
          errorMessage: error.message,
        });
        return { success: false, error: error.message, properties: [] };
      }
    }),

  // Atualizar qualificação do lead baseado em histórico (N8N)
  updateLeadQualification: publicProcedure
    .input(z.object({
      phone: z.string(),
      qualification: z.enum(["quente", "morno", "frio", "nao_qualificado"]),
      buyerProfile: z.enum(["investidor", "primeira_casa", "upgrade", "curioso", "indeciso"]).optional(),
      urgencyLevel: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const allLeads = await db.getAllLeads();
        const lead = allLeads.find(l => l.phone === input.phone);

        if (!lead) {
          return { success: false, error: "Lead não encontrado" };
        }

        const updateData: any = {
          qualification: input.qualification,
        };

        if (input.buyerProfile) {
          updateData.buyerProfile = input.buyerProfile;
        }

        if (input.urgencyLevel) {
          updateData.urgencyLevel = input.urgencyLevel;
        }

        if (input.notes) {
          updateData.notes = `${lead.notes || ''}\n\n[IA - ${new Date().toLocaleString('pt-BR')}] ${input.notes}`;
        }

        await db.updateLead(lead.id, updateData);

        await db.createWebhookLog({
          source: "n8n",
          event: "lead_qualified",
          payload: JSON.stringify(input),
          response: JSON.stringify({ success: true, leadId: lead.id }),
          status: "success",
        });

        return { success: true, leadId: lead.id };
      } catch (error: any) {
        await db.createWebhookLog({
          source: "n8n",
          event: "qualification_error",
          payload: JSON.stringify(input),
          response: JSON.stringify({ error: error.message }),
          status: "error",
          errorMessage: error.message,
        });
        return { success: false, error: error.message };
      }
    }),
});

// ============================================
// OWNERS ROUTER
// ============================================

const ownersRouter = router({
  // Listar todos os proprietários (protegido)
  list: protectedProcedure.query(async () => {
    return await db.getAllOwners();
  }),

  // Obter proprietário por ID (protegido)
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getOwnerById(input.id);
    }),

  // Buscar proprietários (protegido)
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
    }))
    .query(async ({ input }) => {
      return await db.searchOwners(input.query);
    }),

  // Criar proprietário (protegido - admin)
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      cpfCnpj: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      bankName: z.string().optional(),
      bankAgency: z.string().optional(),
      bankAccount: z.string().optional(),
      pixKey: z.string().optional(),
      notes: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar proprietários');
      }
      return await db.createOwner(input);
    }),

  // Atualizar proprietário (protegido - admin)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        cpfCnpj: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        bankName: z.string().optional(),
        bankAgency: z.string().optional(),
        bankAccount: z.string().optional(),
        pixKey: z.string().optional(),
        notes: z.string().optional(),
        active: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem atualizar proprietários');
      }
      await db.updateOwner(input.id, input.data);
      return { success: true };
    }),

  // Deletar proprietário (protegido - admin)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar proprietários');
      }
      await db.deleteOwner(input.id);
      return { success: true };
    }),
});

// ============================================
// ANALYTICS ROUTER
// ============================================

const analyticsRouter = router({
  // Registrar evento de analytics
  trackEvent: publicProcedure
    .input(z.object({
      eventType: z.string(),
      propertyId: z.number().optional(),
      leadId: z.number().optional(),
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      url: z.string().optional(),
      referrer: z.string().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(analyticsEvents).values({
        ...input,
        createdAt: new Date(),
      });
      
      return { success: true };
    }),

  // Obter métricas gerais (protegido - admin)
  getMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver métricas');
      }
      
      const db = await getDb();
      if (!db) return null;
      
      // Total de eventos
      const totalEvents = await db.select().from(analyticsEvents);
      
      // Eventos por tipo
      const eventsByType: Record<string, number> = {};
      totalEvents.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      });
      
      // Eventos por fonte
      const eventsBySource: Record<string, number> = {};
      totalEvents.forEach(event => {
        if (event.source) {
          eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
        }
      });
      
      return {
        totalEvents: totalEvents.length,
        eventsByType,
        eventsBySource,
      };
    }),

  // Listar campanhas (protegido - admin)
  listCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver campanhas');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(campaignSources).orderBy(desc(campaignSources.createdAt));
    }),

  // Criar campanha (protegido - admin)
  createCampaign: protectedProcedure
    .input(z.object({
      name: z.string(),
      source: z.string(),
      medium: z.string().optional(),
      campaignId: z.string().optional(),
      budget: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar campanhas');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(campaignSources).values({
        name: input.name,
        source: input.source,
        medium: input.medium,
        campaignId: input.campaignId,
        budget: input.budget,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        notes: input.notes,
        clicks: 0,
        impressions: 0,
        conversions: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true };
    }),
});

// ============================================
// FINANCIAL ROUTER
// ============================================

const financialRouter = router({
  // Listar transações (protegido - admin)
  listTransactions: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver transações');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select().from(transactions);
      
      // Filtros opcionais
      // TODO: Implementar filtros quando necessário
      
      return query.orderBy(desc(transactions.createdAt));
    }),

  // Criar transação (protegido - admin)
  createTransaction: protectedProcedure
    .input(z.object({
      type: z.string(),
      category: z.string().optional(),
      amount: z.string(),
      description: z.string(),
      propertyId: z.number().optional(),
      leadId: z.number().optional(),
      ownerId: z.number().optional(),
      status: z.string().optional(),
      paymentMethod: z.string().optional(),
      paymentDate: z.string().optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar transações');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(transactions).values({
        ...input,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        currency: 'BRL',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true };
    }),

  // Listar comissões (protegido - admin)
  listCommissions: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver comissões');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(commissions).orderBy(desc(commissions.createdAt));
    }),

  // Criar comissão (protegido - admin)
  createCommission: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      leadId: z.number(),
      ownerId: z.number().optional(),
      salePrice: z.string(),
      commissionRate: z.string(),
      commissionAmount: z.string(),
      splitWithAgent: z.boolean().optional(),
      agentName: z.string().optional(),
      agentCommissionAmount: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar comissões');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(commissions).values({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true };
    }),

  // Obter resumo financeiro (protegido - admin)
  getSummary: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver resumo financeiro');
      }
      
      const db = await getDb();
      if (!db) return null;
      
      const allTransactions = await db.select().from(transactions);
      const allCommissions = await db.select().from(commissions);
      
      const totalRevenue = allTransactions
        .filter(t => t.type === 'revenue' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = allTransactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalCommissions = allCommissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0);
      
      const pendingCommissions = allCommissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0);
      
      return {
        totalRevenue,
        totalExpenses,
        totalCommissions,
        pendingCommissions,
        netProfit: totalRevenue - totalExpenses,
      };
    }),

  // Obter estatísticas financeiras (GET /api/financial/stats)
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver estatísticas financeiras');
      }
      
      const db = await getDb();
      if (!db) return null;
      
      const allTransactions = await db.select().from(transactions);
      const allCommissions = await db.select().from(commissions);
      
      const totalRevenue = allTransactions
        .filter(t => t.type === 'revenue' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = allTransactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalRepasses = allTransactions
        .filter(t => t.type === 'transfer' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        totalRevenue,
        totalExpenses,
        totalRepasses,
        netProfit: totalRevenue - totalExpenses - totalRepasses,
      };
    }),

  // Listar últimas transações (GET /api/financial/transactions)
  getRecentTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver transações');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      return db.select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit);
    }),

  // ============================================
  // FILTROS GRANULARES (CRM 360º)
  // ============================================

  // Obter transações com filtros avançados
  getFilteredTransactions: protectedProcedure
    .input(z.object({
      ownerId: z.number().optional(),
      propertyId: z.number().optional(),
      type: z.string().optional(), // 'revenue', 'expense', 'transfer', 'commission'
      category: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver transações');
      }
      
      const db = await getDb();
      if (!db) return { items: [], summary: {} };
      
      // Buscar todas as transações
      let allTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      
      // Aplicar filtros
      if (input.ownerId) {
        allTransactions = allTransactions.filter(t => t.ownerId === input.ownerId);
      }
      if (input.propertyId) {
        allTransactions = allTransactions.filter(t => t.propertyId === input.propertyId);
      }
      if (input.type) {
        allTransactions = allTransactions.filter(t => t.type === input.type);
      }
      if (input.category) {
        allTransactions = allTransactions.filter(t => t.category === input.category);
      }
      if (input.status) {
        allTransactions = allTransactions.filter(t => t.status === input.status);
      }
      if (input.startDate) {
        const startDate = new Date(input.startDate);
        allTransactions = allTransactions.filter(t => new Date(t.createdAt) >= startDate);
      }
      if (input.endDate) {
        const endDate = new Date(input.endDate);
        allTransactions = allTransactions.filter(t => new Date(t.createdAt) <= endDate);
      }
      
      // Calcular resumo
      const summary = {
        totalRevenue: allTransactions
          .filter(t => t.type === 'revenue')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalExpenses: allTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalTransfers: allTransactions
          .filter(t => t.type === 'transfer')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalCommissions: allTransactions
          .filter(t => t.type === 'commission')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        count: allTransactions.length,
      };
      
      return {
        items: allTransactions.slice(0, input.limit),
        summary,
      };
    }),

  // Obter relatório por proprietário
  getOwnerReport: protectedProcedure
    .input(z.object({
      ownerId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver relatórios');
      }
      
      const db = await getDb();
      if (!db) return null;
      
      // Buscar dados do proprietário
      const landlordData = await db.select().from(landlords).where(eq(landlords.id, input.ownerId)).limit(1);
      if (!landlordData[0]) return null;
      
      // Buscar pagamentos de aluguel
      const payments = await db.select().from(rentalPayments).where(eq(rentalPayments.landlordId, input.ownerId));
      
      // Buscar despesas
      const expenses = await db.select().from(propertyExpenses).where(eq(propertyExpenses.landlordId, input.ownerId));
      
      // Buscar repasses
      const transfers = await db.select().from(landlordTransfers).where(eq(landlordTransfers.landlordId, input.ownerId));
      
      // Buscar contratos
      const contractsData = await db.select().from(rentalContracts).where(eq(rentalContracts.landlordId, input.ownerId));
      
      // Calcular totais
      const totalRentReceived = payments
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      
      const totalCommissions = payments
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + (p.commissionAmount || 0), 0);
      
      const totalExpenses = expenses
        .filter(e => e.status === 'pago')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const totalTransferred = transfers
        .filter(t => t.status === 'concluido')
        .reduce((sum, t) => sum + (t.netAmount || 0), 0);
      
      return {
        owner: landlordData[0],
        contracts: contractsData,
        payments,
        expenses,
        transfers,
        summary: {
          totalRentReceived,
          totalCommissions,
          totalExpenses,
          totalTransferred,
          pendingTransfer: totalRentReceived - totalCommissions - totalExpenses - totalTransferred,
          activeContracts: contractsData.filter(c => c.status === 'ativo').length,
        },
      };
    }),

  // Obter relatório por imóvel
  getPropertyReport: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver relatórios');
      }
      
      const db = await getDb();
      if (!db) return null;
      
      // Buscar dados do imóvel
      const propertyData = await db.select().from(properties).where(eq(properties.id, input.propertyId)).limit(1);
      if (!propertyData[0]) return null;
      
      // Buscar pagamentos de aluguel
      const payments = await db.select().from(rentalPayments).where(eq(rentalPayments.propertyId, input.propertyId));
      
      // Buscar despesas
      const expenses = await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, input.propertyId));
      
      // Buscar contratos
      const contractsData = await db.select().from(rentalContracts).where(eq(rentalContracts.propertyId, input.propertyId));
      
      // Calcular totais
      const totalRentReceived = payments
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      
      const totalExpenses = expenses
        .filter(e => e.status === 'pago')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const totalCommissions = payments
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + (p.commissionAmount || 0), 0);
      
      return {
        property: propertyData[0],
        contracts: contractsData,
        payments,
        expenses,
        summary: {
          totalRentReceived,
          totalExpenses,
          totalCommissions,
          netProfit: totalRentReceived - totalExpenses,
          occupancyRate: contractsData.filter(c => c.status === 'ativo').length > 0 ? 100 : 0,
        },
      };
    }),

  // Listar proprietários para filtro
  getOwnersList: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver proprietários');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      return db.select({
        id: landlords.id,
        name: landlords.name,
        email: landlords.email,
      }).from(landlords).orderBy(landlords.name);
    }),

  // Listar imóveis para filtro
  getPropertiesList: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver imóveis');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      return db.select({
        id: properties.id,
        title: properties.title,
        address: properties.address,
        neighborhood: properties.neighborhood,
      }).from(properties).orderBy(properties.title);
    }),

  // Listar categorias para filtro
  getCategoriesList: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver categorias');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      const allTransactions = await db.select({ category: transactions.category }).from(transactions);
      const categories = [...new Set(allTransactions.map(t => t.category).filter(Boolean))];
      return categories;
    }),
});

// ============================================
// REVIEWS ROUTER
// ============================================

const reviewsRouter = router({
  // Listar avaliações aprovadas (público)
  list: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      return db.select()
        .from(reviews)
        .where(eq(reviews.approved, true))
        .orderBy(desc(reviews.featured), desc(reviews.displayOrder), desc(reviews.createdAt));
    }),

  // Listar todas as avaliações (protegido - admin)
  listAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver todas as avaliações');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(reviews).orderBy(desc(reviews.createdAt));
    }),

  // Criar avaliação (protegido - admin)
  create: protectedProcedure
    .input(z.object({
      clientName: z.string(),
      clientRole: z.string().optional(),
      clientPhoto: z.string().optional(),
      rating: z.number().min(1).max(5),
      title: z.string().optional(),
      content: z.string(),
      propertyId: z.number().optional(),
      leadId: z.number().optional(),
      approved: z.boolean().optional(),
      featured: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar avaliações');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(reviews).values({
        ...input,
        approved: input.approved ?? false,
        featured: input.featured ?? false,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true };
    }),

  // Aprovar avaliação (protegido - admin)
  approve: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem aprovar avaliações');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(reviews)
        .set({ approved: true, updatedAt: new Date() })
        .where(eq(reviews.id, input.id));
      
      return { success: true };
    }),

  // Deletar avaliação (protegido - admin)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar avaliações');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(reviews).where(eq(reviews.id, input.id));
      
      return { success: true };
    }),
});

// ============================================
// FINANCING ROUTER
// ============================================

const financingRouter = router({
  // Criar simulação de financiamento (público)
  createSimulation: publicProcedure
    .input(z.object({
      // Lead data
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      propertyType: z.string().nullable(),
      desiredLocation: z.string().nullable(),
      estimatedValue: z.number().nullable(),
      
      // Simulation data
      propertyValue: z.number(),
      downPayment: z.number(),
      financedAmount: z.number(),
      termMonths: z.number(),
      amortizationSystem: z.enum(["SAC", "PRICE"]),
      selectedBank: z.string(),
      interestRate: z.string(),
      
      // Results
      firstInstallment: z.number(),
      lastInstallment: z.number(),
      averageInstallment: z.number(),
      totalAmount: z.number(),
      totalInterest: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Criar ou atualizar lead
      const existingLead = await db.select()
        .from(leads)
        .where(eq(leads.email, input.email))
        .limit(1);
      
      let leadId: number;
      
      if (existingLead.length > 0) {
        leadId = existingLead[0].id;
        // Atualizar lead existente
        await db.update(leads)
          .set({
            name: input.name,
            phone: input.phone,
            stage: "warm",
            source: "Simulador de Financiamento",
            notes: `Simulação de financiamento: ${input.selectedBank} - ${input.amortizationSystem}`,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, leadId));
      } else {
        // Criar novo lead
        const [newLead] = await db.insert(leads).values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          stage: "warm",
          source: "Simulador de Financiamento",
          clientType: "buyer",
          notes: `Simulação de financiamento: ${input.selectedBank} - ${input.amortizationSystem}`,
        });
        leadId = newLead.insertId;
      }
      
      // Salvar simulação
      const [simulation] = await db.insert(financingSimulations).values({
        leadId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        propertyType: input.propertyType,
        desiredLocation: input.desiredLocation,
        estimatedValue: input.estimatedValue,
        propertyValue: input.propertyValue,
        downPayment: input.downPayment,
        financedAmount: input.financedAmount,
        termMonths: input.termMonths,
        amortizationSystem: input.amortizationSystem,
        selectedBank: input.selectedBank,
        interestRate: input.interestRate,
        firstInstallment: input.firstInstallment,
        lastInstallment: input.lastInstallment,
        averageInstallment: input.averageInstallment,
        totalAmount: input.totalAmount,
        totalInterest: input.totalInterest,
        status: "pending",
      });
      
      // Criar interação
      await db.insert(interactions).values({
        leadId,
        type: "simulation",
        notes: `Simulação de financiamento realizada: ${input.selectedBank}`,
        metadata: JSON.stringify({
          bank: input.selectedBank,
          system: input.amortizationSystem,
          propertyValue: input.propertyValue,
          downPayment: input.downPayment,
          termMonths: input.termMonths,
        }),
      });
      
      // TODO: Enviar webhook para N8N
      // await fetch(process.env.N8N_FINANCING_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ leadId, simulationId: simulation.insertId, ...input })
      // });
      
      return { success: true, simulationId: simulation.insertId, leadId };
    }),

  // Listar simulações (protegido - admin)
  list: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem listar simulações');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const simulations = await db.select()
        .from(financingSimulations)
        .orderBy(desc(financingSimulations.createdAt))
        .limit(100);
      
      return simulations;
    }),

  // Obter simulação por ID (protegido - admin)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver simulações');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [simulation] = await db.select()
        .from(financingSimulations)
        .where(eq(financingSimulations.id, input.id))
        .limit(1);
      
      if (!simulation) {
        throw new Error('Simulação não encontrada');
      }
      
      return simulation;
    }),

  // Marcar como contatado (protegido - admin)
  markContacted: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem atualizar simulações');
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(financingSimulations)
        .set({ contacted: true, status: "contacted", updatedAt: new Date() })
        .where(eq(financingSimulations.id, input.id));
      
      return { success: true };
    }),
});

// ============================================
// RENTAL MANAGEMENT ROUTER
// ============================================

const rentalRouter = router({
  // Proprietários
  landlords: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        cpfCnpj: z.string(),
        email: z.string().email(),
        phone: z.string(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        bankName: z.string().optional(),
        agencyNumber: z.string().optional(),
        accountNumber: z.string().optional(),
        accountType: z.enum(["corrente", "poupanca"]).optional(),
        pixKey: z.string().optional(),
        pixKeyType: z.enum(["cpf", "cnpj", "email", "telefone", "aleatoria"]).optional(),
        commissionRate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.createLandlord(input as any);
      }),
    
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await rentalMgmt.listLandlords(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await rentalMgmt.getLandlordById(input.id);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          bankName: z.string().optional(),
          agencyNumber: z.string().optional(),
          accountNumber: z.string().optional(),
          pixKey: z.string().optional(),
          status: z.enum(["ativo", "inativo", "bloqueado"]).optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.updateLandlord(input.id, input.data as any);
      }),
  }),
  
  // Locatários
  tenants: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        cpf: z.string(),
        email: z.string().email(),
        phone: z.string(),
        whatsapp: z.string().optional(),
        occupation: z.string().optional(),
        employer: z.string().optional(),
        monthlyIncome: z.number().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.createTenant(input as any);
      }),
    
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await rentalMgmt.listTenants(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await rentalMgmt.getTenantById(input.id);
      }),
  }),
  
  // Contratos
  contracts: router({
    create: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        landlordId: z.number(),
        tenantId: z.number(),
        contractNumber: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        durationMonths: z.number(),
        rentAmount: z.number(),
        condoFee: z.number().optional(),
        iptu: z.number().optional(),
        commissionRate: z.string(),
        paymentDay: z.number().optional(),
        depositAmount: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.createRentalContract(input as any);
      }),
    
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        landlordId: z.number().optional(),
        tenantId: z.number().optional(),
        propertyId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await rentalMgmt.listRentalContracts(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await rentalMgmt.getRentalContractById(input.id);
      }),
  }),
  
  // Pagamentos
  payments: router({
    create: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        propertyId: z.number(),
        landlordId: z.number(),
        tenantId: z.number(),
        referenceMonth: z.string(),
        rentAmount: z.number(),
        condoFee: z.number().optional(),
        iptu: z.number().optional(),
        commissionRate: z.string(),
        dueDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.createRentalPayment(input as any);
      }),
    
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        contractId: z.number().optional(),
        landlordId: z.number().optional(),
        referenceMonth: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await rentalMgmt.listRentalPayments(input);
      }),
    
    markAsPaid: protectedProcedure
      .input(z.object({
        id: z.number(),
        paymentDate: z.string(),
        paymentMethod: z.string(),
        paymentProof: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.markPaymentAsPaid(
          input.id,
          new Date(input.paymentDate),
          input.paymentMethod,
          input.paymentProof
        );
      }),
    
    generateMonthly: protectedProcedure
      .input(z.object({ referenceMonth: z.string() }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.generateMonthlyPayments(input.referenceMonth);
      }),
  }),
  
  // Despesas
  expenses: router({
    create: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        landlordId: z.number(),
        expenseType: z.enum(["manutencao", "reparo", "pintura", "limpeza", "jardinagem", "seguranca", "seguro", "iptu", "condominio", "taxa_administracao", "outros"]),
        description: z.string(),
        amount: z.number(),
        paidBy: z.enum(["imobiliaria", "proprietario", "inquilino"]),
        expenseDate: z.string(),
        supplierName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.createPropertyExpense(input as any);
      }),
    
    list: protectedProcedure
      .input(z.object({
        propertyId: z.number().optional(),
        landlordId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await rentalMgmt.listPropertyExpenses(input);
      }),
  }),
  
  // Repasses
  transfers: router({
    list: protectedProcedure
      .input(z.object({
        landlordId: z.number().optional(),
        referenceMonth: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await rentalMgmt.listLandlordTransfers(input);
      }),
    
    calculate: protectedProcedure
      .input(z.object({
        landlordId: z.number(),
        referenceMonth: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await rentalMgmt.calculateLandlordTransfer(input.landlordId, input.referenceMonth);
      }),
  }),
  
  // Relatórios
  reports: router({
    landlordFinancial: protectedProcedure
      .input(z.object({
        landlordId: z.number(),
        startMonth: z.string(),
        endMonth: z.string(),
      }))
      .query(async ({ input }) => {
        return await rentalMgmt.getLandlordFinancialReport(
          input.landlordId,
          input.startMonth,
          input.endMonth
        );
      }),
  }),
});

// ============================================
// CLIENTS ROUTER (CRM 360º)
// ============================================

const clientsRouter = router({
  // Listar todos os clientes unificados (leads + proprietários + locatários)
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      search: z.string().optional(),
      type: z.string().optional(), // 'comprador', 'locatario', 'proprietario', 'all'
      source: z.string().optional(), // 'site', 'whatsapp', 'instagram', etc
    }))
    .query(async ({ input }) => {
      return await db.getUnifiedClients(input);
    }),
  
  // Obter perfil completo de um cliente
  getProfile: protectedProcedure
    .input(z.object({
      entityType: z.enum(['lead', 'landlord', 'tenant']),
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getClientProfile(input.entityType, input.id);
    }),
  
  // Obter dados financeiros do cliente
  getFinancials: protectedProcedure
    .input(z.object({
      entityType: z.enum(['lead', 'landlord', 'tenant']),
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getClientFinancials(input.entityType, input.id);
    }),
  
  // Obter imóveis relacionados ao cliente
  getProperties: protectedProcedure
    .input(z.object({
      entityType: z.enum(['lead', 'landlord', 'tenant']),
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getClientProperties(input.entityType, input.id);
    }),
  
  // Obter histórico de interações
  getInteractions: protectedProcedure
    .input(z.object({
      entityType: z.enum(['lead', 'landlord', 'tenant']),
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getClientInteractions(input.entityType, input.id);
    }),
  
  // Obter resumo de estatísticas
  getStats: protectedProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return { totalLeads: 0, totalLandlords: 0, totalTenants: 0, newThisMonth: 0 };
    
    const leadsCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(leads);
    const landlordsCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(landlords);
    const tenantsCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(tenants);
    
    // Leads novos este mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newLeads = await dbInstance.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(gte(leads.createdAt, startOfMonth));
    
    return {
      totalLeads: Number(leadsCount[0]?.count || 0),
      totalLandlords: Number(landlordsCount[0]?.count || 0),
      totalTenants: Number(tenantsCount[0]?.count || 0),
      newThisMonth: Number(newLeads[0]?.count || 0),
    };
  }),
});

// ============================================
// APP ROUTER
// ============================================

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  properties: propertiesRouter,
  propertyImages: propertyImagesRouter,
  leads: leadsRouter,
  interactions: interactionsRouter,
  blog: blogRouter,
  settings: settingsRouter,
  owners: ownersRouter,
  integration: integrationRouter,
  analytics: analyticsRouter,
  financial: financialRouter,
  reviews: reviewsRouter,
  financing: financingRouter,
  rental: rentalRouter,
  clients: clientsRouter,
  webhooks: webhooksRouter,
});

export type AppRouter = typeof appRouter;
