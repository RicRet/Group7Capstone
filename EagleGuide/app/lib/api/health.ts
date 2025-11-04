import { http } from '../http';

export type HealthResponse = {
  ok: boolean;
};


 // GET /v1/health
export async function getHealth(): Promise<HealthResponse> {
  const res = await http.get<HealthResponse>('/health');
  return res.data;
}
