import { http } from '../http';

export type SignUpRequest = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type SignUpResponse = {
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export async function signUp(userData: SignUpRequest): Promise<SignUpResponse> {
  const res = await http.post<SignUpResponse>('/auth/signup', userData);
  return res.data;
}

export async function checkEmailAvailability(email: string): Promise<{ available: boolean }> {
  const res = await http.post<{ available: boolean }>('/auth/signup/check-email', { email });
  return res.data;
}