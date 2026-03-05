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
  const rows = await query(
    `SELECT
        building_id,
        name,
        description,
        type,
        fill,
        ST_AsGeoJSON(location::geometry)::json AS geometry
     FROM gis.buildings
     WHERE ST_Intersects(
       location::geometry,
       ST_MakeEnvelope($1,$2,$3,$4,4326)
     )`,
    [minLon, minLat, maxLon, maxLat]
  );
  return {
    type: 'FeatureCollection',
    features: rows.map(r => ({
      type: 'Feature',
      geometry: r.geometry,
      properties: {
        building_id: r.building_id,
        name: r.name,
        description: r.description,
        type: r.type,
        fill: r.fill
      }
    }))
  };
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
export async function entrancesByBbox([minLon, minLat, maxLon, maxLat]) {
  const norm = normalizeBbox([minLon, minLat, maxLon, maxLat]);
  const k = keys.gis.entrancesBbox(hashBbox(norm));
  const cached = await jsonGet(k);
  if (cached) return cached;

  const rows = await query(
    `SELECT entrance_id,
            entrance_name,
            entrance_accessible,
            ST_AsGeoJSON(location::geometry)::json AS geometry
       FROM gis.entrances
      WHERE ST_Intersects(
        location::geometry,
        ST_MakeEnvelope($1,$2,$3,$4,4326)
      )`,
    norm
  );

  const features = rows.map(r => ({
    type: 'Feature',
    geometry: r.geometry,
    properties: {
      entrance_id: r.entrance_id,
      entrance_name: r.entrance_name,
      entrance_accessible: r.entrance_accessible
    }
  }));

  const fc = { type: 'FeatureCollection', features };
  await jsonSet(k, fc, TTL.gis);
  return fc;
}

export async function bicycleParkingByBbox([minLon, minLat, maxLon, maxLat]) {
  const norm = normalizeBbox([minLon, minLat, maxLon, maxLat]);
  const k = keys.gis.bicycleParkingBbox(hashBbox(norm));
  const cached = await jsonGet(k);
  if (cached) return cached;

  const rows = await query(
    `SELECT
        bicycle_pk,
        fid,
        ST_AsGeoJSON(location::geometry)::json AS geometry
     FROM gis.bicycle_parking
     WHERE ST_Intersects(
       location::geometry,
       ST_MakeEnvelope($1,$2,$3,$4,4326)
     )`,
    norm
  );

  const features = rows.map(r => ({
    type: 'Feature',
    geometry: r.geometry,
    properties: {
      bicycle_pk: r.bicycle_pk,
      fid: r.fid
    }
  }));

  const fc = { type: 'FeatureCollection', features };
  await jsonSet(k, fc, TTL.gis);
  return fc;
}

export async function emergencyPhonesByBbox([minLon, minLat, maxLon, maxLat]) {
  const norm = normalizeBbox([minLon, minLat, maxLon, maxLat]);
  const k = keys.gis.emergencyPhonesBbox(hashBbox(norm));
  const cached = await jsonGet(k);
  if (cached) return cached;

  const rows = await query(
    `SELECT
        phone_pk,
        objectid,
        ST_AsGeoJSON(location::geometry)::json AS geometry
     FROM gis.emergency_phones
     WHERE ST_Intersects(
       location::geometry,
       ST_MakeEnvelope($1,$2,$3,$4,4326)
     )`,
    norm
  );

  const features = rows.map(r => ({
    type: 'Feature',
    geometry: r.geometry,
    properties: {
      phone_pk: r.phone_pk,
      objectid: r.objectid
    }
  }));

  const fc = { type: 'FeatureCollection', features };
  await jsonSet(k, fc, TTL.gis);
  return fc;
}