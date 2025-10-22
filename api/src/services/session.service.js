// FIXME, script to load cached data

import { v4 as uuid } from 'uuid';
import { keys } from '../cache/keys.js';
import { TTL } from '../cache/policy.js';
import { jsonGet, jsonSet, redis } from '../cache/redis.js';

export async function createSession(userId, roles = []) {
  const sid = uuid();
  await jsonSet(keys.session(sid), { userId, roles, createdAt: Date.now() }, TTL.session);
  return sid;
}
export function getSession(sid) {
  return jsonGet(keys.session(sid));
}
export function touchSession(sid) {
  return redis.expire(keys.session(sid), TTL.session);
}
export function deleteSession(sid) {
  return redis.del(keys.session(sid));
}
