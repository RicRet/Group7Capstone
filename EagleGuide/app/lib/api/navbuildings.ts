import { http } from '../http';

export type Building = {
    name: string;
    lat: number;
    lon: number;
};

export async function fetchBuildings(): Promise<Building[]> {
    const resp = await http.get<Building[]>('/buildings');
    return resp.data;
}

export async function searchBuildings(query: string): Promise<Building[]> {
    const all = await fetchBuildings();
    const lower = query.toLowerCase();
    return all.filter((b) => b.name.toLowerCase().includes(lower));
}