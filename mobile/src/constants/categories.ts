/** Görünen isim -> ai-service / NewsAPI kategori anahtarı + Listen Notes genre_id */
export type CategoryOption = {
  label: string;
  apiSlug: string;
  /** Listen Notes GET /best_podcasts?genre_id=… (GET /genres ile doğrulandı) */
  listenNotesGenreId: string;
  showSparkle?: boolean;
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { label: 'Technology', apiSlug: 'technology', listenNotesGenreId: '127' },
  { label: 'Science', apiSlug: 'science', listenNotesGenreId: '107' },
  { label: 'Business', apiSlug: 'economy', listenNotesGenreId: '93' },
  { label: 'Health', apiSlug: 'health', listenNotesGenreId: '88' },
  { label: 'World News', apiSlug: 'world', listenNotesGenreId: '99' },
  { label: 'Sports', apiSlug: 'sports', listenNotesGenreId: '77' },
  { label: 'Entertainment', apiSlug: 'entertainment', listenNotesGenreId: '100' },
  { label: 'Finance', apiSlug: 'finance', listenNotesGenreId: '144' },
  { label: 'Music', apiSlug: 'music', listenNotesGenreId: '134' },
  { label: 'AI', apiSlug: 'ai', listenNotesGenreId: '127', showSparkle: true },
];

export function getCategoryOption(label: string): CategoryOption | undefined {
  const key = label.trim();
  return CATEGORY_OPTIONS.find((c) => c.label === key);
}

/** Archive chip görünen adı (Discover kategorileriyle uyumlu). */
const FAVORITE_CHIP_LABELS: Record<string, string> = {
  economy: 'BUSINESS',
  world: 'WORLD',
};

/** Archive chip → apiSlug (null = tümü). Discover ile aynı kategori seti. */
export const FAVORITE_FILTERS = [
  { label: 'ALL SAVED', slug: null as string | null },
  ...CATEGORY_OPTIONS.map((c) => ({
    label: FAVORITE_CHIP_LABELS[c.apiSlug] ?? c.label.toUpperCase(),
    slug: c.apiSlug,
  })),
] as const;

export type FavoriteFilterSlug = (typeof FAVORITE_FILTERS)[number]['slug'];
