import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';
import { validate } from '../../middleware/validate.js';
import { buildingsByBbox, parkingLotsByBbox } from '../../services/gis.service.js';
import { bboxQuery } from '../../validations/gis.schema.js';

const r = Router();

r.get('/buildings', requireSession, validate(bboxQuery), async (req, res) => {
  const { minLon, minLat, maxLon, maxLat } = req.query;
  const data = await buildingsByBbox([+minLon, +minLat, +maxLon, +maxLat]);
  res.json(data);
});

r.get('/parking-lots', requireSession, validate(bboxQuery), async (req, res) => {
  const { minLon, minLat, maxLon, maxLat } = req.query;
  const data = await parkingLotsByBbox([+minLon, +minLat, +maxLon, +maxLat]);
  res.json(data);
});

export default r;
