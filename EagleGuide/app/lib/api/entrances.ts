import { http } from "../http";
import type { Bbox } from "./parkingLots";

export type EntranceFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    entrance_id: string;
    entrance_name: string;
    entrance_accessible: boolean;
  };
};

export type EntranceFeatureCollection = {
  type: "FeatureCollection";
  features: EntranceFeature[];
};

export async function fetchEntrances(bbox: Bbox): Promise<EntranceFeatureCollection> {
  try {
    const resp = await http.get("/gis/entrances", { params: bbox });
    return resp.data;
  } catch (err: any) {
    console.log("ENTRANCES ERROR:", err?.response?.status, err?.response?.data);
    throw err;
  }
}