import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notifications_enabled';

let cached: boolean | null = null;

export function getNotificationsEnabled(): boolean {
  return cached ?? true;
}

export async function loadNotificationsEnabled(): Promise<boolean> {
  if (cached !== null) return cached;

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  cached = stored === null ? true : stored === 'true';
  return cached;
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  cached = enabled;
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}
