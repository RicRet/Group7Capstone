import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 8080;

const app = createApp();

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down');
  process.exit(0);
});
