// seed_parking_from_geojson.js
import 'dotenv/config';
import fs from 'node:fs';
import { withTx } from './db.js';
import { polygonWKT } from './wkt.js';

function toRings(geometry) {
  // Return array-of-rings in [ [ [lng,lat], ... ], ... ]
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') {
    // Flatten multipolygon into individual inserts (or merge if you prefer)
    return geometry.coordinates.flat();
  }
  return null;
}

async function main() {
  const gj = JSON.parse(fs.readFileSync('./parking_lots.geojson','utf8'));

  await withTx(async (client) => {
    for (const f of gj.features) {
      const rings = toRings(f.geometry);
      if (!rings) continue;

      // Ensure each ring is explicitly closed
      const closed = rings.map(r => (r.length && (r[0][0] !== r[r.length-1][0] || r[0][1] !== r[r.length-1][1]))
        ? [...r, r[0]] : r
      );

      const wkt = polygonWKT(closed);
      const desc = f.properties?.description ?? 'Parking Lot';
      const zone = f.properties?.zone ?? null;

      await client.query(
        `INSERT INTO gis.parking_lots(description, location)
         VALUES ($1, ST_GeogFromText($2))`,
        [desc, wkt, zone]
      );
      console.log(`Inserted parking lot: ${desc}`);
    }
  });

  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
