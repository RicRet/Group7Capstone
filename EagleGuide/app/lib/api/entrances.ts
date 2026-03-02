import { http } from "../http";

export async function fetchEntrances(params: {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}) {
  const res = await http.get("/gis/entrances", { params });
  return res.data;
}