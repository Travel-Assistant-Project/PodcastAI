import { api } from '@/src/api/client';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  age?: number;
  job?: string;
};

export type AuthResponse = {
  id: string;
  fullName: string;
  email: string;
  token: string;
};

export async function login(payload: LoginRequest) {
  const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
  return data;
}

export async function register(payload: RegisterRequest) {
  const { data } = await api.post<AuthResponse>('/api/auth/register', payload);
  return data;
}
