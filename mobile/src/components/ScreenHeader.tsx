import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

type ScreenHeaderProps = {
  pageTitle: string;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function HeaderProfileButton({
  photoUrl,
  onPress,
}: {
  photoUrl: string | null;
  onPress?: () => void;
}) {
  const content = photoUrl ? (
    <Image key={photoUrl} source={{ uri: photoUrl }} style={styles.headerAvatarImg} />
  ) : (
    <View style={styles.avatarDot} />
  );

  if (!onPress) {
    return <View style={styles.headerSide}>{content}</View>;
  }

  return (
    <TouchableOpacity
      style={styles.headerSide}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityLabel="Profile">
      {content}
    </TouchableOpacity>
  );
}

export default function ScreenHeader({ pageTitle, right, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        <MaterialIcons name="auto-awesome" size={16} color="#8B8FFF" />
        <Text style={styles.headerBrand}>PodcastAI</Text>
        <View style={styles.headerDivider} />
        <Text style={styles.headerPage}>{pageTitle}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 62,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002E83',
  },
  headerDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D6DAE6',
  },
  headerPage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8F9A',
  },
  headerSide: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
});
