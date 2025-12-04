import { http } from '../http';

export type AddRouteResponse = {
  message: string;
  path_id?: number;
};

export type SavedRoute = {
  path_id: number;
  description: string;
  type: string;
  accessibility: number;
};

export type DeleteRouteResponse = {
  message: string;
};

//calls function from backend
export async function addRoute(prevb: string,newb: string,type: string,accessibility: number
) {
  const res = await http.post<AddRouteResponse>('/routes', { prevb,newb,type,accessibility, });
  return res.data;
}


export async function getRoutes() {
  const res = await http.get<SavedRoute[]>('/routes');
  return res.data;
}

  export async function deleteRoute(id: number) {
   const res = await http.delete<DeleteRouteResponse>(`/routes/${id}`);
   return res.data;
}
