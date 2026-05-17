import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';

import { addPodcastFavorite, removePodcastFavorite } from '@/src/api/favorites.api';
import { useFavorite } from '@/src/hooks/useFavorite';

type Props = Readonly<{
  /** Oturum favorilerine yazmak için dahili podcast kimliği (Guid string). */
  podcastId?: string | null;
  initialFavorited?: boolean;
  onFavoriteChange?: (podcastId: string, favorited: boolean) => void;
  size?: number;
  dark?: boolean;
}>;

export default function FavoriteButton({
  podcastId,
  initialFavorited = false,
  onFavoriteChange,
  size = 18,
  dark = false,
}: Props) {
  const persist = Boolean(podcastId?.trim());
  const local = useFavorite(initialFavorited);

  const [serverFavorited, setServerFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (persist) setServerFavorited(initialFavorited);
  }, [persist, initialFavorited, podcastId]);

  const isFavorited = persist ? serverFavorited : local.isFavorited;
  const iconColor = isFavorited ? '#E53935' : dark ? '#fff' : '#C2C7D0';

  const toggle = useCallback(async () => {
    if (!persist) {
      local.toggle();
      return;
    }

    const id = podcastId!.trim();
    if (busy) return;
    setBusy(true);

    try {
      if (serverFavorited) {
        try {
          await removePodcastFavorite(id);
        } catch (e: unknown) {
          const status = axios.isAxiosError(e) ? e.response?.status : undefined;
          if (status !== 404) throw e;
        }
        setServerFavorited(false);
        onFavoriteChange?.(id, false);
      } else {
        try {
          await addPodcastFavorite(id);
        } catch (e: unknown) {
          const status = axios.isAxiosError(e) ? e.response?.status : undefined;
          if (status === 400) {
            setServerFavorited(true);
            onFavoriteChange?.(id, true);
            return;
          }
          throw e;
        }
        setServerFavorited(true);
        onFavoriteChange?.(id, true);
      }
    } catch {
      /* istek başarısız; durumu olduğu gibi bırak */
    } finally {
      setBusy(false);
    }
  }, [persist, podcastId, serverFavorited, busy, local, onFavoriteChange]);

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
