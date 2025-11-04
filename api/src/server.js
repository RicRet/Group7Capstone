import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 8080;

const app = createApp();

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

// Optionally start analytics background services in-process
async function maybeStartAnalytics() {
  try {
    if (String(process.env.ANALYTICS_WORKER).toLowerCase() === 'true') {
      // Starts an event consumer loop for Redis Streams -> Postgres
      await import('../Analytics/src/worker.js');
      console.log('Analytics worker started');
    }
    if (String(process.env.ANALYTICS_AGGREGATOR).toLowerCase() === 'true') {
      // Starts periodic SQL aggregation job
      await import('../Analytics/src/aggregator.js');
      console.log('Analytics aggregator started');
    }
  } catch (e) {
    console.error('Failed to start analytics background services:', e?.message || e);
  }
}

maybeStartAnalytics();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down');
  process.exit(0);
});
