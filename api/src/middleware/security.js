import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.js';

export function security() {
  return [
    helmet(),
    cors({ origin: env.CORS_ORIGIN, credentials: true }),
    rateLimit({ windowMs: 60_000, max: 300 })
  ];
}
