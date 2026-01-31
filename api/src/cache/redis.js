//Helper and connnect functions for redis

import { createClient } from 'redis';
import { env } from '../config/env.js';

// Build a client if REDIS_URL is provided; otherwise create a disabled stub
function buildClient() {
  const url = env.REDIS_URL || '';
  if (!url) {
    return null;
  }
  try {
    const u = new URL(url);
    const isTLS = u.protocol === 'rediss:';
    const client = createClient({
      url,
      socket: isTLS ? { tls: true, servername: u.hostname } : {},
    });
    client.on('error', (e) => console.error('Redis Client Error', e));
    return client;
  } catch (e) {
    console.error('Invalid REDIS_URL; disabling Redis', e);
    return null;
  }
}

export const redis = buildClient();

export async function connectRedis() {
  if (!redis) {
    console.log('Redis disabled: no REDIS_URL provided');
    return;
  }
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (e) {
    // Do not crash the app if Redis cannot connect
    console.error('Redis connect failed; proceeding without cache', e);
  }
}

export async function jsonGet(key) {
  try {
    if (!redis || !redis.isOpen) return null;
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export async function jsonSet(key, val, ttlSec) {
  try {
    if (!redis || !redis.isOpen) return null;
    const s = JSON.stringify(val);
    return ttlSec ? redis.set(key, s, { EX: ttlSec }) : redis.set(key, s);
  } catch {
    return null;
  }
}
