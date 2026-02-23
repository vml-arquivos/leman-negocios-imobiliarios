#!/usr/bin/env tsx

/**
 * SCRIPT: scripts/smoke-crud.ts
 *
 * Smoke test de CRUD completo contra o Supabase externo.
 *
 * Fluxo:
 *   1. Criar lead com telefone real
 *   2. Criar property com enums canônicos (casa, venda, disponivel)
 *   3. Atualizar property
 *   4. Listar properties
 *   5. Cleanup (deletar lead e property criados)
 *
 * NÃO executa na VPS automaticamente — rode manualmente após o deploy:
 *   npx tsx scripts/smoke-crud.ts
 *
 * ATENÇÃO: Este script cria e deleta registros reais no banco.
 * Use apenas em ambiente de homologação ou com DATABASE_URL de staging.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc } from "drizzle-orm";
import { properties, leads } from "../drizzle/schema";
import { mapPropertyInputToDb, mapLeadInputToDb } from "../server/_core/mappers";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(step: string, msg: string) {
  console.log(`${colors.blue}[${step}]${colors.reset} ${msg}`);
}
function ok(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}
function fail(msg: string) {
  console.error(`${colors.red}✗${colors.reset} ${msg}`);
}

async function smokeCrud() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   SMOKE-CRUD — TESTE COMPLETO DE CRUD         ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail("DATABASE_URL não definida nas variáveis de ambiente.");
    process.exit(1);
  }

  let client: postgres.Sql | null = null;
  let createdLeadId: number | null = null;
  let createdPropertyId: number | null = null;

  try {
    // ── Conectar ─────────────────────────────────────────────────────────────
    log("0/5", "Conectando ao banco de dados...");
    client = postgres(databaseUrl, { max: 1, connect_timeout: 10, prepare: false });
    const db = drizzle(client);
    ok("Conexão estabelecida\n");

    // ── 1. Criar Lead ─────────────────────────────────────────────────────────
    log("1/5", "Criando lead de teste...");
    const leadPayload = mapLeadInputToDb({
      name: "Smoke Test Lead",
      email: "smoketest@leman.com.br",
      whatsapp: "(61) 98888-0001",
      source: "site",
      stage: "novo",
      budgetMin: 300000,
      budgetMax: 800000,
      preferredNeighborhoods: "Asa Norte, Lago Sul",
      notes: "Lead criado pelo smoke-crud.ts — remover após teste",
    });

    const [lead] = await db.insert(leads).values(leadPayload).returning();
    if (!lead) throw new Error("Falha ao criar lead");
    createdLeadId = lead.id;
    ok(`Lead criado — ID: ${colors.yellow}${createdLeadId}${colors.reset}, telefone: ${lead.telefone}\n`);

    // ── 2. Criar Property ─────────────────────────────────────────────────────
    log("2/5", "Criando imóvel de teste...");
    const propertyPayload = mapPropertyInputToDb({
      title: "Smoke Test — Casa Residencial",
      description: "Imóvel criado pelo smoke-crud.ts para validação de CRUD.",
      propertyType: "casa",
      transactionType: "venda",
      status: "disponivel",
      address: "SQN 210 Bloco A",
      neighborhood: "Asa Norte",
      city: "Brasília",
      state: "DF",
      zipCode: "70862-010",
      sale_price: 750000,
      bedrooms: 3,
      bathrooms: 2,
      suites: 1,
      parkingSpaces: 2,
      totalArea: 180,
      builtArea: 150,
      featured: false,
      published: false,
    }, 1 /* created_by: admin */);

    const [property] = await db.insert(properties).values(propertyPayload).returning();
    if (!property) throw new Error("Falha ao criar property");
    createdPropertyId = property.id;
    ok(`Imóvel criado — ID: ${colors.yellow}${createdPropertyId}${colors.reset}, tipo: ${property.property_type}, transação: ${property.transaction_type}\n`);

    // ── 3. Atualizar Property ─────────────────────────────────────────────────
    log("3/5", "Atualizando imóvel de teste...");
    const updatePayload = mapPropertyInputToDb({
      description: "Descrição atualizada pelo smoke-crud.ts",
      sale_price: 780000,
    });
    updatePayload.updated_at = new Date();

    const [updated] = await db
      .update(properties)
      .set(updatePayload)
      .where(eq(properties.id, createdPropertyId))
      .returning();

    if (!updated) throw new Error("Falha ao atualizar property");
    ok(`Imóvel atualizado — sale_price: ${colors.yellow}${updated.sale_price}${colors.reset}\n`);

    // ── 4. Listar Properties ──────────────────────────────────────────────────
    log("4/5", "Listando imóveis (limit 5)...");
    const list = await db
      .select()
      .from(properties)
      .orderBy(desc(properties.created_at))
      .limit(5);

    ok(`Listagem retornou ${colors.yellow}${list.length}${colors.reset} imóvel(is)\n`);
    list.forEach((p, i) => {
      console.log(
        `  ${colors.magenta}#${i + 1}${colors.reset} ID:${p.id} | ${p.title} | ${p.property_type} | ${p.transaction_type} | ${p.status}`
      );
    });
    console.log();

    // ── 5. Cleanup ────────────────────────────────────────────────────────────
    log("5/5", "Removendo dados de teste (cleanup)...");

    await db.delete(properties).where(eq(properties.id, createdPropertyId));
    ok(`Imóvel ID ${createdPropertyId} removido`);

    await db.delete(leads).where(eq(leads.id, createdLeadId));
    ok(`Lead ID ${createdLeadId} removido\n`);

    // ── Resultado ─────────────────────────────────────────────────────────────
    console.log(`${colors.cyan}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║   ✅ SMOKE-CRUD APROVADO                      ║${colors.reset}`);
    console.log(`${colors.cyan}║   CREATE ✓  UPDATE ✓  LIST ✓  DELETE ✓       ║${colors.reset}`);
    console.log(`${colors.cyan}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.error(`${colors.red}║   ✗ SMOKE-CRUD FALHOU                         ║${colors.reset}`);
    console.error(`${colors.red}╚═══════════════════════════════════════════════╝${colors.reset}\n`);
    console.error(`${colors.red}Erro:${colors.reset}`, error);

    // Tentar cleanup mesmo em caso de erro
    if (client) {
      const db = drizzle(client);
      try {
        if (createdPropertyId) {
          await db.delete(properties).where(eq(properties.id, createdPropertyId));
          console.log(`${colors.yellow}⚠ Imóvel ID ${createdPropertyId} removido no cleanup de erro${colors.reset}`);
        }
        if (createdLeadId) {
          await db.delete(leads).where(eq(leads.id, createdLeadId));
          console.log(`${colors.yellow}⚠ Lead ID ${createdLeadId} removido no cleanup de erro${colors.reset}`);
        }
      } catch (cleanupErr) {
        fail(`Falha no cleanup: ${cleanupErr}`);
      }
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log(`${colors.blue}ℹ${colors.reset} Conexão encerrada.\n`);
    }
  }
}

smokeCrud();
