import { http } from '../http';

export type SignUpRequest = {
  username: string;
  email: string;
  password: string;
};

export type SignUpResponse = {
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
};

export async function signUp(userData: SignUpRequest): Promise<SignUpResponse> {
  const res = await http.post<SignUpResponse>('/auth/signup', userData);
  return res.data;
}