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
  const route = req.baseUrl + req.path;
  // H3: per-user when the request is already authenticated (requireAuth ran
  // before this middleware and set req.userId), so one abusive account cannot
  // hide behind a shared IP — and one IP cannot burn another user's budget.
  // Otherwise fall back to IP + route. NOTE: apiRateLimit is mounted globally
  // in app.js before the routers, so on most routes req.userId is not set yet
  // and the IP key applies; the per-user key takes effect wherever this
  // middleware runs after requireAuth.
  const userId = req.userId || req.authUser?.id;
  const who = userId ? `user:${userId}` : `ip:${req.ip || 'unknown'}`;
  return createHash('sha256').update(`${who}:${route}`).digest('hex');
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
    // H3: fail CLOSED. The old code logged and called next(), so if the
    // api_rate_limits table (or the DB) went down, there was no rate limit
    // at all. A 503 keeps the API safe while the limiter is unavailable.
    logger.error('rate_limit.failed_closed', { error, requestId: req.requestId });
    return res.status(503).json({ error: 'Rate limiter unavailable. Try again shortly.' });
  }
}
