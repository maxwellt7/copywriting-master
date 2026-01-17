import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Copywriting Master...\n');

// Run migrations first
console.log('📊 Running database migrations...');
const migrate = spawn('node', [join(__dirname, 'migrations', 'migrate.js')], {
  stdio: 'inherit'
});

migrate.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Migration failed with code ${code}`);
    process.exit(code);
  }

  console.log('✅ Migrations complete\n');
  console.log('🌐 Starting API server...');

  // Start the main server
  const server = spawn('node', [join(__dirname, 'index.js')], {
    stdio: 'inherit'
  });

  server.on('close', (code) => {
    process.exit(code);
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
});

migrate.on('error', (err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
