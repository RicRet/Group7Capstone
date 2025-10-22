// seed_buildings.js
import 'dotenv/config';
import fs from 'node:fs';
import { withTx } from './db.js';
import { gmaps, GMAPS_KEY, sleep } from './gmaps.js';
import { pointWKT } from './wkt.js';

const buildings = JSON.parse(fs.readFileSync('./buildings.json','utf8'));

async function geocode(name) {
  const { data } = await gmaps.geocode({
    params: { address: `${name}, University of North Texas, Denton, TX`, key: GMAPS_KEY }
  });
  if (!data.results?.length) return null;
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

async function main() {
  await withTx(async (client) => {
    for (const b of buildings) {
      const geo = await geocode(b.name);
      if (!geo) { console.warn(`No geocode for ${b.name}`); continue; }

      const wkt = pointWKT(geo.lng, geo.lat);
      await client.query(
        `INSERT INTO gis.buildings(name, description, type, location)
         VALUES ($1,$2,$3, ST_GeogFromText($4))`,
        [b.name, b.description ?? null, b.type ?? null, wkt]
      );

      console.log(`Inserted building: ${b.name} @ (${geo.lat}, ${geo.lng})`);
      await sleep(150); // tiny pause for rate limiting friendliness
    }
  });
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
