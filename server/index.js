import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info('server.started', {
    port: env.PORT,
    env: env.NODE_ENV,
    health: `http://localhost:${env.PORT}/health`,
    ready: `http://localhost:${env.PORT}/ready`,
    metrics: `http://localhost:${env.PORT}/api/metrics`
  });
});

export default app;
