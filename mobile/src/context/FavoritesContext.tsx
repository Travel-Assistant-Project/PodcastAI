import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getFavoriteKeys } from '@/src/api/favorites.api';
import { getUser } from '@/src/store/authStore';

type FavoritesContextValue = {
  podcastIds: ReadonlySet<string>;
  listenNotesPodcastIds: ReadonlySet<string>;
  loading: boolean;
  refresh: () => Promise<void>;
  isFavorited: (opts: {
    podcastId?: string | null;
    listenNotesPodcastId?: string | null;
  }) => boolean;
  markFavorited: (opts: {
    podcastId?: string | null;
    listenNotesPodcastId?: string | null;
  }) => void;
  markUnfavorited: (opts: {
    podcastId?: string | null;
    listenNotesPodcastId?: string | null;
  }) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [podcastIds, setPodcastIds] = useState<Set<string>>(new Set());
  const [listenNotesPodcastIds, setListenNotesPodcastIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!getUser()?.token) {
      setPodcastIds(new Set());
      setListenNotesPodcastIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const keys = await getFavoriteKeys();
      setPodcastIds(new Set(keys.podcastIds.map((id) => id.trim().toLowerCase())));
      setListenNotesPodcastIds(
        new Set(keys.listenNotesPodcastIds.map((id) => id.trim().toLowerCase())),
      );
    } catch {
      setPodcastIds(new Set());
      setListenNotesPodcastIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorited = useCallback(
    (opts: { podcastId?: string | null; listenNotesPodcastId?: string | null }) => {
      const ln = opts.listenNotesPodcastId?.trim().toLowerCase();
      if (ln) return listenNotesPodcastIds.has(ln);
      const id = opts.podcastId?.trim().toLowerCase();
      if (id) return podcastIds.has(id);
      return false;
    },
    [listenNotesPodcastIds, podcastIds],
  );

  const markFavorited = useCallback(
    (opts: { podcastId?: string | null; listenNotesPodcastId?: string | null }) => {
      const ln = opts.listenNotesPodcastId?.trim().toLowerCase();
      if (ln) {
        setListenNotesPodcastIds((prev) => new Set(prev).add(ln));
        return;
      }
      const id = opts.podcastId?.trim().toLowerCase();
      if (id) setPodcastIds((prev) => new Set(prev).add(id));
    },
    [],
  );

  const markUnfavorited = useCallback(
    (opts: { podcastId?: string | null; listenNotesPodcastId?: string | null }) => {
      const ln = opts.listenNotesPodcastId?.trim().toLowerCase();
      if (ln) {
        setListenNotesPodcastIds((prev) => {
          const next = new Set(prev);
          next.delete(ln);
          return next;
        });
        return;
      }
      const id = opts.podcastId?.trim().toLowerCase();
      if (id) {
        setPodcastIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      podcastIds,
      listenNotesPodcastIds,
      loading,
      refresh,
      isFavorited,
      markFavorited,
      markUnfavorited,
    }),
    [
      podcastIds,
      listenNotesPodcastIds,
      loading,
      refresh,
      isFavorited,
      markFavorited,
      markUnfavorited,
    ],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
