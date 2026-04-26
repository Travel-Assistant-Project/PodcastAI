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
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const TRANSCRIPT = [
  {
    id: 't1',
    time: '00:00',
    speaker: 'Dr. Thorne',
    text: '"When we consider the actual architecture of these transformers, we aren\'t just looking at math."',
    highlighted: false,
  },
  {
    id: 't2',
    time: '04:43',
    speaker: 'Sarah Jenkins',
    text: '"It\'s more like a digital fossil record of human language. Every weight in that neural network is a crystallized moment of human communication. We\'re building a mirror, not just a tool."',
    highlighted: true,
  },
  {
    id: 't3',
    time: '09:12',
    speaker: 'Dr. Thorne',
    text: '"Exactly. And that\'s where the ethical dimension becomes unavoidable. If the mirror is reflecting our biases, then the reflection itself becomes a catalyst for future bias."',
    highlighted: false,
  },
  {
    id: 't4',
    time: '14:55',
    speaker: 'Sarah Jenkins',
    text: '"Can we ever truly achieve \'objective\' intelligence when the very medium—language—is inherently subjective?"',
    highlighted: false,
  },
];

const KEY_THEMES = ['Neural Networks', 'Linguistics', 'AI Ethics', 'Machine Consciousness'];

const RESEARCH = [
  { id: 'r1', title: 'Attention Is All You Need', meta: 'VASWANI ET AL · 2017' },
  { id: 'r2', title: 'Language Models are Few-Shot Learners', meta: 'BROWN ET AL · 2020' },
];

export default function PodcastDetailScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#111318" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PodcastAI</Text>
        <View style={styles.headerRight}>
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
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {['SCIENCE', 'FUTURE TECH', 'AI ENHANCED'].map((tag) => (
            <View
              key={tag}
              style={[styles.tag, tag === 'AI ENHANCED' && styles.tagAccent]}>
              {tag === 'AI ENHANCED' && (
                <MaterialIcons name="auto-awesome" size={10} color="#0714B8" style={{ marginRight: 3 }} />
              )}
              <Text style={[styles.tagText, tag === 'AI ENHANCED' && styles.tagTextAccent]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        {/* Title & Meta */}
        <Text style={styles.title}>The Architecture of{'\n'}Synthetic Minds</Text>
        <Text style={styles.hosts}>Hosted by Dr. Aris Thorne & Sarah Jenkins</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="schedule" size={13} color="#8A8F9A" />
          <Text style={styles.metaText}>55 MIN</Text>
          <View style={styles.metaDot} />
          <MaterialIcons name="calendar-today" size={12} color="#8A8F9A" />
          <Text style={styles.metaText}>MAR 12, 2024</Text>
        </View>

        {/* Mini Player */}
        <View style={styles.miniPlayer}>
          <TouchableOpacity
            style={styles.miniPlayBtn}
            onPress={() => setIsPlaying(!isPlaying)}>
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <View style={styles.miniProgressWrap}>
            <View style={styles.miniProgressTrack}>
              <View style={styles.miniProgressFill} />
            </View>
            <View style={styles.miniTimes}>
              <Text style={styles.miniTime}>16:45</Text>
              <Text style={styles.miniTime}>34:00</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionPrimary}>
            <MaterialIcons name="auto-awesome" size={15} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.actionPrimaryText}>View Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSecondary}>
            <MaterialIcons name="ios-share" size={15} color="#111318" style={{ marginRight: 6 }} />
            <Text style={styles.actionSecondaryText}>Share Insight</Text>
          </TouchableOpacity>
        </View>

        {/* Transcript */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI-Generated Transcript</Text>
            <View style={styles.transcriptBadges}>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
              <Text style={styles.langBadge}>ENGLISH</Text>
            </View>
          </View>

          {TRANSCRIPT.map((item) => (
            <View
              key={item.id}
              style={[styles.transcriptBlock, item.highlighted && styles.transcriptHighlighted]}>
              <Text style={styles.transcriptTime}>{item.time}</Text>
              <Text
                style={[
                  styles.transcriptText,
                  item.highlighted && styles.transcriptTextHighlighted,
                ]}>
                <Text style={styles.transcriptSpeaker}>{item.speaker}: </Text>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Key Themes */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Key Themes</Text>
          <View style={styles.themesWrap}>
            {KEY_THEMES.map((theme) => (
              <View key={theme} style={styles.themeTag}>
                <Text style={styles.themeTagText}>{theme}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Research Cited */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>AI Research Cited</Text>
          {RESEARCH.map((r) => (
            <View key={r.id} style={styles.researchRow}>
              <View style={styles.researchIcon}>
                <MaterialIcons name="article" size={16} color="#0714B8" />
              </View>
              <View style={styles.researchInfo}>
                <Text style={styles.researchTitle}>{r.title}</Text>
                <Text style={styles.researchMeta}>{r.meta}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Player Button */}
      <View style={styles.stickyPlayer}>
        <TouchableOpacity
          style={styles.stickyPlayBtn}
          onPress={() => router.push('/player')}
          activeOpacity={0.85}>
          <MaterialIcons name="headphones" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.stickyPlayText}>Open Full Player</Text>
          <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
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
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111318',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    paddingBottom: 100,
  },

  heroContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    marginBottom: 16,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,30,0.15)',
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ECEEF2',
  },

  tagAccent: {
    backgroundColor: '#EEF1FF',
    borderWidth: 1,
    borderColor: '#C7CFFF',
  },

  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5A5F6A',
    letterSpacing: 1.2,
  },

  tagTextAccent: {
    color: '#0714B8',
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111318',
    lineHeight: 34,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  hosts: {
    fontSize: 13,
    color: '#5A5F6A',
    paddingHorizontal: 16,
    marginBottom: 8,
    fontWeight: '500',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 20,
  },

  metaText: {
    fontSize: 12,
    color: '#8A8F9A',
    fontWeight: '600',
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#C2C7D0',
    marginHorizontal: 2,
  },

  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  miniPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniProgressWrap: {
    flex: 1,
  },

  miniProgressTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 6,
  },

  miniProgressFill: {
    width: '48%',
    height: '100%',
    backgroundColor: '#0714B8',
    borderRadius: 2,
  },

  miniTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  miniTime: {
    fontSize: 11,
    color: '#8A8F9A',
  },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 28,
  },

  actionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0714B8',
    borderRadius: 14,
    paddingVertical: 13,
  },

  actionPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  actionSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111318',
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111318',
  },

  transcriptBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  liveBadge: {
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  langBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1,
  },

  transcriptBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },

  transcriptHighlighted: {
    backgroundColor: '#EEF1FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0714B8',
  },

  transcriptTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  transcriptSpeaker: {
    fontWeight: '700',
    color: '#111318',
    fontSize: 13,
  },

  transcriptText: {
    fontSize: 13,
    color: '#5A5F6A',
    lineHeight: 20,
  },

  transcriptTextHighlighted: {
    color: '#111318',
  },

  infoCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 12,
  },

  themesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  themeTag: {
    backgroundColor: '#F0F2F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  themeTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D4048',
  },

  researchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  researchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  researchInfo: {
    flex: 1,
  },

  researchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111318',
    marginBottom: 2,
  },

  researchMeta: {
    fontSize: 11,
    color: '#8A8F9A',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  stickyPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F9FB',
    borderTopWidth: 1,
    borderTopColor: '#E8EBF2',
  },

  stickyPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0714B8',
    borderRadius: 16,
    paddingVertical: 14,
  },

  stickyPlayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
