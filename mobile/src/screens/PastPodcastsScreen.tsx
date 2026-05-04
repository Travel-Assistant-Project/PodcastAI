import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { getPodcasts, type PodcastSummary } from '@/src/api/podcasts.api';

function statusLabel(status: string | null | undefined): { text: string; color: string } {
  const s = (status ?? '').toLowerCase();
  if (s === 'completed') return { text: 'Ready', color: '#2E7D32' };
  if (s === 'failed') return { text: 'Failed', color: '#C62828' };
  if (s === 'processing' || s === 'pending') return { text: 'Processing', color: '#1565C0' };
  return { text: status ?? '—', color: '#8A8F9A' };
}

function formatCreatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function PastPodcastsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PodcastSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getPodcasts();
    setItems(data);
    setError(null);
  }, []);

  const onMount = useCallback(async () => {
    try {
      setLoading(true);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not load your podcasts.');
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
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Refresh failed.');
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
        <Text style={styles.headerTitle}>Past episodes</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0714B8" size="large" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0714B8" />
          }
          showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="podcasts" size={40} color="#C2C7D0" />
            <Text style={styles.emptyTitle}>No episodes yet</Text>
            <Text style={styles.emptySub}>
              Generate a new podcast from the Create tab — it will show up here.
            </Text>
            <TouchableOpacity
              style={styles.gotoCreate}
              onPress={() => router.push('/(tabs)/create')}>
              <Text style={styles.gotoCreateText}>Create a podcast</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map((p) => {
              const st = statusLabel(p.status);
              const title =
                p.title?.trim() ||
                (p.categories?.length
                  ? p.categories.map((c) => c.replace(/^./, (ch) => ch.toUpperCase())).join(', ')
                  : 'Podcast');
              const durationMin =
                p.durationSeconds != null
                  ? `${Math.max(1, Math.round(p.durationSeconds / 60))} dk`
                  : null;

              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.row}
                  activeOpacity={0.75}
                  onPress={() => router.push({ pathname: '/podcast', params: { id: p.id } })}>
                  <View style={styles.rowIcon}>
                    <MaterialIcons name="graphic-eq" size={22} color="#0714B8" />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {title}
                    </Text>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowMetaText}>{formatCreatedAt(p.createdAt)}</Text>
                      {durationMin && (
                        <>
                          <Text style={styles.rowMetaDot}>•</Text>
                          <Text style={styles.rowMetaText}>{durationMin}</Text>
                        </>
                      )}
                    </View>
                    <View style={styles.badges}>
                      <View style={[styles.statusPill, { borderColor: st.color + '55' }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.text}</Text>
                      </View>
                      {p.learningMode && (
                        <View style={styles.learnPill}>
                          <MaterialIcons name="school" size={12} color="#0714B8" />
                          <Text style={styles.learnPillText}>
                            {p.cefrLevel ? `Learn ${p.cefrLevel}` : 'Learn mode'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color="#C2C7D0" />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF2',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111318', flex: 1, textAlign: 'center' },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  muted: { color: '#8A8F9A', fontSize: 13 },
  errorText: { color: '#E53935', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0714B8',
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  scroll: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#111318', marginTop: 12 },
  emptySub: {
    fontSize: 13,
    color: '#8A8F9A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  gotoCreate: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: '#0714B8',
    borderRadius: 12,
  },
  gotoCreateText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EBF2',
    gap: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111318', marginBottom: 4 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  rowMetaText: { fontSize: 11, color: '#8A8F9A', fontWeight: '600' },
  rowMetaDot: { fontSize: 11, color: '#C2C7D0' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FAFBFC',
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  learnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#EEF1FF',
    borderWidth: 1,
    borderColor: '#C7CFFF',
  },
  learnPillText: { fontSize: 10, fontWeight: '800', color: '#0714B8' },
});
