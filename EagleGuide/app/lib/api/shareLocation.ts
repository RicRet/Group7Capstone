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

export type FriendLocation = {
  userId: string;
  username: string;
  shareId: string;
  latitude: number;
  longitude: number;
  label?: string | null;
  expiresAt: number;
};

/** Broadcast my current location to friends (creates/refreshes the active share). */
export async function broadcastMyLocation(latitude: number, longitude: number, expiresInSec = 3600) {
  return createShareLocation({ latitude, longitude, label: 'My Location', expiresInSec });
}

/** Stop broadcasting — removes the active share. */
export async function stopBroadcast() {
  await http.delete('/share-location/me');
}

/** Fetch live locations of all accepted friends who are currently broadcasting. */
export async function getFriendLocations(): Promise<FriendLocation[]> {
  const res = await http.get<{ friends: FriendLocation[] }>('/share-location/friends');
  return res.data.friends;
}
