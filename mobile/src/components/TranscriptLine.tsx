import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import type { TranscriptSegment } from '@/src/api/podcasts.api';

type Props = {
  segment: TranscriptSegment;
  active: boolean;
  showTr: boolean;
  onToggleTr: () => void;
  onWordLongPress: (word: string, contextSentence: string) => void;
};

// 00:42 gibi bir mm:ss üretir.
function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Cümleyi kelimelere ve aralarındaki noktalama/whitespace'e böler. Kelime parçaları
// long-press dinleyicisine sahip Pressable'lara gömülür; geri kalanlar düz Text kalır.
function tokenize(text: string): { value: string; isWord: boolean }[] {
  const out: { value: string; isWord: boolean }[] = [];
  // Apostroflu kelimeleri ("don't") tek parça yakalamak için \w'\u00C0-\u017F genişletildi.
  const regex = /([A-Za-z\u00C0-\u017F][A-Za-z\u00C0-\u017F'’\-]*)|([^A-Za-z\u00C0-\u017F]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) out.push({ value: match[1], isWord: true });
    else if (match[2]) out.push({ value: match[2], isWord: false });
  }
  return out;
}

export default function TranscriptLine({
  segment,
  active,
  showTr,
  onToggleTr,
  onWordLongPress,
}: Props) {
  const tokens = useMemo(() => tokenize(segment.text), [segment.text]);
  const hasTr = !!segment.textTr;

  return (
    <View style={[styles.block, active && styles.blockActive]}>
      <View style={styles.headerRow}>
        <Text style={styles.time}>{formatMs(segment.startMs)}</Text>
        <Text style={styles.speaker}>{segment.speaker}</Text>
        {hasTr && (
          <Pressable onPress={onToggleTr} style={[styles.trToggle, showTr && styles.trToggleActive]}>
            <MaterialIcons
              name="translate"
              size={12}
              color={showTr ? '#FFFFFF' : '#0714B8'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.trToggleText, showTr && styles.trToggleTextActive]}>TR</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.text, active && styles.textActive]}>
        {tokens.map((tok, idx) =>
          tok.isWord ? (
            <Text
              key={idx}
              suppressHighlighting
              onLongPress={() => onWordLongPress(tok.value.toLowerCase(), segment.text)}>
              {tok.value}
            </Text>
          ) : (
            <Text key={idx}>{tok.value}</Text>
          ),
        )}
      </Text>

      {showTr && hasTr && <Text style={styles.textTr}>{segment.textTr}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  blockActive: {
    backgroundColor: '#EEF1FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0714B8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 0.5,
  },
  speaker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111318',
    letterSpacing: 0.5,
    flex: 1,
  },
  trToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#EEF1FF',
    borderWidth: 1,
    borderColor: '#C7CFFF',
  },
  trToggleActive: {
    backgroundColor: '#0714B8',
    borderColor: '#0714B8',
  },
  trToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 0.8,
  },
  trToggleTextActive: {
    color: '#FFFFFF',
  },
  text: {
    fontSize: 14,
    color: '#3D4048',
    lineHeight: 21,
  },
  textActive: {
    color: '#111318',
  },
  textTr: {
    marginTop: 6,
    fontSize: 13,
    color: '#0714B8',
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
