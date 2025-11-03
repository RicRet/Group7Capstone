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