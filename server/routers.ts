import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { webhooksRouter } from "./routers/webhooks";
import { z } from "zod";
import * as db from "./db";
// [FASE2-DISABLED] // import * as rentalMgmt from "./rental-management"; // DISABLED
import { getDb } from "./db";
import { eq, desc, asc, gte, sql, isNull } from "drizzle-orm";
import {financingSimulations, leads, rentalPayments, properties, landlords, owners, propertyImages, campaignSources, interactions, transactions, commissions, contracts, financialCategories, analyticsEvents, reviews} from "../drizzle/schema";
// tenants não existe no schema real — usar stub
const tenants = leads; // backward compat stub

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
      
      // Atualizar last_sign_in_at
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
// USERS ROUTER
// ============================================

const usersRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'gerente') {
        throw new Error('Apenas administradores e gerentes podem listar usuários');
      }
      return await db.db.listUsers();
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
      role: z.enum(["admin", "gerente", "corretor", "atendente", "user"]).default("user"),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar usuários');
      }

      const { hashPassword } = await import("./auth");

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
        role: input.role,
        phone: input.phone,
      });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
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
      const result = await db.listProperties({ featured: true, limit: input?.limit || 6 });
      return result.items;
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
      sale_price: z.number().optional(),
      salePrice: z.number().optional(),
      rent_price: z.number().optional(),
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
      status: z.enum(["disponivel", "reservado", "vendido", "alugado", "inativo"]).optional(),
      featured: z.boolean().optional(),
      published: z.boolean().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      slug: z.string().optional(),
      ownerId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar imóveis');
      }
      return await db.createProperty(input, ctx.user.id);
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
        sale_price: z.number().optional(),
        salePrice: z.number().optional(),
        rent_price: z.number().optional(),
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
        status: z.enum(["disponivel", "reservado", "vendido", "alugado", "inativo"]).optional(),
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

  listAdmin: protectedProcedure
    .input(z.object({ ownerId: z.number().nullable().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem listar imóveis no admin');
      }

      const dbi = await getDb();
      if (!dbi) return [];

      const base = dbi
        .select({
          id: properties.id,
          referenceCode: properties.reference_code,
          title: properties.title,
          propertyType: properties.property_type,
          neighborhood: properties.neighborhood,
          city: properties.city,
          salePrice: properties.sale_price,
          rentPrice: properties.rent_price,
          status: properties.status,
          owner_id: properties.owner_id,
          ownerName: owners.name,
        })
        .from(properties)
        .leftJoin(owners, eq(properties.owner_id, owners.id));

      if (input?.ownerId === null) {
        return base.where(isNull(properties.owner_id)).orderBy(desc(properties.updated_at));
      }

      if (typeof input?.ownerId === "number") {
        return base.where(eq(properties.owner_id, input.ownerId)).orderBy(desc(properties.updated_at));
      }

      return base.orderBy(desc(properties.updated_at));
    }),

  assignOwner: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      ownerId: z.number().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem vincular proprietário');
      }
      await db.updateProperty(input.propertyId, { ownerId: input.ownerId });
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
      if (lead.interesse) {
        filters.transactionType = lead.interesse;
      }

      // Filtrar por orçamento (campos reais: orcamento_min, orcamento_max)
      if (lead.orcamento_min) {
        filters.minPrice = lead.orcamento_min;
      }
      if (lead.orcamento_max) {
        filters.maxPrice = lead.orcamento_max;
      }

      // Filtrar por bairros preferidos (campo real: regioes_interesse array)
      if (lead.regioes_interesse) {
        const regioes = Array.isArray(lead.regioes_interesse)
          ? lead.regioes_interesse
          : String(lead.regioes_interesse).split(',');
        if (regioes.length > 0) filters.neighborhood = String(regioes[0]).trim();
      }

      // Filtrar por tipo de imóvel (campo real: tipo_imovel)
      if (lead.tipo_imovel) {
        filters.propertyType = lead.tipo_imovel;
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
      const hotLeads = allLeads.filter((lead: any) => lead.status === 'quente' || lead.status === 'qualificado');

      // Para cada lead quente, verificar última interação
      const inactiveLeads = [];
      for (const lead of hotLeads) {
        const interactions = await db.getInteractionsByLeadId(lead.id);
        
        if (interactions.length === 0) {
          // Sem interações, verificar data de criação
          const createdDate = new Date(lead.created_at);
          if (createdDate < threeDaysAgo) {
            inactiveLeads.push({
              ...lead,
              daysSinceLastContact: Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)),
              lastContactDate: lead.created_at,
            });
          }
        } else {
          // Com interações, verificar a mais recente
          const lastInteraction = interactions.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          const lastContactDate = new Date(lastInteraction.created_at);
          
          if (lastContactDate < threeDaysAgo) {
            inactiveLeads.push({
              ...lead,
              daysSinceLastContact: Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)),
              lastContactDate: lastInteraction.created_at,
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
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }
      
      const images = await database
        .select()
        .from(propertyImages)
        .where(eq(propertyImages.property_id, input.propertyId))
        .orderBy(
          desc(propertyImages.is_main),
          asc(propertyImages.display_order),
          asc(propertyImages.created_at)
        );
      return images;
    }),

  // Criar URL de upload (protegido - admin)
  createUploadUrl: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      filename: z.string(),
      contentType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem fazer upload de imagens');
      }

      const { generateStorageKey, getPublicUrl } = await import("./storage/supabase");
      const key = generateStorageKey(input.propertyId, input.filename);
      const publicUrl = getPublicUrl(key);

      return {
        key,
        uploadUrl: publicUrl, // Upload será via backend (ver save)
        publicUrl,
      };
    }),

  // Upload de arquivo (protegido - admin)
  uploadFile: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      filename: z.string(),
      contentType: z.string(),
      fileData: z.string(), // Base64
      caption: z.string().optional(),
      isMain: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem fazer upload de imagens');
      }

      try {
        const database = await getDb();
        if (!database) {
          throw new Error('Database not available');
        }
        
        const { generateStorageKey, uploadFile } = await import("./storage/supabase");
        const key = generateStorageKey(input.propertyId, input.filename);

        // Converter base64 para Buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload para Supabase Storage
        const publicUrl = await uploadFile(key, buffer, input.contentType);

        // Se isMain === true, zerar is_main das outras imagens
        if (input.isMain) {
          await database
            .update(propertyImages)
            .set({ is_main: false })
            .where(eq(propertyImages.property_id, input.propertyId));
        }

        // Salvar no DB
        const [image] = await database
          .insert(propertyImages)
          .values({
            property_id: input.propertyId,
            url: publicUrl,
            caption: input.caption || null,
            display_order: 0,
            is_main: input.isMain ?? false,
            storage_key: key,
          })
          .returning();

        return image;
      } catch (error) {
        console.error('[PropertyImages] Upload failed:', error);
        throw error; // Propagar erro real para o cliente
      }
    }),

  // Salvar imagem no DB após upload (protegido - admin)
  save: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      url: z.string(),
      caption: z.string().optional(),
      displayOrder: z.number().optional(),
      isMain: z.boolean().optional(),
      storageKey: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem salvar imagens');
      }

      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      // Se isMain === true, zerar is_main das outras imagens
      if (input.isMain) {
        await database
          .update(propertyImages)
          .set({ is_main: false })
          .where(eq(propertyImages.property_id, input.propertyId));
      }

      const [image] = await database
        .insert(propertyImages)
        .values({
          property_id: input.propertyId,
          url: input.url,
          caption: input.caption || null,
          display_order: input.displayOrder ?? 0,
          is_main: input.isMain ?? false,
          storage_key: input.storageKey || null,
        })
        .returning();

      return image;
    }),

  // Definir imagem principal (protegido - admin)
  setMain: protectedProcedure
    .input(z.object({
      imageId: z.number(),
      propertyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem definir imagem principal');
      }

      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      // Zerar is_main de todas as imagens do imóvel
      await database
        .update(propertyImages)
        .set({ is_main: false })
        .where(eq(propertyImages.property_id, input.propertyId));

      // Setar is_main da imagem selecionada
      await database
        .update(propertyImages)
        .set({ is_main: true })
        .where(eq(propertyImages.id, input.imageId));

      return { success: true };
    }),

  // Deletar imagem (protegido - admin)
  delete: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      imageId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar imagens');
      }

      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      // Buscar imagem para pegar storage_key
      const [image] = await database
        .select()
        .from(propertyImages)
        .where(eq(propertyImages.id, input.imageId));

      if (!image) {
        throw new Error('Imagem não encontrada');
      }

      // Deletar do storage se tiver storage_key
      if (image.storage_key) {
        try {
          const { deleteObject } = await import("./storage/supabase");
          await deleteObject(image.storage_key);
        } catch (error) {
          console.error('Erro ao deletar imagem do storage:', error);
          // Continua mesmo se falhar (imagem pode não existir mais)
        }
      }

      // Deletar do DB
      await database
        .delete(propertyImages)
        .where(eq(propertyImages.id, input.imageId));

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
        return await db.getAiHistoryByPhone(input.phone);
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
      // Atualizar lead insights (tabela lead_insights no Supabase)
      const dbInstance = await getDb();
      if (dbInstance) {
        const { leadInsights } = await import("../drizzle/schema");
        const existing = await dbInstance.select().from(leadInsights).where(eq(leadInsights.lead_id, input.leadId)).limit(1);
        if (existing.length > 0) {
          await dbInstance.update(leadInsights).set({
            sentiment_score: input.sentimentScore,
            ai_summary: input.aiSummary,
            updated_at: new Date(),
          } as any).where(eq(leadInsights.lead_id, input.leadId));
        } else {
          await dbInstance.insert(leadInsights).values({
            lead_id: input.leadId,
            sentiment_score: input.sentimentScore,
            ai_summary: input.aiSummary,
          } as any);
        }
      }
      
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
        const lead = allLeads.find((l: any) => l.telefone === input.phone || l.telefone === input.phone?.replace(/\D/g, ''));

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
        } else if (lead.interesse) {
          filters.transactionType = lead.interesse;
        }

        if (input.propertyType) {
          filters.propertyType = input.propertyType;
        }

        if (input.budgetMin || lead.orcamento_min) {
          filters.minPrice = input.budgetMin || lead.orcamento_min;
        }

        if (input.budgetMax || lead.orcamento_max) {
          filters.maxPrice = input.budgetMax || lead.orcamento_max;
        }

        if (input.neighborhood) {
          filters.neighborhood = input.neighborhood;
        } else if (lead.regioes_interesse) {
          const neighborhoods = Array.isArray(lead.regioes_interesse)
            ? lead.regioes_interesse
            : String(lead.regioes_interesse).split(',');
          if (neighborhoods.length > 0) {
            filters.neighborhood = String(neighborhoods[0]).trim();
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
            phone: lead.telefone,
            qualification: lead.status, // status é o campo real no DB
          },
          properties: matchedProperties.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            propertyType: p.property_type,
            transactionType: p.transaction_type,
            price: p.sale_price,
            rental_price: p.rent_price,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            totalArea: p.total_area,
            address: p.address,
            neighborhood: p.neighborhood,
            city: p.city,
            state: p.state,
            coverImage: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
            referenceCode: p.reference_code,
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
        const lead = allLeads.find((l: any) => l.telefone === input.phone || l.telefone === input.phone?.replace(/\D/g, ''));

        if (!lead) {
          return { success: false, error: "Lead não encontrado" };
        }

        const updateData: any = {
          status: input.qualification, // qualification → status no DB
        };

        if (input.buyerProfile) {
          updateData.buyerProfile = input.buyerProfile;
        }

        if (input.urgencyLevel) {
          updateData.urgencyLevel = input.urgencyLevel;
        }

        if (input.notes) {
          updateData.observacoes = `${lead.observacoes || ''}\n\n[IA - ${new Date().toLocaleString('pt-BR')}] ${input.notes}`;
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
    const dbi = await getDb();
    if (!dbi) return [];
    return dbi
      .select({ id: owners.id, name: owners.name, phone: owners.phone, email: owners.email })
      .from(owners)
      .orderBy(asc(owners.name));
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
        created_at: new Date(),
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
      
      return db.select().from(campaignSources).orderBy(desc(campaignSources.created_at));
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
        utm_source: input.source,
        utm_medium: input.medium,
        utm_campaign: input.campaignId,
        active: true,
      } as any);
      
      return { success: true };
    }),
});

