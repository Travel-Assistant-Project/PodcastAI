import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import {
  getFavorites,
  removeListenNotesFavorite,
  removePodcastFavorite,
} from '@/src/api/favorites.api';
import { getProfile } from '@/src/api/user.api';
import type { PodcastSummary } from '@/src/api/podcasts.api';
import PodcastCardFavorite from '@/src/components/PodcastCardFavorite';
import ScreenHeader, { HeaderProfileButton } from '@/src/components/ScreenHeader';
import { FAVORITE_FILTERS } from '@/src/constants/categories';
import { useFavorites } from '@/src/context/FavoritesContext';
import {
  categoryTag,
  favoriteCardSubtitle,
  matchesFavoriteFilter,
  openPodcastSummary,
} from '@/src/utils/podcastNavigation';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=800&auto=format&fit=crop';

function formatSavedDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { markUnfavorited } = useFavorites();
  const [activeSlug, setActiveSlug] = useState<string | null>(FAVORITE_FILTERS[0].slug);
  const [saved, setSaved] = useState<PodcastSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setSaved(data);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadFavorites();

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
    }, [loadFavorites]),
  );

  const filtered = useMemo(
    () => saved.filter((p) => matchesFavoriteFilter(p, activeSlug)),
    [saved, activeSlug],
  );

  const handleUnfavorite = useCallback(
    async (item: PodcastSummary) => {
      const ln = item.listenNotesPodcastId?.trim();
      try {
        if (ln) {
          await removeListenNotesFavorite(ln);
          markUnfavorited({ listenNotesPodcastId: ln });
        } else {
          await removePodcastFavorite(item.id);
          markUnfavorited({ podcastId: item.id });
        }
        setSaved((prev) => prev.filter((p) => p.id !== item.id));
      } catch {
        /* keep list unchanged on error */
      }
    },
    [markUnfavorited],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader
        pageTitle="Favorites"
        right={
          <HeaderProfileButton
            photoUrl={profilePhotoUrl}
            onPress={() => router.push('/(tabs)/profile')}
          />
        }
      />

      <View style={styles.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}>
          {FAVORITE_FILTERS.map((f) => {
            const isActive = activeSlug === f.slug;
            return (
              <TouchableOpacity
                key={f.slug ?? 'all'}
                activeOpacity={0.8}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveSlug(f.slug)}>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#0714B8" />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!loading &&
          filtered.map((item) => {
            const cover = item.coverImageUrl?.trim() || FALLBACK_COVER;
            const dateLabel = formatSavedDate(item.createdAt);
            const tag = categoryTag(item);
            const subtitle = favoriteCardSubtitle(item);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openPodcastSummary(router, item)}>
                <Image source={{ uri: cover }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTag}>{tag}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title ?? 'Untitled'}
                  </Text>
                  <Text style={styles.cardDesc} numberOfLines={1}>
                    {subtitle}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>{dateLabel}</Text>
                    <View style={styles.cardActions}>
                      <PodcastCardFavorite
                        item={item}
                        size={18}
                        onFavoriteChange={(favorited) => {
                          if (!favorited) void handleUnfavorite(item);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.playBtn}
                        onPress={() => openPodcastSummary(router, item)}>
                        <MaterialIcons name="play-arrow" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

        {!loading && filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="favorite-border" size={48} color="#D0D4E0" />
            <Text style={styles.emptyTitle}>No saved podcasts</Text>
            <Text style={styles.emptyDesc}>
              {activeSlug
                ? 'Nothing saved in this category yet. Try another filter or save podcasts from Home.'
                : 'Save podcasts from Home or your generated library to see them here.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },

  filtersWrap: {
    height: 40,
    marginBottom: 16,
  },

  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    minHeight: 40,
  },

  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E2E7F0',
    borderWidth: 1,
    borderColor: '#CDD5E3',
  },

  filterTabActive: {
    backgroundColor: '#0714B8',
    borderColor: '#0714B8',
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F4656',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  cardImage: {
    width: 110,
    height: 130,
  },

  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },

  cardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111318',
    lineHeight: 19,
  },

  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 17,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  cardDate: {
    fontSize: 11,
    color: '#8A8F9A',
    fontWeight: '600',
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111318',
  },

  emptyDesc: {
    fontSize: 13,
    color: '#8A8F9A',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
