import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ALL_CATEGORIES = ['Technology', 'Science', 'Business', 'Health', 'World News', 'AI'];
const TONES = [
  { id: 'official', label: 'Official', desc: 'Formal, concise, data-driven report.', icon: 'gavel' },
  { id: 'friendly', label: 'Friendly', desc: 'Accessible, warm, and explanatory.', icon: 'sentiment-satisfied' },
  { id: 'entertaining', label: 'Entertaining', desc: 'Dynamic storytelling with personality.', icon: 'theater-comedy' },
];
const DURATIONS = ['2 min', '5 min', '10 min'];

export default function CreateScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Science']);
  const [hostMode, setHostMode] = useState<'single' | 'dual'>('single');
  const [tone, setTone] = useState('official');
  const [duration, setDuration] = useState('5 min');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleGenerate = () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Kategori Seç', 'Lütfen en az bir kategori seçin.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert('Podcast Oluşturuldu!', 'Podcastiniz hazırlanıyor. Kısa süre içinde dinleyebilirsiniz.');
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <MaterialIcons name="menu" size={22} color="#111318" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PodcastAI</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <MaterialIcons name="search" size={22} color="#5A5F6A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Page Title */}
        <Text style={styles.pageTitle}>Create Your Daily{'\n'}Briefing</Text>
        <Text style={styles.pageSubtitle}>
          Curate your intelligence feed. Our AI synthesizes the latest global insights into a
          personalized audio experience.
        </Text>

        {/* Step 01 — Categories */}
        <View style={styles.stepBlock}>
          <View style={styles.stepLabelRow}>
            <Text style={styles.stepNumber}>01 /</Text>
            <Text style={styles.stepLabel}>CHOOSE CATEGORIES</Text>
          </View>
          <View style={styles.tagsWrap}>
            {ALL_CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => toggleCategory(cat)}
                  activeOpacity={0.8}>
                  {cat === 'AI' && (
                    <MaterialIcons
                      name="auto-awesome"
                      size={13}
                      color={active ? '#fff' : '#0714B8'}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 02 — Host Selection */}
        <View style={styles.stepBlock}>
          <View style={styles.stepLabelRow}>
            <Text style={styles.stepNumber}>02 /</Text>
            <Text style={styles.stepLabel}>HOST SELECTION</Text>
          </View>
          <View style={styles.hostCard}>
            <View style={styles.hostLeft}>
              <View style={styles.hostAvatarWrap}>
                <MaterialIcons name="mic" size={20} color="#0714B8" />
              </View>
              <View>
                <Text style={styles.hostVoiceLabel}>Voice</Text>
                <Text style={styles.hostName}>Narrative</Text>
                <Text style={styles.hostDesc}>Switch between solo or{'\n'}conversational AI</Text>
              </View>
            </View>
            <View style={styles.hostToggle}>
              <TouchableOpacity
                style={[styles.hostToggleBtn, hostMode === 'single' && styles.hostToggleBtnActive]}
                onPress={() => setHostMode('single')}>
                <Text style={[styles.hostToggleText, hostMode === 'single' && styles.hostToggleTextActive]}>
                  Single{'\n'}Host
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.hostToggleBtn, hostMode === 'dual' && styles.hostToggleBtnActive]}
                onPress={() => setHostMode('dual')}>
                <Text style={[styles.hostToggleText, hostMode === 'dual' && styles.hostToggleTextActive]}>
                  Dual{'\n'}Hosts
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Step 03 — Editorial Tone */}
        <View style={styles.stepBlock}>
          <View style={styles.stepLabelRow}>
            <Text style={styles.stepNumber}>03 /</Text>
            <Text style={styles.stepLabel}>EDITORIAL TONE</Text>
          </View>
          <View style={styles.toneList}>
            {TONES.map((t) => {
              const active = tone === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={styles.toneRow}
                  onPress={() => setTone(t.id)}
                  activeOpacity={0.8}>
                  <View style={[styles.toneRadio, active && styles.toneRadioActive]}>
                    {active && <View style={styles.toneRadioDot} />}
                  </View>
                  <View style={styles.toneInfo}>
                    <Text style={[styles.toneLabel, active && styles.toneLabelActive]}>{t.label}</Text>
                    <Text style={styles.toneDesc}>{t.desc}</Text>
                  </View>
                  <MaterialIcons
                    name={t.icon as any}
                    size={20}
                    color={active ? '#0714B8' : '#C2C7D0'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 04 — Briefing Length */}
        <View style={styles.stepBlock}>
          <View style={styles.stepLabelRow}>
            <Text style={styles.stepNumber}>04 /</Text>
            <Text style={styles.stepLabel}>BRIEFING LENGTH</Text>
          </View>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
                onPress={() => setDuration(d)}
                activeOpacity={0.8}>
                <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewMedia}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=800&auto=format&fit=crop',
              }}
              style={styles.previewImage}
            />
            <View style={styles.previewOverlay} />
            <TouchableOpacity style={styles.previewPlayBtn}>
              <MaterialIcons name="play-arrow" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.previewBadgeSafe}>
              <Text style={styles.previewBadgeSafeText}>SAFE WORK</Text>
            </View>
          </View>

          <View style={styles.previewBody}>
            <View style={styles.previewAiBadge}>
              <MaterialIcons name="auto-awesome" size={11} color="#0714B8" />
              <Text style={styles.previewAiBadgeText}>AI USING BRIEF</Text>
            </View>
            <Text style={styles.previewTitle}>Visualizing Your Story</Text>
            <Text style={styles.previewDesc}>
              Based on your{' '}
              {selectedCategories.length > 0
                ? selectedCategories.slice(0, 2).join(' & ')
                : 'selected category'}{' '}
              choices, we're pulling the latest papers from today. Your brief will include a summary
              of the new fusion energy breakthrough.
            </Text>
            <View style={styles.previewFooter}>
              <View style={styles.previewAvatars}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/40?img=47' }}
                  style={styles.previewAvatar}
                />
                <Image
                  source={{ uri: 'https://i.pravatar.cc/40?img=25' }}
                  style={[styles.previewAvatar, { marginLeft: -10 }]}
                />
              </View>
              <Text style={styles.previewVoice}>Neural Voice: "Atlas"</Text>
            </View>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, isGenerating && styles.generateBtnLoading]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={isGenerating}>
          <MaterialIcons name="auto-awesome" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.generateBtnText}>
            {isGenerating ? 'Generating...' : 'Generate Podcast'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.generateNote}>Estimated generation time: 12 seconds</Text>
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
    paddingVertical: 13,
  },

  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002E83',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111318',
    lineHeight: 40,
    marginBottom: 12,
    marginTop: 4,
  },

  pageSubtitle: {
    fontSize: 14,
    color: '#5A5F6A',
    lineHeight: 22,
    marginBottom: 32,
  },

  /* Step block */
  stepBlock: {
    marginBottom: 28,
  },

  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },

  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 0.5,
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A8F9A',
    letterSpacing: 1.5,
  },

  /* Category tags */
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  tagActive: {
    backgroundColor: '#0714B8',
    borderColor: '#0714B8',
  },

  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D4048',
  },

  tagTextActive: {
    color: '#FFFFFF',
  },

  /* Host card */
  hostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  hostLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },

  hostAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hostVoiceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  hostName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 3,
  },

  hostDesc: {
    fontSize: 12,
    color: '#8A8F9A',
    lineHeight: 17,
  },

  hostToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F6',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },

  hostToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },

  hostToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  hostToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8F9A',
    textAlign: 'center',
    lineHeight: 15,
  },

  hostToggleTextActive: {
    color: '#111318',
    fontWeight: '700',
  },

  /* Tone */
  toneList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F6',
    gap: 14,
  },

  toneRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D0D4E0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  toneRadioActive: {
    borderColor: '#0714B8',
  },

  toneRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0714B8',
  },

  toneInfo: {
    flex: 1,
  },

  toneLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A5F6A',
    marginBottom: 2,
  },

  toneLabelActive: {
    color: '#111318',
    fontWeight: '700',
  },

  toneDesc: {
    fontSize: 12,
    color: '#9EA3AE',
  },

  /* Duration */
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },

  durationBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  durationBtnActive: {
    backgroundColor: '#0714B8',
    borderColor: '#0714B8',
  },

  durationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A5F6A',
  },

  durationTextActive: {
    color: '#FFFFFF',
  },

  /* Preview card */
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8EBF2',
  },

  previewMedia: {
    height: 180,
    position: 'relative',
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,30,0.5)',
  },

  previewPlayBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewBadgeSafe: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    marginLeft: -32,
  },

  previewBadgeSafeText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },

  previewBody: {
    padding: 18,
  },

  previewAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },

  previewAiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 1.2,
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 8,
  },

  previewDesc: {
    fontSize: 13,
    color: '#5A5F6A',
    lineHeight: 20,
    marginBottom: 14,
  },

  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  previewAvatars: {
    flexDirection: 'row',
  },

  previewAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  previewVoice: {
    fontSize: 12,
    color: '#8A8F9A',
    fontWeight: '500',
  },

  /* Generate */
  generateBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginBottom: 10,
  },

  generateBtnLoading: {
    opacity: 0.75,
  },

  generateBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  generateNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9EA3AE',
  },
});
