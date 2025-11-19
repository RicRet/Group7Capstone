import { http } from '../http';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    roles: string[];
  };
};

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/auth/login', credentials);
  return res.data;
}