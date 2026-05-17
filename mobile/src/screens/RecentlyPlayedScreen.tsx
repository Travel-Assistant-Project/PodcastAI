import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import RecentlyPlayedList from '@/src/components/RecentlyPlayedList';
import { getRecentlyPlayed, type RecentlyPlayed } from '@/src/api/podcasts.api';
import { Colors } from '@/src/styles/colors';

export default function RecentlyPlayedScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RecentlyPlayed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getRecentlyPlayed();
    setItems(data);
    setError(null);
  }, []);

  const onMount = useCallback(async () => {
    try {
      setLoading(true);
      await load();
    } catch {
      setError('Could not load listening history.');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void onMount();
  }, [onMount]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } catch {
      setError('Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#111318" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recently played</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={28} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void onMount()}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="history" size={40} color="#C2C7D0" />
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptySub}>
                Start listening on the Home tab — episodes you open will appear here.
              </Text>
            </View>
          ) : (
            <RecentlyPlayedList items={items} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  muted: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
