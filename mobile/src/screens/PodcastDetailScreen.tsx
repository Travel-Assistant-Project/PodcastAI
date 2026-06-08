import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import {
  getListenNotesPodcastDetail,
  getPodcastById,
  type PodcastDetail,
  type PodcastSource,
  type TranscriptSegment,
} from '@/src/api/podcasts.api';
import TranscriptLine from '@/src/components/TranscriptLine';
import WordLookupModal from '@/src/components/WordLookupModal';
import { usePlayback } from '@/src/context/PlaybackContext';
import { getNotificationsEnabled } from '@/src/store/notificationPrefs';

// Backend MVP'sinde durum 'processing' olabilir; bu durumda kullanıcıyı tutmak yerine
// kısa aralıklarla yeniden poll ediyoruz.
const POLL_INTERVAL_MS = 4000;

function hasSourceContent(source: PodcastSource): boolean {
  return Boolean(
    source.newsUrl?.trim() || source.newsTitle?.trim() || source.sourceName?.trim(),
  );
}

function sourceLabel(source: PodcastSource): string {
  const title = source.newsTitle?.trim();
  const name = source.sourceName?.trim();
  if (title && name) return `${name} — ${title}`;
  return title || name || 'News article';
}

async function openSourceUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return;
  try {
    await openBrowserAsync(trimmed, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  } catch {
    Alert.alert('Could not open link', 'Try again in a moment.');
  }
}

