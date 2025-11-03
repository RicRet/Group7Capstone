#!/usr/bin/env node
/*
  Quick test script to attempt a live TLS connection to Postgres using the
  same SSL logic used by the API. Reads `api/.env` via dotenv.

  Usage: run from repository root (script uses absolute path when invoked by
  the test runner below):
    node api/test-db-ssl.js
*/

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

function buildSsl() {
  const mode = String(process.env.PGSSL_MODE || 'require').toLowerCase();
  console.log('PGSSL_MODE:', mode);
  if (mode === 'disable' || mode === 'off' || mode === 'false') return false;
  if (mode === 'require') return { rejectUnauthorized: false };
  const caPath = process.env.PGSSL_CA_PATH || path.resolve('certs/rds-combined-ca-bundle.pem');
  console.log('PGSSL_CA_PATH:', caPath);
  if (!fs.existsSync(caPath)) {
    console.warn('CA file not found; falling back to require (no verification)');
    return { rejectUnauthorized: false };
  }
  return { ca: fs.readFileSync(caPath, 'utf8') };
}

async function main() {
  console.log('Using env from api/.env (if present) and environment');

  const ssl = buildSsl();

  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl,
    // keep short for test
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });

  try {
    console.log('Attempting to connect to', process.env.PGHOST + ':' + process.env.PGPORT);
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT 1 AS ok');
      console.log('Query result:', res.rows);
    } finally {
      client.release();
    }
    await pool.end();
    console.log('Success: connected and queried the database.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR: could not connect or query the database');
    console.error(err instanceof Error ? err.stack || err.message : err);
    try { await pool.end(); } catch (e) {}
    process.exit(2);
  }
}

main();
