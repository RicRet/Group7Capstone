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
router.get('/userroute/:userid', async (req, res) => {
  const { userid } = req.params;

  try {
    const result = await query(
      `SELECT saved_route_id,user_id,name,ST_X(start_geom) AS start_lon,ST_Y(start_geom) AS start_lat,
        ST_X(end_geom) AS end_lon,ST_Y(end_geom) AS end_lat,is_accessible,length_m,duration_s,
        created_at
      FROM users.user_saved_route
      WHERE user_id = $1;`,
      [userid]
    );

    res.json(result);
  } catch (err) {
    console.error('Get error', err);
    res.status(500).json({ message: 'Database error' });
  }
});




//Delete Route function
router.delete('/userroute/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM users.user_saved_route 
       WHERE saved_route_id = $1 
       RETURNING saved_route_id;`,
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'No route with that ID exists' });
    }

    res.json({
      message: `Route ${id} has been deleted.`,
      deleted_id: result[0].saved_route_id
    });
  } catch (err) {
    console.error('Deletion error', err);
    res.status(500).json({ message: 'Database error' });
  }
});
//edit route function
router.put('/userroute/:id', async (req, res) => {
  const { id } = req.params;
  const { name, start_lon, start_lat, end_lon, end_lat, accessible, length, duration } = req.body;

  try {
    const result = await query(
      `UPDATE users.user_saved_route
      SET
      name = COALESCE($1, name),start_geom = COALESCE(ST_SetSRID(ST_Point($2, $3), 4326), start_geom),end_geom = COALESCE(ST_SetSRID(ST_Point($4, $5), 4326), end_geom),
      is_accessible = COALESCE($6, is_accessible),length_m = COALESCE($7, length_m),duration_s = COALESCE($8, duration_s)
      WHERE saved_route_id = $9
      RETURNING saved_route_id;`,
      [name || null,start_lon || null,start_lat || null,end_lon || null,end_lat || null,accessible,length || null,duration || null,id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json({
      message: `Route ${id} updated successfully`,
      updated_id: result[0].saved_route_id
    });

  } catch (err) {
    console.error('Edit error', err);
    res.status(500).json({ message: 'Database error' });
  }
});




export default router;
