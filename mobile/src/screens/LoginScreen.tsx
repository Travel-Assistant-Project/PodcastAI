



import {useRouter} from 'expo-router';
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { login } from '@/src/api/auth.api';
import { setAuthToken } from '@/src/api/client';
import { setUser } from '@/src/store/authStore';

const LoginScreen = () => {
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email ve sifre zorunludur.');
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
      router.replace('/(tabs)');
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message as string | undefined;
      const message = backendMessage ?? 'Giris basarisiz. Bilgilerini kontrol et.';
      setErrorMessage(message);
      Alert.alert('Giris Hatasi', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>✦</Text>
            <Text style={styles.logoText}>PodcastAI</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to access{'\n'}your archive.
          </Text>

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="sarah@gmail.com"
            placeholderTextColor="#B6BAC2"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordHeader}>
            <Text style={styles.label}>PASSWORD</Text>
            <TouchableOpacity>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#AEB3BC"
            secureTextEntry
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="oneTimeCode"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRemember(!remember)}
            activeOpacity={0.8}>
            <View style={[styles.checkbox, remember && styles.checkboxActive]}>
              {remember && <Text style={styles.check}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember this device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInButton}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isSubmitting}>
            <Text style={styles.signInText}>{isSubmitting ? 'Signing In...' : 'Sign In  →'}</Text>
          </TouchableOpacity>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signUpRow}>
            <Text style={styles.noAccount}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.signUpText}>Sign up for free</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backRow} onPress={() => router.replace('/')}>
            <Text style={styles.backText}>← Back to Welcome</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>©️ PODCAST-AI</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FB',
    paddingHorizontal: 30,
    paddingTop: 28,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 30,
    paddingTop: 42,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 18},
    elevation: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 62,
  },
  logoIcon: {
    fontSize: 29,
    color: '#002E83',
    marginRight: 8,
    fontWeight: '900',
  },
  logoText: {
    fontSize: 23,
    fontWeight: '600',
    color: '#002E83',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: '#111318',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 27,
    color: '#4A4E57',
    marginBottom: 42,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#3D4048',
    marginBottom: 12,
  },
  input: {
    height: 72,
    backgroundColor: '#F0F1F5',
    borderRadius: 13,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#111318',
    marginBottom: 32,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  forgot: {
    color: '#002E83',
    fontSize: 14,
    fontWeight: '800',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 34,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 5,
    borderWidth: 1.4,
    borderColor: '#CFD2D8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkboxActive: {
    backgroundColor: '#002E83',
    borderColor: '#002E83',
  },
  check: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rememberText: {
    fontSize: 16,
    color: '#4A4E57',
  },
  signInButton: {
    height: 72,
    borderRadius: 13,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 12},
    elevation: 8,
    marginBottom: 60,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    marginTop: -48,
    marginBottom: 28,
    textAlign: 'center',
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E3E8',
  },
  dividerText: {
    marginHorizontal: 18,
    fontSize: 12,
    letterSpacing: 2,
    color: '#7D828C',
    fontWeight: '700',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 55,
  },
  socialButton: {
    flex: 1,
    height: 62,
    borderRadius: 11,
    backgroundColor: '#F0F1F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#002E83',
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#000000',
  },
  socialText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15171D',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccount: {
    fontSize: 16,
    color: '#30333B',
  },
  signUpText: {
    fontSize: 16,
    color: '#002E83',
    fontWeight: '700',
  },
  footer: {
    marginTop: 80,
    textAlign: 'center',
    color: '#7C8089',
    fontSize: 13,
    letterSpacing: 4,
    lineHeight: 21,
  },
  backRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#8A8F99',
    fontWeight: '600',
  },
});