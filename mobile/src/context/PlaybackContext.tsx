import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export type PlaybackTrack = {
  podcastId: string;
  title: string;
  audioUrl: string;
};

type PlaybackContextValue = {
  track: PlaybackTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  playbackError: string | null;
  playTrack: (t: PlaybackTrack, opts?: { initialRate?: number }) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  /** Sesi durdur, kaynağı boşalt, mini player dahil oynatmayı tamamen kapat */
  stopAndClear: () => Promise<void>;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const trackIdRef = useRef<string | null>(null);
  /** stopAndClear ile artırılır; devam eden playTrack yüklemeleri iptal edilir */
  const loadGenerationRef = useRef(0);

  const [track, setTrack] = useState<PlaybackTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    trackIdRef.current = track?.podcastId ?? null;
  }, [track?.podcastId]);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) {
        setPlaybackError(`Audio error: ${status.error}`);
      }
      return;
    }
    setPlaybackError(null);
    setPositionMs(status.positionMillis ?? 0);
    if (status.durationMillis) {
      setDurationMs(status.durationMillis);
    }
    setIsPlaying(status.isPlaying ?? false);
    if (status.didJustFinish) {
      setIsPlaying(false);
      void soundRef.current?.setPositionAsync(0);
    }
  }, []);

  const playTrack = useCallback(
    async (t: PlaybackTrack, opts?: { initialRate?: number }) => {
      const loadGen = loadGenerationRef.current;
      const stale = () => loadGen !== loadGenerationRef.current;

      const rate = opts?.initialRate ?? 1;
      if (trackIdRef.current === t.podcastId && soundRef.current) {
        try {
          const st = await soundRef.current.getStatusAsync();
          if (stale()) return;
          if (st.isLoaded) {
            setTrack(t);
            await soundRef.current.setRateAsync(rate, true).catch(() => {});
            if (stale()) return;
            setIsLoading(false);
            return;
          }
        } catch {
          /* reload */
        }
      }

      if (stale()) return;

      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch {
          /* noop */
        }
        soundRef.current = null;
      }

      if (stale()) return;

      setPlaybackError(null);
      setTrack(t);
      setIsLoading(true);
      setPositionMs(0);
      setDurationMs(0);

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        if (stale()) return;

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: t.audioUrl },
          { shouldPlay: true, rate, shouldCorrectPitch: true },
          onStatus,
        );
        if (stale()) {
          await sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        if (status.isLoaded) {
          setDurationMs(status.durationMillis ?? 0);
          setIsPlaying(status.isPlaying ?? true);
        }
      } catch (e: unknown) {
        if (!stale()) {
          const msg = e instanceof Error ? e.message : 'Could not load audio';
          setPlaybackError(msg);
          setTrack(null);
          soundRef.current = null;
        }
      } finally {
        if (!stale()) {
          setIsLoading(false);
        }
      }
    },
    [onStatus],
  );

  const togglePlayPause = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    const st = await s.getStatusAsync();
    if (!st.isLoaded) return;
    try {
      if (st.isPlaying) {
        await s.pauseAsync();
      } else {
        await s.playAsync();
      }
    } catch {
      /* noop */
    }
  }, []);

  const seekTo = useCallback(async (ms: number) => {
    const s = soundRef.current;
    if (!s) return;
    const st = await s.getStatusAsync();
    if (!st.isLoaded || !st.durationMillis) return;
    const dur = st.durationMillis;
    await s.setPositionAsync(Math.max(0, Math.min(dur, Math.floor(ms))));
  }, []);

  const setPlaybackRate = useCallback(async (rate: number) => {
    const s = soundRef.current;
    if (s) {
      await s.setRateAsync(rate, true).catch(() => {});
    }
  }, []);

  const stopAndClear = useCallback(async () => {
    loadGenerationRef.current += 1;
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {
        /* noop */
      }
      try {
        await soundRef.current.unloadAsync();
      } catch {
        /* noop */
      }
      soundRef.current = null;
    }
    trackIdRef.current = null;
    setPlaybackError(null);
    setTrack(null);
    setIsPlaying(false);
    setIsLoading(false);
    setPositionMs(0);
    setDurationMs(0);
  }, []);

  const value = useMemo<PlaybackContextValue>(
    () => ({
      track,
      isPlaying,
      isLoading,
      positionMs,
      durationMs,
      playbackError,
      playTrack,
      togglePlayPause,
      seekTo,
      setPlaybackRate,
      stopAndClear,
    }),
    [
      track,
      isPlaying,
      isLoading,
      positionMs,
      durationMs,
      playbackError,
      playTrack,
      togglePlayPause,
      seekTo,
      setPlaybackRate,
      stopAndClear,
    ],
  );

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) {
    throw new Error('usePlayback must be used within PlaybackProvider');
  }
  return ctx;
}
