import crypto from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Shared mocks to keep the API bootable without external infra
vi.mock('../../api/src/cache/redis.js', () => {
  return {
    connectRedis: vi.fn(),
    jsonGet: vi.fn(async () => null),
    jsonSet: vi.fn(async () => {}),
    redis: {
      expire: vi.fn(),
      del: vi.fn(),
    },
  };
});
vi.mock('../../api/src/middleware/analytics.js', () => ({ analytics: () => (_req, _res, next) => next() }));
vi.mock('../../Analytics/src/api.js', async () => {
  const expressMod = await import('express');
  const express = expressMod.default;
  return { createAnalyticsRouter: () => express.Router() };
});

// In-memory user store for auth service mock
const users = new Map();
let idCounter = 1;
const hash = (p: string) => crypto.createHash('sha256').update(p).digest('hex');

vi.mock('../../api/src/services/auth.service.js', () => {
  return {
    createUser: async (username: string, email: string, password: string, firstName?: string, lastName?: string) => {
      const exists = Array.from(users.values()).find((u: any) => u.username === username || u.email === email);
      if (exists) return null;
      const user = {
        id: `u-${idCounter++}`,
        username,
        email,
        password_hash: hash(password),
        firstName: firstName || null,
        lastName: lastName || null,
      } as any;
      users.set(user.id, user);
      return user;
    },
    isEmailAvailable: async (email: string) => !Array.from(users.values()).some((u: any) => u.email === email),
    login: async (username: string, password: string) => {
      const match = Array.from(users.values()).find((u: any) => u.username === username || u.email === username);
      if (!match) return null;
      if (match.password_hash !== hash(password)) return null;
      return { sid: `sid-${match.id}`, user: { id: match.id, username: match.username, roles: [] } };
    },
  };
});

import { createApp } from '../../api/src/app.js';

const app = createApp();

beforeEach(() => {
  users.clear();
  idCounter = 1;
});

describe('Auth routes', () => {
  it('signs up a new user (BC-102 equivalent backend)', async () => {
    const res = await request(app)
      .post('/v1/auth/signup')
      .send({ username: 'alice', email: 'alice@test.com', password: 'password123' })
      .expect(201);

    expect(res.body.message).toBe('User created successfully');
    expect(users.size).toBe(1);
  });

  it('rejects duplicate username or email with 409', async () => {
    await request(app)
      .post('/v1/auth/signup')
      .send({ username: 'bob', email: 'bob@test.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/v1/auth/signup')
      .send({ username: 'bob', email: 'bob@test.com', password: 'password123' })
      .expect(409);

    expect(res.body.error).toBe('Username or email already exists');
  });

  it('logs in with correct credentials (LG-03 backend side)', async () => {
    await request(app)
      .post('/v1/auth/signup')
      .send({ username: 'carol', email: 'carol@test.com', password: 's3cretPass!' })
      .expect(201);

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: 'carol', password: 's3cretPass!' })
      .expect(200);

    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ username: 'carol' });
  });

  it('returns 401 for invalid credentials (LG-02 backend side)', async () => {
    // create user
    await request(app)
      .post('/v1/auth/signup')
      .send({ username: 'dave', email: 'dave@test.com', password: 'goodpass123' });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: 'dave', password: 'badpass' })
      .expect(401);

    expect(res.body.error).toBe('Invalid credentials');
  });

  it('fails validation on missing fields (LG-01 backend side)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: '', password: '' })
      .expect(400);

    expect(res.body.error).toBe('ValidationError');
  });
});
