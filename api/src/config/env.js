//define our environment

import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().default(3000),
  PGHOST: z.string(),
  PGPORT: z.coerce.number().default(5432),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
  PGDATABASE: z.string(),
  REDIS_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:19006'),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info')
});

export const env = Env.parse(process.env);
