import express from 'express';
import morgan from 'morgan';
import { createAnalyticsRouter } from '../Analytics/src/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestID.js';
import { security } from './middleware/security.js';
import v1 from './routes/v1/index.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use(security());
  app.use(morgan('tiny'));
  app.use('/v1', v1);
  // Mount analytics routes at /analytics (they will use Redis/TS endpoints)
  app.use('/analytics', createAnalyticsRouter());
  app.use(errorHandler);
  return app;
}
