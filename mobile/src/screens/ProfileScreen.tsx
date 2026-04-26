import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { setAuthToken } from '@/src/api/client';
import { getUser, setUser } from '@/src/store/authStore';

const INTERESTS = ['Technology', 'AI', 'Business'];

export default function ProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const user = getUser();
  const fullName = user?.fullName ?? 'Kullanıcı';
  const email = user?.email ?? '';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setAuthToken(null);
            setUser(null);
            router.dismissAll();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PodcastAI</Text>
        <View style={styles.avatarSmall}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
            style={styles.avatarSmallImg}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/200?img=12' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <MaterialIcons name="edit" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileRole}>{email}</Text>
        </View>

        {/* My Interests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Interests</Text>
            <TouchableOpacity>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagsRow}>
            {INTERESTS.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  tag === 'AI' && styles.tagAccent,
                ]}>
                {tag === 'AI' && (
                  <MaterialIcons name="auto-awesome" size={13} color="#0714B8" style={{ marginRight: 4 }} />
                )}
                {tag !== 'AI' && (
                  <View style={styles.tagDot} />
                )}
                <Text style={[styles.tagText, tag === 'AI' && styles.tagTextAccent]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.preferenceList}>
            {/* Daily Podcast Time */}
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

            {/* Notifications */}
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

            {/* Account Security */}
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

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color="#E53935" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
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

  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
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

  profileRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1.5,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 14,
  },

  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0714B8',
    marginBottom: 14,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  tagAccent: {
    backgroundColor: '#EEF1FF',
    borderColor: '#C7CFFF',
  },

  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8A8F9A',
    marginRight: 7,
  },

  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3D4048',
  },

  tagTextAccent: {
    color: '#0714B8',
    fontWeight: '600',
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
