/**
 * server/_core/mappers.ts
 *
 * Mapeamentos explícitos de payload camelCase (router/front) para
 * colunas snake_case do banco de dados (Drizzle/Supabase).
 *
 * Fonte da verdade: schema real do Supabase (pasted_content_2.txt).
 *
 * NUNCA use spread direto do input no .values() — sempre passe pelo mapper.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Converte string vazia ou undefined para null */
function emptyToNull(val: string | null | undefined): string | null {
  if (val === "" || val === undefined) return null;
  return val;
}

/**
 * Normaliza um valor numérico que pode vir como string ("170", "0.00"),
 * number ou undefined/null. Retorna number | null.
 */
function toNumericOrNull(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === "") return null;
  const parsed = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(parsed) ? null : parsed;
}

/** Converte para inteiro ou null */
function toIntOrNull(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === "") return null;
  const parsed = typeof val === "string" ? parseInt(val, 10) : Math.round(val);
  return isNaN(parsed) ? null : parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Property Mapper
//
// Tabela properties no Supabase:
//   title, description, reference_code, property_type, transaction_type,
//   address, neighborhood, city, state, zip_code, latitude, longitude,
//   sale_price, rent_price, condo_fee, iptu, bedrooms, bathrooms, suites,
//   parking_spaces, total_area, built_area, features, images, main_image,
//   video_url, tour_virtual_url, status, featured, published,
//   meta_title, meta_description, slug, owner_id, created_by
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapeia o payload camelCase vindo do router para as colunas snake_case
 * da tabela `properties`.
 *
 * @param input  - Objeto camelCase do Zod input (properties.create / properties.update)
 * @param userId - ID do usuário autenticado (para created_by)
 */
