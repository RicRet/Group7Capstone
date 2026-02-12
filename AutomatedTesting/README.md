# AutomatedTesting

This folder holds self-contained automated test scaffolding for EagleGuide. It does not modify the app or API code; everything runs from here.

## Prereqs
- Node 18+ (ESM support)
- From this folder: `npm install` to pull the test-only deps.
- API env: copy `api/.env` to `api/.env.test` or export the same variables if you want live DB runs. The backend tests here stub the DB by default.

## Commands
- `npm run test:backend` — vitest + supertest integration-style tests for `/v1/userroute` (BC-104/105/106/107/108, INT-01).
- `npm run test:frontend` — jest-expo + React Native Testing Library component tests for homepage, add route, and auth (BC-001/002/003/004/005/007, BC-100/LG-01/LG-02/LG-03/LG-05).
- `npm test` — runs both suites.

## What is covered now
- Backend: create/read/update/delete user routes with mocked PG and Redis; error paths for missing fields and missing IDs.
- Frontend: homepage quick actions navigation, add-route validation + alerts, login masking and messaging, signup button gating on password requirements.

## Next additions (drop in new files)
- Add INT-03 cache assertions by swapping DB mock for live Redis and checking response headers/time.
- Add SignupEmail flow and edit-route component tests.
- Add Detox E2E flow (login → add route → delete route) using the same folder for config.

## Notes
- Paths in tests import the real app/API code from the repo
- If you want live DB tests, remove the DB mock in `backend/addroute.integration.test.ts` and point env vars at the test database.
