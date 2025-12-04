//loads env before anything else

import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });
console.log('✅ Loaded .env');

//loads other imports
const { default: express } = await import('express');
const { default: cors } = await import('cors');
const { default: userroute } = await import('./addroute.js');
const { createApp } = await import('./app.js');



const PORT = process.env.PORT || 8080;

const app = createApp();

//mounts the addroutefunction
app.use('/v1', userroute);


app.listen(PORT, '0.0.0.0', () => {
  console.log(` API server listening on http://0.0.0.0:${PORT}`);
});


// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down');
  process.exit(0);
});
