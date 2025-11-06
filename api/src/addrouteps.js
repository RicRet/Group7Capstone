import express from 'express';
import { query } from './db/pg.js';

const router = express.Router();

//Function to inserst routes into db
router.post('/routes', async (req, res) => {
  const { prevb, newb, type, accessibility } = req.body;
    
  if (!prevb || !newb || !type || accessibility == null) {
    return res.json({ message: 'Needs all options selected' });
  }

  try {
    const result = await query(
      `INSERT INTO gis.paths (description, type, accessibility_path_type)
       VALUES ($1, $2, $3)
       RETURNING path_id;`,
      [`Route from ${prevb} to ${newb}`, type, accessibility]
    );

    res.json({
      message: `Route saved from ${prevb} to ${newb}`,
      path_id: result[0].path_id,
    });
  } catch (err) {
    console.error('Insert error', err);
    res.status(500).json({ message: 'Database error' });
  }
});

//Gets route for front end to list
router.get('/routes', async (req, res) => {
  try {
     const result = await query(`SELECT * FROM gis.paths ORDER BY path_id DESC;`);
    res.json(result);
  } catch (err) {
    console.error('get error');
  
  }
});



//Delete Route function
router.delete('/routes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM gis.paths WHERE path_id = $1 RETURNING path_id, description`,
      [id]
    );

    if (result.length === 0) {
      return res.json({ message: 'No Route with that id exists' });
    }

    res.json({
      message: `Route ${id} has been deleted `,
    });
  } catch (err) {
    console.error('Deletion error');
  }
});




export default router;





