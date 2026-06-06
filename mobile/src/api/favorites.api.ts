import { api } from '@/src/api/client';
import { getCategoryOption } from '@/src/constants/categories';
import type { PodcastSummary } from '@/src/api/podcasts.api';
import { inferFavoriteCategoryLabel } from '@/src/utils/podcastNavigation';

export type FavoriteKeysDto = {
  podcastIds: string[];
  listenNotesPodcastIds: string[];
};

export type FavoriteSnapshot = {
  title?: string | null;
  audioUrl?: string | null;
  durationSeconds?: number | null;
  coverImageUrl?: string | null;
  categories?: string[];
  publisher?: string | null;
};

/** browseCategoryLabel: kullanıcı hangi kategori sayfasından kaydettiyse (ör. Music). */
export function toFavoriteSnapshot(
  item: PodcastSummary,
  browseCategoryLabel?: string | null,
): FavoriteSnapshot {
  const cats = [...(item.categories ?? [])];
  const labelToStore =
    browseCategoryLabel?.trim() || inferFavoriteCategoryLabel(item) || null;

  if (labelToStore) {
    const label = labelToStore;
    const option = getCategoryOption(label);
    const extras = [label, option?.apiSlug].filter(
      (v): v is string => Boolean(v?.trim()),
    );

    for (let i = extras.length - 1; i >= 0; i--) {
      const v = extras[i].trim();
      const exists = cats.some((c) => c.trim().toLowerCase() === v.toLowerCase());
      if (!exists) cats.unshift(v);
    }
  }

  return {
    title: item.title,
    audioUrl: item.audioUrl,
    durationSeconds: item.durationSeconds,
    coverImageUrl: item.coverImageUrl,
    categories: cats,
    publisher: item.publisher,
  };
}

/** Kullanıcının kayıtlı podcast listesi (dahili + Listen Notes). */
export async function getFavorites(): Promise<PodcastSummary[]> {
  const { data } = await api.get<PodcastSummary[]>('/api/favorites');
  return data;
}

export async function getFavoriteKeys(): Promise<FavoriteKeysDto> {
  const { data } = await api.get<FavoriteKeysDto>('/api/favorites/keys');
  return data;
}

/** Dahili podcast (Guid) favorilere ekler. */
export async function addPodcastFavorite(podcastId: string): Promise<void> {
  const id = podcastId.trim();
  await api.post(`/api/favorites/${encodeURIComponent(id)}`);
}

/** Dahili podcast favoriden çıkarır. */
export async function removePodcastFavorite(podcastId: string): Promise<void> {
  const id = podcastId.trim();
  await api.delete(`/api/favorites/${encodeURIComponent(id)}`);
}

/** Listen Notes şovu favorilere ekler. */
export async function addListenNotesFavorite(
  listenNotesPodcastId: string,
  snapshot: FavoriteSnapshot,
): Promise<void> {
  const id = listenNotesPodcastId.trim();
  await api.post('/api/favorites/listen-notes', {
    listenNotesPodcastId: id,
    title: snapshot.title ?? undefined,
    audioUrl: snapshot.audioUrl ?? undefined,
    durationSeconds: snapshot.durationSeconds ?? undefined,
    coverImageUrl: snapshot.coverImageUrl ?? undefined,
    publisher: snapshot.publisher ?? undefined,
    categories: snapshot.categories ?? undefined,
  });
}

/** Listen Notes şovu favoriden çıkarır. */
export async function removeListenNotesFavorite(listenNotesPodcastId: string): Promise<void> {
  const id = listenNotesPodcastId.trim();
  await api.delete(`/api/favorites/listen-notes/${encodeURIComponent(id)}`);
}
