import { http } from '../http';

export type ProfileResponse = {
  userId: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

export type UpdateProfileRequest = {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export async function getProfile(): Promise<ProfileResponse> {
  const res = await http.get<ProfileResponse>('/users/me');
  return res.data;
}

export async function updateProfile(fields: UpdateProfileRequest): Promise<ProfileResponse> {
  const res = await http.patch<ProfileResponse>('/users/me', fields);
  return res.data;
}
