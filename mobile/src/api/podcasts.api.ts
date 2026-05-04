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
