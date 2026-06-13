import type { Router } from 'expo-router';

import { CATEGORY_OPTIONS } from '@/src/constants/categories';
import type { PodcastSummary } from '@/src/api/podcasts.api';

export function formatDurationMinutes(seconds?: number | null): string {
  if (!seconds) return '';
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

/** /podcast ve /player arasında paylaşılan rota parametreleri. */
export function buildEpisodeRouteParams(input: {
  id: string;
  listenNotesPodcastId?: string | null;
  listenNotesEpisodeId?: string | null;
  fromDetail?: boolean;
}): Record<string, string> {
  const ln = input.listenNotesPodcastId?.trim();
  const lnEp = input.listenNotesEpisodeId?.trim();
  const base = ln
    ? {
        id: input.id,
        lnId: ln,
        ...(lnEp ? { lnEpisodeId: lnEp } : {}),
      }
    : { id: input.id };

  if (input.fromDetail) {
    return { ...base, fromDetail: '1' };
  }
  return base;
}

/** Detay ekranından oynatıcıya geç (push). fromDetail ile player'dan geri → Home. */
export function openPlayerForEpisode(
  router: Router,
  input: {
    id: string;
    listenNotesPodcastId?: string | null;
    listenNotesEpisodeId?: string | null;
  },
  opts?: { fromDetail?: boolean },
): void {
  router.push({
    pathname: '/player',
    params: buildEpisodeRouteParams({ ...input, fromDetail: opts?.fromDetail }),
  });
}

/**
 * Oynatıcıdan detay/transcript/resources:
 * - Detail'den gelindiyse back() (stack büyümez)
 * - Doğrudan player açıldıysa replace ile detay
 */
export function openPodcastDetailFromPlayer(
  router: Router,
  input: {
    id: string;
    listenNotesPodcastId?: string | null;
    listenNotesEpisodeId?: string | null;
  },
  fromDetail: boolean,
): void {
  if (fromDetail) {
    router.back();
    return;
  }
  router.replace({
    pathname: '/podcast',
    params: buildEpisodeRouteParams(input),
  });
}

/**
 * Oynatıcıyı kapat:
 * - Detail üzerinden gelindiyse Home'a (Detail + Player birlikte kapanır)
 * - Aksi halde normal geri
 */
export function exitPlayerScreen(router: Router, fromDetail: boolean): void {
  if (fromDetail) {
    router.dismiss(2);
    return;
  }
  router.back();
}

export function openPodcastSummary(router: Router, item: PodcastSummary): void {
  const isExternal = item.status?.toLowerCase() === 'external';
  if (isExternal) {
    const ln = item.listenNotesPodcastId?.trim();
    if (ln) {
      router.push({ pathname: '/podcast', params: { lnId: ln } });
      return;
    }
  }
  router.push({ pathname: '/podcast', params: { id: item.id } });
}

export function categoryTag(item: PodcastSummary): string {
  const inferred = inferFavoriteCategoryLabel(item);
  if (inferred) return inferred.toUpperCase();

  const pub = item.publisher?.trim().toLowerCase() ?? '';
  for (const raw of item.categories) {
    const t = raw.trim();
    if (!t || t.toLowerCase() === 'podcast') continue;
    if (pub && t.toLowerCase() === pub) continue;
    return t.toUpperCase();
  }

  if (item.publisher?.trim()) return item.publisher.trim().toUpperCase();
  return 'PODCAST';
}

/** Archive chip slug → eşleşen kategori adları (Listen Notes genre adları dahil). */
export const FAVORITE_SLUG_ALIASES: Record<string, string[]> = {
  technology: ['technology'],
  science: ['science'],
  economy: ['economy', 'business'],
  health: ['health', 'health & fitness'],
  world: ['world', 'news', 'government'],
  sports: ['sports'],
  entertainment: ['entertainment', 'arts', 'tv & film', 'true crime', 'comedy', 'fiction'],
  finance: ['finance', 'personal finance'],
  music: ['music'],
  ai: ['ai', 'technology'],
};

function findCategoryOptionForRaw(raw: string) {
  const n = raw.trim().toLowerCase();
  if (!n || n === 'podcast') return null;
  return (
    CATEGORY_OPTIONS.find(
      (c) =>
        c.apiSlug === n ||
        c.label.toLowerCase() === n ||
        (FAVORITE_SLUG_ALIASES[c.apiSlug] ?? []).some((a) => n === a || n.includes(a)),
    ) ?? null
  );
}

/** Listen Notes genre → Archive chip kategorisi (Home/Discover trending favorileri için). */
export function inferFavoriteCategoryLabel(item: PodcastSummary): string | null {
  const pub = item.publisher?.trim().toLowerCase() ?? '';

  for (const raw of item.categories ?? []) {
    const t = raw.trim();
    if (!t) continue;
    if (pub && t.toLowerCase() === pub) continue;
    const option = findCategoryOptionForRaw(t);
    if (option) return option.label;
  }
  return null;
}

/** Kullanıcının en çok favorilediği kategori etiketi (eşitlikte alfabetik). */
export function getTopFavoriteCategoryLabel(favorites: PodcastSummary[]): string | null {
  const counts = new Map<string, number>();

  for (const fav of favorites) {
    const label = inferFavoriteCategoryLabel(fav);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  return sorted[0]?.[0] ?? null;
}

export function matchesFavoriteFilter(item: PodcastSummary, slug: string | null): boolean {
  if (!slug) return true;

  const key = slug.trim().toLowerCase();
  const option = CATEGORY_OPTIONS.find((c) => c.apiSlug === key);
  const aliases = new Set(FAVORITE_SLUG_ALIASES[key] ?? [key]);
  if (option) {
    aliases.add(option.apiSlug);
    aliases.add(option.label.toLowerCase());
  }

  const pub = item.publisher?.trim().toLowerCase() ?? '';

  return item.categories.some((c) => {
    const n = c.trim().toLowerCase();
    if (!n || n === 'podcast') return false;
    if (pub && n === pub) return false;
    return [...aliases].some((a) => n === a || n.includes(a) || a.includes(n));
  });
}

export function favoriteCardSubtitle(item: PodcastSummary): string {
  const pub = item.publisher?.trim();
  if (pub) return pub;

  const cats = item.categories
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && c.toLowerCase() !== 'podcast');
  if (cats.length > 1) return cats[1];

  const dur = formatDurationMinutes(item.durationSeconds);
  if (dur) return dur;

  return 'Podify';
}

export function matchesCategoryFilter(item: PodcastSummary, categoryLabel: string, apiSlug: string): boolean {
  const label = categoryLabel.trim().toLowerCase();
  const slug = apiSlug.trim().toLowerCase();
  return item.categories.some((c) => {
    const n = c.trim().toLowerCase();
    return n === slug || n === label || n.includes(slug) || n.includes(label);
  });
}
