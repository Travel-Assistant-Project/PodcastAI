import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useRouter, useSegments, usePathname } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayback } from '@/src/context/PlaybackContext';
import { PODCAST_LISTEN_STICKY_HEIGHT } from '@/src/constants/podcastDetailLayout';

const TAB_BAR_HEIGHT = 49;

function isPodcastDetailPath(
  pathname: string | null | undefined,
  segments: string[],
): boolean {
  if (pathname === '/podcast' || pathname?.startsWith('/podcast?')) return true;
  return segments.includes('podcast');
}

function formatTime(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '0:00';
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MiniPlayerBar() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const playback = usePlayback();

  const AUTH_PATHS = new Set(['/', '/login', '/register']);
  const isAuthScreen =
    AUTH_PATHS.has(pathname) ||
    segments[0] === 'index' ||
    segments[0] === 'login' ||
    segments[0] === 'register';

  const hide = useMemo(() => {
    if (!playback.track) return true;
    if (isAuthScreen) return true;
    if (segments[0] === 'player') return true;
    if (pathname === '/player') return true;
    return false;
  }, [playback.track, isAuthScreen, segments, pathname]);

  const bottomOffset = useMemo(() => {
    const inTabs = segments[0] === '(tabs)';
    if (isPodcastDetailPath(pathname, segments)) {
      // Listen şeridi bottom:0 ve home indicator alanına kadar uzanır; mini’nin altı tam şeridin üst kenarına.
      return PODCAST_LISTEN_STICKY_HEIGHT;
    }
    return (inTabs ? TAB_BAR_HEIGHT : 0) + insets.bottom;
  }, [segments, insets.bottom, pathname]);

  if (hide || !playback.track) {
    return null;
  }

  const track = playback.track;
  const { isPlaying, isLoading, positionMs, durationMs, togglePlayPause } = playback;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={[styles.shell, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Pressable
        style={styles.bar}
        onPress={() =>
          router.push({ pathname: '/player', params: { id: track.podcastId } })
        }
        android_ripple={{ color: 'rgba(7,20,184,0.12)' }}>
        <View style={styles.thumb}>
          <MaterialIcons name="graphic-eq" size={22} color="#0714B8" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title || 'Episode'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
          </View>
          <Text style={styles.sub} numberOfLines={1}>
            {formatTime(positionMs / 1000)}
            {durationMs > 0 ? ` / ${formatTime(durationMs / 1000)}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={(e) => {
            e.stopPropagation();
            void togglePlayPause();
          }}
          hitSlop={12}
          disabled={isLoading}>
          {isLoading ? (
            <MaterialIcons name="hourglass-empty" size={26} color="#0714B8" />
          ) : (
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={28}
              color="#0714B8"
            />
          )}
        </TouchableOpacity>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 12,
    paddingHorizontal: 10,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111318',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0714B8',
    borderRadius: 2,
  },
  sub: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8F9A',
  },
  playBtn: {
    padding: 4,
  },
});
