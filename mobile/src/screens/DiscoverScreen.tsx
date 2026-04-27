import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FavoriteButton from '@/src/components/FavoriteButton';

const { width } = Dimensions.get('window');

const TRENDING = [
  {
    id: 't1',
    title: 'Mapping Brain-to-Text Pipelines',
    author: 'Dr. Elena Vos',
    duration: '38 min',
    tag: 'NEUROSCIENCE',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=800&auto=format&fit=crop',
    featured: true,
  },
  {
    id: 't2',
    title: 'CRISPR and the Ethics of Tomorrow',
    duration: '51 min',
    tag: 'BIOTECH',
    imageUrl: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?q=80&w=800&auto=format&fit=crop',
    featured: false,
  },
  {
    id: 't3',
    title: 'Post-Scarcity Economics',
    duration: '44 min',
    tag: 'ECONOMICS',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
    featured: false,
  },
];

const CATEGORIES = [
  { id: 'c1', label: 'Technology', icon: 'computer' },
  { id: 'c2', label: 'Science', icon: 'science' },
  { id: 'c3', label: 'Business', icon: 'trending-up' },
  { id: 'c4', label: 'Health', icon: 'favorite-border' },
  { id: 'c5', label: 'Arts', icon: 'palette' },
  { id: 'c6', label: 'Philosophy', icon: 'psychology' },
  { id: 'c7', label: 'History', icon: 'auto-stories' },
  { id: 'c8', label: 'Environment', icon: 'eco' },
];

const ARCHIVE_PICKS = [
  {
    id: 'a1',
    title: 'The Dark Matter Paradox',
    subtitle: 'Exploring new theories',
    tag: 'PHYSICS DEEP DIVE',
    imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'a2',
    title: 'Sustainable Arcologies',
    subtitle: 'Designing vertical cities',
    tag: 'FUTURE LIVING',
    imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=400&auto=format&fit=crop',
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="auto-awesome" size={16} color="#8B8FFF" />
          <Text style={styles.headerBrand}>PodcastAI</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.headerPage}>Discover</Text>
        </View>
        <TouchableOpacity style={styles.searchIconBtn}>
          <MaterialIcons name="search" size={22} color="#5A5F6A" />
        </TouchableOpacity>
      </View>

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
            <TouchableOpacity>
              <Text style={styles.viewAll}>View{'\n'}All</Text>
            </TouchableOpacity>
          </View>

          {/* Featured card */}
          <TouchableOpacity style={styles.featuredCard} activeOpacity={0.88} onPress={() => router.push('/podcast')}>
            <Image source={{ uri: TRENDING[0].imageUrl }} style={styles.featuredImage} />
            <View style={styles.featuredOverlay} />
            <View style={styles.favBtnTopRight}>
              <FavoriteButton dark />
            </View>
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTag}>{TRENDING[0].tag}</Text>
              <Text style={styles.featuredTitle}>{TRENDING[0].title}</Text>
              <View style={styles.featuredFooter}>
                <View style={styles.authorRow}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorInitial}>D</Text>
                  </View>
                  <Text style={styles.authorName}>{TRENDING[0].author}</Text>
                </View>
                <TouchableOpacity style={styles.playBtn}>
                  <MaterialIcons name="play-arrow" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          {/* Regular trending cards */}
          {TRENDING.slice(1).map((item) => (
            <TouchableOpacity key={item.id} style={styles.trendingRow} activeOpacity={0.85} onPress={() => router.push('/podcast')}>
              <Image source={{ uri: item.imageUrl }} style={styles.trendingThumb} />
              <View style={styles.trendingOverlay} />
              <View style={styles.trendingPlayWrap}>
                <MaterialIcons name="play-arrow" size={22} color="#fff" />
              </View>
              <View style={styles.favBtnTopRight}>
                <FavoriteButton dark size={16} />
              </View>
              <View style={styles.trendingInfo}>
                <Text style={styles.trendingTag}>{item.tag}</Text>
                <Text style={styles.trendingTitle}>{item.title}</Text>
                <Text style={styles.trendingDuration}>{item.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <Text style={styles.sectionSub}>Drop dives into specialized domains</Text>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
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
          <Text style={styles.sectionTitle}>PodcastAI Picks</Text>
          <Text style={styles.sectionSub}>Expertly documented research streams</Text>

          {ARCHIVE_PICKS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.archiveRow} activeOpacity={0.85} onPress={() => router.push('/podcast')}>
              <Image source={{ uri: item.imageUrl }} style={styles.archiveThumb} />
              <View style={styles.archiveInfo}>
                <Text style={styles.archiveTag}>{item.tag}</Text>
                <Text style={styles.archiveTitle}>{item.title}</Text>
                <Text style={styles.archiveSub}>{item.subtitle}</Text>
              </View>
              <FavoriteButton size={18} />
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  headerBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002E83',
  },

  headerDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D6DAE6',
  },

  headerPage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8F9A',
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

  /* Featured card */
  favBtnTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },

  featuredCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 200,
    marginBottom: 14,
  },

  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 35, 0.62)',
  },

  featuredContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },

  featuredTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B8FFF',
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 14,
  },

  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B8FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authorInitial: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  authorName: {
    fontSize: 13,
    color: '#C8CAFF',
    fontWeight: '500',
  },

  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B8FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Regular trending rows */
  trendingRow: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 120,
    marginBottom: 12,
  },

  trendingThumb: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  trendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 35, 0.65)',
  },

  trendingPlayWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139,143,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  trendingInfo: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
  },

  trendingTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B8FFF',
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  trendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },

  trendingDuration: {
    fontSize: 12,
    color: '#A0A4C0',
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
