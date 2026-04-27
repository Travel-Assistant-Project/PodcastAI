import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { getInterests } from '@/src/api/interests.api';
import { Colors } from '@/src/styles/colors';
import FavoriteButton from '@/src/components/FavoriteButton';
import { getUser } from '@/src/store/authStore';

const recommendedItems = [
  {
    id: 'r1',
    title: 'The Future of Large Language Models',
    meta: '45 mins',
    category: 'AI INNOVATIONS',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'r2',
    title: 'Decoding the Neural Network Mind',
    meta: '32 mins',
    category: 'NEURAL NETWORK',
    imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=600&auto=format&fit=crop',
  },
];

const recentPlayed = [
  {
    id: 'p1',
    title: 'Ethics in the Age of Automation',
    subtitle: 'Philosophy Now',
    progress: '12m left',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'p2',
    title: 'Quantum Computing Explained',
    subtitle: 'Science Daily',
    progress: 'Completed',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'p3',
    title: 'Human-Machine Synergy',
    subtitle: 'PodcastAI Collective',
    progress: '5m left',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'p4',
    title: 'The Evolution of Voice AI',
    subtitle: 'Sound Systems',
    progress: '32m left',
    imageUrl: 'https://images.unsplash.com/photo-1488229297570-58520851e868?q=80&w=300&auto=format&fit=crop',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [interestNames, setInterestNames] = useState<string[]>([]);

  const user = getUser();
  const displayName = useMemo(() => {
    const fullName = user?.fullName?.trim();
    if (!fullName) return 'there';
    return fullName.split(' ')[0] || fullName;
  }, [user?.fullName]);

  useEffect(() => {
    const loadInterests = async () => {
      try {
        const data = await getInterests();
        setInterestNames(data.slice(0, 3).map((item) => item.name));
      } catch {
        setInterestNames([]);
      }
    };

    loadInterests();
  }, []);

  const interestText = useMemo(() => {
    if (!interestNames.length) return 'Based on your interest in Machine Learning';
    return `Based on your interests: ${interestNames.join(', ')}`;
  }, [interestNames]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>PodcastAI</Text>
          <View style={styles.headerActions}>
            <Text style={styles.iconText}>⌕</Text>
            <View style={styles.avatarDot} />
          </View>
        </View>

        <Text style={styles.greeting}>Merhaba, {displayName}!</Text>
        <Text style={styles.subtitle}>Your AI Curator has 3 new insights for you today.</Text>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLive}>LIVE NOW</Text>
            <Text style={styles.heroTime}>10-15 mins</Text>
          </View>
          <Text style={styles.heroTitle}>Today&apos;s Tech Briefing: The Generative Frontier</Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/player')}>
              <Text style={styles.primaryBtnText}>▶ Listen Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/podcast')}>
              <Text style={styles.secondaryBtnText}>◫ View Insights</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <Text style={styles.sectionAction}>View All</Text>
        </View>
        <Text style={styles.sectionSubtext}>{interestText}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedRow}>
          {recommendedItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.recommendedCard} activeOpacity={0.85} onPress={() => router.push('/podcast')}>
              <Image source={{ uri: item.imageUrl }} style={styles.recommendedImage} />
              <View style={styles.recommendedFavBtn}>
                <FavoriteButton size={15} />
              </View>
              <Text style={styles.recommendedCategory}>{item.category}</Text>
              <Text numberOfLines={2} style={styles.recommendedTitle}>
                {item.title}
              </Text>
              <Text style={styles.recommendedMeta}>{item.meta}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Recently Played</Text>
        <View style={styles.listWrap}>
          {recentPlayed.map((item) => (
            <TouchableOpacity key={item.id} style={styles.listItem} activeOpacity={0.8} onPress={() => router.push('/podcast')}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              <View style={styles.listContent}>
                <Text numberOfLines={1} style={styles.listTitle}>
                  {item.title}
                </Text>
                <Text style={styles.listSubtitle}>
                  {item.subtitle} - {item.progress}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
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
    gap: 10,
  },
  heroLive: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroTime: {
    color: '#DCE6FF',
    fontWeight: '600',
    fontSize: 13,
  },
  heroTitle: {
    marginTop: 12,
    color: Colors.surface,
    fontSize: 40,
    lineHeight: 43,
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
  sectionHeader: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '800',
  },
  sectionAction: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionSubtext: {
    marginTop: -2,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  recommendedRow: {
    gap: 12,
    paddingRight: 10,
  },
  recommendedCard: {
    position: 'relative',
    width: 195,
  },
  recommendedImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#CED8F6',
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
