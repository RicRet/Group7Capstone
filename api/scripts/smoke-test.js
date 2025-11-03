#!/usr/bin/env node
/*
  Minimal smoke test that boots the API app, hits a few endpoints, and 
  verifies analytics router responds using a mocked Redis client.

  This does not require real Redis or Postgres.
*/

import 'dotenv/config';
import assert from 'node:assert/strict';
import http from 'node:http';

function requestJSON(base, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const req = http.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, json });
        } catch (e) {
          reject(new Error(`Non-JSON response (${res.statusCode}): ${body}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  // Force analytics router into mock mode
  process.env.ANALYTICS_MOCK = process.env.ANALYTICS_MOCK || '1';
  // Minimal env to satisfy config validation during tests
  process.env.PGHOST = process.env.PGHOST || 'localhost';
  process.env.PGPORT = process.env.PGPORT || '5432';
  process.env.PGUSER = process.env.PGUSER || 'postgres';
  process.env.PGPASSWORD = process.env.PGPASSWORD || 'postgres';
  process.env.PGDATABASE = process.env.PGDATABASE || 'postgres';
  process.env.PGSSL_MODE = process.env.PGSSL_MODE || 'disable';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const { createApp } = await import('../src/app.js');
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1) health route (from main API)
  const health = await requestJSON(base, '/v1/health');
    assert.equal(health.status, 200, 'Health endpoint should return 200');

    // 2) analytics latest (mocked)
    const latest = await requestJSON(base, '/analytics/api/ts/latest');
    assert.equal(latest.status, 200, 'Analytics latest should return 200');
    assert.ok('req' in latest.json && 'latency' in latest.json && 'errors' in latest.json, 'Latest payload shape');

    // 3) analytics keys (mocked)
    const keys = await requestJSON(base, '/analytics/api/keys?pattern=ts:*');
    assert.equal(keys.status, 200, 'Analytics keys should return 200');
    assert.ok(Array.isArray(keys.json), 'Keys should be an array');

    console.log('SMOKE TEST PASS');
    process.exit(0);
  } catch (err) {
    console.error('SMOKE TEST FAIL');
    console.error(err?.stack || err?.message || err);
    process.exit(1);
  } finally {
    server.close();
  }
}

main();
