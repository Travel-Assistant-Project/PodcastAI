import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';

import type { RecentlyPlayed } from '@/src/api/podcasts.api';
import { Colors } from '@/src/styles/colors';
import { categoryAccentColor as categoryColor } from '@/src/utils/categoryAccent';
import {
  formatRecentlyPlayedProgress,
  recentlyPlayedProgressRatio,
} from '@/src/utils/recentlyPlayed';

type Props = Readonly<{
  items: RecentlyPlayed[];
  style?: StyleProp<ViewStyle>;
}>;

export default function RecentlyPlayedList({ items, style }: Props) {
  const router = useRouter();

  return (
    <View style={[styles.listWrap, style]}>
      {items.map((item) => {
        const thumbUri = item.coverImageUrl?.trim() || null;
        const lnPod = item.listenNotesPodcastId?.trim();
        const lnEp = item.listenNotesEpisodeId?.trim();
        const rowKey = `${item.podcastId}-${lnEp ?? ''}`;
        return (
          <TouchableOpacity
            key={rowKey}
            style={styles.listItem}
            activeOpacity={0.8}
            onPress={() => {
              const hasAudio = Boolean(item.audioUrl?.trim());
              const playable = item.status === 'completed' && hasAudio;
              if (playable && lnPod && lnEp) {
                router.push({
                  pathname: '/player',
                  params: { lnId: lnPod, lnEpisodeId: lnEp, id: item.podcastId },
                });
                return;
              }
              if (playable) {
                router.push({ pathname: '/player', params: { id: item.podcastId } });
                return;
              }
              if (lnPod) {
                router.push({
                  pathname: '/podcast',
                  params: {
                    lnId: lnPod,
                    ...(lnEp ? { lnEpisodeId: lnEp } : {}),
                  },
                });
                return;
              }
              router.push({ pathname: '/podcast', params: { id: item.podcastId } });
            }}>
            <View style={styles.thumb}>
              {thumbUri ? (
                <Image source={{ uri: thumbUri }} style={styles.thumbImage} resizeMode="cover" />
              ) : (
                <View
                  style={[styles.thumbImage, { backgroundColor: categoryColor(item.categories) }]}
                />
              )}
            </View>
            <View style={styles.listContent}>
              <Text numberOfLines={1} style={styles.listTitle}>
                {item.title ?? 'Untitled Podcast'}
              </Text>
              <Text style={styles.listSubtitle}>
                {item.categories[0] ?? 'Podcast'} ·{' '}
                {formatRecentlyPlayedProgress(
                  item.progressSeconds,
                  item.durationSeconds,
                  item.isCompleted,
                )}
              </Text>
              {item.durationSeconds != null && item.durationSeconds > 0 && (
                <View style={styles.recProgressTrack}>
                  <View
                    style={[
                      styles.recProgressFill,
                      { width: `${Math.round(recentlyPlayedProgressRatio(item) * 100)}%` },
                    ]}
                  />
                </View>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E8ECF3',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  listSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  recProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  recProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 22,
    lineHeight: 22,
  },
});
