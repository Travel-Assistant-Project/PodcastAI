import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Background gradient blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Logo */}
      <View style={styles.logoRow}>
        <Text style={styles.logoIcon}>✦</Text>
        <Text style={styles.logoText}>PodcastAI</Text>
      </View>

      {/* Illustration area */}
      <View style={styles.illustrationContainer}>
        <View style={styles.cardStack}>
          <View style={[styles.podcastCard, styles.cardBack]} />
          <View style={[styles.podcastCard, styles.cardMid]} />
          <View style={styles.podcastCard}>
            <View style={styles.waveRow}>
              {[18, 28, 38, 52, 44, 60, 44, 52, 38, 28, 18].map((h, i) => (
                <View key={`wave-${i}-${h}`} style={[styles.waveBar, { height: h }]} />
              ))}
            </View>
            <Text style={styles.cardLabel}>Daily Digest</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBubble, styles.statBubbleAccent, styles.statBubbleHalf]}>
            <Text style={[styles.statValue, { color: '#fff' }]}>AI</Text>
            <Text style={[styles.statLabel, { color: '#c7d0ff' }]}>Powered</Text>
          </View>
          <View style={[styles.statBubble, styles.statBubbleHalf]}>
            <Text style={styles.statValue}>∞</Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
        </View>
      </View>

      {/* Headline */}
      <View style={styles.headlineContainer}>
        <Text style={styles.headline}>Your personal{'\n'}podcast universe</Text>
        <Text style={styles.subheadline}>
          AI-curated shows tailored to your{'\n'}interests. Listen, learn, explore.
        </Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.signInButton}
          activeOpacity={0.85}
          onPress={() => router.push('/login')}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpButton}
          activeOpacity={0.85}
          onPress={() => router.push('/register')}>
          <Text style={styles.signUpText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>©️ PODCAST-AI</Text>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FB',
    paddingHorizontal: 28,
  },

  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#002E83',
    opacity: 0.06,
  },

  blobBottomLeft: {
    position: 'absolute',
    bottom: 60,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#0714B8',
    opacity: 0.07,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  logoIcon: {
    fontSize: 26,
    color: '#002E83',
    marginRight: 7,
    fontWeight: '900',
  },

  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#002E83',
  },

  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },

  cardStack: {
    width: width - 80,
    height: 148,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 18,
  },

  podcastCard: {
    position: 'absolute',
    width: width - 80,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    justifyContent: 'center',
    shadowColor: '#002E83',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },

  cardBack: {
    bottom: 0,
    transform: [{ rotate: '-4deg' }, { scale: 0.94 }],
    backgroundColor: '#E8EEFF',
    shadowOpacity: 0.05,
  },

  cardMid: {
    bottom: 6,
    transform: [{ rotate: '2deg' }, { scale: 0.97 }],
    backgroundColor: '#F0F3FF',
    shadowOpacity: 0.07,
  },

  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },

  waveBar: {
    width: 4,
    borderRadius: 3,
    backgroundColor: '#0714B8',
    opacity: 0.75,
  },

  cardLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111318',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: width - 80,
    justifyContent: 'center',
  },

  statBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  statBubbleAccent: {
    backgroundColor: '#0714B8',
  },

  statBubbleHalf: {
    flex: 1,
    maxWidth: (width - 80 - 12) / 2,
  },

  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111318',
  },

  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7D828C',
    marginTop: 3,
    letterSpacing: 0.5,
  },

  headlineContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 120,
  },

  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111318',
    lineHeight: 40,
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  subheadline: {
    fontSize: 15,
    color: '#5A5F6A',
    lineHeight: 22,
  },

  buttonsContainer: {
    gap: 12,
    marginBottom: 12,
  },

  signInButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  signUpButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D6DAE6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  signUpText: {
    color: '#111318',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  footer: {
    textAlign: 'center',
    color: '#9EA3AE',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 4,
  },
});
