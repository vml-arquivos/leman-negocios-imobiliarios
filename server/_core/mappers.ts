/**
 * ARQUIVO: server/_core/mappers.ts
 *
 * Mapeamentos explícitos de payload camelCase (router/front) para
 * colunas snake_case do banco de dados (Drizzle/Supabase).
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

// ─────────────────────────────────────────────────────────────────────────────
// Property Mapper
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

  // Campos de texto diretos (mesmos nomes)
  if (input.title !== undefined)       mapped.title = input.title;
  if (input.description !== undefined) mapped.description = input.description;
  if (input.address !== undefined)     mapped.address = input.address;
  if (input.neighborhood !== undefined) mapped.neighborhood = input.neighborhood;
  if (input.city !== undefined)        mapped.city = input.city;
  if (input.state !== undefined)       mapped.state = input.state;
  if (input.status !== undefined)      mapped.status = input.status;
  if (input.featured !== undefined)    mapped.featured = input.featured;
  if (input.published !== undefined)   mapped.published = input.published;
  if (input.video_url !== undefined)   mapped.video_url = input.video_url;
  if (input.features !== undefined)    mapped.features = input.features;
  if (input.images !== undefined)      mapped.images = input.images;

  // Campos numéricos diretos (já snake_case no router)
  if (input.bedrooms !== undefined)    mapped.bedrooms = toNumericOrNull(input.bedrooms);
  if (input.bathrooms !== undefined)   mapped.bathrooms = toNumericOrNull(input.bathrooms);
  if (input.suites !== undefined)      mapped.suites = toNumericOrNull(input.suites);
  if (input.iptu !== undefined)        mapped.iptu = toNumericOrNull(input.iptu);

  // Preços (podem vir como sale_price / rent_price direto do router)
  if (input.sale_price !== undefined)  mapped.sale_price = toNumericOrNull(input.sale_price);
  if (input.rent_price !== undefined)  mapped.rent_price = toNumericOrNull(input.rent_price);

  // camelCase → snake_case
  if (input.referenceCode !== undefined)
    mapped.reference_code = emptyToNull(input.referenceCode);

  if (input.propertyType !== undefined)
    mapped.property_type = input.propertyType;

  if (input.transactionType !== undefined)
    mapped.transaction_type = input.transactionType;

  if (input.zipCode !== undefined)
    mapped.zip_code = emptyToNull(input.zipCode);

  if (input.latitude !== undefined)
    mapped.latitude = emptyToNull(input.latitude);

  if (input.longitude !== undefined)
    mapped.longitude = emptyToNull(input.longitude);

  if (input.condoFee !== undefined)
    mapped.condo_fee = toNumericOrNull(input.condoFee);

  if (input.parkingSpaces !== undefined)
    mapped.parking_spaces = toNumericOrNull(input.parkingSpaces);

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

  // created_by: usar userId passado explicitamente ou input.createdBy
  if (userId !== undefined) {
    mapped.created_by = userId;
  } else if (input.createdBy !== undefined) {
    mapped.created_by = input.createdBy;
  }

  return mapped;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead Mapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapeia o payload camelCase vindo do router para as colunas snake_case
 * da tabela `leads`.
 *
 * Prioridade de telefone: whatsapp ?? phone
 * O campo `telefone` é NOT NULL e UNIQUE no Supabase.
 */
export function mapLeadInputToDb(input: Record<string, any>) {
  const mapped: Record<string, any> = {};

  // Campos diretos
  if (input.name !== undefined)  mapped.name = input.name;
  if (input.email !== undefined) mapped.email = input.email;
  if (input.score !== undefined) mapped.score = input.score;

  // telefone: prioridade whatsapp → phone
  const telefone = input.whatsapp ?? input.phone ?? input.telefone;
  if (telefone !== undefined) {
    if (!telefone) {
      throw new Error("O campo telefone/whatsapp é obrigatório e não pode ser vazio.");
    }
    mapped.telefone = telefone;
  }

  // camelCase → snake_case
  if (input.budgetMin !== undefined)
    mapped.orcamento_min = toNumericOrNull(input.budgetMin);

  if (input.budgetMax !== undefined)
    mapped.orcamento_max = toNumericOrNull(input.budgetMax);

  if (input.notes !== undefined)
    mapped.observacoes = input.notes;

  if (input.preferredNeighborhoods !== undefined) {
    // Pode vir como string CSV ou já como array
    const val = input.preferredNeighborhoods;
    mapped.regioes_interesse = Array.isArray(val)
      ? val
      : typeof val === "string" && val.trim() !== ""
        ? val.split(",").map((s: string) => s.trim())
        : [];
  }

  // stage (router) → status (DB)
  if (input.stage !== undefined)
    mapped.status = input.stage;

  // source (router) → origem (DB)
  if (input.source !== undefined)
    mapped.origem = input.source;

  // Campos de interesse
  if (input.interesse !== undefined)
    mapped.interesse = input.interesse;

  // assignedTo → assigned_to
  if (input.assignedTo !== undefined)
    mapped.assigned_to = input.assignedTo;

  return mapped;
}
