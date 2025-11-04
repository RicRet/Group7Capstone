import express from 'express';
import { query } from './db/pg.js';

const router = express.Router();

//Function to inserst routes into db
router.post('/routes', async (req, res) => {
  const { prevb, newb } = req.body;
    
  if (!prevb || !newb) {
    return res.json({ message: 'Needs both buildings' });
  }

  try {
    const result = await query(
      `INSERT INTO gis.paths (description, type, accessibility_path_type)
       VALUES ($1, 'pedestrian', 1)
       RETURNING path_id;`,
      [`Route from ${prevb} to ${newb}`]
    );

    res.json({
      message: `Route saved from ${prevb} to ${newb}`,
      path_id: result[0].path_id,
    });
  } catch (err) {
    console.error('Insert error');
  
  }
});

export default router;





