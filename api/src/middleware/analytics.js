import { randomUUID } from 'node:crypto';

// Lazy import inside factory to avoid ESM cycle cost on startup when disabled
function getRedisClient() {
  return import('../../Analytics/src/redisClient.js').then(m => m.getClient());
}

// Middleware factory
export function analytics(options = {}) {
  const {
    enabled = process.env.ANALYTICS_PRODUCER !== '0',
    streamKey = 'events:app',
  } = options;

  const MOCK = String(process.env.ANALYTICS_MOCK).toLowerCase() === 'true' || process.env.ANALYTICS_MOCK === '1';

  if (!enabled || MOCK) {
    // no-op middleware
    return (_req, _res, next) => next();
  }

  return (req, res, next) => {
    const start = Date.now();
    const sessionId = req.sid || 'anonymous';
    const device = req.headers['x-device'] || null;
    const appVersion = req.headers['x-app-version'] || null;

    function onFinish() {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onFinish);

      const elapsed = Date.now() - start;
      const success = res.statusCode < 400;

      const event = {
        event_uuid: randomUUID(),
        session_id: String(sessionId),
        user_id: req.session?.userId ? String(req.session.userId) : null,
        device: device ? String(device) : null,
        app_version: appVersion ? String(appVersion) : null,
        occurred_at_ms: String(Date.now()),
        event_type: 'api_call',
        latency_ms: String(elapsed),
        success: success ? 'true' : 'false',
        building_id: null,
        path: req.originalUrl || req.url,
        method: req.method,
        status_code: String(res.statusCode)
      };

      // Fire-and-forget: do not block the request lifecycle
      getRedisClient()
        .then(r => r.xAdd(streamKey, '*', event, { TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: 10000 } }))
        .catch(() => {/* swallow errors to keep request path healthy */});
    }

    res.on('finish', onFinish);
    res.on('close', onFinish);
    next();
  };
}
