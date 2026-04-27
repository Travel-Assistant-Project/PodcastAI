import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { Colors } from '@/src/styles/colors';

type InputProps = TextInputProps;

export default function Input(props: InputProps) {
  return <TextInput placeholderTextColor={Colors.textMuted} style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
  },
});
