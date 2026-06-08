import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { getPodcastIdFromNotification } from '@/src/services/notifications';

function openPodcastFromNotification(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown> | undefined,
) {
  const podcastId = getPodcastIdFromNotification(data);
  if (!podcastId) return;

  router.push({ pathname: '/podcast', params: { id: podcastId } });
}

export function usePushNotifications() {
  const router = useRouter();

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[push] Notification received:', notification.request.content.title);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      openPodcastFromNotification(router, data);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      openPodcastFromNotification(router, data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [router]);
}
