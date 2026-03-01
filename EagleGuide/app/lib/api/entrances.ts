import axios from "axios";

const entrancesBase =
  process.env.EXPO_PUBLIC_ENTRANCES_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL;

const entrancesHttp = axios.create({
  baseURL: `${entrancesBase}/v1`,
  // IMPORTANT: since we removed requireSession locally for entrances,
  // we do NOT need cookies:
  withCredentials: false,
});
console.log("ENTRANCES BASE:", entrancesBase);
export async function fetchEntrances(params: {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}) {
  const res = await entrancesHttp.get("/gis/entrances", { params });
  return res.data;
}
