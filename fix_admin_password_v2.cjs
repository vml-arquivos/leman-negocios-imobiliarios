const postgres = require('postgres');
const bcrypt = require('bcryptjs');

const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('🔍 Verificando situação atual...\n');
    
    // 1. Buscar hash atual
    const currentUser = await sql`
      SELECT id, email, password FROM users WHERE email = 'admin@admin.com'
    `;
    
    if (currentUser.length === 0) {
      console.log('❌ Usuário admin@admin.com não encontrado!');
      await sql.end();
      process.exit(1);
    }
    
    const hashAtual = currentUser[0].password;
    console.log('✅ Hash atual:', hashAtual.substring(0, 40) + '...');
    
    // 2. Gerar novo hash com bcryptjs
    console.log('\n🔧 Gerando novo hash com bcryptjs...');
    const novoHash = await bcrypt.hash('admin123', 10);
    console.log('✅ Novo hash:', novoHash.substring(0, 40) + '...');
    
    // 3. Testar se o novo hash funciona
    console.log('\n🧪 Testando novo hash...');
    const testeMatch = await bcrypt.compare('admin123', novoHash);
    if (!testeMatch) {
      console.log('❌ ERRO: Novo hash não passou no teste!');
      await sql.end();
      process.exit(1);
    }
    console.log('✅ Teste OK: Hash validado com sucesso');
    
    // 4. Atualizar senha no banco
    await sql`
      UPDATE users SET password = ${novoHash} WHERE email = 'admin@admin.com'
    `;
    
    console.log('\n✅ SENHA ATUALIZADA COM SUCESSO!\n');
    console.log('📝 Credenciais de acesso:');
    console.log('   Email: admin@admin.com');
    console.log('   Senha: admin123');
    console.log('\n⚠️  Hash anterior (backup):', hashAtual);
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await sql.end();
    process.exit(1);
  }
})();
