import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('[DATABASE ERROR] DATABASE_URL environment variable is missing.');
  process.exit(1);
}

// Remove sslmode query param so pg respects explicit ssl configuration
const cleanConnectionString = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]+/, '');

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR] Unexpected error on idle client:', err.message);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('[DATABASE QUERY ERROR]', {
      query: text,
      error: err.message,
      duration: `${Date.now() - start}ms`
    });
    throw err;
  }
};

export default pool;
