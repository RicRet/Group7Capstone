import dotenv from 'dotenv';
dotenv.config({ path: './api/src/.env' });
console.log('✅ Loaded .env');

const { createApp } = await import('./app.js');


const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down');
  process.exit(0);
});

