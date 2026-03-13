/**
 * ATLAS API Server
 *
 * Start with:  node server/index.js
 * or via npm:  npm run server
 *
 * Environment variables (see .env):
 *   PORT          – defaults to 3001
 *   DATABASE_URL  – PostgreSQL connection string
 *   JWT_SECRET    – secret for signing JWTs
 *   FRONTEND_URL  – allowed CORS origin (defaults to http://localhost:5173)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter    from './routes/auth.js';
import entitiesRouter from './routes/entities.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/entities', entitiesRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  ATLAS API server running on http://localhost:${PORT}`);
  console.log(`    Health:   http://localhost:${PORT}/api/health`);
  console.log(`    Auth:     http://localhost:${PORT}/api/auth/signup`);
  console.log(`    Entities: http://localhost:${PORT}/api/entities/:entity\n`);
});

export default app;
