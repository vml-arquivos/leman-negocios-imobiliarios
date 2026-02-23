#!/usr/bin/env tsx

/**
 * SCRIPT: scripts/db-check.ts
 *
 * Verifica conectividade com o Supabase externo via DATABASE_URL.
 * Executa:
 *   1. SELECT inet_server_addr(), inet_server_port()  → confirma IP/porta do servidor
 *   2. SELECT count(*) FROM properties                → prova de vida da tabela principal
 *
 * NÃO executa na VPS automaticamente — rode manualmente após o deploy:
 *   npx tsx scripts/db-check.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { properties, leads } from "../drizzle/schema";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

async function dbCheck() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   DB-CHECK — CONECTIVIDADE SUPABASE EXTERNO   ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(`${colors.red}✗ DATABASE_URL não definida nas variáveis de ambiente.${colors.reset}`);
    process.exit(1);
  }

  let client: postgres.Sql | null = null;

  try {
    // ── 1. Conectar ──────────────────────────────────────────────────────────
    console.log(`${colors.blue}[1/3]${colors.reset} Conectando ao banco de dados...`);
    client = postgres(databaseUrl, {
      max: 1,
      connect_timeout: 10,
      prepare: false,
    });
    const db = drizzle(client);
    console.log(`${colors.green}✓${colors.reset} Conexão estabelecida\n`);

    // ── 2. Verificar servidor (IP e porta) ───────────────────────────────────
    console.log(`${colors.blue}[2/3]${colors.reset} Verificando servidor remoto...`);
    const serverInfo = await db.execute(
      sql`SELECT inet_server_addr() AS addr, inet_server_port() AS port`
    );
    const row = serverInfo.rows?.[0] as any;
    console.log(`${colors.green}✓${colors.reset} Servidor: ${colors.yellow}${row?.addr ?? "N/A"}:${row?.port ?? "N/A"}${colors.reset}\n`);

    // ── 3. Contar registros nas tabelas principais ────────────────────────────
    console.log(`${colors.blue}[3/3]${colors.reset} Contando registros...`);

    const propCount = await db.execute(sql`SELECT count(*) AS total FROM properties`);
    const leadCount = await db.execute(sql`SELECT count(*) AS total FROM leads`);

    const totalProps = (propCount.rows?.[0] as any)?.total ?? 0;
    const totalLeads = (leadCount.rows?.[0] as any)?.total ?? 0;

    console.log(`${colors.green}✓${colors.reset} properties: ${colors.yellow}${totalProps}${colors.reset} registros`);
    console.log(`${colors.green}✓${colors.reset} leads:      ${colors.yellow}${totalLeads}${colors.reset} registros\n`);

    // ── Resultado ────────────────────────────────────────────────────────────
    console.log(`${colors.cyan}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║   ✅ SUPABASE EXTERNO OPERACIONAL             ║${colors.reset}`);
    console.log(`${colors.cyan}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}╔═══════════════════════════════════════════════╗${colors.reset}`);
    console.error(`${colors.red}║   ✗ FALHA NA CONECTIVIDADE                    ║${colors.reset}`);
    console.error(`${colors.red}╚═══════════════════════════════════════════════╝${colors.reset}\n`);
    console.error(`${colors.red}Erro:${colors.reset}`, error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log(`${colors.blue}ℹ${colors.reset} Conexão encerrada.\n`);
    }
  }
}

dbCheck();