// ============================================
// FINANCIAL ROUTER
// ============================================

const financialRouter = router({
  // Estatísticas gerais (cards do dashboard financeiro)
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas administradores podem ver estatísticas financeiras");
      }

      const dbi = await getDb();
      if (!dbi) return null;

      const allTransactions = await dbi.select().from(transactions);
      const allCommissions = await dbi.select().from(commissions);

      const isPaid = (status?: string | null) => (status || "").toLowerCase() === "pago";
      const typeOf = (tipo: string) => {
        const t = (tipo || "").toLowerCase();
        if (t.includes("comissao")) return "commission";
        if (t.includes("repasse") || t.includes("transfer")) return "transfer";
        if (t.includes("despesa") || t.includes("taxa") || t.includes("iptu") || t.includes("condo") || t.includes("condominio")) return "expense";
        return "revenue";
      };

      const paidTx = allTransactions.filter((t) => isPaid((t as any).status));
      const totalRevenue = paidTx.filter((t) => typeOf((t as any).tipo) === "revenue").reduce((sum, t) => sum + Number((t as any).valor || 0), 0);
      const totalExpenses = paidTx.filter((t) => typeOf((t as any).tipo) === "expense").reduce((sum, t) => sum + Number((t as any).valor || 0), 0);
      const totalTransfers = paidTx.filter((t) => typeOf((t as any).tipo) === "transfer").reduce((sum, t) => sum + Number((t as any).valor || 0), 0);

      const paidCommissions = allCommissions.filter((c) => (String((c as any).status || "")).toLowerCase() === "pago");
      const totalCommissions = paidCommissions.reduce((sum, c) => sum + Number((c as any).valor_comissao || 0), 0);

      const netProfit = totalRevenue - totalExpenses - totalCommissions;

      return {
        totalRevenue,
        totalExpenses,
        totalTransfers,
        totalCommissions,
        netProfit,
        countTransactions: allTransactions.length,
      };
    }),

  // Lista filtrada de transações (tabela)
  getFilteredTransactions: protectedProcedure
    .input(z.object({
      ownerId: z.number().optional(),
      propertyId: z.number().optional(),
      type: z.string().optional(), // revenue|expense|transfer|commission
      category: z.string().optional(), // opcional: pode vir de transactions.descricao ou metadata
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas administradores podem ver transações");
      }

      const dbi = await getDb();
      if (!dbi) return { items: [], summary: {} };

      const props = await dbi.select({ id: properties.id, owner_id: properties.owner_id, title: properties.title }).from(properties);
      const propOwnerById = new Map<number, number | null>();
      props.forEach((p) => propOwnerById.set(p.id, (p as any).owner_id ?? null));

      let all = await dbi.select().from(transactions).orderBy(desc(transactions.created_at));

      // Map para formato esperado no front
      const typeOf = (tipo: string) => {
        const t = (tipo || "").toLowerCase();
        if (t.includes("comissao")) return "commission";
        if (t.includes("repasse") || t.includes("transfer")) return "transfer";
        if (t.includes("despesa") || t.includes("taxa") || t.includes("iptu") || t.includes("condo") || t.includes("condominio")) return "expense";
        return "revenue";
      };

      const toItem = (t: any) => {
        const propertyId = t.property_id ?? null;
        const ownerId = propertyId ? (propOwnerById.get(propertyId) ?? null) : null;
        const mappedType = typeOf(t.tipo);
        return {
          id: t.id,
          ownerId,
          propertyId,
          type: mappedType,
          category: null,
          description: t.descricao || t.tipo,
          amount: t.valor,
          status: t.status,
          createdAt: t.created_at,
          dueDate: t.data_vencimento,
          paidAt: t.data_pagamento,
        };
      };

      let items = all.map(toItem);

      if (input.ownerId) items = items.filter((t) => t.ownerId === input.ownerId);
      if (input.propertyId) items = items.filter((t) => t.propertyId === input.propertyId);
      if (input.type) items = items.filter((t) => t.type === input.type);
      if (input.status) items = items.filter((t) => String(t.status || "").toLowerCase() === String(input.status).toLowerCase());

      if (input.startDate) {
        const sd = new Date(input.startDate);
        items = items.filter((t) => t.createdAt && new Date(t.createdAt) >= sd);
      }
      if (input.endDate) {
        const ed = new Date(input.endDate);
        items = items.filter((t) => t.createdAt && new Date(t.createdAt) <= ed);
      }

      const summary = {
        totalRevenue: items.filter((t) => t.type === "revenue").reduce((s, t) => s + Number(t.amount || 0), 0),
        totalExpenses: items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0),
        totalTransfers: items.filter((t) => t.type === "transfer").reduce((s, t) => s + Number(t.amount || 0), 0),
        totalCommissions: items.filter((t) => t.type === "commission").reduce((s, t) => s + Number(t.amount || 0), 0),
        count: items.length,
      };

      return { items: items.slice(0, input.limit), summary };
    }),

  // Relatório por proprietário (owners.id)
  getOwnerReport: protectedProcedure
    .input(z.object({
      ownerId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas administradores podem ver relatórios");
      }

      const dbi = await getDb();
      if (!dbi) return null;

      const ownerRow = await dbi.select().from(owners).where(eq(owners.id, input.ownerId)).limit(1);
      if (!ownerRow[0]) return null;

      const ownerProps = await dbi.select().from(properties).where(eq(properties.owner_id, input.ownerId));
      const propertyIds = ownerProps.map((p: any) => p.id);

      // Contratos ativos (locação)
      const allContracts = propertyIds.length
        ? await dbi.select().from(contracts).orderBy(desc(contracts.created_at))
        : [];
      const contractsForOwner = allContracts.filter((c: any) => propertyIds.includes(c.property_id));
      const activeContracts = contractsForOwner.filter((c: any) => (c.is_active_rental === true) || String(c.tipo || "").toLowerCase().includes("loca"));

      // Transações do owner (via property_id)
      let tx = await dbi.select().from(transactions).orderBy(desc(transactions.created_at));
      tx = tx.filter((t: any) => t.property_id && propertyIds.includes(t.property_id));

      // filtro de datas opcional (por created_at)
      if (input.startDate) {
        const sd = new Date(input.startDate);
        tx = tx.filter((t: any) => t.created_at && new Date(t.created_at) >= sd);
      }
      if (input.endDate) {
        const ed = new Date(input.endDate);
        tx = tx.filter((t: any) => t.created_at && new Date(t.created_at) <= ed);
      }

      const isPaid = (status?: string | null) => (status || "").toLowerCase() === "pago";
      const isExpense = (tipo: string) => {
        const t = (tipo || "").toLowerCase();
        return t.includes("despesa") || t.includes("taxa") || t.includes("iptu") || t.includes("condo") || t.includes("condominio");
      };
      const isTransfer = (tipo: string) => (tipo || "").toLowerCase().includes("repasse") || (tipo || "").toLowerCase().includes("transfer");
      const isRent = (tipo: string) => {
        const t = (tipo || "").toLowerCase();
        return t.includes("aluguel") || t.includes("locacao") || t.includes("renda") || t.includes("mensalidade");
      };

      const totalRentReceived = tx.filter((t: any) => isPaid(t.status) && isRent(t.tipo)).reduce((s, t: any) => s + Number(t.valor || 0), 0);
      const totalExpenses = tx.filter((t: any) => isPaid(t.status) && isExpense(t.tipo)).reduce((s, t: any) => s + Number(t.valor || 0), 0);
      const pendingTransfer = tx.filter((t: any) => !isPaid(t.status) && isTransfer(t.tipo)).reduce((s, t: any) => s + Number(t.valor || 0), 0);

      // Comissões relacionadas a contratos desse owner
      const contractIds = contractsForOwner.map((c: any) => c.id);
      const allComms = contractIds.length ? await dbi.select().from(commissions).orderBy(desc(commissions.created_at)) : [];
      const comms = allComms.filter((c: any) => c.contract_id && contractIds.includes(c.contract_id));
      const totalCommissions = comms.filter((c: any) => String(c.status || "").toLowerCase() === "pago").reduce((s, c: any) => s + Number(c.valor_comissao || 0), 0);

      const mappedContracts = activeContracts.map((c: any) => ({
        id: c.id,
        contractNumber: (c.metadata && (c.metadata as any).contractNumber) || null,
        startDate: c.data_inicio,
        endDate: c.data_fim || c.data_inicio,
        rentAmount: c.valor_parcela || 0,
        status: c.status,
      }));

      return {
        owner: {
          id: ownerRow[0].id,
          name: ownerRow[0].name,
          email: ownerRow[0].email,
        },
        properties: ownerProps,
        contracts: mappedContracts,
        summary: {
          totalRentReceived,
          totalCommissions,
          totalExpenses,
          pendingTransfer,
          activeContracts: mappedContracts.length,
        },
      };
    }),

  // Relatório por imóvel
  getPropertyReport: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas administradores podem ver relatórios");
      }

      const dbi = await getDb();
      if (!dbi) return null;

      const propRow = await dbi.select().from(properties).where(eq(properties.id, input.propertyId)).limit(1);
      if (!propRow[0]) return null;

      let tx = await dbi.select().from(transactions).orderBy(desc(transactions.created_at));
      tx = tx.filter((t: any) => t.property_id === input.propertyId);

      if (input.startDate) {
        const sd = new Date(input.startDate);
        tx = tx.filter((t: any) => t.created_at && new Date(t.created_at) >= sd);
      }
      if (input.endDate) {
        const ed = new Date(input.endDate);
        tx = tx.filter((t: any) => t.created_at && new Date(t.created_at) <= ed);
      }

      const isPaid = (status?: string | null) => (status || "").toLowerCase() === "pago";
      const isExpense = (tipo: string) => {
        const t = (tipo || "").toLowerCase();
        return t.includes("despesa") || t.includes("taxa") || t.includes("iptu") || t.includes("condo") || t.includes("condominio");
      };
      const isRent = (tipo: string) => {
        const t = (tipo || "").toLowerCase();
        return t.includes("aluguel") || t.includes("locacao") || t.includes("renda") || t.includes("mensalidade");
      };

      const totalRentReceived = tx.filter((t: any) => isPaid(t.status) && isRent(t.tipo)).reduce((s, t: any) => s + Number(t.valor || 0), 0);
      const totalExpenses = tx.filter((t: any) => isPaid(t.status) && isExpense(t.tipo)).reduce((s, t: any) => s + Number(t.valor || 0), 0);
      const netProfit = totalRentReceived - totalExpenses;

      // Synth: histórico de pagamentos por mês (agrupa por data_vencimento)
      const monthKey = (d: any) => {
        if (!d) return "N/A";
        const dt = new Date(d);
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        return `${dt.getFullYear()}-${m}`;
      };

      const buckets = new Map<string, any>();
      for (const t of tx) {
        const key = monthKey((t as any).data_vencimento);
        const curr = buckets.get(key) || { totalAmount: 0, paid: true, latestDue: (t as any).data_vencimento };
        curr.totalAmount += Number((t as any).valor || 0);
        if (!isPaid((t as any).status)) curr.paid = false;
        curr.latestDue = (t as any).data_vencimento;
        buckets.set(key, curr);
      }

      const payments = Array.from(buckets.entries()).map(([k, v]) => ({
        id: k,
        referenceMonth: k,
        dueDate: v.latestDue,
        totalAmount: v.totalAmount,
        status: v.paid ? "pago" : "pendente",
      }));

      // Ocupação (heurística): se existe contrato de locação ativo para este property, 100 senão 0
      const cts = await dbi.select().from(contracts).where(eq(contracts.property_id, input.propertyId));
      const active = cts.some((c: any) => c.is_active_rental === true || String(c.tipo || "").toLowerCase().includes("loca"));
      const occupancyRate = active ? 100 : 0;

      return {
        property: propRow[0],
        payments,
        summary: {
          totalRentReceived,
          totalExpenses,
          netProfit,
          occupancyRate,
        },
      };
    }),

  // Listas auxiliares para filtros
  getOwnersList: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Apenas administradores podem ver proprietários");
      const dbi = await getDb();
      if (!dbi) return [];
      return dbi.select({ id: owners.id, name: owners.name, email: owners.email }).from(owners).orderBy(owners.name);
    }),

  getPropertiesList: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Apenas administradores podem ver imóveis");
      const dbi = await getDb();
      if (!dbi) return [];
      return dbi.select({ id: properties.id, title: properties.title, address: properties.address, neighborhood: properties.neighborhood }).from(properties).orderBy(properties.title);
    }),

  getCategoriesList: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Apenas administradores podem ver categorias");
      const dbi = await getDb();
      if (!dbi) return [];
      // financial_categories existe no schema; se não existir, retorna vazio
      try {
        return await dbi.select().from(financialCategories).orderBy(asc(financialCategories.name));
      } catch {
        return [];
      }
    }),
});


