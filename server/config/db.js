import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
  } else {
    console.log('✓ Connected to PostgreSQL database');
  }
});

pool.on('connect', () => {
  console.log('✓ PostgreSQL client connected');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err.message);
  // Don't exit - let the app continue and retry connections
});

export default pool;
