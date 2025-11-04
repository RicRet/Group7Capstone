//loads env before anything else

import dotenv from 'dotenv';
dotenv.config({ path: './api/src/.env' });
console.log('✅ Loaded .env');

//loads other imports
const { default: express } = await import('express');
const { default: cors } = await import('cors');
const { default: routes } = await import('./addrouteps.js');
const { createApp } = await import('./app.js');



const PORT = process.env.PORT || 3000;

const app = createApp();

//mounts the addroutefunction
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down');
  process.exit(0);
});
