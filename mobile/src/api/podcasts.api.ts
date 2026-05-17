import { api } from '@/src/api/client';

export type TranscriptSegment = {
  order: number;
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
  textTr?: string | null;
};

export type PodcastSource = {
  sourceName?: string | null;
  newsTitle?: string | null;
  newsUrl?: string | null;
  publishedAt?: string | null;
};

export type PodcastDetail = {
  id: string;
  userId?: string | null;
  title?: string | null;
  scriptText?: string | null;
  audioUrl?: string | null;
  durationSeconds?: number | null;
  tone?: string | null;
  speakerCount: number;
  status?: string | null;
  categories: string[];
  /** Backend podcasts.coverimageobjectkey için üretilmiş görüntüleme URL */
  coverImageUrl?: string | null;
  createdAt: string;
  sources: PodcastSource[];
  transcript: TranscriptSegment[];
  cefrLevel?: string | null;
  learningMode: boolean;
  /** Oturum kullanıcısı için son kaydedilen konum (saniye). */
  listeningProgressSeconds?: number;
  listeningCompleted?: boolean;
  listenNotesPodcastId?: string | null;
  listenNotesEpisodeId?: string | null;
  /** Listen Notes şovları için yayıncı metni */
  publisher?: string | null;
};

export type PodcastSummary = {
  id: string;
  title?: string | null;
  audioUrl?: string | null;
  durationSeconds?: number | null;
  status?: string | null;
  categories: string[];
  coverImageUrl?: string | null;
  /** Listen Notes şov sayfası (yedek). */
  listenNotesUrl?: string | null;
  publisher?: string | null;
  listenNotesPodcastId?: string | null;
  createdAt: string;
  learningMode?: boolean;
  cefrLevel?: string | null;
};

export type GeneratePodcastRequest = {
  categories: string[];
  tone: string;
  durationMinutes: number;
  speakerCount: number;
  learningMode?: boolean;
  cefrLevel?: string | null;
};

export type GeneratePodcastResponse = {
  podcastId: string;
  status: string;
};

export type RecentlyPlayed = {
  podcastId: string;
  title?: string | null;
  audioUrl?: string | null;
  progressSeconds: number;
  isCompleted: boolean;
  lastListenedAt: string;
  durationSeconds?: number | null;
  categories: string[];
  coverImageUrl?: string | null;
  status?: string | null;
  listenNotesEpisodeId?: string | null;
  listenNotesPodcastId?: string | null;
};

export type RecordPlayRequest = {
  progressSeconds: number;
  isCompleted: boolean;
};

export type ListenNotesPlayPayload = {
  listenNotesEpisodeId: string;
  listenNotesPodcastId: string;
  progressSeconds: number;
  isCompleted: boolean;
  durationSeconds?: number | null;
  title?: string | null;
  audioUrl?: string | null;
  coverImageUrl?: string | null;
  categories?: string[] | null;
};

export async function generatePodcast(
  payload: GeneratePodcastRequest,
): Promise<GeneratePodcastResponse> {
  const { data } = await api.post<GeneratePodcastResponse>('/api/podcasts/generate', payload);
  return data;
}

export async function getPodcastById(id: string): Promise<PodcastDetail> {
  const { data } = await api.get<PodcastDetail>(`/api/podcasts/${id}`);
  return data;
}

export async function getListenNotesPodcastDetail(
  listenNotesPodcastId: string,
  episodeId?: string | null,
): Promise<PodcastDetail> {
  const enc = encodeURIComponent(listenNotesPodcastId.trim());
  const q =
    episodeId && episodeId.trim().length > 0
      ? `?episodeId=${encodeURIComponent(episodeId.trim())}`
      : '';
  const { data } = await api.get<PodcastDetail>(`/api/podcasts/listen-notes/${enc}${q}`);
  return data;
}

export async function getPodcasts(): Promise<PodcastSummary[]> {
  const { data } = await api.get<PodcastSummary[]>('/api/podcasts');
  return data;
}

export async function getLatestPodcast(): Promise<PodcastSummary | null> {
  const response = await api.get<PodcastSummary>('/api/podcasts/latest');
  if (response.status === 204) return null;
  return response.data;
}

/** Home trending row — Listen Notes `best_podcasts` (up to 10 items via `/recommended`). */
export async function getTrendingPodcasts(): Promise<PodcastSummary[]> {
  const { data } = await api.get<PodcastSummary[]>('/api/podcasts/recommended');
  return data;
}

export async function recordPlay(id: string, payload: RecordPlayRequest): Promise<void> {
  await api.post(`/api/podcasts/${id}/play`, payload);
}

export async function recordListenNotesPlay(payload: ListenNotesPlayPayload): Promise<void> {
  await api.post('/api/podcasts/listen-notes/play', {
    listenNotesEpisodeId: payload.listenNotesEpisodeId,
    listenNotesPodcastId: payload.listenNotesPodcastId,
    progressSeconds: payload.progressSeconds,
    isCompleted: payload.isCompleted,
    durationSeconds: payload.durationSeconds ?? undefined,
    title: payload.title ?? undefined,
    audioUrl: payload.audioUrl ?? undefined,
    coverImageUrl: payload.coverImageUrl ?? undefined,
    categories: payload.categories ?? undefined,
  });
}

export async function getRecentlyPlayed(): Promise<RecentlyPlayed[]> {
  const { data } = await api.get<RecentlyPlayed[]>('/api/podcasts/recently-played');
  return data;
}
