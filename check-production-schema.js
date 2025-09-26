// Check production database schema
const { Client } = require('pg');

async function checkSchema() {
  const connectionString = "postgresql://postgres.nbrnulspgunxsrjcccnl:B8hJZnfA7sR%26tn%2F@aws-1-ca-central-1.pooler.supabase.com:5432/postgres";
  
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('Checking production database schema...');
    await client.connect();
    
    // Check Users table schema
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });
    
    // Check if password field exists
    const hasPassword = result.rows.some(row => row.column_name === 'password');
    console.log(`\n${hasPassword ? '✅' : '❌'} Password field ${hasPassword ? 'exists' : 'missing'}`);
    
    if (!hasPassword) {
      console.log('⚠️  Production database is missing the password field!');
      console.log('This will cause booking and authentication issues.');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();