export default function PodcastDetailScreen() {
  const router = useRouter();
  const playback = usePlayback();
  const params = useLocalSearchParams<{ id?: string; lnId?: string; lnEpisodeId?: string }>();
  const lnRaw = typeof params.lnId === 'string' ? params.lnId.trim() : '';
  const idRaw = typeof params.id === 'string' ? params.id.trim() : '';
  const lnEpisodeRaw =
    typeof params.lnEpisodeId === 'string' ? params.lnEpisodeId.trim() : '';
  const listenNotesPodcastId = lnRaw.length > 0 ? lnRaw : undefined;
  const podcastId = listenNotesPodcastId ? undefined : idRaw.length > 0 ? idRaw : undefined;
  const listenNotesEpisodeId = lnEpisodeRaw.length > 0 ? lnEpisodeRaw : undefined;

  const routeEpisodeKey = [listenNotesPodcastId ?? '', podcastId ?? '', listenNotesEpisodeId ?? ''].join(
    '|',
  );

  const [podcast, setPodcast] = useState<PodcastDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transcript bölümü varsayılan olarak açık; yeni podcast sayfasına geçince sıfırlanır.
  const [showTranscript, setShowTranscript] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [showAllTr, setShowAllTr] = useState(false);
  const [perLineTr, setPerLineTr] = useState<Record<number, boolean>>({});

  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [currentMs, setCurrentMs] = useState<number>(0);

  const [wordModal, setWordModal] = useState<{
    word: string;
    sentence: string;
  } | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchOnce = useCallback(async () => {
    if (listenNotesPodcastId)
      return getListenNotesPodcastDetail(listenNotesPodcastId, listenNotesEpisodeId);
    if (podcastId) return getPodcastById(podcastId);
    return null;
  }, [listenNotesPodcastId, podcastId, listenNotesEpisodeId]);

  // Podcast'i çek; processing ise polling (yalnızca kendi AI bölümleri).
  useEffect(() => {
    if (!listenNotesPodcastId && !podcastId) {
      setError('Invalid podcast id.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async (initial: boolean) => {
      try {
        if (initial) setLoading(true);
        const data = listenNotesPodcastId
          ? await getListenNotesPodcastDetail(listenNotesPodcastId, listenNotesEpisodeId)
          : await getPodcastById(podcastId!);
        if (cancelled) return;
        setPodcast(data);
        setError(null);
        if (
          !listenNotesPodcastId &&
          (data.status === 'processing' || data.status === 'pending')
        ) {
          timer = setTimeout(() => load(false), POLL_INTERVAL_MS);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message ?? 'Could not load podcast.');
        }
      } finally {
        if (!cancelled && initial) setLoading(false);
      }
    };

    void load(true);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [listenNotesPodcastId, podcastId, listenNotesEpisodeId]);

  // Yeni podcast detayına geçince transcript tekrar açık başlasın.
  useEffect(() => {
    setShowAllTr(false);
    setPerLineTr({});
    setShowTranscript(true);
    setShowSources(false);
  }, [routeEpisodeKey]);

  const handleManualRefresh = useCallback(async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      const data = await fetchOnce();
      if (data) {
        setPodcast(data);
        setError(null);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not refresh podcast.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchOnce, refreshing]);

  // currentMs değiştikçe aktif satırı güncelle.
  useEffect(() => {
    if (!podcast) return;
    const idx = podcast.transcript.findIndex(
      (s) => currentMs >= s.startMs && currentMs < s.endMs,
    );
    setActiveIndex(idx);
  }, [currentMs, podcast]);

  const isLearning = podcast?.learningMode ?? false;
  const transcript: TranscriptSegment[] = podcast?.transcript ?? [];
  const isFailedStatus = podcast?.status === 'failed';

  const audioReady = Boolean(podcast?.audioUrl?.trim());
  const canUseTranscript = audioReady && !isFailedStatus;

  const trAvailable = useMemo(
    () => transcript.some((s) => !!s.textTr),
    [transcript],
  );

  const handleLineTrToggle = (order: number) => {
    setPerLineTr((prev) => ({ ...prev, [order]: !prev[order] }));
  };

  const handleToggleAllTr = () => {
    const next = !showAllTr;
    setShowAllTr(next);
    if (next) {
      const all: Record<number, boolean> = {};
      transcript.forEach((s) => {
        if (s.textTr) all[s.order] = true;
      });
      setPerLineTr(all);
    } else {
      setPerLineTr({});
    }
  };

  const handleWordLongPress = (word: string, sentence: string) => {
    if (!isLearning) {
      Alert.alert(
        'Learning mode off',
        'This episode was not created in learning mode. Turn on “Learn English” when you create a new podcast to use word lookup and Turkish subtitles.',
      );
      return;
    }
    setWordModal({ word, sentence });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color="#0714B8" />
          <Text style={styles.loadingText}>Loading podcast…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !podcast) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={28} color="#E53935" />
          <Text style={styles.errorText}>{error ?? 'Podcast not found.'}</Text>
          <TouchableOpacity style={styles.backBtnSecondary} onPress={() => router.back()}>
            <Text style={styles.backBtnSecondaryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isProcessing = podcast.status === 'processing' || podcast.status === 'pending';
  const isFailed = podcast.status === 'failed';

  const listenEnabled = audioReady && !isFailed;

  const scriptPreviewText = podcast.scriptText?.trim() ?? '';
  const hasScriptPreview = scriptPreviewText.length > 0 && !isFailed;
  const hasTimedTranscript = transcript.length > 0;
  /** Senaryo geldi ama henüz zamanlı transcript veya ses tamamlanmadı — kullanıcı metni okuyabilsin */
  const showScriptPreviewPanel =
    hasScriptPreview && !(audioReady && hasTimedTranscript);

  const displaySources = (podcast.sources ?? []).filter(hasSourceContent);

  /** Arka planda mini player açıkken içerik listen + mini altında kalmasın */
  const scrollBottomPad = 110 + (playback.track ? 92 : 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#111318" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {podcast.title || 'Podcast'}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleManualRefresh}
            disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color="#0714B8" />
            ) : (
              <MaterialIcons name="refresh" size={20} color="#0714B8" />
            )}
          </TouchableOpacity>
          {isLearning && (
            <View style={styles.cefrBadge}>
              <Text style={styles.cefrBadgeText}>{podcast.cefrLevel}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}>
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
        </View>

        <View style={styles.tagsRow}>
          {(podcast.categories ?? [])
            .filter((tag) => tag.trim().toLowerCase() !== 'podcast')
            .slice(0, 4)
            .map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
            </View>
          ))}
          {isLearning && (
            <View style={[styles.tag, styles.tagAccent]}>
              <MaterialIcons name="school" size={11} color="#0714B8" style={{ marginRight: 3 }} />
              <Text style={[styles.tagText, styles.tagTextAccent]}>LEARN MODE</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{podcast.title || 'Podcast'}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="schedule" size={13} color="#8A8F9A" />
          <Text style={styles.metaText}>
            {podcast.durationSeconds
              ? `${Math.round(podcast.durationSeconds / 60)} MIN`
              : '— MIN'}
          </Text>
          <View style={styles.metaDot} />
          <MaterialIcons name="record-voice-over" size={13} color="#8A8F9A" />
          <Text style={styles.metaText}>
            {listenNotesPodcastId
              ? podcast.publisher?.trim() ||
                podcast.categories?.find((c) => c.trim().toLowerCase() !== 'podcast') ||
                'LISTEN NOTES'
              : podcast.speakerCount === 2
                ? 'DUAL'
                : 'SOLO'}
          </Text>
        </View>

        {displaySources.length > 0 && (
          <View style={styles.sourcesCard}>
            <TouchableOpacity
              style={styles.sourcesHeader}
              onPress={() => setShowSources((v) => !v)}
              activeOpacity={0.7}>
              <MaterialIcons
                name={showSources ? 'expand-less' : 'expand-more'}
                size={20}
                color="#111318"
              />
              <View style={styles.sourcesHeaderText}>
                <View style={styles.sourcesTitleRow}>
                  <MaterialIcons name="newspaper" size={18} color="#0714B8" />
                  <Text style={styles.sourcesTitle}>Sources</Text>
                </View>
                <Text style={styles.sourcesSubtitle}>
                  {showSources
                    ? 'This episode is based on the following news articles.'
                    : `${displaySources.length} article${displaySources.length === 1 ? '' : 's'} — tap to expand`}
                </Text>
              </View>
            </TouchableOpacity>

            {showSources &&
              displaySources.map((source, index) => {
                const url = source.newsUrl?.trim() ?? '';
                const label = sourceLabel(source);
                const key = url || `${source.sourceName ?? ''}-${source.newsTitle ?? ''}-${index}`;

                if (url) {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.sourceRow}
                      onPress={() => void openSourceUrl(url)}
                      activeOpacity={0.7}>
                      <Text style={styles.sourceRowText} numberOfLines={2}>
                        {label}
                      </Text>
                      <MaterialIcons name="open-in-new" size={16} color="#0714B8" />
                    </TouchableOpacity>
                  );
                }

                return (
                  <View key={key} style={styles.sourceRow}>
                    <Text style={styles.sourceRowTextStatic} numberOfLines={2}>
                      {label}
                    </Text>
                  </View>
                );
              })}
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingCard}>
            <ActivityIndicator color="#0714B8" />
            <View style={{ flex: 1 }}>
              <Text style={styles.processingTitle}>Creating your podcast…</Text>
              <Text style={styles.processingDesc}>
                {hasScriptPreview
                  ? 'Your episode script is ready below — we are generating the MP3. Listen unlocks when audio is ready; timed captions appear after that.'
                  : 'Fetching headlines and drafting your episode… This screen refreshes automatically.'}
              </Text>
              <Text style={styles.processingHint}>
                {getNotificationsEnabled()
                  ? "Your episode is being generated in the background. When it is ready, open it from the details"
                  : 'Keep this screen open to follow along, or find it later in Past Episodes.'}
              </Text>
            </View>
          </View>
        )}

        {showScriptPreviewPanel && (
          <View style={styles.scriptPreviewCard}>
            <View style={styles.scriptPreviewTitleRow}>
              <MaterialIcons name="article" size={20} color="#0714B8" />
              <Text style={styles.scriptPreviewTitle}>Episode script</Text>
            </View>
            {!audioReady && (
              <Text style={styles.scriptPreviewBadge}>Preview · audio generating</Text>
            )}
            <Text style={styles.scriptPreviewBody} selectable>
              {scriptPreviewText}
            </Text>
          </View>
        )}

        {audioReady && !isFailed && (
          <View style={styles.audioFirstHint}>
            <MaterialIcons name="play-circle-outline" size={20} color="#0714B8" />
            <Text style={styles.audioFirstHintText}>
              Use Listen below for the full player. Transcript below is expanded by default — tap the
              header to collapse or expand while you read along.
            </Text>
          </View>
        )}

        {isFailed && (
          <View style={styles.failedCard}>
            <MaterialIcons name="error-outline" size={22} color="#E53935" />
            <View style={{ flex: 1 }}>
              <Text style={styles.failedTitle}>Generation failed</Text>
              <Text style={styles.failedDesc}>
                Something went wrong while creating this episode (e.g. TTS quota). Try again or
                create a new podcast with different settings.
              </Text>
            </View>
          </View>
        )}

        {/* Transcript — ses hazır olduktan sonra açılabilir */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={[styles.sectionTitleRow, !canUseTranscript && styles.sectionTitleRowDisabled]}
              onPress={() => {
                if (!canUseTranscript) {
                  Alert.alert(
                    'Audio not ready yet',
                    'Open the transcript after the episode audio is available. Pull to refresh or tap refresh in a few seconds.',
                  );
                  return;
                }
                setShowTranscript((v) => !v);
              }}
              activeOpacity={0.7}>
              <MaterialIcons
                name={showTranscript ? 'expand-less' : 'expand-more'}
                size={20}
                color={canUseTranscript ? '#111318' : '#C2C7D0'}
              />
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    !canUseTranscript && styles.sectionTitleDisabled,
                  ]}>
                  Transcript
                </Text>
                {!canUseTranscript && !isFailed && (
                  <Text style={styles.sectionSubtitle}>
                    {hasScriptPreview && !audioReady
                      ? 'Timed lines unlock when audio finishes'
                      : 'Unlocks when audio is ready'}
                  </Text>
                )}
                {canUseTranscript && !showTranscript && transcript.length > 0 && (
                  <Text style={styles.sectionSubtitle}>
                    {transcript.length} lines — tap to expand
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {trAvailable && canUseTranscript && showTranscript && (
              <TouchableOpacity
                style={[styles.allTrBtn, showAllTr && styles.allTrBtnActive]}
                onPress={handleToggleAllTr}>
                <MaterialIcons
                  name="translate"
                  size={13}
                  color={showAllTr ? '#FFFFFF' : '#0714B8'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.allTrText, showAllTr && styles.allTrTextActive]}>
                  Show Turkish
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {showTranscript && canUseTranscript && transcript.length === 0 && (
            <Text style={styles.emptyTranscript}>
              {isProcessing ? 'Preparing transcript…' : 'No transcript for this episode.'}
            </Text>
          )}

          {showTranscript &&
            canUseTranscript &&
            transcript.map((seg) => (
              <TranscriptLine
                key={seg.order}
                segment={seg}
                active={activeIndex === seg.order}
                showTr={!!perLineTr[seg.order]}
                onToggleTr={() => handleLineTrToggle(seg.order)}
                onWordLongPress={handleWordLongPress}
              />
            ))}

          {isLearning && canUseTranscript && showTranscript && transcript.length > 0 && (
            <Text style={styles.hint}>
              Tip: Long-press a word to see its Turkish meaning and save it to your vocabulary
              notebook.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky: önce dinle — ses hazır olunca tam oynatıcı */}
      <View style={styles.stickyPlayer}>
        <TouchableOpacity
          style={[styles.stickyPlayBtn, !listenEnabled && styles.stickyPlayBtnDisabled]}
          onPress={() => {
            if (isFailed) {
              Alert.alert(
                'Generation failed',
                'No audio file was produced for this episode. Create a new podcast and try again.',
              );
              return;
            }
            if (!audioReady) {
              Alert.alert(
                'Audio not ready yet',
                'You can listen here once generation finishes. Refresh this screen while it is still processing.',
              );
              return;
            }
            const ln = podcast.listenNotesPodcastId?.trim();
            const lnEp = podcast.listenNotesEpisodeId?.trim();
            router.push({
              pathname: '/player',
              params: ln
                ? {
                    id: podcast.id,
                    lnId: ln,
                    ...(lnEp ? { lnEpisodeId: lnEp } : {}),
                  }
                : { id: podcast.id },
            });
          }}
          activeOpacity={0.85}>
          <View style={styles.stickyPlayIconSlot}>
            <MaterialIcons
              name={
                isFailed ? 'error-outline' : audioReady ? 'play-arrow' : 'hourglass-empty'
              }
              size={20}
              color="#fff"
            />
          </View>
          <Text style={styles.stickyPlayText}>
            {isFailed ? 'No audio' : audioReady ? 'Listen' : 'Preparing audio…'}
          </Text>
          <View style={styles.stickyPlayIconSlot}>
            {audioReady && !isFailed ? (
              <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.92)" />
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      <WordLookupModal
        visible={!!wordModal}
        word={wordModal?.word ?? null}
        contextSentence={wordModal?.sentence ?? null}
        podcastId={podcast.id}
        onClose={() => setWordModal(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FB' },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
  },
  loadingText: { color: '#5A5F6A', fontSize: 13 },
  errorText: { color: '#E53935', fontSize: 14, textAlign: 'center', marginTop: 4 },

  backBtnSecondary: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0714B8',
  },
  backBtnSecondaryText: { color: '#fff', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#ECEEF2',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111318' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  refreshBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#EEF1FF',
    alignItems: 'center', justifyContent: 'center',
  },

  cefrBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0714B8',
  },
  cefrBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },

  scrollContent: { paddingBottom: 110 },

  heroContainer: { width: '100%', height: 200, position: 'relative', marginBottom: 16 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,8,30,0.15)' },

  tagsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, marginBottom: 12,
  },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: '#ECEEF2',
  },
  tagAccent: {
    backgroundColor: '#EEF1FF',
    borderWidth: 1, borderColor: '#C7CFFF',
  },
  tagText: { fontSize: 9, fontWeight: '800', color: '#5A5F6A', letterSpacing: 1.2 },
  tagTextAccent: { color: '#0714B8' },

  title: {
    fontSize: 24, fontWeight: '800', color: '#111318',
    paddingHorizontal: 16, marginBottom: 8, lineHeight: 30,
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 6, marginBottom: 18,
  },
  metaText: { fontSize: 12, color: '#8A8F9A', fontWeight: '600' },
  metaDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#C2C7D0', marginHorizontal: 2,
  },

  sourcesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  sourcesHeaderText: {
    flex: 1,
  },
  sourcesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sourcesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111318',
  },
  sourcesSubtitle: {
    fontSize: 12,
    color: '#8A8F9A',
    lineHeight: 17,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  sourceRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0714B8',
    lineHeight: 18,
  },
  sourceRowTextStatic: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#3D4048',
    lineHeight: 18,
  },

  processingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 16,
    padding: 14, borderRadius: 14,
    backgroundColor: '#EEF1FF', borderWidth: 1, borderColor: '#C7CFFF',
  },
  processingTitle: { fontWeight: '800', color: '#0714B8', marginBottom: 2, fontSize: 14 },
  processingDesc: { color: '#3D4048', fontSize: 12 },
  processingHint: { color: '#8A8F9A', fontSize: 11, marginTop: 6, lineHeight: 16 },

  scriptPreviewCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scriptPreviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scriptPreviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111318',
  },
  scriptPreviewBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0714B8',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  scriptPreviewBody: {
    fontSize: 13,
    lineHeight: 21,
    color: '#3D4048',
  },

  failedCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 16, marginBottom: 16,
    padding: 14, borderRadius: 14,
    backgroundColor: '#FEECEB', borderWidth: 1, borderColor: '#F5C2C0',
  },
  failedTitle: { fontWeight: '800', color: '#B71C1C', marginBottom: 4, fontSize: 14 },
  failedDesc: { color: '#5A2A28', fontSize: 12, lineHeight: 17 },

  audioFirstHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0F3FF',
    borderWidth: 1,
    borderColor: '#D6DEFA',
  },
  audioFirstHintText: {
    flex: 1,
    fontSize: 12,
    color: '#3D4048',
    lineHeight: 17,
  },

  section: { paddingHorizontal: 12, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4, marginBottom: 8,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  sectionTitleRowDisabled: { opacity: 0.75 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111318' },
  sectionTitleDisabled: { color: '#9EA3AE' },
  sectionSubtitle: {
    fontSize: 11,
    color: '#8A8F9A',
    fontWeight: '600',
    marginTop: 2,
  },

  allTrBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#EEF1FF', borderWidth: 1, borderColor: '#C7CFFF',
  },
  allTrBtnActive: { backgroundColor: '#0714B8', borderColor: '#0714B8' },
  allTrText: { fontSize: 11, fontWeight: '800', color: '#0714B8' },
  allTrTextActive: { color: '#FFFFFF' },

  emptyTranscript: {
    color: '#8A8F9A', fontSize: 13, fontStyle: 'italic',
    paddingHorizontal: 12, paddingVertical: 8,
  },

  hint: {
    marginTop: 8, paddingHorizontal: 8,
    color: '#5A5F6A', fontSize: 12, fontStyle: 'italic',
  },

  stickyPlayer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
    backgroundColor: '#F7F9FB', borderTopWidth: 1, borderTopColor: '#E8EBF2',
  },
  stickyPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0714B8',
    borderRadius: 22,
    paddingVertical: 15,
    paddingHorizontal: 14,
    shadowColor: '#0714B8',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  stickyPlayBtnDisabled: {
    backgroundColor: '#9EA3AE',
    shadowOpacity: 0,
    elevation: 0,
  },
  stickyPlayIconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyPlayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
