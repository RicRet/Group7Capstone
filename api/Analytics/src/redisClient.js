import timeSeriesPkg from '@redis/time-series';
import 'dotenv/config';
import { createClient } from 'redis';
const timeSeries = (timeSeriesPkg && (timeSeriesPkg.timeSeries || (timeSeriesPkg.default && timeSeriesPkg.default.timeSeries))) || timeSeriesPkg.timeSeries;

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
    // stream ops used by worker (no-ops in mock mode)
    async xGroupCreate() { return 'OK'; },
    async xAutoClaim() { return { messages: [] }; },
    async xReadGroup() { return null; },
    async xAck() { return 0; },
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
    const baseOptions = {
      url: REDIS_URL,
      socket: isTLS ? { tls: true, servername: u.hostname } : {},
    };
    // If the timeSeries plugin is available, attach it; otherwise fall back to core client
    if (timeSeries) {
      // @ts-ignore - modules is supported by node-redis for module plugins
      client = createClient({ ...baseOptions, modules: { timeSeries } });
    } else {
      client = createClient(baseOptions);
    }
    client.on('error', (err) => console.error('Redis Client Error', err));
  }

  if (!client.isOpen) await client.connect();
  // If TS module wasn't attached, provide a minimal shim using sendCommand
  // so the rest of the app can operate against r.ts.*
  if (!('ts' in client) || !client.ts) {
    const c = client;
    // helper to coerce COUNT option
    function buildRangeArgs(key, from, to, options = {}) {
      const args = ['TS.RANGE', key, String(from), String(to)];
      if (options && options.count) args.push('COUNT', String(options.count));
      return args;
    }
    client.ts = {
      create: (key, options = {}) => {
        const args = ['TS.CREATE', key];
        if (options.RETENTION) { args.push('RETENTION', String(options.RETENTION)); }
        if (options.DUPLICATE_POLICY) { args.push('DUPLICATE_POLICY', String(options.DUPLICATE_POLICY).toUpperCase()); }
        if (options.LABELS && typeof options.LABELS === 'object') {
          args.push('LABELS');
          for (const [k, v] of Object.entries(options.LABELS)) args.push(String(k), String(v));
        }
        return c.sendCommand(args);
      },
      add: (key, timestamp, value, options = {}) => {
        const args = ['TS.ADD', key, String(timestamp), String(value)];
        const policy = options.ON_DUPLICATE || 'SUM';
        if (policy) {
          args.push('ON_DUPLICATE', String(policy).toUpperCase());
        }
        return c.sendCommand(args);
      },
      get: async (key) => {
        const resp = await c.sendCommand(['TS.GET', key]);
        if (!resp) return null;
        const [ts, val] = resp;
        return { timestamp: String(ts), value: String(val) };
      },
      range: (key, from, to, options) => c.sendCommand(buildRangeArgs(key, from, to, options)),
      info: (key) => c.sendCommand(['TS.INFO', key])
    };
  }
  return client;
}
