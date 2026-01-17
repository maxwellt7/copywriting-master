import pkg from 'pg';
const { Pool } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Copywriting Master...\n');

// Run migrations first
async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('📊 Running database migrations...');

    const sql = readFileSync(join(__dirname, 'migrations', 'init.sql'), 'utf8');
    await pool.query(sql);

    console.log('✅ Migrations complete\n');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run migrations then start server
runMigrations().then(async () => {
  console.log('🌐 Starting API server...\n');

  // Import and start the Express app
  const { default: app } = await import('./index.js');

  console.log('✅ Server initialization complete');
}).catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});
