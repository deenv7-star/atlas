import 'dotenv/config';
import { z } from 'zod';

// Local development only: match docker-compose.yml postgres service if .env is missing.
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://atlas:atlas@127.0.0.1:5432/atlas';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev_jwt_secret_minimum_32_chars_long!!';
  }
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(180).default(30),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  DATA_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  PLATFORM_ADMIN_EMAILS: z.string().optional(),
  /** Absolute path to Vite `dist/` — when set, Express serves the SPA and falls back to index.html (fixes direct loads of /changelog, /contact, etc.). */
  STATIC_DIST_PATH: z.string().optional()
});

export const env = schema.parse(process.env);
