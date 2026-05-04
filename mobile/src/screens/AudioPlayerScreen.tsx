import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Pressable,
  FlatList,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { getPodcastById, type PodcastDetail, type TranscriptSegment } from '@/src/api/podcasts.api';
import { usePlayback } from '@/src/context/PlaybackContext';

const { width } = Dimensions.get('window');
const TRACK_WIDTH = width - 48;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatSeconds(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '00:00';
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const podcastId = typeof params.id === 'string' ? params.id : undefined;
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const playback = usePlayback();
  const [podcast, setPodcast] = useState<PodcastDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const transcriptListRef = useRef<FlatList<TranscriptSegment>>(null);
  const lastAutoScrollIndexRef = useRef<number>(-1);
  const [speed, setSpeed] = useState<number>(1);
  const [showCaption, setShowCaption] = useState(false);

  const isActiveEpisode =
    !!podcastId && playback.track?.podcastId === podcastId;
  const isLoadingAudio = isActiveEpisode && playback.isLoading;
  const isPlaying = isActiveEpisode && playback.isPlaying;
  const positionMs = isActiveEpisode ? playback.positionMs : 0;
  const durationMs = isActiveEpisode ? playback.durationMs : 0;

  const trackTitle = podcast?.title || 'Podcast';
  const trackMeta = useMemo(() => {
    if (!podcast) return '';
    const cats = podcast.categories?.length
      ? podcast.categories.join(' • ')
      : 'Daily briefing';
    const speakers = podcast.speakerCount === 2 ? 'Dual Host' : 'Solo';
    return `${cats} • ${speakers}`;
  }, [podcast]);

  // 1) Podcast meta bilgisini çek.
  useEffect(() => {
    if (!podcastId) {
      setLoadError('Invalid episode id.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getPodcastById(podcastId);
        if (!cancelled) setPodcast(data);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.response?.data?.message ?? 'Could not load episode.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [podcastId]);

  // 2) Global oynatıcıda ses — ekrandan çıkınca da çalmaya devam eder.
  useEffect(() => {
    if (!podcast?.audioUrl || !podcastId) {
      if (podcast && !podcast.audioUrl) {
        setLoadError('Audio for this episode is not ready yet.');
      }
      return;
    }
    void playback.playTrack(
      {
        podcastId,
        title: podcast.title ?? 'Podcast',
        audioUrl: podcast.audioUrl,
      },
      { initialRate: speed },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca kaynak / bölüm değişince
  }, [podcast?.audioUrl, podcastId, podcast?.title, playback.playTrack]);

  useEffect(() => {
    if (playback.track?.podcastId === podcastId) {
      void playback.setPlaybackRate(speed);
    }
  }, [speed, podcastId, playback.track?.podcastId, playback.setPlaybackRate]);

  const displayError =
    loadError || (isActiveEpisode ? playback.playbackError : null);

  const togglePlay = useCallback(async () => {
    try {
      await playback.togglePlayPause();
    } catch (e: any) {
      Alert.alert('Playback error', e?.message ?? 'Unknown error.');
    }
  }, [playback]);

  const handleStopAndClose = useCallback(async () => {
    await playback.stopAndClear();
    router.back();
  }, [playback, router]);

  /** Aşağı çek → tam ekranı kapat; ses çalar, mini player görünür (X gibi durdurmaz). */
  const minimizeToBar = useCallback(() => {
    router.back();
  }, [router]);

  const openPodcastDetailForTranscript = useCallback(() => {
    if (!podcastId) return;
    router.push({
      pathname: '/podcast',
      params: { id: podcastId, openTranscript: '1' },
    });
  }, [router, podcastId]);

  const dismissTranslateY = useSharedValue(0);
  const dismissThreshold = Math.min(128, windowHeight * 0.2);

  const dismissAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dismissTranslateY.value }],
  }));

  const dismissPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(10)
        .failOffsetX([-28, 28])
        .onUpdate((e) => {
          dismissTranslateY.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          const y = dismissTranslateY.value;
          const vy = e.velocityY;
          if (y > dismissThreshold || vy > 950) {
            dismissTranslateY.value = withTiming(
              windowHeight,
              { duration: 220 },
              (finished) => {
                if (finished) runOnJS(minimizeToBar)();
              },
            );
          } else {
            dismissTranslateY.value = withSpring(0, { damping: 24, stiffness: 340 });
          }
        }),
    [dismissThreshold, windowHeight, minimizeToBar],
  );

  const skip = useCallback(
    async (deltaMs: number) => {
      if (!isActiveEpisode || !durationMs) return;
      const target = Math.max(0, Math.min(durationMs, positionMs + deltaMs));
      await playback.seekTo(target);
    },
    [isActiveEpisode, durationMs, positionMs, playback],
  );

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  // Track tıklayınca o pozisyona seek.
  const onTrackPress = async (e: any) => {
    if (!isActiveEpisode || !durationMs) return;
    const x = e.nativeEvent.locationX as number;
    const ratio = Math.max(0, Math.min(1, x / TRACK_WIDTH));
    await playback.seekTo(Math.floor(durationMs * ratio));
  };

  const progressRatio = durationMs > 0 ? positionMs / durationMs : 0;

  const remainingMs = Math.max(0, durationMs - positionMs);

  const activeIndex = useMemo(() => {
    if (!podcast?.transcript?.length) return -1;
    return podcast.transcript.findIndex(
      (seg) => positionMs >= seg.startMs && positionMs < seg.endMs,
    );
  }, [podcast, positionMs]);

  const transcript = podcast?.transcript ?? [];
  const isLearning = !!podcast?.learningMode;
  const hasTranscriptPanel = showCaption && transcript.length > 0;

  const sheetMetrics = useMemo(() => {
    const expanded = Math.min(windowHeight * 0.85, windowHeight - insets.top - 8);
    // Dar peek: oynatıcı kontrollerine mümkün olduğunca az bindir.
    const collapsedPeek = 6 + insets.bottom;
    const maxTranslate = Math.max(56, expanded - collapsedPeek);
    return { expanded, maxTranslate };
  }, [windowHeight, insets.top, insets.bottom]);

  const sheetExpandedH = useSharedValue(sheetMetrics.expanded);
  const sheetMaxTranslateY = useSharedValue(sheetMetrics.maxTranslate);
  const sheetTranslateY = useSharedValue(sheetMetrics.maxTranslate);
  const panStartTranslate = useSharedValue(0);

  useEffect(() => {
    sheetExpandedH.value = sheetMetrics.expanded;
    sheetMaxTranslateY.value = sheetMetrics.maxTranslate;
    sheetTranslateY.value = Math.min(sheetTranslateY.value, sheetMetrics.maxTranslate);
  }, [sheetMetrics.expanded, sheetMetrics.maxTranslate]);

  useEffect(() => {
    if (hasTranscriptPanel) {
      sheetTranslateY.value = sheetMetrics.maxTranslate;
    }
  }, [hasTranscriptPanel, sheetMetrics.maxTranslate]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    height: sheetExpandedH.value,
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-24, 24])
        .onStart(() => {
          panStartTranslate.value = sheetTranslateY.value;
        })
        .onUpdate((e) => {
          const next = panStartTranslate.value + e.translationY;
          sheetTranslateY.value = Math.min(
            Math.max(0, next),
            sheetMaxTranslateY.value,
          );
        })
        .onEnd((e) => {
          const maxT = sheetMaxTranslateY.value;
          const vy = e.velocityY;
          const y = sheetTranslateY.value;
          let snap: number;
          if (vy > 550) {
            snap = maxT;
          } else if (vy < -550) {
            snap = 0;
          } else {
            snap = y > maxT * 0.48 ? maxT : 0;
          }
          sheetTranslateY.value = withSpring(snap, {
            velocity: vy,
            damping: 26,
            stiffness: 280,
          });
        }),
    [],
  );

  const toggleSheetSnap = useCallback(() => {
    const maxT = sheetMetrics.maxTranslate;
    const y = sheetTranslateY.value;
    if (y > maxT * 0.45) {
      sheetTranslateY.value = withSpring(0, { damping: 26, stiffness: 280 });
    } else {
      sheetTranslateY.value = withSpring(maxT, { damping: 26, stiffness: 280 });
    }
  }, [sheetMetrics.maxTranslate]);

  useEffect(() => {
    if (showCaption) lastAutoScrollIndexRef.current = -1;
  }, [showCaption]);

  useEffect(() => {
    if (activeIndex < 0) lastAutoScrollIndexRef.current = -1;
  }, [activeIndex]);

  useEffect(() => {
    if (!showCaption || activeIndex < 0 || activeIndex >= transcript.length) return;
    if (lastAutoScrollIndexRef.current === activeIndex) return;
    lastAutoScrollIndexRef.current = activeIndex;
    requestAnimationFrame(() => {
      try {
        transcriptListRef.current?.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.12,
        });
      } catch {
        /* scrollToIndex can throw if list not ready */
      }
    });
  }, [activeIndex, showCaption, transcript.length]);

  const seekToMs = useCallback(
    async (ms: number) => {
      if (!isActiveEpisode) return;
      await playback.seekTo(Math.max(0, Math.min(durationMs || 0, Math.floor(ms))));
    },
    [isActiveEpisode, durationMs, playback],
  );

  const renderTranscriptLine = useCallback(
    ({ item, index }: { item: TranscriptSegment; index: number }) => {
      const active = index === activeIndex;
      return (
        <Pressable
          onPress={() => void seekToMs(item.startMs)}
          style={[styles.transcriptRow, active && styles.transcriptRowActive]}>
          <View style={styles.transcriptRowTop}>
            <Text style={[styles.transcriptSpeaker, active && styles.transcriptSpeakerActive]}>
              {item.speaker}
            </Text>
            <Text style={styles.transcriptTime}>{formatSeconds(item.startMs / 1000)}</Text>
          </View>
          <Text style={styles.transcriptBody}>{item.text}</Text>
          {isLearning && !!item.textTr && (
            <Text style={styles.transcriptBodyTr} numberOfLines={4}>
              {item.textTr}
            </Text>
          )}
        </Pressable>
      );
    },
    [activeIndex, isLearning, seekToMs],
  );

  const artSize = width - 80;

  return (
    <SafeAreaView style={styles.screenOuter} edges={['top', 'bottom']}>
      <GestureHandlerRootView style={styles.flexFill}>
        <Animated.View style={[styles.flexFill, dismissAnimatedStyle]}>
        <View style={styles.bodyInner}>
          <GestureDetector gesture={dismissPanGesture}>
            <View>
              <View
                style={styles.playerPullStrip}
                accessibilityRole="adjustable"
                accessibilityLabel="Swipe down to minimize player">
                <View style={styles.playerGrabber} />
              </View>
              <View style={styles.header}>
                <TouchableOpacity onPress={minimizeToBar} style={styles.headerBtn}>
                  <MaterialIcons name="chevron-left" size={26} color="#111318" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerSub}>NOW PLAYING</Text>
                  <Text style={styles.headerTitle}>PodcastAI</Text>
                </View>
                <TouchableOpacity
                  onPress={() => void handleStopAndClose()}
                  style={styles.headerBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Stop playback and close">
                  <MaterialIcons name="close" size={24} color="#111318" />
                </TouchableOpacity>
              </View>
            </View>
          </GestureDetector>
          <ScrollView
            style={styles.upperScroll}
            contentContainerStyle={[
              styles.upperScrollContent,
              hasTranscriptPanel && styles.upperScrollContentWithSheet,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={!hasTranscriptPanel}>
          {/* Album Art */}
          <View style={styles.artContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
              }}
              style={[styles.artImage, { width: artSize, height: artSize }]}
            />
        {isLearning && podcast?.cefrLevel ? (
          <View style={styles.cefrBadge}>
            <MaterialIcons name="school" size={12} color="#fff" />
            <Text style={styles.cefrBadgeText}>{podcast.cefrLevel}</Text>
          </View>
        ) : (
          <View style={styles.aiBadge}>
            <MaterialIcons name="auto-awesome" size={11} color="#0714B8" />
            <Text style={styles.aiBadgeText}>AI ENHANCED</Text>
          </View>
        )}
      </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {trackTitle}
        </Text>
        <Text style={styles.trackMeta} numberOfLines={1}>
          {trackMeta}
        </Text>
      </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
        <Pressable onPress={onTrackPress} hitSlop={8}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: TRACK_WIDTH * progressRatio }]}
            />
            <View
              style={[
                styles.progressThumb,
                { left: Math.max(0, TRACK_WIDTH * progressRatio - 6) },
              ]}
            />
          </View>
        </Pressable>
        <View style={styles.progressTimes}>
          <Text style={styles.timeText}>{formatSeconds(positionMs / 1000)}</Text>
          <Text style={styles.timeText}>-{formatSeconds(remainingMs / 1000)}</Text>
        </View>
      </View>

          {/* Controls */}
          <View style={styles.controls}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => skip(-10000)}>
          <MaterialIcons name="replay-10" size={32} color="#111318" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playBtn}
          onPress={togglePlay}
          disabled={isLoadingAudio || !!displayError}
          activeOpacity={0.85}>
          {isLoadingAudio ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={34}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => skip(10000)}>
          <MaterialIcons name="forward-10" size={32} color="#111318" />
        </TouchableOpacity>
      </View>

          {/* Secondary Controls */}
          <View style={styles.secondaryControls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={cycleSpeed}>
          <Text style={styles.speedText}>{speed}x</Text>
          <Text style={styles.secondaryLabel}>SPEED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setShowCaption((v) => !v)}>
          <View
            style={[
              styles.captionIcon,
              showCaption && { backgroundColor: '#0714B8' },
            ]}>
            <MaterialIcons
              name={showCaption ? 'closed-caption' : 'closed-caption-off'}
              size={22}
              color={showCaption ? '#FFFFFF' : '#5A5F6A'}
            />
          </View>
          <Text style={styles.secondaryLabel}>CAPTION</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={openPodcastDetailForTranscript}>
          <MaterialIcons name="format-list-bulleted" size={22} color="#5A5F6A" />
          <Text style={styles.secondaryLabel}>TRANSCRIPT</Text>
        </TouchableOpacity>
      </View>
          </ScrollView>

          {/* Hata bandı */}
          {displayError && (
            <View style={styles.errorBar}>
              <MaterialIcons name="error-outline" size={18} color="#B71C1C" />
              <Text style={styles.errorText} numberOfLines={2}>
                {displayError}
              </Text>
            </View>
          )}
        </View>

        {showCaption && transcript.length > 0 && (
          <Animated.View style={[styles.transcriptSheet, sheetAnimatedStyle]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.sheetHandleArea}>
                <View style={styles.sheetGrabber} />
                <View style={styles.sheetHeaderRow}>
                  <View style={styles.sheetHeaderTextBlock}>
                    <Text style={styles.transcriptPanelTitle}>Live transcript</Text>
                    <Text style={styles.transcriptPanelHint} numberOfLines={1}>
                      Drag up to expand · tap a line to jump
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={toggleSheetSnap}
                    style={styles.sheetChevronBtn}
                    accessibilityLabel="Expand or collapse transcript">
                    <MaterialIcons name="unfold-more" size={26} color="#5A5F6A" />
                  </TouchableOpacity>
                </View>
              </View>
            </GestureDetector>
            <FlatList
              ref={transcriptListRef}
              data={transcript}
              keyExtractor={(item) => `seg-${item.order}`}
              renderItem={renderTranscriptLine}
              extraData={activeIndex}
              style={styles.transcriptList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={[
                styles.transcriptListContent,
                { paddingBottom: Math.max(insets.bottom, 14) + 8 },
              ]}
              keyboardShouldPersistTaps="handled"
              onScrollToIndexFailed={({ index }) => {
                setTimeout(() => {
                  transcriptListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.12,
                  });
                }, 120);
              }}
            />
          </Animated.View>
        )}
        </Animated.View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenOuter: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },

  flexFill: {
    flex: 1,
  },

  bodyInner: {
    flex: 1,
    paddingHorizontal: 24,
    minHeight: 0,
  },

  upperScroll: {
    flex: 1,
    minHeight: 0,
  },

  upperScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },

  upperScrollContentWithSheet: {
    paddingBottom: 72,
  },

  transcriptSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 30,
    elevation: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  sheetHandleArea: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF1F6',
  },

  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C6CCD6',
    marginBottom: 6,
  },

  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  sheetHeaderTextBlock: {
    flex: 1,
  },

  sheetChevronBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playerPullStrip: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  playerGrabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C6CCD6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: { alignItems: 'center' },

  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1.5,
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002E83',
  },

  artContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 22,
    position: 'relative',
  },

  artImage: {
    borderRadius: 24,
  },

  aiBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7CFFF',
  },

  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 1,
  },

  cefrBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0714B8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  cefrBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },

  trackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111318',
    textAlign: 'center',
    marginBottom: 6,
  },

  trackMeta: {
    fontSize: 13,
    color: '#8A8F9A',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  progressSection: {
    marginBottom: 24,
  },

  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 10,
    position: 'relative',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#0714B8',
    borderRadius: 3,
  },

  progressThumb: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0714B8',
  },

  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: 12,
    color: '#8A8F9A',
    fontWeight: '500',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 28,
  },

  skipBtn: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 0,
  },

  secondaryBtn: {
    alignItems: 'center',
    gap: 5,
    minWidth: 60,
  },

  speedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111318',
  },

  secondaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1.2,
  },

  captionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEECEB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F5C2C0',
    marginBottom: 12,
  },

  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#5A2A28',
    lineHeight: 17,
  },

  transcriptPanelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111318',
    letterSpacing: 0.4,
  },
  transcriptPanelHint: {
    marginTop: 1,
    fontSize: 11,
    color: '#8A8F9A',
    fontWeight: '500',
  },
  transcriptList: {
    flex: 1,
  },
  transcriptListContent: {
    paddingTop: 4,
  },
  transcriptRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  transcriptRowActive: {
    backgroundColor: '#F0F4FF',
    borderLeftColor: '#0714B8',
  },
  transcriptRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transcriptSpeaker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 0.8,
  },
  transcriptSpeakerActive: {
    color: '#002E83',
  },
  transcriptTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 0.5,
  },
  transcriptBody: {
    fontSize: 14,
    color: '#111318',
    lineHeight: 20,
  },
  transcriptBodyTr: {
    marginTop: 6,
    fontSize: 13,
    color: '#0714B8',
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
