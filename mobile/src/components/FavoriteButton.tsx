import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';

import {
  addListenNotesFavorite,
  addPodcastFavorite,
  removeListenNotesFavorite,
  removePodcastFavorite,
  type FavoriteSnapshot,
} from '@/src/api/favorites.api';
import { useFavorites } from '@/src/context/FavoritesContext';
import { useFavorite } from '@/src/hooks/useFavorite';

type Props = Readonly<{
  podcastId?: string | null;
  listenNotesPodcastId?: string | null;
  snapshot?: FavoriteSnapshot;
  initialFavorited?: boolean;
  onFavoriteChange?: (key: string, favorited: boolean) => void;
  size?: number;
  dark?: boolean;
}>;

export default function FavoriteButton({
  podcastId,
  listenNotesPodcastId,
  snapshot,
  initialFavorited = false,
  onFavoriteChange,
  size = 18,
  dark = false,
}: Props) {
  const favorites = useFavorites();
  const lnId = listenNotesPodcastId?.trim() ?? '';
  const internalId = podcastId?.trim() ?? '';
  const persist = lnId.length > 0 || internalId.length > 0;
  const local = useFavorite(initialFavorited);

  const contextFavorited = favorites.isFavorited({
    podcastId: internalId || undefined,
    listenNotesPodcastId: lnId || undefined,
  });

  const [serverFavorited, setServerFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!persist) return;
    setServerFavorited(contextFavorited || initialFavorited);
  }, [persist, contextFavorited, initialFavorited, internalId, lnId]);

  const isFavorited = persist ? serverFavorited : local.isFavorited;
  const iconColor = isFavorited ? '#E53935' : dark ? '#fff' : '#C2C7D0';
  const changeKey = lnId || internalId;

  const toggle = useCallback(async () => {
    if (!persist) {
      local.toggle();
      return;
    }

    if (busy) return;
    setBusy(true);

    const opts = {
      podcastId: internalId || undefined,
      listenNotesPodcastId: lnId || undefined,
    };

    try {
      if (serverFavorited) {
        try {
          if (lnId) await removeListenNotesFavorite(lnId);
          else await removePodcastFavorite(internalId);
        } catch (e: unknown) {
          const status = axios.isAxiosError(e) ? e.response?.status : undefined;
          if (status !== 404) throw e;
        }
        setServerFavorited(false);
        favorites.markUnfavorited(opts);
        onFavoriteChange?.(changeKey, false);
      } else {
        try {
          if (lnId) {
            if (!snapshot) throw new Error('Favorite snapshot required for Listen Notes podcasts.');
            await addListenNotesFavorite(lnId, snapshot);
          } else {
            await addPodcastFavorite(internalId);
          }
        } catch (e: unknown) {
          const status = axios.isAxiosError(e) ? e.response?.status : undefined;
          if (status === 400) {
            setServerFavorited(true);
            favorites.markFavorited(opts);
            onFavoriteChange?.(changeKey, true);
            return;
          }
          throw e;
        }
        setServerFavorited(true);
        favorites.markFavorited(opts);
        onFavoriteChange?.(changeKey, true);
      }
    } catch {
      /* istek başarısız; durumu olduğu gibi bırak */
    } finally {
      setBusy(false);
    }
  }, [
    persist,
    busy,
    serverFavorited,
    lnId,
    internalId,
    snapshot,
    local,
    favorites,
    onFavoriteChange,
    changeKey,
  ]);

  return (
    <TouchableOpacity
      style={[styles.btn, dark && styles.btnDark]}
      onPress={() => void toggle()}
      disabled={busy && persist}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      {busy && persist ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <MaterialIcons
          name={isFavorited ? 'favorite' : 'favorite-border'}
          size={size}
          color={iconColor}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDark: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
