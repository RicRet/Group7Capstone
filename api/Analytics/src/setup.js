import { getClient } from './redisClient.js';

async function ensureTs(client, key, { retention = 0, labels = {} } = {}) {
  const exists = await client.exists(key);
  if (!exists) {
    await client.ts.create(key, { RETENTION: retention, LABELS: labels });
    console.log('Created TS', key);
  }
}

async function ensureRule(client, source, agg, bucketMs, dest) {
  const destExists = await client.exists(dest);
  if (!destExists) {
    await client.ts.create(dest, { LABELS: { metric: source, bucket: String(bucketMs), agg } });
  }


  try {
    await client.sendCommand([
      'TS.CREATERULE',
      source,
      dest,
      'AGGREGATION',
      String(agg).toUpperCase(),
      String(bucketMs)
    ]);
    console.log(`Rule: ${source} -> (${agg}/${bucketMs}ms) -> ${dest}`);
  } catch (e) {
    const msg = String(e?.message || '').toLowerCase();
    if (!msg.includes('already exists') && !msg.includes('busy')) {
      throw e;
    }
  }
}

(async () => {
  const client = await getClient();

  const dayMs = 24 * 60 * 60 * 1000;
  await ensureTs(client, 'ts:req:count',   { retention: dayMs, labels: { kind: 'req' } });
  await ensureTs(client, 'ts:latency:ms',  { retention: dayMs, labels: { kind: 'latency' } });
  await ensureTs(client, 'ts:errors:count',{ retention: dayMs, labels: { kind: 'errors' } });

  const buckets = [10_000, 60_000];
  for (const b of buckets) {
    await ensureRule(client, 'ts:req:count',   'SUM', b, `ts:req:count:${b}`);
    await ensureRule(client, 'ts:latency:ms',  'AVG', b, `ts:latency:ms:${b}`);
    await ensureRule(client, 'ts:errors:count','SUM', b, `ts:errors:count:${b}`);
  }

  console.log('Setup complete.');
  process.exit(0);
})();
