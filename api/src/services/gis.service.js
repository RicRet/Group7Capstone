import crypto from 'node:crypto';
import { keys } from '../cache/keys.js';
import { TTL } from '../cache/policy.js';
import { jsonGet, jsonSet } from '../cache/redis.js';
import { query } from '../db/pg.js';

function hashBbox(b) {
  return crypto.createHash('md5').update(b.join(',')).digest('hex').slice(0, 10);
}

// Snap bounding boxes to a coarse grid to avoid thousands of near-duplicate keys
function normalizeBbox(bbox, precision = 3) {
  return bbox.map((v) => Number(v.toFixed(precision)));
}

export async function buildingsByBbox([minLon, minLat, maxLon, maxLat]) {
  const norm = normalizeBbox([minLon, minLat, maxLon, maxLat]);
  const k = keys.gis.bbox(hashBbox(norm));
  const cached = await jsonGet(k);
  if (cached) return cached;

  const rows = await query(//query taht gets the nearest buildings
    `SELECT ST_AsGeoJSON(geom)::json AS geojson
     FROM buildings
     WHERE geom && ST_MakeEnvelope($1,$2,$3,$4, 4326)`,
    norm
  );
  const features = rows.map(r => ({ type: 'Feature', geometry: r.geojson, properties: {} }));
  const fc = { type: 'FeatureCollection', features };
  await jsonSet(k, fc, TTL.gis);
  return fc;
}

export async function parkingLotsByBbox([minLon, minLat, maxLon, maxLat]) {
  const norm = normalizeBbox([minLon, minLat, maxLon, maxLat]);
  const k = keys.gis.parkingLotsBbox(hashBbox(norm));
  const cached = await jsonGet(k);
  if (cached) return cached;

  const rows = await query(
    `SELECT lot_id, description, zone, fill,
            ST_AsGeoJSON(location::geometry)::json AS geometry
       FROM gis.parking_lots
      WHERE ST_Intersects(location, ST_MakeEnvelope($1,$2,$3,$4, 4326)::geography)`,
    norm
  );

  const features = rows.map(r => ({
    type: 'Feature',
    geometry: r.geometry,
    properties: {
      lot_id: r.lot_id,
      description: r.description,
      zone: r.zone,
      fill: r.fill
    }
  }));

  const fc = { type: 'FeatureCollection', features };
  await jsonSet(k, fc, TTL.gis);
  return fc;
}
