//Setting up pg connection

import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { env } from '../config/env.js';

function buildSsl() {
  // Modes supported: disable | require | verify-ca
  const mode = (env.PGSSL_MODE || 'require').toLowerCase();
  if (mode === 'disable' || mode === 'off' || mode === 'false') return false;

  // 'require' => use TLS but don't validate server certificate (convenient)
  if (mode === 'require') return { rejectUnauthorized: false };

  // 'verify-ca' => validate server certificate against provided CA bundle
  const caPath = env.PGSSL_CA_PATH || path.resolve('certs/rds-combined-ca-bundle.pem');
  if (!fs.existsSync(caPath)) {
    // If CA not present, fall back to 'require' to avoid startup failures.
    // For production, supply the CA bundle and set PGSSL_MODE=verify-ca.
    return { rejectUnauthorized: false };
  }

  return { ca: fs.readFileSync(caPath, 'utf8') };
}


export const pg = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  database: env.PGDATABASE,
  ssl: buildSsl(),
  max: 10
});

//helper to run query
export async function query(text, params) {
  const res = await pg.query(text, params);
  return res.rows;
}

export async function queries(text, params) {
  const res = await pg.query(text, params);
  return res;
}