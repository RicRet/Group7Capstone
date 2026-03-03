import { keys } from '../cache/keys.js';
import { TTL } from '../cache/policy.js';
import { jsonGet, jsonSet, redis } from '../cache/redis.js';
import { query } from '../db/pg.js';

export async function getUserProfile(userId) {
  const cacheKey = keys.user(userId);
  const cached = await jsonGet(cacheKey);
  if (cached) return cached;
  const rows = await query(
    `SELECT user_id, display_name, email, first_name, last_name, avatar_url, created_at
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
    firstName: u.first_name,
    lastName: u.last_name,
    avatarUrl: u.avatar_url,
    createdAt: u.created_at
  };
  await jsonSet(cacheKey, profile, TTL.user);
  return profile;
}

export async function updateUserProfile(userId, fields) {
  const allowed = ['display_name', 'first_name', 'last_name', 'avatar_url'];
  // Map camelCase incoming keys to DB column names
  const colMap = {
    username: 'display_name',
    firstName: 'first_name',
    lastName: 'last_name',
    avatarUrl: 'avatar_url',
  };

  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(fields)) {
    const col = colMap[key] ?? (allowed.includes(key) ? key : null);
    if (!col) continue;
    setClauses.push(`${col} = $${idx++}`);
    values.push(val);
  }

  if (setClauses.length === 0) throw new Error('No valid fields to update');

  values.push(userId);
  const rows = await query(
    `UPDATE users.app_user
     SET ${setClauses.join(', ')}
     WHERE user_id = $${idx}
     RETURNING user_id, display_name, email, first_name, last_name, avatar_url, created_at`,
    values
  );

  const u = rows[0];
  if (!u) return null;

  const profile = {
    id: u.user_id,
    username: u.display_name,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    avatarUrl: u.avatar_url,
    createdAt: u.created_at,
  };

  // Invalidate cached profile
  const cacheKey = keys.user(userId);
  try { if (redis?.isOpen) await redis.del(cacheKey); } catch {}

  return profile;
}
