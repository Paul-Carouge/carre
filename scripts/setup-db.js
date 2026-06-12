// Setup script for Carré forum — executes the SQL schema against Supabase
// Usage: SUPABASE_DB_URL="postgresql://..." node scripts/setup-db.js
//
// Get your DATABASE_URL from Supabase Dashboard → Settings → Database → Connection string
// OR use the Session pooler: postgresql://postgres.zxnfagxjilltrecojdco:[YOUR-DB-PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL provided.');
  console.error('Set SUPABASE_DB_URL or DATABASE_URL environment variable.');
  console.error('');
  console.error('Get your connection string from:');
  console.error('  Supabase Dashboard → Settings → Database → Connection string');
  console.error('');
  console.error('Or copy-paste schema.sql into the SQL Editor at:');
  console.error('  https://supabase.com/dashboard/project/zxnfagxjilltrecojdco/sql/new');
  process.exit(1);
}

async function main() {
  console.log('🔧 Carré — Database Setup\n');
  const masked = DATABASE_URL.replace(/\/\/.*@/, '//***:***@');
  console.log(`Connecting: ${masked.substring(0, 80)}...`);

  const pool = new Pool({ connectionString: DATABASE_URL, connectionTimeoutMillis: 10000 });
  
  try {
    const test = await pool.query('SELECT 1 as ok');
    console.log('  ✅ Connected!\n');
  } catch (err) {
    console.error(`  ❌ Connection failed: ${err.message}`);
    await pool.end().catch(() => {});
    process.exit(1);
  }

  console.log('📄 Executing schema.sql...');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

  try {
    await pool.query(sql);
    console.log('✅ Schema created successfully!');
    console.log('   - profiles, categories, topics, posts, likes tables');
    console.log('   - RLS policies configured');
    console.log('   - 6 default categories seeded');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
