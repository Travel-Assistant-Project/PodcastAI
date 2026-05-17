import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { getMyInterests } from '@/src/api/interests.api';
import {
  getLatestPodcast,
  getRecentlyPlayed,
  getRecommendedPodcasts,
  type PodcastSummary,
  type RecentlyPlayed,
} from '@/src/api/podcasts.api';
import { Colors } from '@/src/styles/colors';
import FavoriteButton from '@/src/components/FavoriteButton';
import { getUser } from '@/src/store/authStore';

const POLL_INTERVAL_MS = 5000;

const CATEGORY_COLORS: Record<string, string> = {
  technology: '#1E3A8A',
  ai: '#3730A3',
  science: '#065F46',
  health: '#7C2D12',
  finance: '#78350F',
  economy: '#374151',
  sports: '#1E40AF',
  music: '#581C87',
  entertainment: '#831843',
  world: '#134E4A',
};

function categoryColor(categories: string[]): string {
  const first = (categories[0] ?? '').toLowerCase();
  return CATEGORY_COLORS[first] ?? '#1E3A8A';
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '';
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function formatProgress(progressSeconds: number, durationSeconds?: number | null, isCompleted?: boolean): string {
  if (isCompleted) return 'Completed';
  if (!durationSeconds || progressSeconds === 0) return 'Not started';
  const remaining = Math.max(0, durationSeconds - progressSeconds);
  const m = Math.round(remaining / 60);
  return m <= 0 ? 'Almost done' : `${m}m left`;
}

function StatusBadge({ status }: Readonly<{ status?: string | null }>) {
  const isProcessing = status === 'processing';
  return (
    <View style={[styles.heroBadge, isProcessing && styles.heroBadgeProcessing]}>
      {isProcessing && <ActivityIndicator size={10} color="#fff" style={{ marginRight: 4 }} />}
      <Text style={styles.heroBadgeText}>{isProcessing ? 'Processing…' : 'LIVE NOW'}</Text>
    </View>
  );
}

function HeroSkeleton() {
  return (
    <View style={[styles.heroCard, { justifyContent: 'center', alignItems: 'center', minHeight: 180 }]}>
      <ActivityIndicator color="#fff" />
      <Text style={[styles.heroTime, { marginTop: 8 }]}>Loading latest podcast…</Text>
    </View>
  );
}

function HeroEmpty() {
  const router = useRouter();
  return (
    <View style={[styles.heroCard, { alignItems: 'center', paddingVertical: 28 }]}>
      <Text style={[styles.heroTitle, { fontSize: 22, textAlign: 'center' }]}>
        No podcasts yet
      </Text>
      <Text style={[styles.heroTime, { textAlign: 'center', marginTop: 6 }]}>
        Create your first AI podcast to get started.
      </Text>
      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => router.push('/create')}>
        <Text style={styles.primaryBtnText}>＋ Create Podcast</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const [latestPodcast, setLatestPodcast] = useState<PodcastSummary | null | undefined>(undefined);
  const [recommended, setRecommended] = useState<PodcastSummary[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed[]>([]);
  const [interestText, setInterestText] = useState('Based on your interests');

  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingRec, setLoadingRec] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = getUser();
  const displayName = useMemo(() => {
    const fullName = user?.fullName?.trim();
    if (!fullName) return 'there';
    return fullName.split(' ')[0] || fullName;
  }, [user?.fullName]);

  // --- Fetch latest podcast (+ poll while processing) ---
  const fetchLatest = useCallback(async () => {
    try {
      const data = await getLatestPodcast();
      setLatestPodcast(data);
      return data;
    } catch {
      setLatestPodcast(null);
      return null;
    } finally {
      setLoadingLatest(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const data = await fetchLatest();
      if (data?.status !== 'processing') {
        clearInterval(pollRef.current ?? undefined);
        pollRef.current = null;
      }
    }, POLL_INTERVAL_MS);
  }, [fetchLatest]);

  useEffect(() => {
    fetchLatest().then((data) => {
      if (data?.status === 'processing') startPolling();
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchLatest, startPolling]);

  // When latest podcast status changes to processing, start polling
  useEffect(() => {
    if (latestPodcast?.status === 'processing') {
      startPolling();
      return;
    }
    clearInterval(pollRef.current ?? undefined);
    pollRef.current = null;
  }, [latestPodcast?.status, startPolling]);

  // --- Fetch recommended + interests ---
  useEffect(() => {
    const load = async () => {
      try {
        const [recs, myInterests] = await Promise.all([
          getRecommendedPodcasts(),
          getMyInterests(),
        ]);
        setRecommended(recs);
        if (myInterests.length > 0) {
          const names = myInterests.slice(0, 3).map((i) => i.name);
          setInterestText(`Based on your interests: ${names.join(', ')}`);
        }
      } catch {
        setRecommended([]);
      } finally {
        setLoadingRec(false);
      }
    };
    load();
  }, []);

  // --- Fetch recently played ---
  useEffect(() => {
    getRecentlyPlayed()
      .then(setRecentlyPlayed)
      .catch(() => setRecentlyPlayed([]))
      .finally(() => setLoadingRecent(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>PodcastAI</Text>
          <View style={styles.headerActions}>
            <Text style={styles.iconText}>⌕</Text>
            <View style={styles.avatarDot} />
          </View>
        </View>

        <Text style={styles.greeting}>Merhaba, {displayName}!</Text>
        <Text style={styles.subtitle}>Your AI Curator has new insights for you today.</Text>

        {/* ── Today's Tech ── */}
        {loadingLatest && <HeroSkeleton />}
        {!loadingLatest && latestPodcast && (
          <View style={[styles.heroCard, { backgroundColor: categoryColor(latestPodcast.categories) }]}>
            <View style={styles.heroTop}>
              <StatusBadge status={latestPodcast.status} />
              {latestPodcast.durationSeconds != null && (
                <Text style={styles.heroTime}>{formatDuration(latestPodcast.durationSeconds)}</Text>
              )}
              {latestPodcast.categories.length > 0 && (
                <Text style={styles.heroCategory}>{latestPodcast.categories[0].toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {latestPodcast.title ?? "Today's Briefing"}
            </Text>
          <View style={styles.heroButtons}>
            {latestPodcast.status === 'completed' && (
              <>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push({ pathname: '/player', params: { id: latestPodcast.id } })}
                >
                  <Text style={styles.primaryBtnText}>▶ Listen Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push({ pathname: '/podcast', params: { id: latestPodcast.id } })}
                >
                  <Text style={styles.secondaryBtnText}>◫ View Insights</Text>
                </TouchableOpacity>
              </>
            )}
            {latestPodcast.status !== 'completed' && (
              <View style={styles.processingNote}>
                <Text style={styles.processingNoteText}>
                  Your podcast is being prepared. This usually takes 1–2 minutes.
                </Text>
              </View>
            )}
          </View>
        </View>
        )}
        {!loadingLatest && !latestPodcast && <HeroEmpty />}

        {/* ── Recommended for You ── */}
        <View>
          <View style={styles.recSubRow}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/past-podcasts')}
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtext}>{interestText}</Text>
        </View>

        {loadingRec && (
          <View style={styles.centeredLoader}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!loadingRec && recommended.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Complete a podcast to see personalized recommendations.
            </Text>
          </View>
        )}
        {!loadingRec && recommended.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedRow}
          >
            {recommended.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recommendedCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/podcast', params: { id: item.id } })}
              >
                <View
                  style={[
                    styles.recommendedImagePlaceholder,
                    { backgroundColor: categoryColor(item.categories) },
                  ]}
                >
                  <Text style={styles.recommendedPlaceholderIcon}>🎙</Text>
                </View>
                <View style={styles.recommendedFavBtn}>
                  <FavoriteButton size={15} />
                </View>
                {item.categories.length > 0 && (
                  <Text style={styles.recommendedCategory}>
                    {item.categories[0].toUpperCase()}
                  </Text>
                )}
                <Text numberOfLines={2} style={styles.recommendedTitle}>
                  {item.title ?? 'Untitled Podcast'}
                </Text>
                <Text style={styles.recommendedMeta}>{formatDuration(item.durationSeconds)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Recently Played ── */}
        <Text style={styles.sectionTitle}>Recently Played</Text>

        {loadingRecent && (
          <View style={styles.centeredLoader}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!loadingRecent && recentlyPlayed.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You haven't listened to any podcasts yet.{'\n'}Start listening to track your history.
            </Text>
          </View>
        )}
        {!loadingRecent && recentlyPlayed.length > 0 && (
          <View style={styles.listWrap}>
            {recentlyPlayed.map((item) => (
              <TouchableOpacity
                key={item.podcastId}
                style={styles.listItem}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/podcast', params: { id: item.podcastId } })}
              >
                <View
                  style={[
                    styles.thumb,
                    { backgroundColor: categoryColor(item.categories), justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>🎙</Text>
                </View>
                <View style={styles.listContent}>
                  <Text numberOfLines={1} style={styles.listTitle}>
                    {item.title ?? 'Untitled Podcast'}
                  </Text>
                  <Text style={styles.listSubtitle}>
                    {item.categories[0] ?? 'Podcast'} ·{' '}
                    {formatProgress(item.progressSeconds, item.durationSeconds, item.isCompleted)}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#0B286E',
    fontSize: 17,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconText: {
    color: Colors.text,
    fontSize: 18,
  },
  avatarDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0F172A',
  },
  greeting: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 10,
  },
  subtitle: {
    color: Colors.textMuted,
    marginTop: 0,
    fontSize: 14,
    lineHeight: 20,
  },
  heroCard: {
    marginTop: 4,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#1E3A8A',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroBadgeProcessing: {
    backgroundColor: 'rgba(251,191,36,0.25)',
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTime: {
    color: '#DCE6FF',
    fontWeight: '600',
    fontSize: 13,
  },
  heroCategory: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    marginTop: 12,
    color: Colors.surface,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
  },
  heroButtons: {
    marginTop: 16,
    gap: 10,
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  primaryBtnText: {
    color: '#13244D',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  secondaryBtnText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  processingNote: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 10,
  },
  processingNoteText: {
    color: '#DCE6FF',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  recSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '800',
    flexShrink: 1,
  },
  sectionAction: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  viewAllBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexShrink: 0,
  },
  viewAllBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionSubtext: {
    marginTop: 2,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  centeredLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  recommendedRow: {
    gap: 12,
    paddingRight: 10,
  },
  recommendedCard: {
    position: 'relative',
    width: 195,
  },
  recommendedImagePlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedPlaceholderIcon: {
    fontSize: 52,
  },
  recommendedFavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  recommendedCategory: {
    color: '#1E3A8A',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendedTitle: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  recommendedMeta: {
    marginTop: 2,
    color: Colors.textMuted,
    fontSize: 12,
  },
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
    backgroundColor: '#B9C6E7',
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
  chevron: {
    color: '#94A3B8',
    fontSize: 22,
    lineHeight: 22,
  },
});
