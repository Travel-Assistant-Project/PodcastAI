




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
import { register } from '@/src/api/auth.api';
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
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message as string | undefined;
      const statusCode = error?.response?.status as number | undefined;

      const message =
        backendMessage ??
        (statusCode
          ? `Could not create account (HTTP ${statusCode}).`
          : 'Could not create account. Check your network connection.');

      setErrorMessage(message);
      Alert.alert('Registration error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>✦</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>

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
            textContentType="oneTimeCode"
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
            textContentType="oneTimeCode"
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
          <Text style={styles.signUpButtonText}>{isSubmitting ? 'Signing Up...' : 'Sign Up →'}</Text>
        </TouchableOpacity>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

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

      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },

  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 40,
  },

  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },

  logoIcon: {
    color: '#002E83',
    fontSize: 25,
    fontWeight: '900',
  },

  title: {
    fontSize: 38,
    fontWeight: '700',
    color: '#111318',
    textAlign: 'center',
    marginBottom: 40,
  },

  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#686D77',
    marginBottom: 10,
    marginLeft: 4,
  },

  inputWrapper: {
    height: 56,
    backgroundColor: '#F2F3F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  inputIcon: {
    width: 24,
    fontSize: 18,
    color: '#747A84',
    marginRight: 8,
    textAlign: 'center',
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#111318',
    paddingRight: 40,
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
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 12},
    elevation: 8,
    marginTop: 20,
    marginBottom: 40,
  },

  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    marginTop: -24,
    marginBottom: 22,
    textAlign: 'center',
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },

  termsText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    color: '#626778',
    marginBottom: 28,
  },

  linkText: {
    color: '#002E83',
    fontWeight: '700',
  },

  memberDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E9EAED',
    alignSelf: 'center',
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  returnButtonText: {
    color: '#5D6578',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});