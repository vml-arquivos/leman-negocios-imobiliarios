#!/usr/bin/env node
/**
 * Script de Teste de Login
 * Testa conexão com banco e autenticação
 */

const postgres = require('postgres');
const bcrypt = require('bcryptjs');

// Configuração da conexão (usando parâmetros separados)
const sql = postgres({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.mzirdgwsqsovvulqlktw',
  password: 'Leman@2026imob',
  ssl: 'require'
});

async function testLogin() {
  try {
    console.log('🔍 TESTE 1: Verificando conexão com banco...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    console.log('✅ Tabela users existe:', tables.length > 0);
    
    console.log('\n🔍 TESTE 2: Buscando usuário admin@admin.com...');
    const users = await sql`
      SELECT id, email, name, role, password, created_at 
      FROM users 
      WHERE email = 'admin@admin.com'
    `;
    
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado!');
      await sql.end();
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   Role:', user.role);
    console.log('   Senha hash:', user.password ? user.password.substring(0, 20) + '...' : 'NULL');
    
    console.log('\n🔍 TESTE 3: Verificando senha...');
    const testPassword = 'admin123';
    
    if (!user.password) {
      console.log('❌ Usuário não tem senha configurada!');
      await sql.end();
      process.exit(1);
    }
    
    const passwordMatch = await bcrypt.compare(testPassword, user.password);
    console.log('   Senha testada:', testPassword);
    console.log('   Match:', passwordMatch ? '✅ CORRETO' : '❌ INCORRETO');
    
    if (!passwordMatch) {
      console.log('\n⚠️  A senha no banco NÃO corresponde a "admin123"');
      console.log('   Vou criar um novo hash para você:');
      const newHash = await bcrypt.hash('admin123', 10);
      console.log('   Novo hash:', newHash);
      console.log('\n   Execute no Supabase SQL Editor:');
      console.log(`   UPDATE users SET password = '${newHash}' WHERE email = 'admin@admin.com';`);
    } else {
      console.log('\n✅ TUDO CERTO! Login deve funcionar.');
    }
    
    await sql.end();
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testLogin();
