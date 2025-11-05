import { http } from '../http';

export type AddRouteResponse = {
  message: string;
  path_id?: number;
};

//calls function from backend
export async function addRoute(prevb: string, newb: string) {
  const res = await http.post<AddRouteResponse>('/routes', { prevb, newb });
  return res.data;
}
