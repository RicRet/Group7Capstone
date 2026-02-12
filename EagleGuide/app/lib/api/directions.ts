import Constants from "expo-constants";

export type Coordinates = { latitude: number; longitude: number };
export type Profile = "foot-walking" | "cycling-regular" | "driving-car";

export type RouteStep = {
  distance: number;
  duration: number;
  type: number;
  instruction: string;
  name: string;
  way_points: [number, number];
};

export type RouteData = {
  coordinates: Coordinates[];
  steps: RouteStep[];
  summary: {
    distance: number;
    duration: number;
  };
};

export async function getRouteFromORS(
  start: Coordinates,
  end: Coordinates,
  profile: Profile = "foot-walking"
): Promise<RouteData | null> {
  const apiKey =
    (Constants.expoConfig?.extra as any)?.orsApiKey ||
    (process.env.EXPO_PUBLIC_ORS_API_KEY as string);

  if (!apiKey) throw new Error("Missing ORS API key");

  const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${encodeURIComponent(apiKey)}`;

  const body = {
    coordinates: [
      [start.longitude, start.latitude],
      [end.longitude, end.latitude],
    ],
    elevation: false,
    preference: "recommended",
    instructions: true,
    instructions_format: "text",
    units: "m",
    geometry: "true",
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`ORS error ${resp.status}: ${text.slice(0, 300)}`);
    }

    const data = await resp.json();
    const route = data.routes?.[0];

    if (!route) return null;

    let decodedCoords: Coordinates[] = [];
    if (typeof route.geometry === "string") {
      decodedCoords = decodePolyline(route.geometry, 5).map(([lat, lon]) => ({
        latitude: lat,
        longitude: lon,
      }));
    } else if (Array.isArray(route.geometry?.coordinates)) {
       decodedCoords = route.geometry.coordinates.map((c: number[]) => ({
           latitude: c[1],
           longitude: c[0]
       }));
    }

    const steps: RouteStep[] = route.segments?.[0]?.steps || [];
    
    const summary = route.summary || { distance: 0, duration: 0 };

    return {
      coordinates: decodedCoords,
      steps,
      summary
    };

  } catch (err) {
    console.warn("Route fetch failed:", err);
    throw err;
  }
}

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
