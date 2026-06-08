import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '@/src/api/auth.api';
import { getApiErrorMessage } from '@/src/api/errorMessage';
import { setAuthToken } from '@/src/api/client';
import { useFavorites } from '@/src/context/FavoritesContext';
import { setUser } from '@/src/store/authStore';
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { refresh: refreshFavorites } = useFavorites();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setAuthToken(response.token);
      setUser(response);
      await refreshFavorites();
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        'Sign-in failed. Check your email and password.',
      );
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentBlock}>
            <View style={styles.headerBlock}>
              <View style={styles.logoCircle}>
                <Ionicons name="sparkles" size={26} color="#002E83" />
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue to your library.</Text>
            </View>

            <View style={styles.formBlock}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#B6BAC2"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#AEB3BC"
                  secureTextEntry
                  autoCorrect={false}
                  autoCapitalize="none"
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.signInButton}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={isSubmitting}>
                <Text style={styles.signInText}>
                  {isSubmitting ? 'Signing In...' : 'Sign In →'}
                </Text>
              </TouchableOpacity>
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>

            <View style={styles.footerBlock}>
              <View style={styles.memberDividerRow}>
                <View style={styles.memberDivider} />
                <Text style={styles.memberText}>NO ACCOUNT?</Text>
                <View style={styles.memberDivider} />
              </View>

              <TouchableOpacity
                style={styles.returnButton}
                onPress={() => router.replace('/register')}>
                <Text style={styles.returnButtonText}>CREATE ACCOUNT</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backRow} onPress={() => router.replace('/')}>
                <Text style={styles.backText}>← Back to Welcome</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  contentBlock: {
    width: '100%',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  formBlock: {},
  footerBlock: {
    marginTop: 24,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111318',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: '#626778',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#686D77',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    minHeight: 48,
    backgroundColor: '#F2F3F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111318',
    paddingVertical: 12,
  },
  signInButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginTop: 6,
    marginBottom: 0,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 4,
    marginBottom: 0,
    textAlign: 'center',
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  memberDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  memberDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E3E8',
  },
  memberText: {
    marginHorizontal: 14,
    fontSize: 11,
    letterSpacing: 2,
    color: '#8A8F99',
    fontWeight: '700',
  },
  returnButton: {
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E9EAED',
    alignSelf: 'center',
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnButtonText: {
    color: '#5D6578',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  backRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#8A8F99',
    fontWeight: '600',
  },
});
