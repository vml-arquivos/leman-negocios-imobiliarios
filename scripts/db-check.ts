#!/usr/bin/env tsx

/**
 * SMOKE TEST - Prova de Vida do Banco de Dados
 * 
 * Este script verifica se o banco está operacional:
 * 1. Conecta no banco via Drizzle
 * 2. Insere um Lead de teste
 * 3. Lê o Lead recém-criado
 * 4. Exibe confirmação no console
 * 5. Deleta o Lead (limpeza)
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Cores para terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

async function smokeTest() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   SMOKE TEST - BANCO DE DADOS LEMAN       ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  let client: postgres.Sql | null = null;
  let testLeadId: number | null = null;

  try {
    // 1. CONECTAR NO BANCO
    console.log(`${colors.blue}[1/5]${colors.reset} Conectando ao banco de dados...`);
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL não definida nas variáveis de ambiente");
    }

    client = postgres(databaseUrl, {
      max: 1,
      connect_timeout: 10,
    });

    const db = drizzle(client);
    console.log(`${colors.green}✓${colors.reset} Conexão estabelecida com sucesso\n`);

    // 2. INSERIR LEAD DE TESTE
    console.log(`${colors.blue}[2/5]${colors.reset} Inserindo Lead de teste...`);
    
    const testLead = {
      name: "Teste DB",
      email: "teste@db.com",
      phone: "(61) 99999-0000",
      whatsapp: "(61) 99999-0000",
      source: "site" as const,
      stage: "novo" as const,
      clientType: "comprador" as const,
      qualification: "nao_qualificado" as const,
      notes: "Lead criado automaticamente pelo smoke test",
    };

    const [insertedLead] = await db.insert(leads).values(testLead).returning();
    
    if (!insertedLead) {
      throw new Error("Falha ao inserir Lead de teste");
    }

    testLeadId = insertedLead.id;
    console.log(`${colors.green}✓${colors.reset} Lead inserido com sucesso`);
    console.log(`  ${colors.yellow}→${colors.reset} ID: ${testLeadId}`);
    console.log(`  ${colors.yellow}→${colors.reset} Nome: ${insertedLead.name}`);
    console.log(`  ${colors.yellow}→${colors.reset} Email: ${insertedLead.email}\n`);

    // 3. LER O LEAD RECÉM-CRIADO
    console.log(`${colors.blue}[3/5]${colors.reset} Lendo Lead do banco...`);
    
    const [readLead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, testLeadId))
      .limit(1);

    if (!readLead) {
      throw new Error("Lead não encontrado após inserção");
    }

    console.log(`${colors.green}✓${colors.reset} Lead lido com sucesso`);
    console.log(`  ${colors.yellow}→${colors.reset} ID: ${readLead.id}`);
    console.log(`  ${colors.yellow}→${colors.reset} Nome: ${readLead.name}`);
    console.log(`  ${colors.yellow}→${colors.reset} Email: ${readLead.email}`);
    console.log(`  ${colors.yellow}→${colors.reset} Criado em: ${readLead.createdAt}\n`);

    // 4. EXIBIR CONFIRMAÇÃO
    console.log(`${colors.green}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✅ BANCO OPERACIONAL: ID [${testLeadId}] CRIADO  ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════╝${colors.reset}\n`);

    // 5. DELETAR O LEAD (LIMPEZA)
    console.log(`${colors.blue}[4/5]${colors.reset} Limpando dados de teste...`);
    
    await db.delete(leads).where(eq(leads.id, testLeadId));
    
    console.log(`${colors.green}✓${colors.reset} Lead de teste deletado com sucesso\n`);

    // VERIFICAR SE FOI DELETADO
    console.log(`${colors.blue}[5/5]${colors.reset} Verificando limpeza...`);
    
    const [deletedLead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, testLeadId))
      .limit(1);

    if (deletedLead) {
      throw new Error("Lead ainda existe após deleção");
    }

    console.log(`${colors.green}✓${colors.reset} Limpeza confirmada - Lead removido do banco\n`);

    // RESULTADO FINAL
    console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║          SMOKE TEST CONCLUÍDO              ║${colors.reset}`);
    console.log(`${colors.cyan}║                                            ║${colors.reset}`);
    console.log(`${colors.cyan}║  Status: ${colors.green}✅ APROVADO${colors.cyan}                      ║${colors.reset}`);
    console.log(`${colors.cyan}║  Banco: ${colors.green}OPERACIONAL${colors.cyan}                      ║${colors.reset}`);
    console.log(`${colors.cyan}║  CRUD: ${colors.green}CREATE ✓ READ ✓ DELETE ✓${colors.cyan}         ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}╔════════════════════════════════════════════╗${colors.reset}`);
    console.error(`${colors.red}║           SMOKE TEST FALHOU                ║${colors.reset}`);
    console.error(`${colors.red}╚════════════════════════════════════════════╝${colors.reset}\n`);
    console.error(`${colors.red}✗ Erro:${colors.reset}`, error);
    
    // Tentar limpar se o Lead foi criado
    if (testLeadId && client) {
      try {
        const db = drizzle(client);
        await db.delete(leads).where(eq(leads.id, testLeadId));
        console.log(`\n${colors.yellow}⚠ Lead de teste foi removido durante cleanup${colors.reset}`);
      } catch (cleanupError) {
        console.error(`${colors.red}✗ Falha no cleanup:${colors.reset}`, cleanupError);
      }
    }
    
    process.exit(1);
  } finally {
    // Fechar conexão
    if (client) {
      await client.end();
      console.log(`${colors.blue}ℹ${colors.reset} Conexão com banco encerrada\n`);
    }
  }
}

// Executar smoke test
smokeTest();
