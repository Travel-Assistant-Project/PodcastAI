import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import {
  getLatestPodcast,
  getRecentlyPlayed,
  getTrendingPodcasts,
  type PodcastSummary,
  type RecentlyPlayed,
} from '@/src/api/podcasts.api';
import { Colors } from '@/src/styles/colors';
import PodcastCardFavorite from '@/src/components/PodcastCardFavorite';
import RecentlyPlayedList from '@/src/components/RecentlyPlayedList';
import { getUser } from '@/src/store/authStore';
import { getProfile } from '@/src/api/user.api';
import { categoryAccentColor as categoryColor } from '@/src/utils/categoryAccent';
import { categoryTag } from '@/src/utils/podcastNavigation';

const POLL_INTERVAL_MS = 5000;

const TRENDING_SECTION_SUBTITLE = 'Popular on Listen Notes right now.';

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '';
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function RecommendedCoverArt({
  uri,
  fallbackColor,
}: Readonly<{ uri: string | null; fallbackColor: string }>) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View style={[styles.recommendedCoverImage, { backgroundColor: fallbackColor }]} />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.recommendedCoverImage}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

function HeroStatusBadge({ status }: Readonly<{ status?: string | null }>) {
  const s = (status ?? '').toLowerCase();
  const isProcessing = s === 'processing';
  const isCompleted = s === 'completed';
  const isFailed = s === 'failed';
  const label = isProcessing
    ? 'Processing…'
    : isCompleted
      ? 'Ready'
      : isFailed
        ? 'Generation failed'
        : 'Updating…';
  return (
    <View
      style={[
        styles.heroBadge,
        isProcessing && styles.heroBadgeProcessing,
        isFailed && styles.heroBadgeFailed,
      ]}>
      {isProcessing && <ActivityIndicator size={10} color="#fff" style={{ marginRight: 4 }} />}
      <Text style={styles.heroBadgeText}>{label}</Text>
    </View>
  );
}

function HeroSkeleton() {
  return (
    <View style={[styles.heroCard, styles.heroCardSkeleton]}>
      <ActivityIndicator color="#fff" />
      <Text style={[styles.heroTime, { marginTop: 8 }]}>Loading latest podcast…</Text>
    </View>
  );
}

function HeroEmpty() {
  const router = useRouter();
  return (
    <View style={[styles.heroCard, styles.heroCardEmpty]}>
      <Text style={[styles.heroTitle, { fontSize: 22, textAlign: 'center' }]}>
        No podcasts yet
      </Text>
      <Text style={[styles.heroTime, { textAlign: 'center', marginTop: 6 }]}>
        Create your first AI podcast to get started.
      </Text>
      <TouchableOpacity
        style={styles.heroEmptyBtn}
        onPress={() => router.push('/create')}>
        <Text style={styles.primaryBtnText}>＋ Create Podcast</Text>
      </TouchableOpacity>
    </View>
  );
}

