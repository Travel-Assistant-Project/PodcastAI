import type { PodcastDetail, PodcastSummary } from '@/src/api/podcasts.api';

type CuratedEntry = {
  listenNotesPodcastId: string;
  id: string;
  title: string;
  publisher: string;
  category: string;
};

const GENRE_ID_TO_LABEL: Record<string, string> = {
  '127': 'Technology',
  '107': 'Science',
  '93': 'Business',
  '88': 'Health',
  '99': 'World News',
  '77': 'Sports',
  '100': 'Entertainment',
  '144': 'Finance',
  '134': 'Music',
};

const CATALOG: CuratedEntry[] = [
  {
    listenNotesPodcastId: '4f18f0de-fd21-4af2-ae89-eeb19542e7c3',
    id: '6021e785-b397-9b01-1b1b-0debf26356d9',
    title: 'The Daily',
    publisher: 'The New York Times',
    category: 'World News',
  },
  {
    listenNotesPodcastId: 'b2942240-4c77-4be3-b6b6-a2d5c843a36f',
    id: 'db6f91df-4ae7-eb1e-648f-b10b9e62968a',
    title: 'TED Talks Daily',
    publisher: 'TED',
    category: 'Technology',
  },
  {
    listenNotesPodcastId: '22d5b560-01e3-40fb-ab46-e629b9968c40',
    id: 'dbae2372-1cbf-e3a3-fb72-f0b4a28f5913',
    title: 'Stuff You Should Know',
    publisher: 'iHeartPodcasts',
    category: 'Science',
  },
  {
    listenNotesPodcastId: '7a633f6e-2d7b-48ef-8a49-f1fd45124a55',
    id: 'bcceb796-225c-a47e-475a-5f5ecb63ef54',
    title: 'How I Built This',
    publisher: 'NPR',
    category: 'Business',
  },
  {
    listenNotesPodcastId: '6f6d31bc-eb6e-4130-a850-9a2d5fbfa0e4',
    id: '0c80508f-1110-4956-517d-df5085ab99b1',
    title: 'Hidden Brain',
    publisher: 'NPR',
    category: 'Health',
  },
  {
    listenNotesPodcastId: '42be484a-fafc-4d75-915b-59c1aea9e886',
    id: '6f5234b7-593c-d754-9273-2b540b6433d9',
    title: 'Science Vs',
    publisher: 'Spotify Studios',
    category: 'Science',
  },
  {
    listenNotesPodcastId: '73cb3bf0-df27-4aa9-aeeb-fe30f21e5abc',
    id: '66577cd3-72db-4498-4f89-1cfe6ae39666',
    title: 'Freakonomics Radio',
    publisher: 'Freakonomics Radio + Stitcher',
    category: 'Finance',
  },
  {
    listenNotesPodcastId: '98bc3aa3-9ad4-46eb-a88c-ae548551fe1d',
    id: '35ac530c-076b-31ed-798a-3654379fb16d',
    title: 'Planet Money',
    publisher: 'NPR',
    category: 'Finance',
  },
  {
    listenNotesPodcastId: 'c7b33460-0f5e-4fc1-8c7f-5fe01d55b0b1',
    id: 'edb183b8-699f-2b24-258c-a65e2678b75d',
    title: 'The Bill Simmons Podcast',
    publisher: 'The Ringer',
    category: 'Sports',
  },
  {
    listenNotesPodcastId: 'e8bf79c8-7a43-4a4d-9428-268aa6217b63',
    id: 'dded2b1f-c9dc-135f-a267-e85de9add28e',
    title: 'Song Exploder',
    publisher: 'Hrishikesh Hirway',
    category: 'Music',
  },
  {
    listenNotesPodcastId: '2bc39836-7723-4aa9-b815-17eb2d2e7f2e',
    id: '414392db-cc95-4697-fcbf-c1d91a4046af',
    title: 'SmartLess',
    publisher: 'Jason Bateman, Sean Hayes, Will Arnett',
    category: 'Entertainment',
  },
];

function toSummary(entry: CuratedEntry): PodcastSummary {
  const listenNotesUrl = `https://www.listennotes.com/c/${entry.listenNotesPodcastId}/`;
  return {
    id: entry.id,
    title: entry.title,
    audioUrl: listenNotesUrl,
    durationSeconds: null,
    status: 'External',
    categories: [entry.category],
    coverImageUrl: null,
    listenNotesUrl,
    publisher: entry.publisher,
    listenNotesPodcastId: entry.listenNotesPodcastId,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    learningMode: false,
    cefrLevel: null,
  };
}

function toDetail(entry: CuratedEntry): PodcastDetail {
  const listenNotesUrl = `https://www.listennotes.com/c/${entry.listenNotesPodcastId}/`;
  const createdAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: entry.id,
    userId: null,
    title: entry.title,
    scriptText: `Curated fallback entry for ${entry.title}. Listen Notes API is temporarily unavailable.`,
    audioUrl: null,
    durationSeconds: null,
    tone: null,
    speakerCount: 1,
    status: 'failed',
    categories: [entry.category],
    coverImageUrl: null,
    createdAt,
    sources: [
      {
        sourceName: 'Listen Notes',
        newsTitle: entry.title,
        newsUrl: listenNotesUrl,
        publishedAt: createdAt,
      },
    ],
    transcript: [],
    cefrLevel: null,
    learningMode: false,
    listeningProgressSeconds: 0,
    listeningCompleted: false,
    listenNotesPodcastId: entry.listenNotesPodcastId,
    listenNotesEpisodeId: null,
    publisher: entry.publisher,
  };
}

export function getCuratedTrending(genreId?: string | null, max = 10): PodcastSummary[] {
  const label = genreId?.trim() ? GENRE_ID_TO_LABEL[genreId.trim()] : undefined;
  const filtered = label
    ? CATALOG.filter((e) => e.category.toLowerCase().includes(label.toLowerCase()))
    : CATALOG;
  return filtered.slice(0, max).map(toSummary);
}

export function getCuratedDetail(listenNotesPodcastId: string): PodcastDetail | null {
  const key = listenNotesPodcastId.trim().toLowerCase();
  const entry = CATALOG.find((e) => e.listenNotesPodcastId.toLowerCase() === key);
  return entry ? toDetail(entry) : null;
}
