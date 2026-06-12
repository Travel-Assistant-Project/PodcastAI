import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import PodcastCardFavorite from '@/src/components/PodcastCardFavorite';
import { getExternalTrending, getCategoryStats, getPodcasts, type PodcastSummary } from '@/src/api/podcasts.api';
import { getCategoryOption } from '@/src/constants/categories';
import {
  categoryTag,
  formatDurationMinutes,
  matchesCategoryFilter,
  openPodcastSummary,
} from '@/src/utils/podcastNavigation';

const { width } = Dimensions.get('window');

const CATEGORY_META: Record<string, { color: string; icon: string; description: string }> = {
  Technology: {
    color: '#0714B8',
    icon: 'computer',
    description:
      'From quantum computing to biotechnology: From quantum fluctuations to the architecture of human innovation.',
  },
  Science: {
    color: '#0A8A5A',
    icon: 'science',
    description:
      'Explore the frontiers of human knowledge, from particle physics to the deepest corners of the cosmos.',
  },
  Business: {
    color: '#B85C07',
    icon: 'trending-up',
    description:
      'Strategy, innovation and the forces shaping global markets and the economy of tomorrow.',
  },
  Health: {
    color: '#C4175A',
    icon: 'favorite-border',
    description:
      'The science of longevity, mental resilience and the future of personalized medicine.',
  },
  'World News': {
    color: '#1A5AB8',
    icon: 'public',
    description:
      'Global headlines, geopolitics and the stories shaping our interconnected world.',
  },
  Sports: {
    color: '#0A7A3A',
    icon: 'sports-soccer',
    description:
      'Athletics, competition and the culture of sport from grassroots to the world stage.',
  },
  Entertainment: {
    color: '#7A0DB8',
    icon: 'palette',
    description:
      'Creativity, culture and the intersection of human expression with emerging technologies.',
  },
  Finance: {
    color: '#8A5A0A',
    icon: 'account-balance',
    description:
      'Markets, investing and the economic forces that move money and shape decisions.',
  },
  Music: {
    color: '#B80A7A',
    icon: 'music-note',
    description:
      'Artists, albums and the soundscapes that define generations and genres.',
  },
  AI: {
    color: '#4A0DB8',
    icon: 'auto-awesome',
    description:
      'Machine learning, automation and the frontier of artificial intelligence research.',
  },
  Arts: {
    color: '#7A0DB8',
    icon: 'palette',
    description:
      'Creativity, culture and the intersection of human expression with emerging technologies.',
  },
  Philosophy: {
    color: '#1A7AB8',
    icon: 'psychology',
    description:
      'Timeless questions, modern answers: ethics, consciousness and the nature of reality.',
  },
  History: {
    color: '#8A6A0A',
    icon: 'auto-stories',
    description:
      'Deep dives into civilizations, turning points and the patterns that define our future.',
  },
  Environment: {
    color: '#1A8A1A',
    icon: 'eco',
    description:
      'Climate, biodiversity and the technologies driving a more sustainable world.',
  },
};

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=800&auto=format&fit=crop';

