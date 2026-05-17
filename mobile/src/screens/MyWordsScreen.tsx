import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import {
  deleteWord,
  getProgress,
  getWords,
  setWordLearned,
  type LearningProgress,
  type UserWord,
} from '@/src/api/learning.api';

export default function MyWordsScreen() {
  const router = useRouter();
  const [words, setWords] = useState<UserWord[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlearned' | 'learned'>('all');

  const load = useCallback(async () => {
    try {
      const [w, p] = await Promise.all([getWords(false), getProgress()]);
      setWords(w);
      setProgress(p);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not load words.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = words.filter((w) =>
    filter === 'all' ? true : filter === 'learned' ? w.isLearned : !w.isLearned,
  );

  const toggleLearned = async (w: UserWord) => {
    try {
      const updated = await setWordLearned(w.id, !w.isLearned);
      setWords((prev) => prev.map((x) => (x.id === w.id ? updated : x)));
      // Progress sayaçları için yeniden çek (hafif istek).
      void getProgress().then(setProgress).catch(() => {});
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not update.');
    }
  };

  const remove = (w: UserWord) => {
    Alert.alert('Remove word', `Remove “${w.word}” from your notebook?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWord(w.id);
            setWords((prev) => prev.filter((x) => x.id !== w.id));
            void getProgress().then(setProgress).catch(() => {});
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Could not delete.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#111318" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vocabulary notebook</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {progress && (
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNum}>{progress.totalWords}</Text>
              <Text style={styles.progressLabel}>Total</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={[styles.progressNum, { color: '#10B981' }]}>
                {progress.learnedWords}
              </Text>
              <Text style={styles.progressLabel}>Learned</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressNum}>{progress.learningPodcastsCount}</Text>
              <Text style={styles.progressLabel}>Podcasts</Text>
            </View>
          </View>
        )}

        <View style={styles.filterRow}>
          {(['all', 'unlearned', 'learned'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}>
              <Text
                style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f === 'unlearned' ? 'Still learning' : 'Learned'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#0714B8" />
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="bookmark-border" size={36} color="#8A8F9A" />
            <Text style={styles.emptyText}>
              No saved words yet. In a learning-mode episode, long-press a word to look it up and
              add it here.
            </Text>
          </View>
        )}

        {!loading &&
          filtered.map((w) => (
            <View key={w.id} style={styles.row}>
              <TouchableOpacity
                style={[styles.checkBox, w.isLearned && styles.checkBoxOn]}
                onPress={() => toggleLearned(w)}>
                {w.isLearned && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={styles.rowHeader}>
                  <Text
                    style={[styles.word, w.isLearned && styles.wordLearned]}>
                    {w.word}
                  </Text>
                  {w.lookupCount > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>×{w.lookupCount}</Text>
                    </View>
                  )}
                </View>
                {!!w.translation && <Text style={styles.translation}>{w.translation}</Text>}
                {!!w.contextSentence && (
                  <Text style={styles.context} numberOfLines={2}>
                    “{w.contextSentence}”
                  </Text>
                )}
              </View>

              <TouchableOpacity onPress={() => remove(w)} style={styles.deleteBtn}>
                <MaterialIcons name="delete-outline" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#ECEEF2',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#111318' },

  content: { paddingHorizontal: 16, paddingBottom: 40 },

  progressCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: '#E8EBF2',
    marginBottom: 16,
  },
  progressItem: { flex: 1, alignItems: 'center' },
  progressDivider: { width: 1, backgroundColor: '#E8EBF2' },
  progressNum: { fontSize: 22, fontWeight: '800', color: '#111318', marginBottom: 2 },
  progressLabel: { fontSize: 11, color: '#8A8F9A', fontWeight: '700', letterSpacing: 0.5 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E8EBF2',
  },
  filterBtnActive: { backgroundColor: '#0714B8', borderColor: '#0714B8' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#3D4048' },
  filterTextActive: { color: '#FFFFFF' },

  center: { paddingVertical: 30, alignItems: 'center' },
  empty: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  emptyText: {
    fontSize: 13, color: '#8A8F9A', textAlign: 'center',
    paddingHorizontal: 30,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#E8EBF2',
  },
  checkBox: {
    width: 26, height: 26, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#C2C7D0',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: '#10B981', borderColor: '#10B981' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontSize: 15, fontWeight: '800', color: '#111318' },
  wordLearned: { color: '#8A8F9A', textDecorationLine: 'line-through' },
  countBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: '#EEF1FF',
  },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: '#0714B8' },
  translation: { fontSize: 13, color: '#0714B8', marginTop: 2 },
  context: { fontSize: 12, color: '#5A5F6A', fontStyle: 'italic', marginTop: 4 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
});
