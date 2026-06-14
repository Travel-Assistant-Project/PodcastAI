import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import PodcastCardFavorite from '@/src/components/PodcastCardFavorite';
import ScreenHeader from '@/src/components/ScreenHeader';
import { getFavorites } from '@/src/api/favorites.api';
import {
  getExternalTrending,
  getTrendingPodcasts,
  type PodcastSummary,
} from '@/src/api/podcasts.api';
import { CATEGORY_OPTIONS, getCategoryOption } from '@/src/constants/categories';
import {
  categoryTag,
  formatDurationMinutes,
  getTopFavoriteCategoryLabel,
  openPodcastSummary,
} from '@/src/utils/podcastNavigation';

const { width } = Dimensions.get('window');
const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=400&auto=format&fit=crop';
const DEFAULT_PICKS_CATEGORY = 'Technology';

function favoriteKey(item: PodcastSummary): string {
  const ln = item.listenNotesPodcastId?.trim().toLowerCase();
  if (ln) return `ln:${ln}`;
  return `id:${item.id.trim().toLowerCase()}`;
}

const CATEGORY_ICONS: Record<string, string> = {
  technology: 'computer',
  science: 'science',
  economy: 'trending-up',
  health: 'favorite-border',
  entertainment: 'palette',
  world: 'public',
  sports: 'sports-soccer',
  finance: 'account-balance',
  music: 'music-note',
  ai: 'auto-awesome',
};

const BROWSE_CATEGORIES = CATEGORY_OPTIONS.map((c) => ({
  id: c.apiSlug,
  label: c.label,
  icon: CATEGORY_ICONS[c.apiSlug] ?? 'category',
}));

export default function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [trending, setTrending] = useState<PodcastSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<PodcastSummary[]>([]);
  const [picksCategory, setPicksCategory] = useState<string | null>(null);
  const [picksLoading, setPicksLoading] = useState(true);

  const loadTrending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTrendingPodcasts();
      setTrending(data);
    } catch {
      setTrending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPicks = useCallback(async () => {
    setPicksLoading(true);
    try {
      const favorites = await getFavorites();
      const topCategory = getTopFavoriteCategoryLabel(favorites) ?? DEFAULT_PICKS_CATEGORY;
      const option = getCategoryOption(topCategory);
      const favoritedKeys = new Set(favorites.map(favoriteKey));

      const categoryPodcasts = await getExternalTrending(option?.listenNotesGenreId ?? null);
      const selected = categoryPodcasts
        .filter((item) => !favoritedKeys.has(favoriteKey(item)))
        .slice(0, 2);

      setPicks(selected);
      setPicksCategory(topCategory);
    } catch {
      setPicks([]);
      setPicksCategory(null);
    } finally {
      setPicksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  useFocusEffect(
    useCallback(() => {
      void loadPicks();
    }, [loadPicks]),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trending;
    return trending.filter((p) => {
      const title = (p.title ?? '').toLowerCase();
      const pub = (p.publisher ?? '').toLowerCase();
      const cats = p.categories.join(' ').toLowerCase();
      return title.includes(q) || pub.includes(q) || cats.includes(q);
    });
  }, [search, trending]);

  const trendingEpisodes = filtered.slice(0, 7);

  const picksSubtitle = picksCategory
    ? `Top picks from ${picksCategory} based on your favorites`
    : 'Save favorites to personalize your picks';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader pageTitle="Explore" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color="#8A8F9A" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for episodes, insights, or curators..."
            placeholderTextColor="#5A5F78"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Trending Episodes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Trending Episodes</Text>
              <Text style={styles.sectionSub}>Curated based on your research interests</Text>
            </View>
          </View>

          {loading && (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color="#0714B8" />
            </View>
          )}
          {!loading && filtered.length === 0 && (
            <Text style={styles.emptyHint}>
              {search.trim()
                ? 'No podcasts match your search right now.'
                : 'Trending picks are momentarily unavailable. Browse by category below.'}
            </Text>
          )}

          {!loading &&
            trendingEpisodes.map((item) => {
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.trendingCard}
                  activeOpacity={0.88}
                  onPress={() => openPodcastSummary(router, item)}>
                  <Image
                    source={{
                      uri:
                        item.coverImageUrl?.trim() ||
                        'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=800&auto=format&fit=crop',
                    }}
                    style={styles.trendingCardImage}
                  />
                  <View style={styles.trendingCardOverlay} />
                  <View style={styles.favBtnTopRight}>
                    <PodcastCardFavorite item={item} dark />
                  </View>
                  <View style={styles.trendingCardContent}>
                    <Text style={styles.trendingCardTag}>{categoryTag(item)}</Text>
                    <Text style={styles.trendingCardTitle}>{item.title ?? 'Untitled'}</Text>
                    <Text style={styles.trendingCardDuration}>
                      {formatDurationMinutes(item.durationSeconds)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.trendingCardPlayBtn}>
                    <MaterialIcons name="play-arrow" size={20} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <Text style={styles.sectionSub}>Drop dives into specialized domains</Text>

          <View style={styles.categoryGrid}>
            {BROWSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/category', params: { id: cat.label } })}>
                <View style={styles.categoryIconWrap}>
                  <MaterialIcons name={cat.icon as any} size={22} color="#0714B8" />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* PodcastAI Picks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podify Picks</Text>
          <Text style={styles.sectionSub}>{picksSubtitle}</Text>

          {picksLoading && (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color="#0714B8" />
            </View>
          )}

          {!picksLoading && picks.length === 0 && (
            <Text style={styles.emptyHint}>No picks available in this category right now.</Text>
          )}

          {!picksLoading &&
            picks.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.archiveRow}
                activeOpacity={0.85}
                onPress={() => openPodcastSummary(router, item)}>
                <Image
                  source={{ uri: item.coverImageUrl?.trim() || FALLBACK_COVER }}
                  style={styles.archiveThumb}
                />
                <View style={styles.archiveInfo}>
                  <Text style={styles.archiveTag}>{categoryTag(item)}</Text>
                  <Text style={styles.archiveTitle}>{item.title ?? 'Untitled'}</Text>
                  <Text style={styles.archiveSub} numberOfLines={1}>
                    {item.publisher?.trim() || formatDurationMinutes(item.durationSeconds)}
                  </Text>
                </View>
                <PodcastCardFavorite
                  item={item}
                  browseCategoryLabel={picksCategory ?? undefined}
                  size={18}
                />
              </TouchableOpacity>
            ))}
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

  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111318',
  },

  section: {
    marginBottom: 32,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 16,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0714B8',
    textAlign: 'right',
    lineHeight: 17,
  },

  loaderWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },

  emptyHint: {
    fontSize: 13,
    color: '#8A8F9A',
    marginBottom: 12,
  },

  /* Featured card */
  favBtnTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },

  /* Trending card - vertical layout */
  trendingCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 140,
    marginBottom: 12,
  },

  trendingCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  trendingCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 35, 0.62)',
  },

  trendingCardContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },

  trendingCardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B8FFF',
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  trendingCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 6,
  },

  trendingCardDuration: {
    fontSize: 12,
    color: '#C8CAFF',
  },

  trendingCardPlayBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B8FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Categories */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  categoryCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111318',
  },

  /* PodcastAI Picks */
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  archiveThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
  },

  archiveInfo: {
    flex: 1,
  },

  archiveTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  archiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 3,
  },

  archiveSub: {
    fontSize: 12,
    color: '#8A8F9A',
  },
});
