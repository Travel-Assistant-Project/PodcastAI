import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import {
  saveWord as apiSaveWord,
  translateWord as apiTranslateWord,
  type TranslateWordResponse,
} from '@/src/api/learning.api';

type Props = {
  visible: boolean;
  word: string | null;
  contextSentence?: string | null;
  podcastId?: string | null;
  onClose: () => void;
};

// Transcript içinde bir kelimeye long-press ile açılan çeviri modalı.
// İlk açılışta /api/learning/translate-word çağırır; "Kelime Defterime Ekle" butonu
// /api/learning/words'e POST atar. Çeviri sonrası sonuç kullanıcıya gösterilir.
export default function WordLookupModal({
  visible,
  word,
  contextSentence,
  podcastId,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslateWordResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !word) {
      setResult(null);
      setError(null);
      setSaved(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiTranslateWord({
          word,
          contextSentence: contextSentence ?? undefined,
          podcastId: podcastId ?? undefined,
        });
        if (!cancelled) setResult(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message ?? 'Could not fetch translation.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, word, contextSentence, podcastId]);

  const handleSave = async () => {
    if (!word || !result) return;
    try {
      setSaving(true);
      await apiSaveWord({
        word,
        contextSentence: contextSentence ?? undefined,
        translation: result.translation,
        podcastId: podcastId ?? undefined,
      });
      setSaved(true);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not save word.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.word}>{word}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color="#5A5F6A" />
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color="#0714B8" />
              <Text style={styles.loadingText}>Fetching translation…</Text>
            </View>
          )}

          {!!error && !loading && (
            <View style={styles.center}>
              <MaterialIcons name="error-outline" size={28} color="#E53935" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!!result && !loading && (
            <View>
              <Text style={styles.translation}>{result.translation}</Text>
              {!!result.partOfSpeech && (
                <Text style={styles.pos}>{result.partOfSpeech.toUpperCase()}</Text>
              )}

              {!!contextSentence && (
                <View style={styles.contextBox}>
                  <Text style={styles.contextLabel}>Context</Text>
                  <Text style={styles.contextText} numberOfLines={3}>
                    “{contextSentence}”
                  </Text>
                </View>
              )}

              {(result.exampleEn || result.exampleTr) && (
                <View style={styles.exampleBox}>
                  {!!result.exampleEn && <Text style={styles.exampleEn}>{result.exampleEn}</Text>}
                  {!!result.exampleTr && <Text style={styles.exampleTr}>{result.exampleTr}</Text>}
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saved && styles.saveBtnDone]}
                onPress={handleSave}
                disabled={saved || saving}
                activeOpacity={0.85}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons
                      name={saved ? 'check' : 'bookmark-add'}
                      size={18}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.saveBtnText}>
                      {saved ? 'Saved to notebook' : 'Save to notebook'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,10,28,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  word: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111318',
    textTransform: 'lowercase',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#5A5F6A',
    fontSize: 13,
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    textAlign: 'center',
  },
  translation: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0714B8',
    marginBottom: 4,
  },
  pos: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#8A8F9A',
    marginBottom: 14,
  },
  contextBox: {
    backgroundColor: '#F4F6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  contextLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#0714B8',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 13,
    color: '#3D4048',
    lineHeight: 19,
  },
  exampleBox: {
    backgroundColor: '#F7F9FB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  exampleEn: {
    fontSize: 13,
    color: '#111318',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  exampleTr: {
    fontSize: 13,
    color: '#5A5F6A',
  },
  saveBtn: {
    height: 48,
    borderRadius: 13,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveBtnDone: {
    backgroundColor: '#10B981',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
