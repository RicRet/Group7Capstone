import Constants from "expo-constants";

export type Coordinates = { latitude: number; longitude: number };
export type Profile = "foot-walking" | "cycling-regular" | "driving-car";

/**
 * Calls OpenRouteService Directions API.
 * Requires `EXPO_PUBLIC_ORS_API_KEY` or `extra.orsApiKey` in `app.json`.
 */
export async function getRouteFromORS(
  start: Coordinates,
  end: Coordinates,
  profile: Profile = "foot-walking"
): Promise<Coordinates[]> {
  const apiKey =
    (Constants.expoConfig?.extra as any)?.orsApiKey ||
    (process.env.EXPO_PUBLIC_ORS_API_KEY as string);

  if (!apiKey) {
    throw new Error("Missing ORS API key");
  }

  const base = `https://api.openrouteservice.org/v2/directions/${profile}`;
  const geojsonUrl = `${base}/geojson?api_key=${encodeURIComponent(apiKey)}`;
  const jsonUrl = `${base}?api_key=${encodeURIComponent(apiKey)}`;

  const body = {
    coordinates: [
      [start.longitude, start.latitude],
      [end.longitude, end.latitude],
    ],
    elevation: false,
    preference: "recommended",
    instructions: false,
    geometry: true,
    units: "m",
  };
  // Try GeoJSON endpoint first for direct coordinates
  try {
    const respGeo = await fetch(geojsonUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = respGeo.ok ? null : await respGeo.text().catch(() => null);
    const dataGeo = respGeo.ok ? await respGeo.json() : null;
    const coordsGeo: [number, number][] | null = dataGeo?.features?.[0]?.geometry?.coordinates || null;
    if (respGeo.ok && coordsGeo && coordsGeo.length > 1) {
      return coordsGeo.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
    }
    // If 200 but empty, fall through to JSON endpoint
    if (!respGeo.ok) {
      console.warn(`ORS geojson error ${respGeo.status}: ${(text || '').slice(0, 200)}`);
    }
  } catch (e) {
    console.warn(`ORS geojson fetch failed: ${String(e).slice(0, 200)}`);
  }

  // Fallback to JSON endpoint and decode encoded polyline from routes[0].geometry
  const respJson = await fetch(jsonUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!respJson.ok) {
    let text: string;
    try { text = await respJson.text(); } catch { text = "<no body>"; }
    throw new Error(`ORS error ${respJson.status}: ${text.slice(0, 300)}`);
  }
  const dataJson = await respJson.json();
  const encoded: string | undefined = dataJson?.routes?.[0]?.geometry;
  if (encoded && typeof encoded === "string") {
    const decoded5 = decodePolyline(encoded, 5);
    if (decoded5.length > 1) return decoded5.map(([lat, lon]) => ({ latitude: lat, longitude: lon }));
    const decoded6 = decodePolyline(encoded, 6);
    if (decoded6.length > 1) return decoded6.map(([lat, lon]) => ({ latitude: lat, longitude: lon }));
  }
  // Last resort: check for any coordinates in features (some variants)
  const coordsAlt: [number, number][] | null = dataJson?.features?.[0]?.geometry?.coordinates || null;
  if (coordsAlt && coordsAlt.length > 1) return coordsAlt.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
  return [];
}

// Decodes an encoded polyline string into [lat, lon] pairs
function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0, lat = 0, lon = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let result = 0, shift = 0, b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    result = 0; shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlon = (result & 1) ? ~(result >> 1) : (result >> 1);
    lon += dlon;

    coordinates.push([lat / factor, lon / factor]);
  }
  return coordinates;
}

/**
 * Snap a coordinate to the nearest routable point using ORS Snap API.
 * Returns the snapped coordinate or the original if snapping fails.
 */
export async function snapToRoad(coord: Coordinates, profile: Profile = "foot-walking"): Promise<Coordinates> {
  const apiKey =
    (Constants.expoConfig?.extra as any)?.orsApiKey ||
    (process.env.EXPO_PUBLIC_ORS_API_KEY as string);

  if (!apiKey) return coord;

  const url = `https://api.openrouteservice.org/v2/snap/${profile}?api_key=${encodeURIComponent(apiKey)}`;
  const body = {
    coordinates: [[coord.longitude, coord.latitude]],
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Snap error ${resp.status}`);
    const data = await resp.json();
    const snapped = data?.features?.[0]?.geometry?.coordinates?.[0];
    if (Array.isArray(snapped) && snapped.length >= 2) {
      return { latitude: snapped[1], longitude: snapped[0] };
    }
    return coord;
  } catch {
    return coord;
  }
}
