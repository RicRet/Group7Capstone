//Setting up pg connection

import { Pool } from 'pg';
import { env } from '../config/env.js';

export const pg = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  database: env.PGDATABASE,
  max: 10
});

//helper to run query
export async function query(text, params) {
  const res = await pg.query(text, params);
  return res.rows;
}