function formatTotalListenTime(seconds: number): string {
  if (seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, minutes)}m`;
}

function isOwnCompletedPodcast(item: PodcastSummary): boolean {
  const status = item.status?.trim().toLowerCase();
  return status === 'completed' && !item.listenNotesPodcastId?.trim();
}

function mergeLatestEpisodes(own: PodcastSummary[], external: PodcastSummary[]): PodcastSummary[] {
  const ownIds = new Set(own.map((p) => p.id.trim().toLowerCase()));
  const filteredExternal = external.filter(
    (item) => !ownIds.has(item.id.trim().toLowerCase()),
  );

  const merged: PodcastSummary[] = [];
  let ownIdx = 0;
  let externalIdx = 0;

  while (ownIdx < own.length || externalIdx < filteredExternal.length) {
    if (externalIdx < filteredExternal.length) {
      merged.push(filteredExternal[externalIdx]);
      externalIdx += 1;
    }
    if (ownIdx < own.length) {
      merged.push(own[ownIdx]);
      ownIdx += 1;
    }
  }

  return merged;
}

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = id ?? 'Technology';
  const categoryOption = getCategoryOption(category);
  const meta = CATEGORY_META[category] ?? CATEGORY_META.Technology;
  const genreId = categoryOption?.listenNotesGenreId ?? null;
  const apiSlug = categoryOption?.apiSlug ?? category.trim().toLowerCase();

  const [categoryItems, setCategoryItems] = useState<PodcastSummary[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<PodcastSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [totalListenSeconds, setTotalListenSeconds] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const [external, ownAll, stats] = await Promise.all([
        getExternalTrending(genreId),
        getPodcasts().catch(() => [] as PodcastSummary[]),
        getCategoryStats(category),
      ]);

      const ownInCategory = ownAll
        .filter(
          (item) =>
            isOwnCompletedPodcast(item) && matchesCategoryFilter(item, category, apiSlug),
        )
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      setCategoryItems(external);
      setLatestEpisodes(mergeLatestEpisodes(ownInCategory, external));
      setFavoritesCount(stats.favoritesCount);
      setTotalListenSeconds(stats.totalListenSeconds);
    } catch {
      setCategoryItems([]);
      setLatestEpisodes([]);
      setFavoritesCount(0);
      setTotalListenSeconds(0);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [genreId, category, apiSlug]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#111318" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
        <View style={styles.headerActions}>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: meta.color }]}>
          <View style={styles.heroGlowCircle} />
          <Text style={styles.heroTag}>INTELLIGENCE ARCHIVE</Text>
          <Text style={styles.heroTitle}>{category}</Text>
          <Text style={styles.heroDesc}>{meta.description}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {loading ? '—' : String(latestEpisodes.length)}
              </Text>
              <Text style={styles.heroStatLabel}>Shows</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {statsLoading ? '—' : String(favoritesCount)}
              </Text>
              <Text style={styles.heroStatLabel}>Favorites</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {statsLoading ? '—' : formatTotalListenTime(totalListenSeconds)}
              </Text>
              <Text style={styles.heroStatLabel}>Listen Time</Text>
            </View>
          </View>
        </View>

        {/* Trending in Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Trending in {category}</Text>
              <Text style={styles.sectionSub}>Updated less than 1 minute ago</Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: meta.color }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={meta.color} />
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
            {!loading &&
              categoryItems.slice(0, 6).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.trendingCard}
                  activeOpacity={0.85}
                  onPress={() => openPodcastSummary(router, item)}>
                  <Image
                    source={{ uri: item.coverImageUrl?.trim() || FALLBACK_COVER }}
                    style={styles.trendingCardImage}
                  />
                  <View style={styles.trendingCardOverlay} />
                  <View style={styles.trendingFavBtn}>
                    <PodcastCardFavorite item={item} browseCategoryLabel={category} dark size={14} />
                  </View>
                  <TouchableOpacity style={[styles.trendingPlayBtn, { backgroundColor: meta.color }]}>
                    <MaterialIcons name="play-arrow" size={18} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.trendingCardContent}>
                    <Text style={styles.trendingCardTag}>{categoryTag(item)}</Text>
                    <Text style={styles.trendingCardTitle} numberOfLines={2}>
                      {item.title ?? 'Untitled'}
                    </Text>
                    <Text style={styles.trendingCardDuration}>
                      {formatDurationMinutes(item.durationSeconds)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* Latest Episodes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Episodes</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: meta.color }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {!loading &&
            latestEpisodes.map((ep) => {
              return (
                <TouchableOpacity
                  key={ep.id}
                  style={styles.episodeCard}
                  activeOpacity={0.88}
                  onPress={() => openPodcastSummary(router, ep)}>
                  <Image
                    source={{ uri: ep.coverImageUrl?.trim() || FALLBACK_COVER }}
                    style={styles.episodeImage}
                  />
                  <View style={styles.episodeOverlay} />
                  <View style={styles.episodeFavBtn}>
                    <PodcastCardFavorite item={ep} browseCategoryLabel={category} dark size={16} />
                  </View>
                  <View style={styles.episodeContent}>
                    <Text style={styles.episodeTag}>{categoryTag(ep)}</Text>
                    <Text style={styles.episodeTitle}>{ep.title ?? 'Untitled'}</Text>
                    <View style={styles.episodeFooter}>
                      <Text style={styles.episodeDuration}>
                        {formatDurationMinutes(ep.durationSeconds)}
                      </Text>
                      <TouchableOpacity style={[styles.episodePlayBtn, { backgroundColor: meta.color }]}>
                        <MaterialIcons name="play-arrow" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          {!loading && latestEpisodes.length === 0 && (
            <Text style={styles.emptyHint}>No shows in this category right now.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111318',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  /* Hero */
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
  },

  heroGlowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -60,
  },

  heroTag: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 10,
  },

  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    marginBottom: 22,
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroStat: {
    flex: 1,
    alignItems: 'center',
  },

  heroStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  /* Section */
  loaderWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  emptyHint: {
    fontSize: 13,
    color: '#8A8F9A',
    marginTop: 8,
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 30,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 4,
  },

  sectionSub: {
    fontSize: 12,
    color: '#8A8F9A',
  },

  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  /* Trending horizontal scroll */
  trendingScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },

  trendingCard: {
    width: 180,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
  },

  trendingCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  trendingCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,30,0.55)',
  },

  trendingFavBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },

  trendingPlayBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  trendingCardContent: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },

  trendingCardTag: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  trendingCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 6,
  },

  trendingCardDuration: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },

  /* Latest Episodes */
  episodeCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 180,
    marginBottom: 14,
  },

  episodeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  episodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,30,0.58)',
  },

  episodeFavBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },

  episodeContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },

  episodeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.4,
    marginBottom: 6,
  },

  episodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 12,
  },

  episodeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  episodeDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  episodePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
