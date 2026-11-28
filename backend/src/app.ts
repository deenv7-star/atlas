import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { organizationRoutes } from './routes/organization.routes.js';
import { propertiesRoutes } from './routes/properties.routes.js';
import { leadsRoutes } from './routes/leads.routes.js';
import { bookingsRoutes } from './routes/bookings.routes.js';
import { paymentsRoutes } from './routes/payments.routes.js';
import { cleaningRoutes } from './routes/cleaning.routes.js';
import { messagesRoutes } from './routes/messages.routes.js';
import { automationsRoutes } from './routes/automations.routes.js';
import { invoicesRoutes } from './routes/invoices.routes.js';
import { integrationsRoutes } from './routes/integrations.routes.js';
import { calendarRoutes } from './routes/calendar.routes.js';

// CORS allowlist (audit C6, 2026-11-28): the previous `origin: true` reflected
// ANY origin while sending credentials — any website could call this API with the
// user's cookies. Now only explicitly listed origins are allowed, and credentials
// are sent only for those origins.
// Set CORS_ORIGINS as a comma-separated list, e.g.:
//   CORS_ORIGINS=https://atlas-il.com,https://app.atlas-il.com
// Default when unset: the local Vite dev server only.
const CORS_ORIGINS = (env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: CORS_ORIGINS, credentials: true });
  app.register(helmet);
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  app.register(jwt, { secret: env.JWT_ACCESS_SECRET });

  app.get('/health', async () => ({ ok: true }));

  app.register(authRoutes);
  app.register(organizationRoutes);
  app.register(propertiesRoutes);
  app.register(leadsRoutes);
  app.register(bookingsRoutes);
  app.register(paymentsRoutes);
  app.register(cleaningRoutes);
  app.register(messagesRoutes);
  app.register(automationsRoutes);
  app.register(invoicesRoutes);
  app.register(integrationsRoutes);
  app.register(calendarRoutes);

  return app;
}
