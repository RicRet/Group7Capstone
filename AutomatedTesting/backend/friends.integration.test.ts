import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory users and friendships for friends.service mock
const users = new Map<string, { id: string; username: string }>();
// Minimal mocks for infra
vi.mock('../../api/src/cache/redis.js', () => {
  const store = new Map();
  return {
    connectRedis: vi.fn(),
    jsonGet: async (k: string) => store.get(k) || null,
    jsonSet: async (k: string, v: any) => store.set(k, v),
    redis: { expire: vi.fn(), del: vi.fn() },
  };
});
vi.mock('../../api/src/middleware/analytics.js', () => ({ analytics: () => (_req, _res, next) => next() }));
vi.mock('../../Analytics/src/api.js', async () => {
  const expressMod = await import('express');
  const express = expressMod.default;
  return { createAnalyticsRouter: () => express.Router() };
});
vi.mock('../../api/src/services/users.service.js', () => ({
  getUserProfile: async (userId: string) => ({ id: userId, username: users.get(userId)?.username || 'user' }),
}));

// Session store for requireSession
const sessions = new Map<string, any>();
vi.mock('../../api/src/services/session.service.js', () => ({
  createSession: async (userId: string, roles: string[] = [], username?: string) => {
    const sid = `sid-${userId}`;
    sessions.set(sid, { userId, roles, username });
    return sid;
  },
  getSession: async (sid: string) => sessions.get(sid) || null,
  touchSession: async (_sid: string) => true,
  deleteSession: async (sid: string) => sessions.delete(sid),
}));
type Friendship = {
  userId: string;
  friendUserId: string;
  status: 'pending' | 'accepted';
  requestedBy: string;
  created_at: string;
  updated_at: string;
};
const friendships: Friendship[] = [];

function normalizePair(a: string, b: string) {
  if (a === b) throw new Error('Cannot add yourself');
  return a < b ? [a, b] : [b, a];
}

function findEdge(a: string, b: string) {
  const [x, y] = normalizePair(a, b);
  return friendships.find((f) => f.userId === x && f.friendUserId === y) || null;
}

function edgeToResponse(edge: Friendship, currentUser: string) {
  const amFirst = edge.userId === currentUser;
  const otherId = amFirst ? edge.friendUserId : edge.userId;
  const otherUser = users.get(otherId)!;
  const direction = edge.status === 'pending'
    ? (edge.requestedBy === currentUser ? 'outgoing' : 'incoming')
    : 'accepted';
  return {
    userId: otherUser.id,
    username: otherUser.username,
    status: edge.status,
    direction,
    requestedBy: edge.requestedBy,
    createdAt: edge.created_at,
    updatedAt: edge.updated_at,
  };
}

vi.mock('../../api/src/services/friends.service.js', () => ({
  listFriendships: async (currentUserId: string) => {
    const relevant = friendships.filter((f) => f.userId === currentUserId || f.friendUserId === currentUserId);
    const normalized = relevant.map((f) => edgeToResponse(f, currentUserId));
    return {
      accepted: normalized.filter((n) => n.status === 'accepted'),
      incoming: normalized.filter((n) => n.status === 'pending' && n.direction === 'incoming'),
      outgoing: normalized.filter((n) => n.status === 'pending' && n.direction === 'outgoing'),
    };
  },
  searchForUsers: async (term: string, currentUserId: string) => {
    const lc = term.toLowerCase();
    return Array.from(users.values())
      .filter((u) => u.id !== currentUserId && u.username.toLowerCase().includes(lc))
      .map((u) => ({ userId: u.id, username: u.username, relationship: 'none' }));
  },
  sendFriendRequest: async (actorId: string, targetId: string) => {
    if (!users.has(targetId)) return { state: 'not-found' };
    const now = new Date().toISOString();
    const edge = findEdge(actorId, targetId);
    if (edge) {
      if (edge.status === 'pending') {
        if (edge.requestedBy === actorId) return { state: 'pending', friendship: edgeToResponse(edge, actorId) };
        edge.status = 'accepted';
        edge.updated_at = now;
        return { state: 'accepted', friendship: edgeToResponse(edge, actorId) };
      }
      if (edge.status === 'accepted') return { state: 'already-friends', friendship: edgeToResponse(edge, actorId) };
    }
    const [x, y] = normalizePair(actorId, targetId);
    const entry: Friendship = { userId: x, friendUserId: y, status: 'pending', requestedBy: actorId, created_at: now, updated_at: now };
    friendships.push(entry);
    return { state: 'pending', friendship: edgeToResponse(entry, actorId) };
  },
  acceptFriendRequest: async (actorId: string, requesterId: string) => {
    const edge = findEdge(actorId, requesterId);
    if (!edge) return { state: 'not-found' };
    if (edge.status !== 'pending') return { state: 'not-pending' };
    if (edge.requestedBy === actorId) return { state: 'already-requested' };
    edge.status = 'accepted';
    edge.updated_at = new Date().toISOString();
    return { state: 'accepted', friendship: edgeToResponse(edge, actorId) };
  },
}));

