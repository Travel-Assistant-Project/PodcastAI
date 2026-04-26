import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const FILTERS = ['ALL SAVED', 'TECHNOLOGY', 'SCIENCE', 'BUSINESS', 'ARTS'];

const SAVED_PODCASTS = [
  {
    id: 'f1',
    title: 'Sentence: Inside the AI Breakthrough of the Decade',
    tag: 'AI · FEATURED',
    date: 'OCT 24, 2024',
    episode: 'EPISODE 142',
    duration: '48 MIN',
    category: 'TECHNOLOGY',
    featured: true,
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'f2',
    title: 'Quantum Biology: Life at the Edge of Chaos',
    tag: 'SCI-FI',
    date: 'NOV 03, 2024',
    episode: 'EPISODE 88',
    duration: '36 MIN',
    category: 'SCIENCE',
    featured: false,
    description:
      'Exploring how birds migrate and plants photosynthesize using subatomic mechanics.',
    imageUrl:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'f3',
    title: 'The Invisible CEO: Managing Decentralized Organizations',
    tag: 'BUSINESS',
    date: 'NOV 14, 2024',
    episode: 'EPISODE 55',
    duration: '52 MIN',
    category: 'BUSINESS',
    featured: false,
    description:
      'How blockchain and AI are rewriting the rules of corporate hierarchy in 2025.',
    imageUrl:
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'f4',
    title: "The Future of Creativity: When AI Writes the Symphony",
    tag: "EDITOR'S PICK",
    date: 'DEC 01, 2024',
    episode: 'EPISODE 203',
    duration: '59 MIN',
    category: 'ARTS',
    featured: false,
    description:
      'A deep dive into the ethical and artistic implications of generative music and its impact on human composers.',
    imageUrl:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
  },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('ALL SAVED');
  const [saved, setSaved] = useState<Record<string, boolean>>(
    Object.fromEntries(SAVED_PODCASTS.map((p) => [p.id, true]))
  );

  const filtered =
    activeFilter === 'ALL SAVED'
      ? SAVED_PODCASTS
      : SAVED_PODCASTS.filter((p) => p.category === activeFilter);

  const toggleSave = (id: string) =>
    setSaved((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <MaterialIcons name="search" size={20} color="#5A5F6A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archive</Text>
        <View style={styles.headerAvatar}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
            style={styles.headerAvatarImg}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.8}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filtered.map((item) =>
          item.featured ? (
            /* Featured large card */
            <TouchableOpacity
              key={item.id}
              style={styles.featuredCard}
              activeOpacity={0.88}
              onPress={() => router.push('/podcast')}>
              <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
              <View style={styles.featuredOverlay} />
              <TouchableOpacity
                style={[styles.heartBtn, { top: 12, right: 12 }]}
                onPress={() => toggleSave(item.id)}>
                <MaterialIcons
                  name={saved[item.id] ? 'favorite' : 'favorite-border'}
                  size={18}
                  color={saved[item.id] ? '#E53935' : '#fff'}
                />
              </TouchableOpacity>
              <View style={styles.featuredContent}>
                <View style={styles.featuredMeta}>
                  <Text style={styles.featuredDate}>{item.date}</Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.featuredEpisode}>{item.episode}</Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={3}>
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            /* Regular card */
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push('/podcast')}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTag}>{item.tag}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{item.date}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => toggleSave(item.id)}>
                      <MaterialIcons
                        name={saved[item.id] ? 'favorite' : 'favorite-border'}
                        size={18}
                        color={saved[item.id] ? '#E53935' : '#C2C7D0'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.playBtn}
                      onPress={() => router.push('/player')}>
                      <MaterialIcons name="play-arrow" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )
        )}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="favorite-border" size={48} color="#D0D4E0" />
            <Text style={styles.emptyTitle}>No saved podcasts</Text>
            <Text style={styles.emptyDesc}>Podcasts you save will appear here.</Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111318',
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

  filtersRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },

  filterTab: {
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E7F0',
    borderWidth: 1,
    borderColor: '#CDD5E3',
    alignItems: 'center',
  },

  filterTabActive: {
    backgroundColor: '#0714B8',
    borderColor: '#0714B8',
  },

  filterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3F4656',
    letterSpacing: 0.6,
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },

  /* Featured card */
  featuredCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 200,
  },

  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,30,0.52)',
  },

  heartBtn: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },

  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },

  featuredDate: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  featuredEpisode: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },

  featuredTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },

  /* Regular card */
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
    height: 'auto',
    minHeight: 130,
  },

  cardBody: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },

  cardTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111318',
    lineHeight: 20,
    marginBottom: 4,
  },

  cardDesc: {
    fontSize: 12,
    color: '#8A8F9A',
    lineHeight: 17,
    marginBottom: 8,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardDate: {
    fontSize: 10,
    color: '#8A8F9A',
    fontWeight: '600',
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D4048',
  },

  emptyDesc: {
    fontSize: 14,
    color: '#8A8F9A',
  },
});
