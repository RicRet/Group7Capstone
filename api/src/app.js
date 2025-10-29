import express from 'express';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { security } from './middleware/security.js';
import v1 from './routes/v1/index.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use(security());
  app.use(morgan('tiny'));
  app.use('/v1', v1);
  app.use(errorHandler);
  return app;
}
