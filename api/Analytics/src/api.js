// src/api.js  (Redis-only, hardened)
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { getClient as getRedis } from './redisClient.js';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8080;
const STREAM_KEY = 'events:app';
const GROUP = 'eg:cg';

/* ----------------- helpers ----------------- */
const toNum = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const minutesToMs = (m) => m * 60_000;

function calcWindowMs(q, defMinutes = 5) {
  const mins = clamp(toNum(q?.minutes, defMinutes), 1 / 6, 24 * 60); // 10s .. 24h
  return minutesToMs(mins);
}

// Accept either [[ts,val], ...] or { samples: [[ts,val], ...] }
function normalizeTS(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.samples)) return data.samples;
  return [];
}

function flattenTS(data) {
  const arr = normalizeTS(data);
  return arr.map((item) => {
    if (Array.isArray(item)) {
      const [ts, val] = item;
      return {
        timestamp: Number(ts),
        iso: new Date(Number(ts)).toISOString(),
        value: Number(val)
      };
    }
    // object shape
    const ts = Number(item.timestamp ?? item.time ?? item[0]);
    const val = Number(item.value ?? item.sample ?? item[1]);
    return { timestamp: ts, iso: new Date(ts).toISOString(), value: val };
  });
}

async function safeRange(r, key, fromMs, toMs) {
  const exists = await r.exists(key);
  if (!exists) return [];
  const raw = await r.ts.range(key, fromMs, toMs, { count: 10000 }).catch(() => null);
  return flattenTS(raw);
}


/* ----------------- TimeSeries ----------------- */

// /api/ts/range?key=ts:req:count:60000&minutes=30
app.get('/api/ts/range', async (req, res) => {
  try {
    const r = await getRedis();
    const key = String(req.query.key || 'ts:req:count:60000');
    const to = Date.now();
    const from = to - calcWindowMs(req.query, 5);
    const data = await safeRange(r, key, from, to); // <— used safeRange
    res.json(data);                                  
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Latest base series
app.get('/api/ts/latest', async (_req, res) => {
  try {
    const r = await getRedis();
    const [reqC, lat, errC] = await Promise.all([
      r.ts.get('ts:req:count').catch(() => null),
      r.ts.get('ts:latency:ms').catch(() => null),
      r.ts.get('ts:errors:count').catch(() => null),
    ]);
    res.json({ at: Date.now(), req: reqC ?? null, latency: lat ?? null, errors: errC ?? null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Minute buckets
app.get('/api/metrics/requests', async (req, res) => {
  try {
    const r = await getRedis();
    const to = Date.now(), from = to - calcWindowMs(req.query, 60);
    const data = await safeRange(r, 'ts:req:count:60000', from, to);
    res.json(data.map(d => ({ minute: d.iso, count: d.value })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/metrics/latency', async (req, res) => {
  try {
    const r = await getRedis();
    const to = Date.now(), from = to - calcWindowMs(req.query, 60);
    const data = await safeRange(r, 'ts:latency:ms:60000', from, to);
    res.json(data.map(d => ({ minute: d.iso, avg_latency_ms: d.value })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/metrics/errors', async (req, res) => {
  try {
    const r = await getRedis();
    const to = Date.now(), from = to - calcWindowMs(req.query, 60);
    const data = await safeRange(r, 'ts:errors:count:60000', from, to);
    res.json(data.map(d => ({ minute: d.iso, error_count: d.value })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ----------------- Stream helpers ----------------- */

app.get('/api/stream/health', async (_req, res) => {
  try {
    const r = await getRedis();
    const [len, pending, groups] = await Promise.all([
      r.xLen(STREAM_KEY),
      r.xPending(STREAM_KEY, GROUP).catch(() => null),
      r.xInfoGroups(STREAM_KEY).catch(() => []),
    ]);
    res.json({
      stream: { key: STREAM_KEY, length: len },
      group: GROUP,
      pending: pending ? pending.count : 0,
      groups,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stream/tail', async (req, res) => {
  try {
    const r = await getRedis();
    const count = clamp(toNum(req.query.count, 20), 1, 200);
    const range = await r.xRevRange(STREAM_KEY, '+', '-', { COUNT: count });
    res.json(range.map(e => ({ id: e.id, ...e.message })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ----------------- Utilities ----------------- */

// List keys by pattern
app.get('/api/keys', async (req, res) => {
  try {
    const r = await getRedis();
    const pattern = String(req.query.pattern || 'ts:*');
    const it = r.scanIterator({ MATCH: pattern, COUNT: 200 });
    const keys = [];
    for await (const k of it) keys.push(k);
    res.json(keys);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// TS.INFO helper (debug)
app.get('/api/ts/info', async (req, res) => {
  try {
    const r = await getRedis();
    const key = String(req.query.key || 'ts:req:count');
    if (!(await r.exists(key))) return res.json({ key, exists: false });
    const info = await r.ts.info(key);
    res.json({ key, exists: true, info });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
