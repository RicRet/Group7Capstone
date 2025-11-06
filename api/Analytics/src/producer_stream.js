// src/producer_stream.js
import { randomUUID } from 'crypto';
import 'dotenv/config';
import { getClient } from './redisClient.js';

function nowMs() { return Date.now(); }
function randn(m, s) {
  const u = 1 - Math.random(), v = 1 - Math.random();
  return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function pickEventType() {
  const r = Math.random();
  return r < 0.01 ? 'error'
       : r < 0.20 ? 'search'
       : r < 0.50 ? 'navigate'
       : r < 0.80 ? 'api_call'
       : 'app_open';
}

// Configurable target RPM pattern
const BASE_RPM = Number(process.env.ANALYTICS_RPM_BASE || 600);          // 600 rpm = 10 rps
const AMP_RPM = Number(process.env.ANALYTICS_RPM_AMPLITUDE || 400);      // +/- amplitude
const PERIOD_S = Number(process.env.ANALYTICS_RPM_PERIOD_S || 300);      // 5 min cycle
const SPIKE_PROB = Number(process.env.ANALYTICS_RPM_SPIKE_PROB || 0.01); // occasional spike
const SPIKE_FACTOR = Number(process.env.ANALYTICS_RPM_SPIKE_FACTOR || 3);

function targetRpm(tMs) {
  const t = tMs / 1000; // seconds
  const cyc = Math.sin((2 * Math.PI * t) / PERIOD_S); // [-1,1]
  let rpm = BASE_RPM + (AMP_RPM * (cyc + 1)) / 2;     // [base, base+amp]
  if (Math.random() < SPIKE_PROB) rpm *= SPIKE_FACTOR; // rare burst
  // clamp to reasonable bounds
  return Math.max(0, Math.min(rpm, 6000));
}

// Poisson sampler for events/second
function samplePoisson(lambda) {
  // Knuth's algorithm; fast enough for lambda up to ~20. For larger, approximate with normal.
  if (lambda > 25) {
    // Normal approximation N(lambda, lambda)
    const z = randn(0, 1);
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
  }
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

const client = await getClient();

setInterval(async () => {
  const now = nowMs();
  const rpm = targetRpm(now);
  const lambdaPerSecond = rpm / 60;
  const n = samplePoisson(lambdaPerSecond);

  if (n === 0) return; // no events this second

  const events = Array.from({ length: n }).map(() => ({
    event_uuid: randomUUID(),
    session_id: `sess_${Math.ceil(Math.random() * 20)}`,
    user_id: `user_${Math.ceil(Math.random() * 200)}`,
    device: Math.random() < 0.5 ? 'android' : 'ios',
    app_version: '1.0.' + Math.ceil(Math.random() * 3),
    occurred_at_ms: String(nowMs()),
    event_type: pickEventType(),
    latency_ms: String(Math.max(10, Math.round(randn(120, 40)))),
    success: Math.random() > 0.03 ? 'true' : 'false',
    building_id: String(Math.ceil(Math.random() * 40))
  }));

  try {
    await Promise.all(
      events.map(event => client.xAdd(
        'events:app',
        '*',
        event,
        { TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 50000 } }
      ))
    );
    process.stdout.write(`rpm≈${rpm.toFixed(0)} emitted=${n}      \r`);
  } catch (e) {
    console.error('xAdd error:', e?.message || e);
  }
}, 1000);
