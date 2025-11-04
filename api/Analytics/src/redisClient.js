import timeSeriesPkg from '@redis/time-series';
import 'dotenv/config';
import { createClient } from 'redis';
const { timeSeries } = timeSeriesPkg;

const { REDIS_URL, ANALYTICS_MOCK } = process.env;

// Lightweight mock to allow running the API without a Redis instance (for smoke tests)
function buildMockClient() {
  const now = Date.now();
  const samples = Array.from({ length: 5 }).map((_, i) => ({
    timestamp: now - (4 - i) * 60_000,
    iso: new Date(now - (4 - i) * 60_000).toISOString(),
    value: Math.round(10 + Math.random() * 10)
  }));
  const tsNS = {
    async get() { return { timestamp: String(now), value: '15' }; },
    async range() { return samples.map(s => [String(s.timestamp), String(s.value)]); },
    async info() { return { totalSamples: samples.length }; },
    async add() { return String(Date.now()); }
  };
  return {
    // minimal surface used by routes
    ts: tsNS,
    async exists() { return 1; },
    async xLen() { return 0; },
    async xPending() { return { count: 0 }; },
    async xInfoGroups() { return []; },
    async xRevRange() { return []; },
    scanIterator: async function* () { yield* ['ts:req:count', 'ts:latency:ms', 'ts:errors:count']; },
    isOpen: true,
    async connect() { return this; },
  };
}

let client;

export async function getClient() {
  if (String(ANALYTICS_MOCK).toLowerCase() === 'true' || ANALYTICS_MOCK === '1') {
    // Return a fresh mock per call to avoid shared state in tests
    return buildMockClient();
  }

  if (!/^redis(s)?:\/\//.test(REDIS_URL || '')) {
    throw new Error(`REDIS_URL must start with redis:// or rediss://`);
  }

  if (!client) {
    const u = new URL(REDIS_URL);
    const isTLS = u.protocol === 'rediss:';
    client = createClient({
      url: REDIS_URL,
      socket: isTLS ? { tls: true, servername: u.hostname } : {},
      // enable RedisTimeSeries module commands (ts.*)
      modules: { timeSeries },
    });
    client.on('error', (err) => console.error('Redis Client Error', err));
  }

  if (!client.isOpen) await client.connect();
  return client;
}
