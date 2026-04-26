import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const TRACK_WIDTH = width - 48;

export default function AudioPlayerScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress] = useState(0.34);
  const [speed, setSpeed] = useState(1.25);

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialIcons name="chevron-left" size={26} color="#111318" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>NOW PLAYING</Text>
          <Text style={styles.headerTitle}>PodcastAI</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <MaterialIcons name="ios-share" size={22} color="#111318" />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
          }}
          style={styles.artImage}
        />
        <View style={styles.aiBadge}>
          <MaterialIcons name="auto-awesome" size={11} color="#0714B8" />
          <Text style={styles.aiBadgeText}>AI ENHANCED</Text>
        </View>
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>Today's Top Tech News</Text>
        <Text style={styles.trackMeta}>Tech Briefing • Hosted by AI Curator</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: TRACK_WIDTH * progress }]} />
          <View style={[styles.progressThumb, { left: TRACK_WIDTH * progress - 6 }]} />
        </View>
        <View style={styles.progressTimes}>
          <Text style={styles.timeText}>12:45</Text>
          <Text style={styles.timeText}>-24:10</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.skipBtn}>
          <MaterialIcons name="replay-10" size={32} color="#111318" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => setIsPlaying(!isPlaying)}
          activeOpacity={0.85}>
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={34}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn}>
          <MaterialIcons name="forward-10" size={32} color="#111318" />
        </TouchableOpacity>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={cycleSpeed}>
          <Text style={styles.speedText}>{speed}x</Text>
          <Text style={styles.secondaryLabel}>SPEED</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <View style={styles.captionIcon}>
            <MaterialIcons name="closed-caption-off" size={22} color="#5A5F6A" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <MaterialIcons name="queue-music" size={22} color="#5A5F6A" />
          <Text style={styles.secondaryLabel}>QUEUE</Text>
        </TouchableOpacity>
      </View>

      {/* AI Insight Bar */}
      <View style={styles.insightBar}>
        <View style={styles.insightIcon}>
          <MaterialIcons name="psychology" size={18} color="#0714B8" />
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightLabel}>AI INSIGHT</Text>
          <Text style={styles.insightText} numberOfLines={1}>
            Summarizing Quantum Computing trends
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#C2C7D0" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    alignItems: 'center',
  },

  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1.5,
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002E83',
  },

  artContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
    position: 'relative',
  },

  artImage: {
    width: width - 80,
    height: width - 80,
    borderRadius: 24,
  },

  aiBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7CFFF',
  },

  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 1,
  },

  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },

  trackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111318',
    textAlign: 'center',
    marginBottom: 6,
  },

  trackMeta: {
    fontSize: 14,
    color: '#8A8F9A',
    fontWeight: '500',
  },

  progressSection: {
    marginBottom: 28,
  },

  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 10,
    position: 'relative',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#0714B8',
    borderRadius: 2,
  },

  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0714B8',
  },

  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: 12,
    color: '#8A8F9A',
    fontWeight: '500',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },

  skipBtn: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0714B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0714B8',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 28,
  },

  secondaryBtn: {
    alignItems: 'center',
    gap: 5,
    minWidth: 60,
  },

  speedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111318',
  },

  secondaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A8F9A',
    letterSpacing: 1.2,
  },

  captionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EBF2',
    gap: 12,
  },

  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightContent: {
    flex: 1,
  },

  insightLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0714B8',
    letterSpacing: 1.3,
    marginBottom: 2,
  },

  insightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111318',
  },
});
