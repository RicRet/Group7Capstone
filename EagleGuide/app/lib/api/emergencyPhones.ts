import { http } from "../http";

export async function fetchEmergencyPhones(params: {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}) {
  const res = await http.get("/gis/emergency-phones", { params });
  return res.data;
}