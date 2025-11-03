//loads import from dotenv before the rest
import dotenv from 'dotenv';
dotenv.config({ path: './api/src/.env' });
console.log('✅ Loaded .env');

// awaits import from .env
const { default: express } = await import('express');
const { default: cors } = await import('cors');
const { query } = await import('./db/pg.js');

// sets up server
const server = express();
server.use(cors());
server.use(express.json());

//adds new route
server.post('/api/routes', async (req, res) => {
  const { prevb, newb } = req.body;
  if (!prevb || !newb)
    return res.json({ message: 'Needs both buildings ' });

  try {
    const result = await query(
      `INSERT INTO gis.paths (description, type, accessibility_path_type)
       VALUES ($1, 'pedestrian', 1)
       RETURNING path_id;`,
      [`Route from ${prevb} to ${newb}`]
    );

    res.json({
      message: `Route saved from ${prevb} to ${newb}`,
    });
  } catch (err) {
    console.error('Insert error');
  }
});



// Start server
server.listen(3000, () => console.log('✅ Server running on port 3000'));

