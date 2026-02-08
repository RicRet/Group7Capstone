import { Router } from 'express';
import { redis } from '../../cache/redis.js';
import { pg } from '../../db/pg.js';

const r = Router();
r.get('/health', (_req, res) => res.json({ ok: true }));
r.get('/ready', async (_req, res) => {
  try {
    if (redis && redis.isOpen) {
      await redis.ping();
    }
    await pg.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});
export default r;
