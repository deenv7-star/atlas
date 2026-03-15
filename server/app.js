import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import entitiesRouter from './routes/entities.js';
import domainRouter from './routes/domain.js';
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
  app.use(apiRateLimit);
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth', authRouter);
  app.use('/api/entities', entitiesRouter);
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
