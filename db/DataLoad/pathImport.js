// pathImport.js (Routes API)
import axios from 'axios';
import 'dotenv/config';
import { withTx } from './db.js';
import { lineStringWKT } from './wkt.js';
// Optional fallback if GeoJSON polyline isn't returned
// npm i polyline
import polyline from 'polyline';

const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

// Build a payload that only includes routingPreference for DRIVE
function buildRoutesBody({ origin, destination, travelMode = 'WALK', computeAlternativeRoutes = false }) {
  const body = {
    origin:      { address: origin },
    destination: { address: destination },
    travelMode,
    computeAlternativeRoutes
  };
  if (travelMode === 'DRIVE') {
    // Allowed values: TRAFFIC_UNAWARE, TRAFFIC_AWARE, TRAFFIC_AWARE_OPTIMAL (if enabled)
    body.routingPreference = 'TRAFFIC_UNAWARE';
  }
  return body;
}

async function directions(origin, destination, travelMode = 'WALK') {
  try {
    const body = buildRoutesBody({ origin, destination, travelMode });

    const { data } = await axios.post(
      ROUTES_URL,
      body,
      {
        headers: {
          'X-Goog-Api-Key': GMAPS_KEY,
          // Request both: prefer GeoJSON, but also fetch encoded polyline for fallback
          'X-Goog-FieldMask': [
            'routes.distanceMeters',
            'routes.duration',
            'routes.polyline.geoJsonLinestring',
            'routes.polyline.encodedPolyline'
          ].join(',')
        },
        timeout: 15000
      }
    );

    const route = data?.routes?.[0];
    if (!route) throw new Error(`No route returned`);

    // Primary: GeoJSON LineString
    const gj = route.polyline?.geoJsonLinestring;
    if (gj?.type === 'LineString' && Array.isArray(gj.coordinates) && gj.coordinates.length > 1) {
      // coordinates are [lng, lat]
      return gj.coordinates;
    }

    // Fallback: decode encoded polyline -> convert to [lng, lat]
    const enc = route.polyline?.encodedPolyline;
    if (enc) {
      const latlng = polyline.decode(enc); // [[lat, lng], ...]
      const coords = latlng.map(([lat, lng]) => [lng, lat]);
      return coords;
    }

    throw new Error(`No polyline found on route: ${JSON.stringify(route)}`);
  } catch (e) {
    console.error('Routes API error:', e.response?.status, e.response?.data || e.message);
    throw e;
  }
}

// --- unchanged below here, shown for context ---
async function main() {
  const origin = 'Willis Library, University of North Texas, Denton, TX';
  const destination = 'Student Union, University of North Texas, Denton, TX';

  await withTx(async (client) => {
    const coords = await directions(origin, destination, 'WALK'); // no routingPreference will be sent
    const wkt = lineStringWKT(coords); // expects [ [lng,lat], ... ]

    await client.query(
      `INSERT INTO gis.paths(description, type, accessibility_path_type, path)
       VALUES ($1, $2, $3, ST_GeogFromText($4))`,
      [`${origin} → ${destination}`, 'walking', 1, wkt]
    );

    console.log(`Inserted path with ${coords.length} vertices`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
