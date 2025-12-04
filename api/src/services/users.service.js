import { keys } from '../cache/keys.js';
import { TTL } from '../cache/policy.js';
import { jsonGet, jsonSet } from '../cache/redis.js';
import { query } from '../db/pg.js';

export async function getUserProfile(userId) {
  const cacheKey = keys.user(userId);
  const cached = await jsonGet(cacheKey);
  if (cached) return cached;
  const rows = await query(
    `SELECT user_id, display_name, email, created_at
     FROM users.app_user
     WHERE user_id = $1`,
    [userId]
  );
  const u = rows[0];
  if (!u) return null;
  const profile = {
    id: u.user_id,
    username: u.display_name,
    email: u.email,
    createdAt: u.created_at
  };
  await jsonSet(cacheKey, profile, TTL.user);
  return profile;
}
