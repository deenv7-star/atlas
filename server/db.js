/**
 * PostgreSQL connection pool
 */
import pg from 'pg';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

pool.on('error', (error) => {
  logger.error('db.pool.error', { error });
});
