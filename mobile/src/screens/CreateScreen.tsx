import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { generatePodcast } from '@/src/api/podcasts.api';
import type { CefrLevel } from '@/src/api/learning.api';

/** Görünen isim -> ai-service / NewsAPI _CATEGORY_MAP anahtarı */
const CATEGORY_OPTIONS: { label: string; apiSlug: string; showSparkle?: boolean }[] = [
  { label: 'Technology', apiSlug: 'technology' },
  { label: 'Science', apiSlug: 'science' },
  { label: 'Business', apiSlug: 'economy' },
  { label: 'Health', apiSlug: 'health' },
  { label: 'World News', apiSlug: 'world' },
  { label: 'Sports', apiSlug: 'sports' },
  { label: 'Entertainment', apiSlug: 'entertainment' },
  { label: 'Finance', apiSlug: 'finance' },
  { label: 'Music', apiSlug: 'music' },
  { label: 'AI', apiSlug: 'ai', showSparkle: true },
];
const TONES = [
  { id: 'formal',  label: 'Official',     desc: 'Formal, concise, data-driven report.',           icon: 'gavel' },
  { id: 'casual',  label: 'Friendly',     desc: 'Accessible, warm, and explanatory.',             icon: 'sentiment-satisfied' },
  { id: 'fun',     label: 'Entertaining', desc: 'Dynamic storytelling with personality.',         icon: 'theater-comedy' },
];
const DURATIONS: { id: number; label: string }[] = [
  { id: 2,  label: '2 min' },
  { id: 5,  label: '5 min' },
  { id: 10, label: '10 min' },
];
const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function CreateScreen() {
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Science']);
  const [hostMode, setHostMode] = useState<'single' | 'dual'>('single');
  const [tone, setTone] = useState('formal');
  const [duration, setDuration] = useState<number>(5);
  const [learningMode, setLearningMode] = useState<boolean>(false);
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>('B1');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const apiCategories = useMemo(
    () =>
      selectedCategories.map((label) => {
        const opt = CATEGORY_OPTIONS.find((o) => o.label === label);
        return opt?.apiSlug ?? label.toLowerCase().replace(/\s+/g, '-');
      }),
    [selectedCategories],
  );

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Pick categories', 'Choose at least one category.');
      return;
    }
    setIsGenerating(true);
    try {
      const resp = await generatePodcast({
        categories: apiCategories,
        tone,
        durationMinutes: duration,
        speakerCount: hostMode === 'dual' ? 2 : 1,
        learningMode,
        cefrLevel: learningMode ? cefrLevel : null,
      });
      Alert.alert(
        'Podcast in progress',
        'Your episode is being generated in the background. When it is ready, open it from the details screen.',
        [
          {
            text: 'OK',
            onPress: () => router.push({ pathname: '/podcast', params: { id: resp.podcastId } }),
          },
        ],
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Could not start podcast generation.';
      Alert.alert('Error', msg);
    } finally {
      setIsGenerating(false);
    }
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
            {CATEGORY_OPTIONS.map(({ label, showSparkle }) => {
              const active = selectedCategories.includes(label);
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => toggleCategory(label)}
                  activeOpacity={0.8}>
                  {showSparkle && (
                    <MaterialIcons
                      name="auto-awesome"
                      size={13}
                      color={active ? '#fff' : '#0714B8'}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{label}</Text>
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
                key={d.id}
                style={[styles.durationBtn, duration === d.id && styles.durationBtnActive]}
                onPress={() => setDuration(d.id)}
                activeOpacity={0.8}>
                <Text style={[styles.durationText, duration === d.id && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 05 — Mode (Listen / Learn) */}
        <View style={styles.stepBlock}>
          <View style={styles.stepLabelRow}>
            <Text style={styles.stepNumber}>05 /</Text>
            <Text style={styles.stepLabel}>MODE</Text>
          </View>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeCard, !learningMode && styles.modeCardActive]}
              onPress={() => setLearningMode(false)}
              activeOpacity={0.85}>
              <MaterialIcons
                name="headset"
                size={20}
                color={!learningMode ? '#0714B8' : '#8A8F9A'}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeLabel, !learningMode && styles.modeLabelActive]}>
                  Listen only
                </Text>
                <Text style={styles.modeDesc}>Standard podcast experience.</Text>
              </View>
              <MaterialIcons
                name={!learningMode ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={!learningMode ? '#0714B8' : '#C2C7D0'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, learningMode && styles.modeCardActive]}
              onPress={() => setLearningMode(true)}
              activeOpacity={0.85}>
              <MaterialIcons
                name="school"
                size={20}
                color={learningMode ? '#0714B8' : '#8A8F9A'}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeLabel, learningMode && styles.modeLabelActive]}>
                  Learn English
                </Text>
                <Text style={styles.modeDesc}>
                  Level-matched script, Turkish subtitles, and vocabulary notebook.
                </Text>
              </View>
              <MaterialIcons
                name={learningMode ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={learningMode ? '#0714B8' : '#C2C7D0'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 06 — Language Level (learn mode only) */}
        {learningMode && (
          <View style={styles.stepBlock}>
            <View style={styles.stepLabelRow}>
              <Text style={styles.stepNumber}>06 /</Text>
              <Text style={styles.stepLabel}>LANGUAGE LEVEL</Text>
            </View>
            <View style={styles.durationRow}>
              {CEFR_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.durationBtn, cefrLevel === lvl && styles.durationBtnActive]}
                  onPress={() => setCefrLevel(lvl)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.durationText,
                      cefrLevel === lvl && styles.durationTextActive,
                    ]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}


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

  /* Mode (Listen / Learn) */
  modeRow: {
    gap: 10,
  },

  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  modeCardActive: {
    borderColor: '#0714B8',
    backgroundColor: '#F4F6FF',
  },

  modeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D4048',
    marginBottom: 2,
  },

  modeLabelActive: {
    color: '#0714B8',
  },

  modeDesc: {
    fontSize: 11,
    color: '#9EA3AE',
    lineHeight: 15,
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
