import { api } from '@/src/api/client';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type PreferredMode = 'listen' | 'learn';

export type OnboardingResponse = {
  preferredMode: PreferredMode;
  cefrLevel: CefrLevel | null;
};

export type TranslateWordResponse = {
  word: string;
  translation: string;
  partOfSpeech?: string | null;
  exampleEn?: string | null;
  exampleTr?: string | null;
  fromCache: boolean;
};

export type UserWord = {
  id: number;
  word: string;
  contextSentence?: string | null;
  translation?: string | null;
  isLearned: boolean;
  lookupCount: number;
  podcastId?: string | null;
  createdAt: string;
};

export type LearningProgress = {
  totalWords: number;
  learnedWords: number;
  learningPodcastsCount: number;
  totalListenSeconds: number;
  cefrLevel?: CefrLevel | null;
};

export async function submitOnboarding(payload: {
  preferredMode: PreferredMode;
  cefrLevel?: CefrLevel | null;
}): Promise<OnboardingResponse> {
  const { data } = await api.post<OnboardingResponse>('/api/learning/onboarding', payload);
  return data;
}

export async function translateWord(payload: {
  word: string;
  contextSentence?: string;
  podcastId?: string;
  sourceLang?: string;
  targetLang?: string;
}): Promise<TranslateWordResponse> {
  const { data } = await api.post<TranslateWordResponse>('/api/learning/translate-word', {
    sourceLang: 'en',
    targetLang: 'tr',
    ...payload,
  });
  return data;
}

export async function saveWord(payload: {
  word: string;
  contextSentence?: string;
  translation?: string;
  podcastId?: string;
}): Promise<UserWord> {
  const { data } = await api.post<UserWord>('/api/learning/words', payload);
  return data;
}

export async function getWords(onlyUnlearned = false): Promise<UserWord[]> {
  const { data } = await api.get<UserWord[]>('/api/learning/words', {
    params: onlyUnlearned ? { onlyUnlearned: true } : undefined,
  });
  return data;
}

export async function setWordLearned(id: number, isLearned: boolean): Promise<UserWord> {
  const { data } = await api.patch<UserWord>(`/api/learning/words/${id}`, { isLearned });
  return data;
}

export async function deleteWord(id: number): Promise<void> {
  await api.delete(`/api/learning/words/${id}`);
}

export async function getProgress(): Promise<LearningProgress> {
  const { data } = await api.get<LearningProgress>('/api/learning/progress');
  return data;
}
