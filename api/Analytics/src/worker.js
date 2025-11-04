// src/worker.js
import { v5 as uuidv5 } from 'uuid';
import { query } from './pgClient.js';
import { getClient as getRedis } from './redisClient.js';
// Try to reuse the main API session store if available. If a session
// exists in the main app (created via session.service), prefer that
// session id for analytics. Falls back to deterministic uuidv5 when
// no main-session is found.
import { getSession } from '../../src/services/session.service.js';

const STREAM = 'events:app';
const GROUP = 'eg:cg';
const CONSUMER = `worker-${process.pid}`;

// Fixed namespace UUID (generate once and keep it stable for your project)
const NAMESPACE = '3b241101-e2bb-4255-8caf-4136c566a962';
const toUuid = (s) => uuidv5(String(s ?? ''), NAMESPACE);
const toBool = (s) => s === 'true' || s === '1';

async function handleBatch(r, messages) {
  for (const { id, message } of messages) {
    const e = message; // strings

    try {
      const t = Number(e.occurred_at_ms);
      const sessionLabel = e.session_id ?? 'unknown';

      // Prefer an existing session from the main API (if client used it).
      // getSession returns stored object or null.
      let session_uuid = null;
      try {
        const s = await getSession(sessionLabel);
        if (s) {
          // session.service uses UUIDs as sid values; use that directly
          session_uuid = sessionLabel;
        }
      } catch (err) {
        // ignore lookup errors and fall back to uuidv5
      }

      if (!session_uuid) {
        session_uuid = toUuid(sessionLabel);
      }

      // 0) ensure the session exists (best-effort) in analytics table
      await query(
        `INSERT INTO analytics.user_sessions (session_id, user_id, device, app_version, started_at)
         VALUES ($1, $2, $3, $4, to_timestamp($5/1000.0))
         ON CONFLICT (session_id) DO NOTHING`,
        [
          session_uuid,
          e.user_id ?? null,
          e.device ?? null,
          e.app_version ?? null,
          t
        ]
      );

      // 1) store raw event (idempotent on event_uuid)
      await query(
        `INSERT INTO analytics.app_events
           (event_uuid, session_id, occurred_at, event_type, latency_ms, success, building_id, payload)
         VALUES
           ($1, $2, to_timestamp($3/1000.0), $4, $5, $6, $7, $8::jsonb)
         ON CONFLICT (event_uuid) DO NOTHING`,
        [
          e.event_uuid,                    // from producer_stream.js
          session_uuid,                    // UUID derived from label
          t,
          e.event_type ?? 'app_open',
          e.latency_ms ? Number(e.latency_ms) : null,
          toBool(e.success ?? 'true'),
          e.building_id ? Number(e.building_id) : null,
          JSON.stringify({ device: e.device, app_version: e.app_version })
        ]
      );

      // 2) feed RedisTimeSeries for live charts
      await Promise.all([
        r.ts.add('ts:req:count', t, 1),
        r.ts.add('ts:latency:ms', t, e.latency_ms ? Number(e.latency_ms) : 0),
        r.ts.add('ts:errors:count', t, (e.event_type === 'error' || e.success === 'false') ? 1 : 0)
      ]);

      // 3) ACK
      await r.xAck(STREAM, GROUP, id);
      console.log(`ACKed ${id}`);
    } catch (err) {
      console.error('Worker error on', id, err.message);
      // no ack -> stays pending for retry
    }
  }
}

async function main() {
  const r = await getRedis();
  try {
    await r.xGroupCreate(STREAM, GROUP, '0-0', { MKSTREAM: true });
    console.log(`Created group ${GROUP} at 0-0`);
  } catch (e) {
    if (!String(e?.message).includes('BUSYGROUP')) throw e;
  }

  console.log(`Worker ${CONSUMER} running…`);

  setInterval(async () => {
    try {
      const { messages } = await r.xAutoClaim(STREAM, GROUP, CONSUMER, 60_000, '0-0', { COUNT: 50 });
      if (messages?.length) {
        console.log(`Auto-claiming ${messages.length} pending messages`);
        await handleBatch(r, messages);
      }
    } catch (e) {
      console.error('xAutoClaim error:', e.message);
    }
  }, 15_000);

  while (true) {
    const resp = await r.xReadGroup(GROUP, CONSUMER, [{ key: STREAM, id: '>' }], { COUNT: 100, BLOCK: 5000 });
    if (!resp) continue;
    for (const s of resp) {
      console.log(`Got ${s.messages.length} msgs from ${s.name}`);
      await handleBatch(r, s.messages);
    }
  }
}

main().catch((e) => {
  console.error('Worker fatal', e);
  process.exit(1);
});
