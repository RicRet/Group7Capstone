import { http } from "../http";

export type Bbox = { minLon: number; minLat: number; maxLon: number; maxLat: number };

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

export async function fetchBuildings(
  bbox: Bbox
): Promise<BuildingFeatureCollection> {
  const resp = await http.get<BuildingFeatureCollection>("/gis/buildings", {
    params: bbox,
  });
  return resp.data;
}