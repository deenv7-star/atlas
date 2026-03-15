import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { pool } from '../db.js';
import { logger } from '../utils/logger.js';
import { up as upRateLimits } from '../migrations/api-rate-limits.js';

let initialized = false;

async function ensureTable() {
  if (initialized) return;

  await upRateLimits(pool);

  initialized = true;
}

function buildKey(req) {
  const ip = req.ip || 'unknown';
  const route = req.baseUrl + req.path;
  return createHash('sha256').update(`${ip}:${route}`).digest('hex');
}

export async function apiRateLimit(req, res, next) {
  try {
    await ensureTable();

    const keyHash = buildKey(req);
    const windowStart = new Date(Math.floor(Date.now() / env.RATE_LIMIT_WINDOW_MS) * env.RATE_LIMIT_WINDOW_MS);

    const { rows } = await pool.query(
      `INSERT INTO public.api_rate_limits (key_hash, window_start, count, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (key_hash)
       DO UPDATE SET
         count = CASE
           WHEN public.api_rate_limits.window_start = EXCLUDED.window_start THEN public.api_rate_limits.count + 1
           ELSE 1
         END,
         window_start = EXCLUDED.window_start,
         updated_at = NOW()
       RETURNING count, window_start`,
      [keyHash, windowStart]
    );

    const currentCount = rows[0]?.count || 0;
    if (currentCount > env.RATE_LIMIT_MAX) {
      const elapsed = Date.now() - new Date(rows[0].window_start).getTime();
      const retryAfter = Math.max(1, Math.ceil((env.RATE_LIMIT_WINDOW_MS - elapsed) / 1000));
      res.setHeader('retry-after', retryAfter);
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    return next();
  } catch (error) {
    logger.error('rate_limit.failed_open', { error, requestId: req.requestId });
    return next();
  }
}
