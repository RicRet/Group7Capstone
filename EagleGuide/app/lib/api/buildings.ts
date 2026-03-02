import axios from "axios";

export type Bbox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

export type BuildingFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: {
    building_id: number;
    name: string;
    description: string | null;
    type: string | null;
    fill: string | null;
  };
};

export type BuildingFeatureCollection = {
  type: "FeatureCollection";
  features: BuildingFeature[];
};

const API_BASE =
  process.env.EXPO_PUBLIC_ENTRANCES_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "";

const api = axios.create({
  baseURL: `${API_BASE}/v1`,
});

export async function fetchBuildings(
  bbox: Bbox
): Promise<BuildingFeatureCollection> {
  const resp = await api.get<BuildingFeatureCollection>("/gis/buildings", {
    params: bbox,
  });

  return resp.data;
}