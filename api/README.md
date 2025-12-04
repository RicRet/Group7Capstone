# EagleGuide API

This folder contains the Node.js/Express API for EagleGuide.

This README explains how to install dependencies and run the API using a single command.

## Requirements

- Node.js (v16+ recommended; tested with Node 20)
- npm

## Quick start (one command)

From the project root run:

```bash
(cd api && npm install && npm run start)
```

This will install dependencies (if needed) and start the API server.

## Manual steps

1. Change to the API folder:

```bash
cd /workspaces/Group7Capstone-1/api
```

2. Install dependencies (if you haven't already):

```bash
npm install
```

3. Start the server:

```bash
npm run start
```

4. For development with auto-restart on file changes use:

```bash
npm run dev
```

## What the scripts do

- `npm run start` — runs `node src/server.js`. This file loads environment variables, imports the app factory from `src/app.js`, and starts an HTTP server on `process.env.PORT` (default 3000).
- `npm run dev` — runs `node --watch src/server.js` which uses Node's built-in file watcher (ESM-friendly).
- `npm run lint` — runs ESLint (configured as a devDependency); failures won't block the command due to `|| true`.

## Configuration / .env

Create an `.env` file inside the `api/` folder (it's already being loaded by `src/server.js`) if you need to change defaults. Example:

```
PORT=4000
# other env vars used by your app (DB, REDIS, etc.)
```

The server uses `process.env.PORT` or falls back to `3000`.

## Sessions (Redis-backed)
- Token: opaque session ID returned by `POST /v1/auth/login` as `token`.
- Storage: Redis key `sess:<sid>` with TTL from `src/cache/policy.js`.
- Middleware: `src/middleware/requireSession.js` reads `Authorization: Bearer <sid>`.
- Service: `src/services/session.service.js` manages create/get/touch/delete.
 - User cache: `src/services/users.service.js` caches user profile at `user:<userId>` for fast lookup.

Protected example:
- `GET /v1/users/me` returns username, email, roles quickly via session + user cache.
- `POST /v1/auth/logout` invalidates the current session.

Run a quick session smoke test:

```bash
node api/tests/session-smoke.js
```

## Notes & troubleshooting

- If you see `ERR_MODULE_NOT_FOUND` for a package (for example `dotenv`) then run `npm install` in `api/`.
- If a route import fails (e.g. `preferences.routes.js`), ensure the referenced file exists under `src/routes/v1/`. A minimal placeholder was created to allow startup; replace it with the real route implementation as needed.
- The project uses ES modules (`"type": "module"` in `package.json`). Keep `import`/`export` syntax in new files.

## Health checks and graceful shutdown

`src/server.js` prints a startup log: `API server listening on port <PORT>`.
It also listens for `SIGINT` and exits gracefully.

## Next steps (optional)

- Add a short integration test that starts `src/server.js` and checks `/v1/health`.
- Add `nodemon` or `pm2` if you prefer their features.
- Containerize the API with a `Dockerfile` for consistent deployment.

If you'd like, I can add any of the optional items above or update this README to include project-specific env variables (DB, Redis, etc.) — tell me which one to do next.
# Eagle Guide — API (Node.js + Express)

Backend service for the Eagle Guide project.  
Provides authentication (opaque Redis sessions), GIS endpoints (PostGIS + Redis cache-aside), and user preferences (Postgres JSONB). Designed for the React Native app in `/EagleGuide` and infra in `/infra`.

## Stack

- **Node.js** (ES Modules) + **Express**
- **Postgres**/**PostGIS** (spatial data, preferences)
- **Redis** (sessions + caching)
- **zod** (request validation)
- **helmet**, **cors**, **rate-limit** (security defaults)
- **pino** (logging)

---

## Quick Start

> Prereqs: FIXME

### 1 Install

```bash
cd api
```

---

## Analytics integration (unified server)

Analytics HTTP endpoints are mounted at `/analytics` by `src/app.js`, reusing the main Express server. Background services can optionally run inside the same Node.js process:

- `ANALYTICS_WORKER=true` — start Redis Stream consumer that writes events to Postgres and feeds RedisTimeSeries.
- `ANALYTICS_AGGREGATOR=true` — start periodic SQL job to aggregate per-minute metrics.

These are disabled by default. Configure via environment variables in `api/.env` (see `.env.example`).

The RedisTimeSeries client is enabled via `@redis/time-series`. For basic smoke tests, you can use a built-in mock client by setting `ANALYTICS_MOCK=1`, which allows analytics routes to respond without a live Redis instance.

### Smoke test (no external services required)

```bash
# from repository root
node api/scripts/smoke-test.js
```

What it does:
- Boots the app on a random port with `ANALYTICS_MOCK=1`
- GETs `/v1/health`, `/analytics/api/ts/latest`, and `/analytics/api/keys`
- Prints `SMOKE TEST PASS` on success