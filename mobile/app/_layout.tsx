import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FavoritesProvider } from '@/src/context/FavoritesContext';
import { PlaybackProvider } from '@/src/context/PlaybackContext';
import MiniPlayerBar from '@/src/components/MiniPlayerBar';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { loadNotificationsEnabled } from '@/src/store/notificationPrefs';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  usePushNotifications();

  useEffect(() => {
    void loadNotificationsEnabled();
  }, []);

  return (
    <PlaybackProvider>
      <FavoritesProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="words" options={{ headerShown: false }} />
        <Stack.Screen name="past-podcasts" options={{ headerShown: false }} />
        <Stack.Screen name="account-settings" options={{ headerShown: false }} />
        <Stack.Screen name="recently-played" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="category" options={{ headerShown: false }} />
        <Stack.Screen name="podcast" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <MiniPlayerBar />
      <StatusBar style="auto" />
    </ThemeProvider>
      </FavoritesProvider>
    </PlaybackProvider>
  );
}