export function mapPropertyInputToDb(input: Record<string, any>, userId?: number) {
  const mapped: Record<string, any> = {};

  // ── Campos de texto com mesmo nome no banco ──────────────────────────────
  if (input.title       !== undefined) mapped.title       = input.title;
  if (input.description !== undefined) mapped.description = input.description;
  if (input.address     !== undefined) mapped.address     = input.address;
  if (input.neighborhood!== undefined) mapped.neighborhood= input.neighborhood;
  if (input.city        !== undefined) mapped.city        = input.city;
  if (input.state       !== undefined) mapped.state       = input.state;
  if (input.status      !== undefined) mapped.status      = input.status;
  if (input.featured    !== undefined) mapped.featured    = input.featured;
  if (input.published   !== undefined) mapped.published   = input.published;
  if (input.video_url   !== undefined) mapped.video_url   = input.video_url;
  if (input.features    !== undefined) mapped.features    = input.features;
  if (input.images      !== undefined) mapped.images      = input.images;

  // ── Preços — colunas reais no Supabase: sale_price, rent_price ───────────
  if (input.sale_price  !== undefined) mapped.sale_price  = toNumericOrNull(input.sale_price);
  if (input.rent_price  !== undefined) mapped.rent_price  = toNumericOrNull(input.rent_price);

  // Compat: alguns formulários antigos enviam salePrice/rentPrice (camelCase)
  if (input.sale_price === undefined && input.salePrice !== undefined) mapped.sale_price = toNumericOrNull(input.salePrice);
  if (input.rent_price === undefined && input.rentPrice !== undefined) mapped.rent_price = toNumericOrNull(input.rentPrice);

  // ── Numéricos diretos ────────────────────────────────────────────────────
  if (input.bedrooms    !== undefined) mapped.bedrooms    = toIntOrNull(input.bedrooms);
  if (input.bathrooms   !== undefined) mapped.bathrooms   = toIntOrNull(input.bathrooms);
  if (input.suites      !== undefined) mapped.suites      = toIntOrNull(input.suites);
  if (input.iptu        !== undefined) mapped.iptu        = toNumericOrNull(input.iptu);

  // ── camelCase → snake_case ───────────────────────────────────────────────
  if (input.referenceCode !== undefined)
    mapped.reference_code = emptyToNull(input.referenceCode);

  if (input.propertyType !== undefined)
    mapped.property_type = input.propertyType;

  if (input.transactionType !== undefined)
    mapped.transaction_type = input.transactionType;

  if (input.zipCode !== undefined)
    mapped.zip_code = emptyToNull(input.zipCode);

  if (input.latitude !== undefined)
    mapped.latitude = toNumericOrNull(input.latitude);

  if (input.longitude !== undefined)
    mapped.longitude = toNumericOrNull(input.longitude);

  if (input.condoFee !== undefined)
    mapped.condo_fee = toNumericOrNull(input.condoFee);

  if (input.parkingSpaces !== undefined)
    mapped.parking_spaces = toIntOrNull(input.parkingSpaces);

  if (input.totalArea !== undefined)
    mapped.total_area = toNumericOrNull(input.totalArea);

  if (input.builtArea !== undefined)
    mapped.built_area = toNumericOrNull(input.builtArea);

  if (input.mainImage !== undefined)
    mapped.main_image = emptyToNull(input.mainImage);

  if (input.metaTitle !== undefined)
    mapped.meta_title = emptyToNull(input.metaTitle);

  if (input.metaDescription !== undefined)
    mapped.meta_description = emptyToNull(input.metaDescription);

  if (input.slug !== undefined)
    mapped.slug = emptyToNull(input.slug);

  if (input.tourVirtualUrl !== undefined)
    mapped.tour_virtual_url = emptyToNull(input.tourVirtualUrl);

  if (input.ownerId !== undefined)
    mapped.owner_id = toIntOrNull(input.ownerId);

  // ── created_by: userId explícito tem prioridade ──────────────────────────
  if (userId !== undefined) {
    mapped.created_by = userId;
  } else if (input.createdBy !== undefined) {
    mapped.created_by = input.createdBy;
  }

  return mapped;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead Mapper
//
// Tabela leads no Supabase:
//   name, email, telefone (NOT NULL UNIQUE), cpf, profile, status,
//   interesse, tipo_imovel, finalidade, orcamento_min, orcamento_max,
//   regioes_interesse (ARRAY), quartos, vagas, observacoes, score,
//   origem, utm_source, utm_medium, utm_campaign, tags (ARRAY),
//   metadata, ultima_interacao, assigned_to
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapeia o payload camelCase vindo do router para as colunas snake_case
 * da tabela `leads`.
 *
 * Prioridade de telefone: whatsapp ?? phone ?? telefone
 * O campo `telefone` é NOT NULL e UNIQUE no Supabase.
 */
export function mapLeadInputToDb(input: Record<string, any>) {
  const mapped: Record<string, any> = {};

  // ── Campos diretos ───────────────────────────────────────────────────────
  if (input.name     !== undefined) mapped.name     = input.name;
  if (input.email    !== undefined) mapped.email    = input.email;
  if (input.cpf      !== undefined) mapped.cpf      = input.cpf;
  if (input.score    !== undefined) mapped.score    = input.score;
  if (input.interesse!== undefined) mapped.interesse= input.interesse;
  if (input.origem   !== undefined) mapped.origem   = input.origem;

  // ── telefone: prioridade whatsapp → phone → telefone ────────────────────
  const telefone = input.whatsapp ?? input.phone ?? input.telefone;
  if (telefone !== undefined) {
    if (!telefone) {
      throw new Error("O campo telefone/whatsapp é obrigatório e não pode ser vazio.");
    }
    mapped.telefone = telefone;
  }

  // ── status: aceita tanto 'status' quanto 'stage' (legado) ───────────────
  if (input.status !== undefined) mapped.status = input.status;
  if (input.stage  !== undefined) mapped.status = input.stage; // stage → status

  // ── source → origem ──────────────────────────────────────────────────────
  if (input.source !== undefined) mapped.origem = input.source;

  // ── Orçamento: camelCase → snake_case, inteiro (Supabase usa integer) ────
  if (input.budgetMin !== undefined)
    mapped.orcamento_min = toIntOrNull(input.budgetMin);

  if (input.budgetMax !== undefined)
    mapped.orcamento_max = toIntOrNull(input.budgetMax);

  // ── Diretos snake_case ───────────────────────────────────────────────────
  if (input.orcamento_min !== undefined)
    mapped.orcamento_min = toIntOrNull(input.orcamento_min);

  if (input.orcamento_max !== undefined)
    mapped.orcamento_max = toIntOrNull(input.orcamento_max);

  // ── notes → observacoes ──────────────────────────────────────────────────
  if (input.notes      !== undefined) mapped.observacoes = input.notes;
  if (input.observacoes!== undefined) mapped.observacoes = input.observacoes;

  // ── Regiões de interesse ─────────────────────────────────────────────────
  if (input.preferredNeighborhoods !== undefined) {
    const val = input.preferredNeighborhoods;
    mapped.regioes_interesse = Array.isArray(val)
      ? val
      : typeof val === "string" && val.trim() !== ""
        ? val.split(",").map((s: string) => s.trim())
        : [];
  }
  if (input.regioes_interesse !== undefined)
    mapped.regioes_interesse = input.regioes_interesse;

  // ── Outros campos ────────────────────────────────────────────────────────
  if (input.quartos !== undefined) mapped.quartos = toIntOrNull(input.quartos);
  if (input.vagas   !== undefined) mapped.vagas   = toIntOrNull(input.vagas);

  if (input.tipo_imovel !== undefined) mapped.tipo_imovel = input.tipo_imovel;
  if (input.finalidade  !== undefined) mapped.finalidade  = input.finalidade;

  if (input.utm_source   !== undefined) mapped.utm_source   = input.utm_source;
  if (input.utm_medium   !== undefined) mapped.utm_medium   = input.utm_medium;
  if (input.utm_campaign !== undefined) mapped.utm_campaign = input.utm_campaign;

  if (input.tags     !== undefined) mapped.tags     = input.tags;
  if (input.metadata !== undefined) mapped.metadata = input.metadata;

  // ── assignedTo → assigned_to ─────────────────────────────────────────────
  if (input.assignedTo  !== undefined) mapped.assigned_to = input.assignedTo;
  if (input.assigned_to !== undefined) mapped.assigned_to = input.assigned_to;

  return mapped;
}
