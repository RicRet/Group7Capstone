import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks for infra so the API can boot
vi.mock('../../api/src/cache/redis.js', () => {
  const store = new Map();
  return {
    connectRedis: vi.fn(),
    jsonSet: async (key, val) => { store.set(key, val); },
    jsonGet: async (key) => store.get(key),
    redis: {
      del: async (key) => { store.delete(key); return 1; },
      expire: async () => 1,
    },
  };
});
vi.mock('../../api/src/middleware/analytics.js', () => ({ analytics: () => (_req, _res, next) => next() }));
vi.mock('../../Analytics/src/api.js', async () => {
  const expressMod = await import('express');
  const express = expressMod.default;
  return {
    createAnalyticsRouter: () => {
      const r = express.Router();
      r.get('/health', (_req, res) => res.json({ ok: true }));
      return r;
    },
  };
});

const users = [] as any[];
const friends = [] as any[];
let userCounter = 1;

vi.mock('../../api/src/db/pg.js', () => {
  const query = async (sql: string, params: any[]) => {
    // Auth: check existing by username/email
    if (sql.startsWith('SELECT user_id FROM users.app_user WHERE display_name = $1 OR email = $2')) {
      const [name, email] = params;
      return users.filter((u) => u.display_name === name || u.email === email).map((u) => ({ user_id: u.user_id }));
    }
    // Auth: insert user
    if (sql.startsWith('INSERT INTO users.app_user')) {
      const [display_name, email, password_hash, first_name, last_name, avatar_url] = params;
      const user = {
        user_id: `u-${userCounter++}`,
        display_name,
        email,
        password_hash,
        first_name,
        last_name,
        avatar_url,
        created_at: new Date().toISOString(),
        roles: [],
      };
      users.push(user);
      return [{
        user_id: user.user_id,
        display_name,
        email,
        first_name,
        last_name,
        avatar_url,
        created_at: user.created_at,
      }];
    }
    // Auth: verify login
    if (sql.startsWith('SELECT user_id as id, display_name, password_hash')) {
      const [identifier] = params;
      const u = users.find((x) => x.display_name === identifier || x.email === identifier);
      return u ? [{ id: u.user_id, display_name: u.display_name, password_hash: u.password_hash, roles: u.roles || [] }] : [];
    }
    // Profile fetch
    if (sql.startsWith('SELECT user_id, display_name, email, first_name, last_name, avatar_url, created_at')) {
      const [userId] = params;
      const u = users.find((x) => x.user_id === userId);
      return u ? [{
        user_id: u.user_id,
        display_name: u.display_name,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
      }] : [];
    }
    // Friends: ensure user exists
    if (sql.startsWith('SELECT 1 FROM users.app_user WHERE user_id = $1')) {
      const [id] = params;
      return users.some((u) => u.user_id === id) ? [{ one: 1 }] : [];
    }
    // Friends: existing edge lookup
    if (sql.startsWith('SELECT status::text AS status, requested_by FROM users.app_friends')) {
      const [u1, u2] = params;
      const edge = friends.find((f) => f.user_id === u1 && f.friend_user_id === u2);
      return edge ? [{ status: edge.status, requested_by: edge.requested_by }] : [];
    }
    // Friends: insert edge
    if (sql.startsWith('INSERT INTO users.app_friends')) {
      const [u1, u2, status, requested_by] = params;
      friends.push({
        user_id: u1,
        friend_user_id: u2,
        status,
        requested_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return [];
    }
    // Friends: update to accepted
    if (sql.startsWith('UPDATE users.app_friends')) {
      const [u1, u2] = params;
      const edge = friends.find((f) => f.user_id === u1 && f.friend_user_id === u2);
      if (edge) {
        edge.status = 'accepted';
        edge.updated_at = new Date().toISOString();
        return [{ status: 'accepted' }];
      }
      return [];
    }
    // Friends: baseSelect queries
    if (sql.includes('FROM users.app_friends f')) {
      const buildRow = (f: any) => {
        const u1 = users.find((u) => u.user_id === f.user_id) || {};
        const u2 = users.find((u) => u.user_id === f.friend_user_id) || {};
        return {
          user_id: f.user_id,
          friend_user_id: f.friend_user_id,
          status: f.status,
          requested_by: f.requested_by,
          created_at: f.created_at,
          updated_at: f.updated_at,
          user1_name: u1.display_name,
          user1_first: u1.first_name,
          user1_last: u1.last_name,
          user1_email: u1.email,
          user2_name: u2.display_name,
          user2_first: u2.first_name,
          user2_last: u2.last_name,
          user2_email: u2.email,
        };
      };

      if (sql.includes('WHERE f.user_id = $1 AND f.friend_user_id = $2')) {
        const [u1, u2] = params;
        const edge = friends.find((f) => f.user_id === u1 && f.friend_user_id === u2);
        return edge ? [buildRow(edge)] : [];
      }
      if (sql.includes('WHERE f.user_id = $1 OR f.friend_user_id = $1')) {
        const [uid] = params;
        return friends.filter((f) => f.user_id === uid || f.friend_user_id === uid).map(buildRow);
      }
    }

    throw new Error(`Unhandled query: ${sql}`);
  };

  return { query, __store: { users, friends }, __reset: () => { users.splice(0); friends.splice(0); userCounter = 1; } };
});

const sessionStore = new Map();
vi.mock('../../api/src/services/session.service.js', () => ({
  createSession: async (userId, roles = [], username) => {
    const sid = `sid-${sessionStore.size + 1}`;
    sessionStore.set(sid, { userId, roles, username });
    return sid;
  },
  getSession: async (sid) => sessionStore.get(sid),
  touchSession: async () => {},
  deleteSession: async (sid) => { sessionStore.delete(sid); },
  __sessionStore: sessionStore,
}));

vi.mock('../../api/src/services/users.service.js', () => {
  const { __store } = require('../../api/src/db/pg.js');
  return {
    getUserProfile: async (userId) => {
      const u = __store.users.find((x: any) => x.user_id === userId);
      if (!u) return null;
      return {
        id: u.user_id,
        username: u.display_name,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        avatarUrl: u.avatar_url,
      };
    },
  };
});

import { createApp } from '../../api/src/app.js';
import { __store, __reset as resetDb } from '../../api/src/db/pg.js';
import { __sessionStore } from '../../api/src/services/session.service.js';

const app = createApp();

beforeEach(() => {
  resetDb();
  __sessionStore.clear();
});

describe('Auth routes', () => {
  it('signup succeeds for new user', async () => {
    const res = await request(app)
      .post('/v1/auth/signup')
      .send({ username: 'alice', email: 'alice@example.com', password: 'Password1!' })
      .expect(201);

    expect(res.body.message).toContain('User created');
    expect(__store.users).toHaveLength(1);
  });

  it('signup rejects duplicate username/email', async () => {
    await request(app).post('/v1/auth/signup').send({ username: 'bob', email: 'bob@example.com', password: 'Password1!' });
    const res = await request(app)
      .post('/v1/auth/signup')
      .send({ username: 'bob', email: 'bob@example.com', password: 'Password1!' })
      .expect(409);
    expect(res.body.error).toMatch(/exists/i);
  });

  it('login returns token for valid credentials', async () => {
    await request(app).post('/v1/auth/signup').send({ username: 'carol', email: 'carol@example.com', password: 'Password1!' });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: 'carol', password: 'Password1!' })
      .expect(200);

    expect(res.body.token).toMatch(/sid-/);
    expect(res.body.user.username).toBe('carol');
  });

  it('login fails with wrong password', async () => {
    await request(app).post('/v1/auth/signup').send({ username: 'dave', email: 'dave@example.com', password: 'Password1!' });
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ username: 'dave', password: 'wrong' })
      .expect(401);
    expect(res.body.error).toMatch(/invalid/i);
  });
});

