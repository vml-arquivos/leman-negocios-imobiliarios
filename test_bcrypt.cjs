const bcrypt = require('bcryptjs');

const hash = '$2b$10$CwTycUXWue0Thq9StjUM0uJ4/F9Aq3ooRrpmT.fUGHZGqXb0vYIw2';
const password = 'admin123';

(async () => {
  try {
    console.log('🔍 Testando bcrypt.compare...');
    console.log('   Senha:', password);
    console.log('   Hash:', hash);
    
    const match = await bcrypt.compare(password, hash);
    
    console.log('   Resultado:', match ? '✅ MATCH!' : '❌ NÃO MATCH');
    
    if (!match) {
      console.log('\n⚠️  Gerando novo hash para admin123...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('   Novo hash:', newHash);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
})();
