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

import { persistListeningHistorySnapshot } from '@/src/utils/listeningHistorySync';

/** Expo AV bazen seek yarışında bu mesajı fırlatır; yakalanmalı yoksa "Uncaught (in promise)" görünür. */
async function safeSetPositionAsync(sound: Audio.Sound, positionMillis: number): Promise<void> {
  try {
    await sound.setPositionAsync(positionMillis);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('Seeking interrupted')) {
      throw e;
    }
  }
}

export type PlaybackTrack = {
  podcastId: string;
  title: string;
  audioUrl: string;
  coverImageUrl?: string | null;
  listenNotesPodcastId?: string | null;
  listenNotesEpisodeId?: string | null;
  /** API/metadata süresi (LN ile gerçek süre birleştirilirken kullanılır). */
  durationSecondsMeta?: number | null;
  categories?: string[] | null;
};

/** Aynı şov + farklı LN bölümü için oturum anahtarı (önbellek çakışmasını önler). */
function playbackSessionKey(t: PlaybackTrack): string {
  const ep = t.listenNotesEpisodeId?.trim();
  const pid = t.podcastId.trim();
  return ep ? `${pid}__lnep__${ep}` : pid;
}

type PlaybackContextValue = {
  track: PlaybackTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  playbackError: string | null;
  playTrack: (
    t: PlaybackTrack,
    opts?: { initialRate?: number; resumeMs?: number },
  ) => Promise<void>;
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
  const trackRef = useRef<PlaybackTrack | null>(null);
  const positionMsRef = useRef(0);
  const durationMsRef = useRef(0);

  const [track, setTrack] = useState<PlaybackTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    trackRef.current = track;
    trackIdRef.current = track ? playbackSessionKey(track) : null;
  }, [track]);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) {
        setPlaybackError(`Audio error: ${status.error}`);
      }
      return;
    }
    setPlaybackError(null);
    const pm = status.positionMillis ?? 0;
    setPositionMs(pm);
    positionMsRef.current = pm;
    const dm = status.durationMillis ?? 0;
    if (dm > 0) {
      setDurationMs(dm);
      durationMsRef.current = dm;
    }
    setIsPlaying(status.isPlaying ?? false);
    if (status.didJustFinish) {
      const cur = trackRef.current;
      const dur = durationMsRef.current;
      if (cur && dur > 0) {
        void persistListeningHistorySnapshot(
          cur,
          Math.floor(dur / 1000),
          true,
          dur / 1000,
        ).catch(() => {});
      }
      setIsPlaying(false);
      void soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  }, []);

  const playTrack = useCallback(
    async (t: PlaybackTrack, opts?: { initialRate?: number; resumeMs?: number }) => {
      const loadGen = loadGenerationRef.current;
      const stale = () => loadGen !== loadGenerationRef.current;

      const rate = opts?.initialRate ?? 1;
      const resumeMs = opts?.resumeMs;
      if (trackIdRef.current === playbackSessionKey(t) && soundRef.current) {
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

      const outgoing = trackRef.current;
      const prevSound = soundRef.current;
      if (
        prevSound &&
        outgoing &&
        playbackSessionKey(outgoing) !== playbackSessionKey(t)
      ) {
        try {
          const pst = await prevSound.getStatusAsync();
          if (stale()) return;
          if (pst.isLoaded) {
            const pm = pst.positionMillis ?? 0;
            const dm = pst.durationMillis ?? 0;
            const sec = Math.floor(pm / 1000);
            const capped = dm > 0 ? Math.min(sec, Math.floor(dm / 1000)) : sec;
            await persistListeningHistorySnapshot(
              outgoing,
              capped,
              false,
              dm > 0 ? dm / 1000 : undefined,
            ).catch(() => {});
          }
        } catch {
          /* noop */
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
      positionMsRef.current = 0;
      durationMsRef.current = 0;

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        if (stale()) return;

        const needsResume = resumeMs != null && resumeMs > 0;

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: t.audioUrl },
          {
            // Kaldığı yerden devam: önce konumu ayarlamak için çalmayı böyle başlatıyoruz (seek yarışını azaltır).
            shouldPlay: !needsResume,
            rate,
            shouldCorrectPitch: true,
          },
          onStatus,
        );
        if (stale()) {
          await sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;

        let durationMillis = status.isLoaded ? (status.durationMillis ?? 0) : 0;
        if (!durationMillis) {
          const stReady = await sound.getStatusAsync();
          if (stale()) {
            await sound.unloadAsync().catch(() => {});
            return;
          }
          if (stReady.isLoaded) {
            durationMillis = stReady.durationMillis ?? 0;
          }
        }

        if (!stale()) {
          setDurationMs(durationMillis);
          durationMsRef.current = durationMillis;
          if (needsResume) {
            try {
              const capped =
                durationMillis > 0
                  ? Math.min(resumeMs!, Math.max(0, durationMillis - 750))
                  : resumeMs!;
              const pos = Math.floor(capped);
              await safeSetPositionAsync(sound, pos);
              if (stale()) return;
              setPositionMs(pos);
              positionMsRef.current = pos;
              await sound.playAsync();
              if (!stale()) setIsPlaying(true);
            } catch {
              try {
                await sound.playAsync();
              } catch {
                /* noop */
              }
              if (!stale()) setIsPlaying(true);
            }
          } else {
            setIsPlaying(status.isLoaded ? (status.isPlaying ?? true) : true);
          }
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
    try {
      await safeSetPositionAsync(s, Math.max(0, Math.min(dur, Math.floor(ms))));
    } catch {
      /* noop */
    }
  }, []);

  const setPlaybackRate = useCallback(async (rate: number) => {
    const s = soundRef.current;
    if (s) {
      await s.setRateAsync(rate, true).catch(() => {});
    }
  }, []);

  /** Tam ekran kapalı bile olsa mini player ile çalarken konumu yaz (AudioPlayer unmount olabilir). */
  useEffect(() => {
    if (!track) return;

    const shouldSync =
      (Boolean(track.listenNotesPodcastId?.trim()) &&
        Boolean(track.listenNotesEpisodeId?.trim())) ||
      !track.listenNotesPodcastId?.trim();

    if (!shouldSync) return;

    const tick = () => {
      const cur = trackRef.current;
      if (!cur) return;
      const pm = positionMsRef.current;
      const dm = durationMsRef.current;
      const sec = Math.floor(pm / 1000);
      if (sec < 0) return;
      const durSec = dm > 0 ? dm / 1000 : undefined;
      void persistListeningHistorySnapshot(cur, sec, false, durSec);
    };

    const firstTimer = setTimeout(tick, 3000);
    const timer = setInterval(tick, 12000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(timer);
    };
  }, [track]);

  const stopAndClear = useCallback(async () => {
    const cur = trackRef.current;
    if (cur) {
      const pm = positionMsRef.current;
      const dm = durationMsRef.current;
      const sec = Math.floor(pm / 1000);
      if (sec >= 0) {
        const capped = dm > 0 ? Math.min(sec, Math.floor(dm / 1000)) : sec;
        const durSec = dm > 0 ? dm / 1000 : undefined;
        await persistListeningHistorySnapshot(cur, capped, false, durSec).catch(() => {});
      }
    }

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
    trackRef.current = null;
    positionMsRef.current = 0;
    durationMsRef.current = 0;
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