// auth.service used in login to build sessions
vi.mock('../../api/src/services/auth.service.js', () => ({
  login: async (username: string, _password: string) => ({ sid: `sid-${username}`, user: { id: username, username, roles: [] } }),
}));

import { createApp } from '../../api/src/app.js';
const app = createApp();

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
const U3 = '33333333-3333-3333-3333-333333333333';

beforeEach(() => {
  sessions.clear();
  users.clear();
  friendships.splice(0, friendships.length);
  users.set(U1, { id: U1, username: 'alice' });
  users.set(U2, { id: U2, username: 'bob' });
  users.set(U3, { id: U3, username: 'charlie' });
});

describe('Friends routes', () => {
  const bearer = (sid: string) => ({ Authorization: `Bearer ${sid}` });

  it('rejects unauthenticated requests', async () => {
    await request(app).get('/v1/friends').expect(401);
  });

  it('sends a friend request (pending -> 201)', async () => {
    sessions.set('sid-u1', { userId: U1 });

    const res = await request(app)
      .post('/v1/friends/requests')
      .set(bearer('sid-u1'))
      .send({ userId: U2 })
      .expect(201);

    expect(res.body.state).toBe('pending');
    expect(friendships).toHaveLength(1);
  });

  it('accepts an incoming request (accepted -> 200)', async () => {
    sessions.set('sid-u1', { userId: U1 });
    sessions.set('sid-u2', { userId: U2 });
    // u1 sends to u2
    await request(app)
      .post('/v1/friends/requests')
      .set(bearer('sid-u1'))
      .send({ userId: U2 })
      .expect(201);

    const res = await request(app)
      .post(`/v1/friends/requests/${U1}/accept`)
      .set(bearer('sid-u2'))
      .send({})
      .expect(200);

    expect(res.body.state).toBe('accepted');
    expect(friendships[0].status).toBe('accepted');
  });

  it('prevents adding yourself', async () => {
    sessions.set('sid-u1', { userId: U1 });
    const res = await request(app)
      .post('/v1/friends/requests')
      .set(bearer('sid-u1'))
      .send({ userId: U1 })
      .expect(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  it('returns 404 when target user missing', async () => {
    sessions.set('sid-u1', { userId: U1 });
    const res = await request(app)
      .post('/v1/friends/requests')
      .set(bearer('sid-u1'))
      .send({ userId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('lists friendships grouped by status', async () => {
    sessions.set('sid-u1', { userId: U1 });
    sessions.set('sid-u2', { userId: U2 });
    // pending outgoing from u1 to u2
    await request(app).post('/v1/friends/requests').set(bearer('sid-u1')).send({ userId: U2 });
    // accepted between u1 and u3
    friendships.push({ userId: U1, friendUserId: U3, status: 'accepted', requestedBy: U1, created_at: 'now', updated_at: 'now' });

    const res = await request(app).get('/v1/friends').set(bearer('sid-u1')).expect(200);
    expect(res.body.accepted).toHaveLength(1);
    expect(res.body.outgoing).toHaveLength(1);
    expect(res.body.incoming).toHaveLength(0);
  });
});
