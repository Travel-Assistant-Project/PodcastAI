import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/styles/colors';

type CheckBoxProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

export default function CheckBox({ label, checked, onToggle }: CheckBoxProps) {
  return (
    <Pressable style={styles.row} onPress={onToggle}>
      <View style={[styles.box, checked && styles.boxChecked]}>{checked ? <Text style={styles.tick}>✓</Text> : null}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 6,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  boxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tick: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 12,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
  },
});
