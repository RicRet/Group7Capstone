import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';
import { validate } from '../../middleware/validate.js';
import { createShareLocation, deleteShareLocation, getFriendLocations, getShareLocation } from '../../services/share.service.js';
import { shareCreateSchema, shareParamsSchema, shareQuerySchema } from '../../validations/share.schema.js';

const r = Router();

r.post('/', requireSession, validate(shareCreateSchema), async (req, res, next) => {
  try {
    const { latitude, longitude, label, expiresInSec } = req.body;
    const { user } = req;
    const result = await createShareLocation({
      userId: user?.id || req.session?.userId,
      username: user?.username,
      latitude,
      longitude,
      label,
      expiresInSec,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'REDIS_DISABLED') {
      return res.status(503).json({ error: 'Location sharing requires Redis. Set REDIS_URL.' });
    }
    next(err);
  }
});

// Must be before /:shareId to avoid route conflict
r.get('/friends', requireSession, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const locations = await getFriendLocations(userId);
    res.json({ friends: locations });
  } catch (err) {
    if (err.code === 'REDIS_DISABLED') {
      return res.status(503).json({ error: 'Location sharing requires Redis. Set REDIS_URL.' });
    }
    next(err);
  }
});

r.delete('/me', requireSession, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { redis } = await import('../../cache/redis.js');
    const { keys } = await import('../../cache/keys.js');
    if (redis && redis.isOpen) {
      const shareId = await redis.get(keys.shareUser(userId));
      if (shareId) {
        await deleteShareLocation(shareId);
        await redis.del(keys.shareUser(userId));
      }
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

r.get('/:shareId', validate(shareParamsSchema), validate(shareQuerySchema), async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const includeOwner = Boolean(req.query.includeOwner);
    const data = await getShareLocation(shareId);
    if (!data) return res.status(404).json({ error: 'Not found or expired' });

    const response = {
      latitude: data.latitude,
      longitude: data.longitude,
      label: data.label,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
    };
    if (includeOwner) {
      response.ownerUsername = data.ownerUsername;
    }
    res.json(response);
  } catch (err) {
    if (err.code === 'REDIS_DISABLED') {
      return res.status(503).json({ error: 'Location sharing requires Redis. Set REDIS_URL.' });
    }
    next(err);
  }
});

export default r;