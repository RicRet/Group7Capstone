// src/producer_stream.js
import { randomUUID } from 'crypto';
import { getClient } from './redisClient.js';

function nowMs() { return Date.now(); }
function randn(m, s) {
  const u = 1 - Math.random(), v = 1 - Math.random();
  return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function pickEventType() {
  const r = Math.random();
  return r < 0.05 ? 'error'
       : r < 0.20 ? 'search'
       : r < 0.50 ? 'navigate'
       : r < 0.80 ? 'api_call'
       : 'app_open';
}

const client = await getClient();

setInterval(async () => {
  const event = {
    event_uuid: randomUUID(),
    session_id: `sess_${Math.ceil(Math.random() * 5)}`,
    user_id: `user_${Math.ceil(Math.random() * 50)}`,
    device: Math.random() < 0.5 ? 'android' : 'ios',
    app_version: '1.0.' + Math.ceil(Math.random() * 3),
    occurred_at_ms: String(nowMs()),
    event_type: pickEventType(),
    latency_ms: String(Math.max(10, Math.round(randn(120, 40)))),
    success: Math.random() > 0.03 ? 'true' : 'false',
    building_id: String(Math.ceil(Math.random() * 40))
  };

  // ✅ Correct xAdd usage:
  await client.xAdd(
    'events:app',
    '*',                      // id
    event,                    // fields object (all string values are safe)
    {                         // options (trim-ish)
      TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 10000 }
    }
  );
}, 1000);
