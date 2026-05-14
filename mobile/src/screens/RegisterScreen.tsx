
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
import { register } from '@/src/api/auth.api';
import { getApiErrorMessage } from '@/src/api/errorMessage';
import { setAuthToken } from '@/src/api/client';
import { setUser } from '@/src/store/authStore';

const RegisterScreen = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Full name, email, and password are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords must match.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setAuthToken(response.token);
      setUser(response);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        'Could not create account. Please try again.',
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
          <View style={styles.headerBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="sparkles" size={26} color="#002E83" />
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join to get podcasts tailored to you.</Text>
          </View>

          <View style={styles.formBlock}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Alexander Hamilton"
                  placeholderTextColor="#B6BAC2"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="alexander@archive.ai"
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
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '🙈' : '👁'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#AEB3BC"
                  secureTextEntry={!showConfirmPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }>
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '🙈' : '👁'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleRegister}
                disabled={isSubmitting}>
                <Text style={styles.signUpButtonText}>
                  {isSubmitting ? 'Signing Up...' : 'Sign Up →'}
                </Text>
              </TouchableOpacity>
              {errorMessage ? (
                <Text style={styles.errorText} numberOfLines={3}>
                  {errorMessage}
                </Text>
              ) : null}
            </View>

            <View style={styles.spacer} />

            <View style={styles.footerBlock}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.linkText}>Terms and Conditions</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy.</Text>
              </Text>

              <View style={styles.memberDividerRow}>
                <View style={styles.memberDivider} />
                <Text style={styles.memberText}>ALREADY A MEMBER?</Text>
                <View style={styles.memberDivider} />
              </View>

              <TouchableOpacity
                style={styles.returnButton}
                onPress={() => router.replace('/login')}>
                <Text style={styles.returnButtonText}>RETURN TO LOGIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backRow}
                onPress={() => router.replace('/')}>
                <Text style={styles.backText}>← Back to Welcome</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

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
    paddingTop: 6,
    paddingBottom: 8,
  },

  headerBlock: {
    alignItems: 'center',
  },

  formBlock: {
    flexGrow: 0,
  },

  spacer: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 4,
  },

  footerBlock: {
    flexGrow: 0,
    paddingTop: 4,
  },

  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    marginBottom: 4,
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#626778',
    textAlign: 'center',
    marginBottom: 14,
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
    marginBottom: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#111318',
    paddingRight: 40,
    paddingVertical: 12,
  },

  eyeButton: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },

  eyeIcon: {
    fontSize: 18,
  },

  signUpButton: {
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
    marginTop: 4,
    marginBottom: 6,
  },

  signUpButtonText: {
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

  termsText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: '#626778',
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  linkText: {
    color: '#002E83',
    fontWeight: '700',
  },

  memberDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    marginTop: 8,
    alignItems: 'center',
  },

  backText: {
    fontSize: 14,
    color: '#8A8F99',
    fontWeight: '600',
  },
});