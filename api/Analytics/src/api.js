// src/api.js  (Redis-only, hardened)
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { getClient as getRedis } from './redisClient.js';

// Create an Express Router with the analytics endpoints so the main API
// server can mount them. Mounting path in the main app will be
// e.g. app.use('/analytics', createAnalyticsRouter()).
export function createAnalyticsRouter() {
  const router = express.Router();
  router.use(express.json());
  router.use(cors());

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
  router.get('/api/ts/range', async (req, res) => {
    try {
      const r = await getRedis();
      const key = String(req.query.key || 'ts:req:count:60000');
      const to = Date.now();
      const from = to - calcWindowMs(req.query, 5);
      const data = await safeRange(r, key, from, to);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Latest base series
  router.get('/api/ts/latest', async (_req, res) => {
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
  router.get('/api/metrics/requests', async (req, res) => {
    try {
      const r = await getRedis();
      const to = Date.now(), from = to - calcWindowMs(req.query, 60);
      const data = await safeRange(r, 'ts:req:count:60000', from, to);
      res.json(data.map(d => ({ minute: d.iso, count: d.value })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/api/metrics/latency', async (req, res) => {
    try {
      const r = await getRedis();
      const to = Date.now(), from = to - calcWindowMs(req.query, 60);
      const data = await safeRange(r, 'ts:latency:ms:60000', from, to);
      res.json(data.map(d => ({ minute: d.iso, avg_latency_ms: d.value })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/api/metrics/errors', async (req, res) => {
    try {
      const r = await getRedis();
      const to = Date.now(), from = to - calcWindowMs(req.query, 60);
      const data = await safeRange(r, 'ts:errors:count:60000', from, to);
      res.json(data.map(d => ({ minute: d.iso, error_count: d.value })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  /* ----------------- Stream helpers ----------------- */

  router.get('/api/stream/health', async (_req, res) => {
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

  router.get('/api/stream/tail', async (req, res) => {
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
  router.get('/api/keys', async (req, res) => {
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
  router.get('/api/ts/info', async (req, res) => {
    try {
      const r = await getRedis();
      const key = String(req.query.key || 'ts:req:count');
      if (!(await r.exists(key))) return res.json({ key, exists: false });
      const info = await r.ts.info(key);
      res.json({ key, exists: true, info });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
}