function HeroLatestPodcastCard({ podcast }: Readonly<{ podcast: PodcastSummary }>) {
  const router = useRouter();
  const heroCover = podcast.coverImageUrl?.trim() || null;
  const tint = categoryColor(podcast.categories);
  const statusLc = (podcast.status ?? '').toLowerCase();
  const isFailed = statusLc === 'failed';
  const titleText =
    podcast.status === 'processing' && !(podcast.title ?? '').trim()
      ? 'Creating your podcast…'
      : (podcast.title ?? 'Untitled podcast');
  const categoryLine =
    podcast.categories.length > 0
      ? podcast.categories
          .slice(0, 4)
          .map((c) => c.toUpperCase())
          .join(' · ')
      : '';

  return (
    <View style={styles.heroCard}>
      {heroCover ? (
        <>
          <Image source={{ uri: heroCover }} style={styles.heroBackdropImage} resizeMode="cover" />
          <View style={styles.heroBackdropTint} />
        </>
      ) : (
        <View style={[styles.heroBackdropImage, { backgroundColor: tint }]} />
      )}
      <View style={styles.heroCardInner}>
        <View style={styles.heroTop}>
          <HeroStatusBadge status={podcast.status} />
          {podcast.status === 'completed' && podcast.durationSeconds != null && (
            <Text style={styles.heroTime}>{formatDuration(podcast.durationSeconds)}</Text>
          )}
          {categoryLine.length > 0 && <Text style={styles.heroCategory}>{categoryLine}</Text>}
        </View>
        <Text style={styles.heroTitle} numberOfLines={3}>
          {titleText}
        </Text>
        <View style={styles.heroButtons}>
          {podcast.status === 'completed' && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push({ pathname: '/player', params: { id: podcast.id } })}
              >
                <Text style={styles.primaryBtnText}>▶ Listen Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push({ pathname: '/podcast', params: { id: podcast.id } })}
              >
                <Text style={styles.secondaryBtnText}>◫ View Insights</Text>
              </TouchableOpacity>
            </>
          )}
          {isFailed && (
            <>
              <View style={styles.processingNote}>
                <Text style={styles.processingNoteText}>
                  This episode did not finish — often due to AI quota or a temporary service limit.
                  For a few minutes this stays visible here; then your last successful episode shows
                  again.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/create')}
              >
                <Text style={styles.primaryBtnText}>Create new</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/podcast', params: { id: podcast.id } })}
              >
                <Text style={styles.secondaryBtnText}>View details</Text>
              </TouchableOpacity>
            </>
          )}
          {!isFailed && podcast.status !== 'completed' && (
            <>
              <View style={styles.processingNote}>
                <Text style={styles.processingNoteText}>
                  You can leave this screen—we&apos;ll keep working on your episode. Usually 1–2
                  minutes.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/podcast', params: { id: podcast.id } })}
              >
                <Text style={styles.secondaryBtnText}>View progress</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const [latestPodcast, setLatestPodcast] = useState<PodcastSummary | null | undefined>(undefined);
  const [trending, setTrending] = useState<PodcastSummary[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed[]>([]);

  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = getUser();
  const displayName = useMemo(() => {
    const fullName = user?.fullName?.trim();
    if (!fullName) return 'there';
    return fullName.split(' ')[0] || fullName;
  }, [user?.fullName]);

  const recentPreview = useMemo(() => recentlyPlayed.slice(0, 5), [recentlyPlayed]);

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

  // Failed hero: backend switches to previous completed episode after ~5 min — poll every 15s so UI catches it quickly.
  useEffect(() => {
    if (latestPodcast?.status?.toLowerCase() !== 'failed') return;
    void fetchLatest();
    const id = setInterval(() => {
      void fetchLatest();
    }, 15000);
    return () => clearInterval(id);
  }, [latestPodcast?.status, fetchLatest]);

  // --- Trending (Listen Notes best_podcasts; API returns up to 10 via /recommended) ---
  useEffect(() => {
    const load = async () => {
      try {
        const rows = await getTrendingPodcasts();
        setTrending(rows);
      } catch {
        setTrending([]);
      } finally {
        setLoadingTrending(false);
      }
    };
    load();
  }, []);

  // --- Recently played + trending + header avatar (sekme odağında yenilenir) ---
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoadingRecent(true);

      fetchLatest();

      getRecentlyPlayed()
        .then((list) => {
          if (!cancelled) setRecentlyPlayed(list);
        })
        .catch(() => {
          if (!cancelled) setRecentlyPlayed([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingRecent(false);
        });

      getProfile()
        .then((p) => {
          if (!cancelled) setProfilePhotoUrl(p.photoUrl?.trim() ? p.photoUrl : null);
        })
        .catch(() => {
          if (!cancelled) setProfilePhotoUrl(null);
        });

      return () => {
        cancelled = true;
      };
    }, [fetchLatest]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>PodcastAI</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityLabel="Profile">
              {profilePhotoUrl ? (
                <Image source={{ uri: profilePhotoUrl }} style={styles.headerAvatarImg} />
              ) : (
                <View style={styles.avatarDot} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greeting}>Hello, {displayName}!</Text>
        <Text style={styles.subtitle}>Your AI Curator has new insights for you today.</Text>

        {(loadingLatest || latestPodcast) && (
          <Text style={styles.heroSectionLabel}>Your latest podcast</Text>
        )}

        {loadingLatest && <HeroSkeleton />}
        {!loadingLatest && latestPodcast && <HeroLatestPodcastCard podcast={latestPodcast} />}
        {!loadingLatest && !latestPodcast && <HeroEmpty />}

        {/* ── Trending ── */}
        <View>
          <View style={styles.recSubRow}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtext}>{TRENDING_SECTION_SUBTITLE}</Text>
        </View>

        {loadingTrending && (
          <View style={styles.centeredLoader}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!loadingTrending && trending.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Trending podcasts are unavailable right now. Try again in a moment.
            </Text>
          </View>
        )}
        {!loadingTrending && trending.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedRow}
          >
            {trending.map((item) => {
              const coverUri = item.coverImageUrl?.trim() || null;
              const isExternal = item.status?.toLowerCase() === 'external';
              const categoryLabel = categoryTag(item);
              const openRecommended = () => {
                if (isExternal) {
                  const ln = item.listenNotesPodcastId?.trim();
                  if (ln) {
                    router.push({ pathname: '/podcast', params: { lnId: ln } });
                    return;
                  }
                }
                router.push({ pathname: '/podcast', params: { id: item.id } });
              };

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recommendedCard}
                  activeOpacity={0.85}
                  onPress={openRecommended}
                >
                  <View style={styles.recommendedCoverWrap}>
                    <RecommendedCoverArt
                      uri={coverUri}
                      fallbackColor={categoryColor(item.categories)}
                    />
                    <View style={styles.recommendedFavBtn}>
                      <PodcastCardFavorite item={item} size={15} />
                    </View>
                  </View>
                  {categoryLabel.length > 0 && (
                    <Text style={styles.recommendedCategory}>
                      {categoryLabel.toUpperCase()}
                    </Text>
                  )}
                  <Text numberOfLines={2} style={styles.recommendedTitle}>
                    {item.title ?? 'Untitled Podcast'}
                  </Text>
                  <Text style={styles.recommendedMeta}>{formatDuration(item.durationSeconds)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Recently Played (preview: 5) ── */}
        <View>
          <View style={styles.recSubRow}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            {recentlyPlayed.length > 5 ? (
              <TouchableOpacity
                style={styles.viewAllBtn}
                activeOpacity={0.75}
                onPress={() => router.push('/recently-played')}
              >
                <Text style={styles.viewAllBtnText}>View All</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loadingRecent && (
          <View style={styles.centeredLoader}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!loadingRecent && recentlyPlayed.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You haven&apos;t listened to any podcasts yet.{'\n'}Start listening to track your history.
            </Text>
          </View>
        )}
        {!loadingRecent && recentlyPlayed.length > 0 && (
          <RecentlyPlayedList items={recentPreview} />
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
  headerAvatarImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
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
  heroSectionLabel: {
    marginTop: 14,
    marginBottom: 2,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  heroCard: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 220,
    backgroundColor: '#1E3A8A',
    position: 'relative',
  },
  heroCardSkeleton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroCardEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  heroEmptyBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heroBackdropImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  heroBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.52)',
  },
  heroCardInner: {
    padding: 16,
    position: 'relative',
    zIndex: 1,
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
  heroBadgeFailed: {
    backgroundColor: 'rgba(239,68,68,0.35)',
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
  recommendedCoverWrap: {
    position: 'relative',
    width: '100%',
    marginBottom: 8,
  },
  recommendedCoverImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#E8ECF3',
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
});
