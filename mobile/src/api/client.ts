import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.1.68:5192';

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

export function setAuthToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
