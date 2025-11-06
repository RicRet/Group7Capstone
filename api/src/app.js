import express from 'express';
import morgan from 'morgan';
import { createAnalyticsRouter } from '../Analytics/src/api.js';
import { connectRedis } from './cache/redis.js';
import { analytics as analyticsMiddleware } from './middleware/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestID.js';
import { security } from './middleware/security.js';
import v1 from './routes/v1/index.js';
export function createApp() {
  const app = express();
  connectRedis()
  app.use(express.json());
  app.use(requestId);
  app.use(security());
  app.use(morgan('tiny'));
  // Non-blocking analytics event producer (writes to Redis Stream when enabled)
  app.use(analyticsMiddleware());
  app.use('/v1', v1);
  // Mount analytics routes at /analytics (they will use Redis/TS endpoints)
  app.use('/analytics', createAnalyticsRouter());
  app.use(errorHandler);
  return app;
}
