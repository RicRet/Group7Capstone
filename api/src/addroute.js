import express from 'express';
import { query } from './db/pg.js';

const router = express.Router();

//Function to inserst routes into db
router.post('/userroute', async (req, res) => {
const { userid, prevb, newb, prevblon, prevblat, newblon, newblat, accessible, length, duration } = req.body;
    
   if (!userid || !prevb || !newb ||  prevblat == null || prevblon == null ||newblat == null ||newblon == null || accessible == null) {
    return res.json({ message: 'Needs all options selected' });
  }

  try {
    const result = await query(
      `INSERT INTO users.user_saved_route (user_id,name,start_geom,end_geom,is_accessible,length_m,duration_s) 
      VALUES ($1,$2,ST_SetSRID(ST_Point($3, $4), 4326),ST_SetSRID(ST_Point($5, $6), 4326),$7,$8,$9
      ) RETURNING saved_route_id;`,
      [userid, `Route from ${prevb} to ${newb}`, prevblon,  prevblat, newblon, newblat, accessible,length || null, duration || null]
    );


    res.json({
      message: `Route saved from ${prevb} to ${newb}`,
      saved_route_id: result[0].saved_route_id,
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
