/**
 * SEED V3 — compatível com Supabase Enterprise Schema (sale_price, rent_price, featured)
 *
 * Uso:
 *   npm run db:seed:prod
 *   npm run db:seed:prod -- --clean
 *
 * Requisitos:
 * - DATABASE_URL definida no ambiente (preferencialmente pooler 6543)
 * - server/db.ts já usa postgres(..., { prepare:false }) para Supabase Transaction Mode
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

import { users, properties } from "../drizzle/schema";

const args = process.argv.slice(2);
const CLEAN = args.includes("--clean");

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Hash de senha:
 * - Tenta bcryptjs se existir no projeto (comum em auth)
 * - Se não existir, cai em sha256 (fallback). IMPORTANTE: alinhar com o auth real depois.
 */
async function hashPassword(pw: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(pw, salt);
  } catch {
    return crypto.createHash("sha256").update(pw).digest("hex");
  }
}

async function main() {
  const databaseUrl = mustEnv("DATABASE_URL");

  // Supabase pooler: prepare:false evita erro em Transaction Mode (6543)
  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  console.log(`[seed-v3] start. clean=${CLEAN}`);

  if (CLEAN) {
    console.log("[seed-v3] cleaning tables (properties -> users-safe)");
    // Ordem segura: apagar properties antes (depende de owner_id).
    // Se houver FKs adicionais no banco, ajustar ordem aqui.
    await db.delete(properties);
    // NÃO apagamos users em produção por padrão; apenas garantimos o admin.
    console.log("[seed-v3] clean done.");
  }

  // 1) Admin user (upsert por email)
  const adminEmail = "admin@leman.com.br";
  const adminPasswordPlain = "senha123";
  const adminPasswordHashed = await hashPassword(adminPasswordPlain);

  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  let adminId: number;
  if (existing.length > 0) {
    adminId = existing[0].id as number;
    console.log(`[seed-v3] admin exists id=${adminId}, updating role/password if needed`);
    await db
      .update(users)
      .set({
        name: "Admin Leman",
        role: "admin",
        password: adminPasswordHashed,
        active: true,
        updated_at: new Date(),
      })
      .where(eq(users.id, adminId));
  } else {
    console.log("[seed-v3] creating admin user");
    const inserted = await db
      .insert(users)
      .values({
        name: "Admin Leman",
        email: adminEmail,
        password: adminPasswordHashed,
        role: "admin",
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_signed_in: new Date(),
      })
      .returning({ id: users.id });
    adminId = inserted[0].id as number;
  }

  // 2) Propriedades de teste
  // Importante: schema enterprise usa:
  // - sale_price (integer) -> centavos
  // - rent_price (integer) -> centavos
  // - featured (boolean)
  // - area mapeia coluna total_area (no schema.ts enterprise, area: integer("total_area"))
  console.log("[seed-v3] inserting test properties");

  const now = new Date();

  const baseImages = [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
  ];

  // Imóvel Venda
  await db.insert(properties).values({
    title: "Apartamento 3Q — Asa Norte (Teste)",
    description: "Imóvel de teste para validação do Supabase Sync V3. Venda.",
    property_type: "apartamento",
    transaction_type: "venda",

    sale_price: 85000000, // R$ 850.000,00 em centavos
    rent_price: null,
    condo_fee: 65000, // R$ 650,00
    iptu: 18000, // R$ 180,00

    address: "SQN 000 Bloco A",
    neighborhood: "Asa Norte",
    city: "Brasília",
    state: "DF",

    bedrooms: 3,
    bathrooms: 2,
    suites: 1,
    parking_spaces: 1,

    area: 92, // mapeia total_area
    features: ["nascente", "varanda", "armários"].map((x) => x),
    images: baseImages,
    video_url: null,

    status: "disponivel",
    featured: true,
    owner_id: adminId,

    created_at: now,
    updated_at: now,
  });

  // Imóvel Aluguel
  await db.insert(properties).values({
    title: "Studio Mobiliado — Águas Claras (Teste)",
    description: "Imóvel de teste para validação do Supabase Sync V3. Aluguel.",
    property_type: "studio",
    transaction_type: "aluguel",

    sale_price: null,
    rent_price: 320000, // R$ 3.200,00 em centavos
    condo_fee: 42000, // R$ 420,00
    iptu: 9000, // R$ 90,00

    address: "Rua 00, Lote 00",
    neighborhood: "Águas Claras",
    city: "Brasília",
    state: "DF",

    bedrooms: 1,
    bathrooms: 1,
    suites: 0,
    parking_spaces: 1,

    area: 34,
    features: ["mobiliado", "lazer completo"].map((x) => x),
    images: baseImages.slice().reverse(),
    video_url: null,

    status: "disponivel",
    featured: false,
    owner_id: adminId,

    created_at: now,
    updated_at: now,
  });

  console.log("[seed-v3] done ✅");
  console.log(`[seed-v3] admin: ${adminEmail} / ${adminPasswordPlain}`);
  await client.end();
}

main().catch((e) => {
  console.error("[seed-v3] failed ❌", e);
  process.exit(1);
});
