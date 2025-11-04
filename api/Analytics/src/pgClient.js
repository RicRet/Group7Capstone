// src/pgClient.js
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

function buildSsl() {
  const mode = String(process.env.PGSSL_MODE || 'require').toLowerCase();
  if (mode === 'disable' || mode === 'off' || mode === 'false') return false;
  if (mode === 'require') return { rejectUnauthorized: false };
  const caPath = process.env.PGSSL_CA_PATH || path.resolve('certs/rds-combined-ca-bundle.pem');
  if (!fs.existsSync(caPath)) return { rejectUnauthorized: false };
  return { ca: fs.readFileSync(caPath, 'utf8') };
}

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: buildSsl(),
});

export async function query(q, params) {
  const res = await pool.query(q, params);
  return res;
}
