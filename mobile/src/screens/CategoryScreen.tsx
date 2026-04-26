import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FavoriteButton from '@/src/components/FavoriteButton';

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

const TRENDING = [
  {
    id: 'tr1',
    title: 'The Silicon Sentience: Exploring Non-Turing Intelligence',
    duration: '41 min',
    tag: 'AI · COGNITION',
    imageUrl:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'tr2',
    title: 'Zero Trust Architectures in the Post-Key Age',
    duration: '33 min',
    tag: 'SECURITY',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'tr3',
    title: 'The Decentralised Ledger: More Than Use Cases',
    duration: '28 min',
    tag: 'BLOCKCHAIN',
    imageUrl:
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop',
  },
];

const LATEST_EPISODES = [
  {
    id: 'ep1',
    title: 'Scaling the Compute Infrastructure for the Next Billion Users',
    duration: '56 min',
    tag: 'INFRASTRUCTURE · CLOUD',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'ep2',
    title: 'The Bio-Link: Interface Between Brain and Machine',
    duration: '49 min',
    tag: 'NEUROTECHNOLOGY',
    imageUrl:
      'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'ep3',
    title: 'Global Connectivity: Bridging the Digital Divide via LEO',
    duration: '37 min',
    tag: 'SATELLITES · NETWORK',
    imageUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop',
  },
];

const CURATORS = [
  {
    id: 'cu1',
    name: 'Nova T.',
    specialty: 'AI SYSTEMS',
    followers: '12.4K',
    imageUrl: 'https://i.pravatar.cc/100?img=47',
    following: false,
  },
  {
    id: 'cu2',
    name: 'Dr. Elena V.',
    specialty: 'NEUROSCIENCE',
    followers: '9.1K',
    imageUrl: 'https://i.pravatar.cc/100?img=25',
    following: true,
  },
  {
    id: 'cu3',
    name: 'Sam Ford',
    specialty: 'BLOCKCHAIN',
    followers: '7.8K',
    imageUrl: 'https://i.pravatar.cc/100?img=33',
    following: false,
  },
  {
    id: 'cu4',
    name: 'Marcus Thoma',
    specialty: 'FUTURE TECH',
    followers: '15.2K',
    imageUrl: 'https://i.pravatar.cc/100?img=52',
    following: false,
  },
];

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = id ?? 'Technology';
  const meta = CATEGORY_META[category] ?? CATEGORY_META.Technology;

  const [followed, setFollowed] = useState<Record<string, boolean>>(
    Object.fromEntries(CURATORS.map((c) => [c.id, c.following]))
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
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="search" size={20} color="#5A5F6A" />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
              style={styles.headerAvatarImg}
            />
          </View>
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
              <Text style={styles.heroStatValue}>2.4K</Text>
              <Text style={styles.heroStatLabel}>Episodes</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>180</Text>
              <Text style={styles.heroStatLabel}>Curators</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>94K</Text>
              <Text style={styles.heroStatLabel}>Listeners</Text>
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
            {TRENDING.map((item) => (
              <TouchableOpacity key={item.id} style={styles.trendingCard} activeOpacity={0.85}>
                <Image source={{ uri: item.imageUrl }} style={styles.trendingCardImage} />
                <View style={styles.trendingCardOverlay} />
                <TouchableOpacity style={[styles.trendingPlayBtn, { backgroundColor: meta.color }]}>
                  <MaterialIcons name="play-arrow" size={18} color="#fff" />
                </TouchableOpacity>
                <View style={styles.trendingCardContent}>
                  <Text style={styles.trendingCardTag}>{item.tag}</Text>
                  <Text style={styles.trendingCardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.trendingCardDuration}>{item.duration}</Text>
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

          {LATEST_EPISODES.map((ep) => (
            <TouchableOpacity key={ep.id} style={styles.episodeCard} activeOpacity={0.88}>
              <Image source={{ uri: ep.imageUrl }} style={styles.episodeImage} />
              <View style={styles.episodeOverlay} />
              <View style={styles.episodeFavBtn}>
                <FavoriteButton dark size={16} />
              </View>
              <View style={styles.episodeContent}>
                <Text style={styles.episodeTag}>{ep.tag}</Text>
                <Text style={styles.episodeTitle}>{ep.title}</Text>
                <View style={styles.episodeFooter}>
                  <Text style={styles.episodeDuration}>{ep.duration}</Text>
                  <TouchableOpacity style={[styles.episodePlayBtn, { backgroundColor: meta.color }]}>
                    <MaterialIcons name="play-arrow" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Curators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top AI Curators</Text>
          <Text style={styles.sectionSub}>Experts in this area you can follow</Text>

          {CURATORS.map((curator) => (
            <View key={curator.id} style={styles.curatorRow}>
              <Image source={{ uri: curator.imageUrl }} style={styles.curatorAvatar} />
              <View style={styles.curatorInfo}>
                <Text style={styles.curatorName}>{curator.name}</Text>
                <Text style={styles.curatorSpecialty}>{curator.specialty}</Text>
                <Text style={styles.curatorFollowers}>{curator.followers} followers</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  followed[curator.id] && { backgroundColor: meta.color, borderColor: meta.color },
                ]}
                onPress={() =>
                  setFollowed((prev) => ({ ...prev, [curator.id]: !prev[curator.id] }))
                }>
                <Text
                  style={[
                    styles.followBtnText,
                    followed[curator.id] && { color: '#fff' },
                  ]}>
                  {followed[curator.id] ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
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

  /* Curators */
  curatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  curatorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },

  curatorInfo: {
    flex: 1,
  },

  curatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 2,
  },

  curatorSpecialty: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  curatorFollowers: {
    fontSize: 12,
    color: '#8A8F9A',
  },

  followBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D0D4E0',
    backgroundColor: '#FFFFFF',
  },

  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111318',
  },
});