describe('Friend requests', () => {
  const authz = (sid: string) => ({ Authorization: `Bearer ${sid}` });

  const seedUsers = async () => {
    await request(app).post('/v1/auth/signup').send({ username: 'u1', email: 'u1@example.com', password: 'Password1!' });
    await request(app).post('/v1/auth/signup').send({ username: 'u2', email: 'u2@example.com', password: 'Password1!' });
    const login1 = await request(app).post('/v1/auth/login').send({ username: 'u1', password: 'Password1!' });
    const login2 = await request(app).post('/v1/auth/login').send({ username: 'u2', password: 'Password1!' });
    return { sid1: login1.body.token, sid2: login2.body.token, id1: __store.users[0].user_id, id2: __store.users[1].user_id };
  };

  it('cannot send request to self', async () => {
    const { sid1, id1 } = await seedUsers();
    const res = await request(app)
      .post('/v1/friends/requests')
      .set(authz(sid1))
      .send({ userId: id1 })
      .expect(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  it('creates and accepts a friend request', async () => {
    const { sid1, sid2, id1, id2 } = await seedUsers();

    const sendRes = await request(app)
      .post('/v1/friends/requests')
      .set(authz(sid1))
      .send({ userId: id2 })
      .expect(201);
    expect(sendRes.body.state).toBe('pending');

    const acceptRes = await request(app)
      .post(`/v1/friends/requests/${id1}/accept`)
      .set(authz(sid2))
      .send({})
      .expect(200);
    expect(acceptRes.body.state).toBe('accepted');

    const listRes = await request(app).get('/v1/friends').set(authz(sid1)).expect(200);
    expect(listRes.body.accepted).toHaveLength(1);
    expect(listRes.body.accepted[0].userId).toBe(id2);
  });

  it('returns 404 when target user missing', async () => {
    const { sid1 } = await seedUsers();
    const res = await request(app)
      .post('/v1/friends/requests')
      .set(authz(sid1))
      .send({ userId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