const reviewsRouter = router({
  // Listar avaliações aprovadas (público)
  list: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      return db.select()
        .from(reviews)
        .where(eq(reviews.approved, true))
        .orderBy(desc(reviews.featured), desc(reviews.displayOrder), desc(reviews.created_at));
    }),

  // Listar todas as avaliações (protegido - admin)
  listAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Apenas administradores podem ver todas as avaliações');
      }
      
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(reviews).orderBy(desc(reviews.created_at));
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
        created_at: new Date(),
        updated_at: new Date(),
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
        .set({ approved: true, updated_at: new Date() })
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
            telefone: input.phone,
            status: "qualificado",
            origem: "simulador",
            observacoes: `Simulação de financiamento: ${input.selectedBank} - ${input.amortizationSystem}`,
            updated_at: new Date(),
          } as any)
          .where(eq(leads.id, leadId));
      } else {
        // Criar novo lead
        const [newLead] = await db.insert(leads).values({
          name: input.name,
          email: input.email,
          telefone: input.phone || `sim_${Date.now()}`,
          status: "qualificado",
          origem: "simulador",
          observacoes: `Simulação de financiamento: ${input.selectedBank} - ${input.amortizationSystem}`,
        } as any).returning();
        leadId = newLead.id;
      }
      
      // Salvar simulação
      const [simulation] = await db.insert(financingSimulations).values({
        lead_id: leadId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        property_type: input.propertyType,
        desired_location: input.desiredLocation,
        estimated_value: input.estimatedValue,
        property_value: input.propertyValue,
        down_payment: input.downPayment,
        financed_amount: input.financedAmount,
        term_months: input.termMonths,
        amortization_system: input.amortizationSystem,
        selected_bank: input.selectedBank,
        interest_rate: input.interestRate,
        first_installment: input.firstInstallment,
        last_installment: input.lastInstallment,
        average_installment: input.averageInstallment,
        total_amount: input.totalAmount,
        total_interest: input.totalInterest,
        status: "pending",
      } as any).returning();
      
      // Criar interação
      await db.insert(interactions).values({
        lead_id: leadId,
        tipo: "simulacao",
        canal: "site",
        descricao: `Simulação de financiamento realizada: ${input.selectedBank}`,
        metadata: {
          bank: input.selectedBank,
          system: input.amortizationSystem,
          propertyValue: input.propertyValue,
          downPayment: input.downPayment,
          termMonths: input.termMonths,
        },
      } as any);
      
      // TODO: Enviar webhook para N8N
      // await fetch(process.env.N8N_FINANCING_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ leadId, simulationId: simulation.insertId, ...input })
      // });
      
      return { success: true, simulationId: simulation?.id, leadId };
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
        .orderBy(desc(financingSimulations.created_at))
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
        .set({ contacted: true, status: "contacted", updated_at: new Date() })
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
// [FASE2-DISABLED]         return await rentalMgmt.createLandlord(input as any);
        return { success: false, message: "rentalMgmt disabled" };
      }),
    
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.listLandlords(input);
        return null;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.getLandlordById(input.id);
        return null;
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
// [FASE2-DISABLED]         return await rentalMgmt.updateLandlord(input.id, input.data as any);
        return { success: false, message: "rentalMgmt disabled" };
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
// [FASE2-DISABLED]         return await rentalMgmt.createTenant(input as any);
        return { success: false, message: "rentalMgmt disabled" };
      }),
    
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.listTenants(input);
        return null;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.getTenantById(input.id);
        return null;
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
// [FASE2-DISABLED]         return await rentalMgmt.createRentalContract(input as any);
        return { success: false, message: "rentalMgmt disabled" };
      }),
    
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        landlordId: z.number().optional(),
        tenantId: z.number().optional(),
        propertyId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.listRentalContracts(input);
        return null;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.getRentalContractById(input.id);
        return null;
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
// [FASE2-DISABLED]         return await rentalMgmt.createRentalPayment(input as any);
        return { success: false, message: "rentalMgmt disabled" };
      }),
    
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        contractId: z.number().optional(),
        landlordId: z.number().optional(),
        referenceMonth: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.listRentalPayments(input);
        return null;
      }),
    
    markAsPaid: protectedProcedure
      .input(z.object({
        id: z.number(),
        paymentDate: z.string(),
        paymentMethod: z.string(),
        paymentProof: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // [FASE2-DISABLED] return await rentalMgmt.markPaymentAsPaid(input.id, new Date(input.paymentDate), input.paymentMethod, input.paymentProof);
        return { success: false, message: "rentalMgmt disabled" };
      }),
    
    generateMonthly: protectedProcedure
      .input(z.object({ referenceMonth: z.string() }))
      .mutation(async ({ input }) => {
        // [FASE2-DISABLED] return await rentalMgmt.generateMonthlyPayments(input.referenceMonth);
        return { success: false, message: "rentalMgmt disabled" };
      }),
  }),
  
  // Despesas
  expenses: router({
    create: protectedProcedure
      .input(z.object({
        propertyId: z.number().optional(),
        landlordId: z.number().optional(),
        expenseType: z.enum(["manutencao", "reparo", "pintura", "limpeza", "jardinagem", "seguranca", "seguro", "iptu", "condominio", "taxa_administracao", "outros"]),
        description: z.string(),
        amount: z.number(),
        paidBy: z.enum(["imobiliaria", "proprietario", "inquilino"]),
        expenseDate: z.string(),
        supplierName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.createPropertyExpense(input as any);
        return { success: false, message: "rentalMgmt disabled" };
      }),
    
    list: protectedProcedure
      .input(z.object({
        propertyId: z.number().optional(),
        landlordId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.listPropertyExpenses(input);
        return null;
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
// [FASE2-DISABLED]         return await rentalMgmt.listLandlordTransfers(input);
        return null;
      }),
    
    calculate: protectedProcedure
      .input(z.object({
        landlordId: z.number(),
        referenceMonth: z.string(),
      }))
      .mutation(async ({ input }) => {
// [FASE2-DISABLED]         return await rentalMgmt.calculateLandlordTransfer(input.landlordId, input.referenceMonth);
        return { success: false, message: "rentalMgmt disabled" };
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
        // [FASE2-DISABLED] return await rentalMgmt.getLandlordFinancialReport(input.landlordId, input.startMonth, input.endMonth);
        return null;
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
      return await db.getClientInteractions(input.id);
    }),
  
  // Obter resumo de estatísticas
  getStats: protectedProcedure.query(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return { totalLeads: 0, totalLandlords: 0, totalTenants: 0, newThisMonth: 0 };
    
    const leadsCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(leads);
    const landlordsCount = await dbInstance.select({ count: sql<number>`count(*)` }).from(owners);
    const tenantsCount = [{ count: 0 }]; // tenants não existe no schema real
    
    // Leads novos este mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newLeads = await dbInstance.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(gte(leads.created_at, startOfMonth));
    
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
  users: usersRouter,
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
  clients: clientsRouter,
  webhooks: webhooksRouter,
});

export type AppRouter = typeof appRouter;