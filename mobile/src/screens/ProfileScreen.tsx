import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';

import { setAuthToken } from '@/src/api/client';
import { getUser, setUser } from '@/src/store/authStore';
import { getProfile, uploadProfilePhoto, type UserProfile } from '@/src/api/user.api';
import { usePlayback } from '@/src/context/PlaybackContext';

function DefaultAvatar({ size }: Readonly<{ size: number }>) {
  return (
    <View
      style={[
        styles.defaultAvatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <MaterialIcons name="person" size={size * 0.52} color="#A0AEC0" />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { stopAndClear } = usePlayback();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const authUser = getUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const displayName = profile?.fullName ?? authUser?.fullName ?? 'User';
  const email = profile?.email ?? authUser?.email ?? '';

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    setPhotoLoading(true);
    try {
      const photoUrl = await uploadProfilePhoto(uri);
      setProfile((prev) => (prev ? { ...prev, photoUrl } : prev));
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await stopAndClear();
            setAuthToken(null);
            setUser(null);
            router.dismissAll();
            router.replace('/');
          },
        },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PodcastAI</Text>
        <View style={styles.avatarSmall}>
          {profile?.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatarSmallImg} />
          ) : (
            <DefaultAvatar size={36} />
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {photoLoading && (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator color="#0714B8" />
              </View>
            )}
            {!photoLoading && profile?.photoUrl && (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
            )}
            {!photoLoading && !profile?.photoUrl && <DefaultAvatar size={96} />}
            <TouchableOpacity
              style={styles.editAvatarBtn}
              activeOpacity={0.8}
              onPress={handlePickPhoto}
              disabled={photoLoading}
            >
              <MaterialIcons name="edit" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>

          {/* Age & Occupation info chips */}
          {(profile?.age != null || profile?.occupation) && (
            <View style={styles.infoChips}>
              {profile?.age != null && (
                <View style={styles.chip}>
                  <MaterialIcons name="cake" size={13} color="#0714B8" style={{ marginRight: 4 }} />
                  <Text style={styles.chipText}>{profile.age} years old</Text>
                </View>
              )}
              {!!profile?.occupation && (
                <View style={styles.chip}>
                  <MaterialIcons name="work-outline" size={13} color="#0714B8" style={{ marginRight: 4 }} />
                  <Text style={styles.chipText}>{profile.occupation}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Past Episodes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Episodes</Text>
          <View style={styles.preferenceList}>
            <TouchableOpacity
              style={styles.preferenceRow}
              activeOpacity={0.75}
              onPress={() => router.push('/past-podcasts')}
            >
              <View style={[styles.prefIconWrap, { backgroundColor: '#F0F3FF' }]}>
                <MaterialIcons name="history" size={20} color="#0714B8" />
              </View>
              <View style={styles.prefContent}>
                <Text style={styles.prefTitle}>All Episodes</Text>
                <Text style={styles.prefSub}>Open and play podcasts you have already created</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#C2C7D0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vocabook */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vocabook</Text>
          <View style={styles.preferenceList}>
            <TouchableOpacity
              style={styles.preferenceRow}
              activeOpacity={0.75}
              onPress={() => router.push('/words')}
            >
              <View style={[styles.prefIconWrap, { backgroundColor: '#EEF1FF' }]}>
                <MaterialIcons name="bookmark" size={20} color="#0714B8" />
              </View>
              <View style={styles.prefContent}>
                <Text style={styles.prefTitle}>Vocabulary Notebook</Text>
                <Text style={styles.prefSub}>
                  Words you save from learning-mode episodes and your progress
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#C2C7D0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferenceList}>
            <TouchableOpacity style={styles.preferenceRow} activeOpacity={0.75}>
              <View style={[styles.prefIconWrap, { backgroundColor: '#EEF1FF' }]}>
                <MaterialIcons name="schedule" size={20} color="#0714B8" />
              </View>
              <View style={styles.prefContent}>
                <Text style={styles.prefTitle}>Daily Podcast Time</Text>
                <Text style={styles.prefSub}>Target: 45 mins / day</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#C2C7D0" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <View style={styles.preferenceRow}>
              <View style={[styles.prefIconWrap, { backgroundColor: '#F0F3FF' }]}>
                <MaterialIcons name="notifications-none" size={20} color="#0714B8" />
              </View>
              <View style={styles.prefContent}>
                <Text style={styles.prefTitle}>Notifications</Text>
                <Text style={styles.prefSub}>Smart AI summaries enabled</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#0714B8' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.preferenceRow} activeOpacity={0.75}>
              <View style={[styles.prefIconWrap, { backgroundColor: '#F0F3FF' }]}>
                <MaterialIcons name="shield" size={20} color="#0714B8" />
              </View>
              <View style={styles.prefContent}>
                <Text style={styles.prefTitle}>Account Security</Text>
                <Text style={styles.prefSub}>Two-factor authentication active</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#C2C7D0" />
            </TouchableOpacity>
          </View>
        </View>

        {/*
        ── References (ileride kullanılabilir) ──────────────────────────────────
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>References</Text>
          <View style={styles.preferenceList}>
            <TouchableOpacity style={styles.preferenceRow} activeOpacity={0.75}>
              <View style={[styles.prefIconWrap, { backgroundColor: '#EEF1FF' }]}>
                <MaterialIcons name="link" size={20} color="#0714B8" />
              </View>
              <View style={styles.prefContent}>
                <Text style={styles.prefTitle}>Linked Sources</Text>
                <Text style={styles.prefSub}>News feeds and content sources</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#C2C7D0" />
            </TouchableOpacity>
          </View>
        </View>
        ─────────────────────────────────────────────────────────────────────── */}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color="#E53935" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>APP VERSION 2.4.0 (AI ENGINE V8)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F7F9FB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111318',
    letterSpacing: 0.3,
    textDecorationLine: 'underline',
    textDecorationColor: '#D1D5DB',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarSmallImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    backgroundColor: '#EDF0F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatar: {
    backgroundColor: '#EDF0F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7F9FB',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8F9A',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF1FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C7CFFF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0714B8',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 10,
  },
  preferenceList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDF0F4',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  prefIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  prefContent: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111318',
    marginBottom: 2,
  },
  prefSub: {
    fontSize: 12,
    color: '#8A8F9A',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginHorizontal: 18,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE0DE',
    marginBottom: 28,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E53935',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#B0B5C0',
    letterSpacing: 1.2,
  },
});
