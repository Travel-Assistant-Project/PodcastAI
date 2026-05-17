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
  createdAt: string;
  sources: PodcastSource[];
  transcript: TranscriptSegment[];
  cefrLevel?: string | null;
  learningMode: boolean;
};

export type PodcastSummary = {
  id: string;
  title?: string | null;
  audioUrl?: string | null;
  durationSeconds?: number | null;
  status?: string | null;
  categories: string[];
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
  status?: string | null;
};

export type RecordPlayRequest = {
  progressSeconds: number;
  isCompleted: boolean;
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

export async function getPodcasts(): Promise<PodcastSummary[]> {
  const { data } = await api.get<PodcastSummary[]>('/api/podcasts');
  return data;
}

export async function getLatestPodcast(): Promise<PodcastSummary | null> {
  const response = await api.get<PodcastSummary>('/api/podcasts/latest');
  if (response.status === 204) return null;
  return response.data;
}

export async function getRecommendedPodcasts(): Promise<PodcastSummary[]> {
  const { data } = await api.get<PodcastSummary[]>('/api/podcasts/recommended');
  return data;
}

export async function recordPlay(id: string, payload: RecordPlayRequest): Promise<void> {
  await api.post(`/api/podcasts/${id}/play`, payload);
}

export async function getRecentlyPlayed(): Promise<RecentlyPlayed[]> {
  const { data } = await api.get<RecentlyPlayed[]>('/api/podcasts/recently-played');
  return data;
}
