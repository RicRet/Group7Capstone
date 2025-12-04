import { http } from '../http';


export type AddRouteResponse = {
  message: string;
  saved_route_id?: string;
};


export type SavedRoute = {
  saved_route_id: string;
  user_id: string;
  name: string;
  start_lon: number;
  start_lat: number;
  end_lon: number;
  end_lat: number;
  is_accessible: number;
  length_m: number | null;
  duration_s: number | null;
  created_at: string;
};


export type DeleteRouteResponse = {
  message: string;
  deleted_id?: string;
};


export async function addRoute(data: {
  userid: string;
  prevb: string;
  newb: string;
  prevblon: number;
  prevblat: number;
  newblon: number;
  newblat: number;
  accessible: number;
  length?: number | null;
  duration?: number | null;
}) {
  const res = await http.post<AddRouteResponse>('/userroute', data);
  return res.data;
}

export async function getRoutes(userid: string) {
  const res = await http.get<SavedRoute[]>(`/userroute/${userid}`);
  return res.data;
}


export async function deleteRoute(id: string) {
  const res = await http.delete<DeleteRouteResponse>(`/userroute/${id}`);
  return res.data;
}


export async function updateRoute(data: {
  id: string;
  name?: string;
  start_lon?: number;
  start_lat?: number;
  end_lon?: number;
  end_lat?: number;
  accessible?: number;
  length?: number | null;
  duration?: number | null;
}) {
  const { id, ...rest } = data;
  const res = await http.put(`/userroute/${id}`, rest);
  return res.data;
}
