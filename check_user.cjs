const postgres = require('postgres');

const sql = postgres({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.mzirdgwsqsovvulqlktw',
  password: 'imobiliaria2026',
  ssl: 'require'
});

(async () => {
  try {
    console.log('🔍 Verificando usuário no banco REAL...');
    
    const users = await sql`
      SELECT id, email, name, role, password, created_at 
      FROM users 
      WHERE email = 'admin@admin.com'
    `;
    
    if (users.length === 0) {
      console.log('❌ USUÁRIO NÃO EXISTE NO BANCO!');
      await sql.end();
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   Role:', user.role);
    console.log('   Senha (hash):', user.password ? user.password.substring(0, 40) + '...' : 'NULL');
    console.log('   Created:', user.created_at);
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
})();
