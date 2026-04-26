import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/src/styles/colors';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
};

export default function Button({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});
