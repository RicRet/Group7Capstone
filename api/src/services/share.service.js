import { v4 as uuid } from 'uuid';
import { keys } from '../cache/keys.js';
import { TTL } from '../cache/policy.js';
import { jsonGet, jsonSet, redis } from '../cache/redis.js';

const DEFAULT_TTL = TTL.shareLocation || 60 * 30;
const MIN_TTL = 60;           // 1 minute
const MAX_TTL = 60 * 60;      // 60 minutes to avoid long-lived tokens

function ensureRedis() {
  if (!redis) {
    const err = new Error('Redis is not configured; location sharing unavailable');
    err.code = 'REDIS_DISABLED';
    throw err;
  }
}

function clampTtl(ttlSec) {
  const val = ttlSec ?? DEFAULT_TTL;
  return Math.max(MIN_TTL, Math.min(MAX_TTL, val));
}

export async function createShareLocation({ userId, username, latitude, longitude, label, expiresInSec }) {
  ensureRedis();
  const shareId = uuid().replace(/-/g, ''); // compact token
  const ttlSec = clampTtl(expiresInSec);
  const now = Date.now();
  const payload = {
    ownerUserId: userId,
    ownerUsername: username || null,
    latitude,
    longitude,
    label: label || null,
    createdAt: now,
    expiresAt: now + ttlSec * 1000,
  };

  const ok = await jsonSet(keys.shareLocation(shareId), payload, ttlSec);
  if (ok === null) {
    const err = new Error('Could not persist share token');
    err.code = 'REDIS_WRITE_FAILED';
    throw err;
  }

  return { shareId, expiresAt: payload.expiresAt };
}

export async function getShareLocation(shareId) {
  ensureRedis();
  return jsonGet(keys.shareLocation(shareId));
}

export async function deleteShareLocation(shareId) {
  ensureRedis();
  return redis.del(keys.shareLocation(shareId));
}