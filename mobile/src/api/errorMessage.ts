import type { AxiosError } from 'axios';

/**
 * Reads message from ASP.NET / typical JSON error bodies and maps network cases.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<{ message?: string | string[]; title?: string }> | undefined;
  if (ax?.response?.data && typeof ax.response.data === 'object') {
    const data = ax.response.data;
    const raw = data.message;
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      return raw[0].trim();
    }
    if (typeof data.title === 'string' && data.title.trim()) {
      return data.title.trim();
    }
  }

  const status = ax?.response?.status;
  if (status != null && status >= 500) {
    return 'Server is temporarily unavailable. Please try again in a moment.';
  }

  if (ax?.code === 'ECONNABORTED') {
    const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (__DEV__ && typeof configured === 'string' && configured.length > 0) {
      return `Request timed out (${configured}). Use your Mac's current Wi-Fi IP in mobile/.env (same network as the phone), then run: npx expo start -c`;
    }
    return 'Request timed out. Check your connection and try again.';
  }

  if (!ax?.response) {
    return 'Could not reach the server. Check your network and API settings.';
  }

  return fallback;
}
