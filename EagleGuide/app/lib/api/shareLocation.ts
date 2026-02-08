import { http } from '../http';

export type ShareCreateRequest = {
  latitude: number;
  longitude: number;
  label?: string;
  expiresInSec?: number;
};

export type ShareCreateResponse = {
  shareId: string;
  expiresAt: number;
};

export type ShareFetchResponse = {
  latitude: number;
  longitude: number;
  label?: string | null;
  createdAt: number;
  expiresAt: number;
  ownerUsername?: string | null;
};

export async function createShareLocation(body: ShareCreateRequest) {
  const res = await http.post<ShareCreateResponse>('/share-location', body);
  return res.data;
}

export async function fetchShareLocation(shareId: string, includeOwner = true) {
  const res = await http.get<ShareFetchResponse>(`/share-location/${shareId}`, {
    params: { includeOwner },
  });
  return res.data;
}