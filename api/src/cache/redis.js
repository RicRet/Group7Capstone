//Helper and connnect functions for redis

import { createClient } from 'redis';
import { env } from '../config/env.js';

export const redis = createClient({ url: env.REDIS_URL });

export async function connectRedis() {
  if (!redis.isOpen) {
    redis.on('error', (e) => console.error('Redis error', e));
    await redis.connect();
  }
}

export async function jsonGet(key) {
  const v = await redis.get(key);
  return v ? JSON.parse(v) : null;
}
export async function jsonSet(key, val, ttlSec) {
  const s = JSON.stringify(val);
  return ttlSec ? redis.set(key, s, { EX: ttlSec }) : redis.set(key, s);
}
