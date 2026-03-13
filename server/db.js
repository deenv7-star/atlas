/**
 * PostgreSQL connection pool
 */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://atlas_user:atlas_local_pw_2024@127.0.0.1:5432/atlas_db',
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});
