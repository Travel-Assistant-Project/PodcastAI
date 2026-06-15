import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import {
  registerExploreRedirectPrompt,
  type ExploreRedirectPromptOptions,
} from '@/src/utils/exploreRedirectPrompt';

export default function ExploreRedirectPrompt() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const close = useCallback(() => {
    setVisible(false);
    setOnConfirm(null);
  }, []);

  const open = useCallback((options: ExploreRedirectPromptOptions) => {
    setMessage(options.message.trim());
    setOnConfirm(() => options.onConfirm);
    setVisible(true);
  }, []);

  useEffect(() => {
    registerExploreRedirectPrompt(open);
    return () => registerExploreRedirectPrompt(null);
  }, [open]);

  const handleConfirm = () => {
    const confirm = onConfirm;
    close();
    confirm?.();
  };

  const displayMessage =
    message ||
    'We cannot perform this action right now. Please check out the content on the Explore page.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="explore" size={28} color="#0714B8" />
          </View>

          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{displayMessage}</Text>
          <Text style={styles.prompt}>Would you like to go to Explore and browse other podcasts?</Text>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={handleConfirm}>
            <MaterialIcons name="explore" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.primaryBtnText}>Go to Explore</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={close}>
            <Text style={styles.secondaryBtnText}>Stay here</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 19, 24, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111318',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5A5F6A',
    textAlign: 'center',
    marginBottom: 10,
  },
  prompt: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8A8F9A',
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0714B8',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  btnIcon: {
    marginRight: 8,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#5A5F6A',
    fontSize: 15,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.86,
  },
});
