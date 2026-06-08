import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getPodcastById } from '@/src/api/podcasts.api';
import { getNotificationsEnabled } from '@/src/store/notificationPrefs';

type WatchedPodcast = {
  id: string;
  title?: string;
  notified: boolean;
};

const watched = new Map<string, WatchedPodcast>();
const POLL_MS = 5000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let appStateListenerAttached = false;

async function showLocalPodcastReadyNotification(podcastId: string, title?: string | null) {
  if (!getNotificationsEnabled()) return;

  const displayTitle = title?.trim() || 'Your podcast';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Podcast ready',
      body: `${displayTitle} is ready to listen.`,
      data: { type: 'podcast_ready', podcastId },
      sound: true,
    },
    trigger: null,
  });

  console.log('[local-notify] Podcast ready notification shown:', podcastId);
}

async function checkAll() {
  if (watched.size === 0) {
    stopPolling();
    return;
  }

  for (const [id, entry] of [...watched.entries()]) {
    if (entry.notified) {
      watched.delete(id);
      continue;
    }

    try {
      const podcast = await getPodcastById(id);
      const status = podcast.status?.toLowerCase();

      if (status === 'completed' && podcast.audioUrl) {
        entry.notified = true;
        await showLocalPodcastReadyNotification(id, podcast.title ?? entry.title);
        watched.delete(id);
      } else if (status === 'failed') {
        watched.delete(id);
      }
    } catch (error) {
      console.warn('[local-notify] Poll failed for podcast', id, error);
    }
  }

  if (watched.size === 0) stopPolling();
}

function ensureAppStateListener() {
  if (appStateListenerAttached) return;
  appStateListenerAttached = true;

  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active' && watched.size > 0) {
      void checkAll();
    }
  });
}

function ensurePolling() {
  ensureAppStateListener();
  if (pollTimer) return;

  void checkAll();
  pollTimer = setInterval(() => {
    void checkAll();
  }, POLL_MS);
}

function stopPolling() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

export function startWatchingPodcastCompletion(podcastId: string, title?: string) {
  const id = podcastId.trim();
  if (!id || !getNotificationsEnabled()) return;

  watched.set(id, { id, title, notified: false });
  ensurePolling();
  console.log('[local-notify] Watching podcast completion:', id);
}
