import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import authRouter from './routes/auth.js';
import entitiesRouter from './routes/entities.js';
import domainRouter from './routes/domain.js';
import billingRouter from './routes/billing.js';
import aiRouter from './routes/ai.js';
import emailRouter from './routes/email.js';
import publicApiRouter from './routes/public.js';
import platformRouter from './routes/platform.js';
import { handleStripeWebhook } from './routes/stripe-webhook.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { requestContext } from './middleware/request-context.js';
import { apiRateLimit } from './middleware/rate-limit.js';
import { securityHeaders } from './middleware/security-headers.js';
import { collectMetrics, renderPrometheusMetrics } from './middleware/metrics.js';
import { pool } from './db.js';
import { checkTcp } from './utils/health.js';
import { captureException } from './utils/error-monitoring.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(collectMetrics);
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  app.use(apiRateLimit);
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth', authRouter);
  app.use('/api/entities', entitiesRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/email', emailRouter);
  app.use('/api/public', publicApiRouter);
  app.use('/api/platform', platformRouter);
  app.use('/api', domainRouter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.get('/health/db', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      return res.json({ status: 'ok' });
    } catch {
      return res.status(503).json({ status: 'down' });
    }
  });

  app.get('/health/redis', async (_req, res) => {
    if (!env.REDIS_URL) return res.status(503).json({ status: 'not_configured' });
    const ok = await checkTcp(env.REDIS_URL);
    return res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'down' });
  });

  app.get('/live', (_req, res) => res.json({ status: 'alive' }));

  app.get('/ready', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      return res.json({ status: 'ready' });
    } catch {
      return res.status(503).json({ status: 'not_ready' });
    }
  });

  app.get('/api/ready', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      return res.json({ status: 'ready' });
    } catch {
      return res.status(503).json({ status: 'not_ready' });
    }
  });

  app.get('/api/metrics', (_req, res) => {
    res.setHeader('content-type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.send(renderPrometheusMetrics());
  });

  const staticRoot = env.STATIC_DIST_PATH ? path.resolve(env.STATIC_DIST_PATH) : null;
  if (staticRoot && fs.existsSync(staticRoot)) {
    app.use(express.static(staticRoot, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(staticRoot, 'index.html'), next);
    });
  } else if (env.STATIC_DIST_PATH) {
    logger.warn('server.static_dist_missing', { path: staticRoot });
  }

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  app.use((error, req, res, _next) => {
    logger.error('server.unhandled_error', {
      error,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl
    });
    captureException(error, { requestId: req.requestId, path: req.originalUrl });
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
