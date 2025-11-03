import { query } from './pgClient.js';


async function upsertLastMinute() {
// Aggregate the previous full minute to keep numbers stable
const sql = `
WITH last_min AS (
SELECT date_trunc('minute', NOW() - interval '1 minute') AS bucket
),
base AS (
SELECT
date_trunc('minute', occurred_at) AS bucket_minute,
COUNT(*) FILTER (WHERE event_type = 'api_call') AS req_count,
COUNT(*) FILTER (WHERE event_type = 'error' OR success = false) AS error_count,
AVG(latency_ms) FILTER (WHERE latency_ms IS NOT NULL) AS avg_latency_ms,
PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM analytics.app_events, last_min
WHERE occurred_at >= bucket AND occurred_at < bucket + interval '1 minute'
GROUP BY 1
)
INSERT INTO analytics.api_metrics_minute(bucket_minute, req_count, error_count, avg_latency_ms, p95_latency_ms)
SELECT bucket_minute, COALESCE(req_count,0), COALESCE(error_count,0), avg_latency_ms, p95_latency_ms
FROM base
ON CONFLICT (bucket_minute) DO UPDATE SET
req_count = EXCLUDED.req_count,
error_count = EXCLUDED.error_count,
avg_latency_ms = EXCLUDED.avg_latency_ms,
p95_latency_ms = EXCLUDED.p95_latency_ms,
updated_at = NOW();
`;
await query(sql);
}


setInterval(() => {
upsertLastMinute().catch(e => console.error('Aggregator error:', e.message));
}, 15_000);


console.log('Aggregator running (15s)…');