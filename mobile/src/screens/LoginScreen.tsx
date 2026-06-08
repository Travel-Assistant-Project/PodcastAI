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
        <View style={styles.inner}>
          <View style={styles.mainBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="sparkles" size={28} color="#002E83" />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to your library.</Text>

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
            <View style={styles.signUpRow}>
              <Text style={styles.noAccount}>No account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signUpLink}>Create one</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backRow} onPress={() => router.replace('/')}>
              <Text style={styles.backText}>← Back to Welcome</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>© PODCAST-AI</Text>
          </View>
        </View>
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
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  mainBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  footerBlock: {
    paddingTop: 8,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111318',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#626778',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
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
    minHeight: 52,
    backgroundColor: '#F2F3F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111318',
    paddingVertical: 14,
  },
  signInButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginTop: 4,
    marginBottom: 12,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  errorText: {
    marginBottom: 14,
    textAlign: 'center',
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  noAccount: {
    fontSize: 15,
    color: '#30333B',
  },
  signUpLink: {
    fontSize: 15,
    color: '#002E83',
    fontWeight: '700',
  },
  backRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#8A8F99',
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    color: '#9EA3AE',
    fontSize: 11,
    letterSpacing: 2,
  },
});
