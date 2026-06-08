import React from 'react';

import type { PodcastSummary } from '@/src/api/podcasts.api';
import { toFavoriteSnapshot } from '@/src/api/favorites.api';
import FavoriteButton from '@/src/components/FavoriteButton';

type Props = Readonly<{
  item: PodcastSummary;
  /** Kategori sayfasından kayıtta filtre için (ör. Music → MUSIC chip). */
  browseCategoryLabel?: string | null;
  dark?: boolean;
  size?: number;
  onFavoriteChange?: (favorited: boolean) => void;
}>;

export default function PodcastCardFavorite({
  item,
  browseCategoryLabel,
  dark,
  size,
  onFavoriteChange,
}: Props) {
  const ln = item.listenNotesPodcastId?.trim();
  const isExternal = item.status?.toLowerCase() === 'external' || Boolean(ln);

  return (
    <FavoriteButton
      podcastId={ln ? undefined : item.id}
      listenNotesPodcastId={ln || undefined}
      snapshot={isExternal ? toFavoriteSnapshot(item, browseCategoryLabel) : undefined}
      dark={dark}
      size={size}
      onFavoriteChange={(_, favorited) => onFavoriteChange?.(favorited)}
    />
  );
}
