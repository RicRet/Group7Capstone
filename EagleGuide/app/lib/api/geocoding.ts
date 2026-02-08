import Constants from "expo-constants";
import type { Coordinates } from "./directions";

export type GeocodeResult = {
  id: string;
  label: string;
  coordinates: Coordinates;
};

export async function searchLocation(query: string): Promise<GeocodeResult[]> {
  const apiKey =
    (Constants.expoConfig?.extra as any)?.orsApiKey ||
    process.env.EXPO_PUBLIC_ORS_API_KEY;

  if (!apiKey || !query.trim()) return [];

  const url =
    `https://api.openrouteservice.org/geocode/search` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&text=${encodeURIComponent(query)}` +
    `&size=5`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Geocoding error ${resp.status}`);
  }

  const data = await resp.json();

  return (data?.features || []).map((f: any) => ({
    id: f.properties.id,
    label: f.properties.label,
    coordinates: {
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    },
  }));
}
