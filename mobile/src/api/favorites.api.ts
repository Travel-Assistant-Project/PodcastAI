import { api } from '@/src/api/client';

/** Dahili podcast (Guid) favorilere ekler — POST /api/favorites/{podcastId} */
export async function addPodcastFavorite(podcastId: string): Promise<void> {
  const id = podcastId.trim();
  await api.post(`/api/favorites/${encodeURIComponent(id)}`);
}

/** Dahili podcast favoriden çıkarır — DELETE /api/favorites/{podcastId} */
export async function removePodcastFavorite(podcastId: string): Promise<void> {
  const id = podcastId.trim();
  await api.delete(`/api/favorites/${encodeURIComponent(id)}`);
}
