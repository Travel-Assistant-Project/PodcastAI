import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFavorite } from '@/src/hooks/useFavorite';

type Props = Readonly<{
  initialFavorited?: boolean;
  size?: number;
  dark?: boolean;
}>;

export default function FavoriteButton({ initialFavorited = false, size = 18, dark = false }: Props) {
  const { isFavorited, toggle } = useFavorite(initialFavorited);
  const iconColor = isFavorited ? '#E53935' : (dark ? '#fff' : '#C2C7D0');

  return (
    <TouchableOpacity
      style={[styles.btn, dark && styles.btnDark]}
      onPress={toggle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <MaterialIcons
        name={isFavorited ? 'favorite' : 'favorite-border'}
        size={size}
        color={iconColor}
      />
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
