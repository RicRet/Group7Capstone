import { http } from "../http";

export async function fetchBicycleParking(params: {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}) {
  const res = await http.get("/gis/bicycle-parking", { params });
  return res.data;
}