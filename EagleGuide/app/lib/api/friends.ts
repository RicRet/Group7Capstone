import { http } from '../http';

export type FriendEdge = {
  userId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  status: 'pending' | 'accepted' | 'blocked';
  direction: 'incoming' | 'outgoing' | 'accepted';
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type FriendsResponse = {
  accepted: FriendEdge[];
  incoming: FriendEdge[];
  outgoing: FriendEdge[];
};

export type FriendSearchResult = {
  userId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  relationship: 'none' | 'accepted' | 'pending_in' | 'pending_out';
};

export type FriendRequestResponse = {
  state: 'pending' | 'accepted' | 'already-friends';
  friendship?: FriendEdge;
};

export async function getFriends(): Promise<FriendsResponse> {
  const res = await http.get<FriendsResponse>('/friends');
  return res.data;
}

export async function searchFriends(query: string): Promise<FriendSearchResult[]> {
  const res = await http.get<{ results: FriendSearchResult[] }>('/friends/search', { params: { q: query } });
  return res.data.results;
}

export async function sendFriendRequest(targetUserId: string): Promise<FriendRequestResponse> {
  const res = await http.post<FriendRequestResponse>('/friends/requests', { userId: targetUserId });
  return res.data;
}

export async function acceptFriend(targetUserId: string): Promise<FriendRequestResponse> {
  const res = await http.post<FriendRequestResponse>(`/friends/requests/${targetUserId}/accept`);
  return res.data;
}
