import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Lightweight mocks so the API can boot without external services
vi.mock('../../api/src/cache/redis.js', () => ({ connectRedis: vi.fn() }));
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

const mockStore = { routes: [] as any[] };
let idCounter = 1;

vi.mock('../../api/src/db/pg.js', () => {
  const query = vi.fn(async (text: string, params: any[]) => {
    if (text.startsWith('INSERT INTO users.user_saved_route')) {
      const saved_route_id = `mock-${idCounter++}`;
      const [userid, name, startLon, startLat, endLon, endLat, accessible, length, duration] = params;
      const route = {
        saved_route_id,
        user_id: userid,
        name,
        start_lon: startLon,
        start_lat: startLat,
        end_lon: endLon,
        end_lat: endLat,
        is_accessible: accessible,
        length_m: length ?? null,
        duration_s: duration ?? null,
        created_at: '2025-01-01',
      };
      mockStore.routes.push(route);
      return [{ saved_route_id }];
    }

    if (text.startsWith('SELECT saved_route_id')) {
      const userId = params[0];
      return mockStore.routes.filter((r) => r.user_id === userId);
    }

    if (text.startsWith('DELETE FROM users.user_saved_route')) {
      const id = params[0];
      const idx = mockStore.routes.findIndex((r) => r.saved_route_id === id);
      if (idx === -1) return [];
      const [removed] = mockStore.routes.splice(idx, 1);
      return [{ saved_route_id: removed.saved_route_id }];
    }

    if (text.startsWith('UPDATE users.user_saved_route')) {
      const [name, startLon, startLat, endLon, endLat, accessible, length, duration, id] = params;
      const idx = mockStore.routes.findIndex((r) => r.saved_route_id === id);
      if (idx === -1) return [];
      const current = mockStore.routes[idx];
      mockStore.routes[idx] = {
        ...current,
        name: name ?? current.name,
        start_lon: startLon ?? current.start_lon,
        start_lat: startLat ?? current.start_lat,
        end_lon: endLon ?? current.end_lon,
        end_lat: endLat ?? current.end_lat,
        is_accessible: accessible ?? current.is_accessible,
        length_m: length ?? current.length_m,
        duration_s: duration ?? current.duration_s,
      };
      return [{ saved_route_id: id }];
    }

    throw new Error(`Unexpected query in mock: ${text}`);
  });

  return {
    query,
    __reset: () => {
      mockStore.routes.splice(0, mockStore.routes.length);
      idCounter = 1;
    },
    __store: mockStore,
  };
});

import { createApp } from '../../api/src/app.js';
import { __reset, __store } from '../../api/src/db/pg.js';

const app = createApp();

beforeEach(() => {
  __reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

const basePayload = {
  userid: 'user-1',
  prevb: 'Student Union',
  newb: 'Willis',
  prevblon: -97.15,
  prevblat: 33.214,
  newblon: -97.152,
  newblat: 33.215,
  accessible: 1,
  length: 120,
  duration: 300,
};

describe('POST /v1/userroute', () => {
  it('creates a route when payload is complete (BC-104, INT-01)', async () => {
    const res = await request(app).post('/v1/userroute').send(basePayload).expect(200);
    expect(res.body.message).toContain('Route saved');
    expect(__store.routes).toHaveLength(1);
    expect(__store.routes[0]).toMatchObject({ user_id: 'user-1', start_lon: -97.15, end_lat: 33.215 });
  });

  it('returns message when fields missing (BC-005 equivalent)', async () => {
    const res = await request(app).post('/v1/userroute').send({}).expect(200);
    expect(res.body.message).toBe('Needs all options selected');
    expect(__store.routes).toHaveLength(0);
  });
});

describe('GET /v1/userroute/:userid', () => {
  it('returns saved routes for a user (BC-106)', async () => {
    await request(app).post('/v1/userroute').send(basePayload);
    await request(app).post('/v1/userroute').send({ ...basePayload, userid: 'user-2', newb: 'Parking Garage' });

    const res = await request(app).get('/v1/userroute/user-1').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toContain('Student Union');
  });
});

describe('PUT /v1/userroute/:id', () => {
  it('updates a route when found (BC-108)', async () => {
    const createRes = await request(app).post('/v1/userroute').send(basePayload);
    const id = createRes.body.saved_route_id;

    const res = await request(app)
      .put(`/v1/userroute/${id}`)
      .send({ name: 'Updated name', length: 200 })
      .expect(200);

    expect(res.body.message).toContain('updated');
    expect(__store.routes[0].name).toBe('Updated name');
    expect(__store.routes[0].length_m).toBe(200);
  });

  it('404s when route not found', async () => {
    const res = await request(app).put('/v1/userroute/missing-id').send({ name: 'x' }).expect(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

describe('DELETE /v1/userroute/:id', () => {
  it('deletes an existing route (BC-105, BC-009, BC-0010)', async () => {
    const createRes = await request(app).post('/v1/userroute').send(basePayload);
    const id = createRes.body.saved_route_id;

    const res = await request(app).delete(`/v1/userroute/${id}`).expect(200);
    expect(res.body.message).toContain('deleted');
    expect(__store.routes).toHaveLength(0);
  });

  it('returns 404 when id not found (BC-007)', async () => {
    const res = await request(app).delete('/v1/userroute/does-not-exist').expect(404);
    expect(res.body.message).toMatch(/no route/i);
  });
});
