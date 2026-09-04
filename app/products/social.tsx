import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { MetricCard } from '../../src/components/MetricCard';
import { colors } from '../../src/theme/colors';

const SUPPORTED_PLATFORMS = [
  { name: 'Instagram', desc: 'Reels, Stories & Posts', icon: '📸', color: '#E1306C', connected: true },
  { name: 'YouTube', desc: 'Shorts & Long Videos', icon: '▶️', color: '#EF4444', connected: true },
  { name: 'X / Twitter', desc: 'Threads & Media Tweets', icon: '🐦', color: '#111816', connected: true },
  { name: 'LinkedIn', desc: 'Articles & Company Updates', icon: '💼', color: '#0A66C2', connected: false },
  { name: 'Facebook', desc: 'Pages & Group Posts', icon: '👤', color: '#1877F2', connected: true },
  { name: 'Bluesky', desc: 'Decentralized Social Feed', icon: '🦋', color: '#0284C7', connected: false },
];

export default function SocialProductScreen() {
  const [activeTab, setActiveTab] = useState<'platforms' | 'composer' | 'queue'>('platforms');
  const [postCaption, setPostCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'Instagram',
    'X / Twitter',
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  const togglePlatform = (name: string) => {
    if (selectedPlatforms.includes(name)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== name));
    } else {
      setSelectedPlatforms([...selectedPlatforms, name]);
    }
  };

  const handlePublish = () => {
    if (!postCaption.trim()) {
      Alert.alert('Validation Error', 'Please type a caption for your post.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one social destination.');
      return;
    }

    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      Alert.alert('Published!', `Cross-posted successfully to ${selectedPlatforms.join(', ')}.`);
      setPostCaption('');
    }, 900);
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="GAP Social Pilot" subtitle="Omnichannel Content Publisher" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: '#4A044E' }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(225, 48, 108, 0.25)' }]}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Social Content Hub</Text>
              <Text style={styles.heroSub}>Cross-publish across 6 major networks</Text>
            </View>
            <StatusBadge status="ACTIVE" size="sm" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Connected</Text>
              <Text style={styles.heroStatValue}>4 Networks</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Scheduled</Text>
              <Text style={styles.heroStatValue}>12 Posts</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Total Reach</Text>
              <Text style={[styles.heroStatValue, { color: '#F43F5E' }]}>84.6k</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'platforms' && styles.tabBtnActive]}
            onPress={() => setActiveTab('platforms')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'platforms' && styles.tabBtnTextActive]}>
              Networks
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'composer' && styles.tabBtnActive]}
            onPress={() => setActiveTab('composer')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'composer' && styles.tabBtnTextActive]}>
              Quick Post
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'queue' && styles.tabBtnActive]}
            onPress={() => setActiveTab('queue')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'queue' && styles.tabBtnTextActive]}>
              Schedule
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: CONNECTED PLATFORMS */}
        {activeTab === 'platforms' && (
          <View>
            <Text style={styles.sectionTitle}>Supported Social Channels</Text>
            <View style={styles.platformsGrid}>
              {SUPPORTED_PLATFORMS.map((item) => (
                <View key={item.name} style={styles.platformCard}>
                  <View style={[styles.platformIcon, { backgroundColor: item.color + '15' }]}>
                    <Text style={styles.platformEmoji}>{item.icon}</Text>
                  </View>
                  <Text style={styles.platformName}>{item.name}</Text>
                  <Text style={styles.platformDesc}>{item.desc}</Text>
                  <View
                    style={[
                      styles.connBadge,
                      { backgroundColor: item.connected ? 'rgba(22, 184, 130, 0.12)' : colors.muted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.connText,
                        { color: item.connected ? '#16B882' : colors.mutedForeground },
                      ]}
                    >
                      {item.connected ? 'Connected' : 'Connect +'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: COMPOSER */}
        {activeTab === 'composer' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cross-Platform Publisher</Text>
            <Text style={styles.cardSubtitle}>
              Compose once and publish simultaneously across selected channels.
            </Text>

            <Text style={styles.inputLabel}>Select Target Destinations</Text>
            <View style={styles.chipsRow}>
              {SUPPORTED_PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.name);
                return (
                  <Pressable
                    key={p.name}
                    style={[styles.platformChip, isSelected && styles.platformChipActive]}
                    onPress={() => togglePlatform(p.name)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {p.icon} {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Post Caption / Copy</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="What's happening? Add your content, hashtags, and links..."
              placeholderTextColor={colors.mutedForeground}
              value={postCaption}
              onChangeText={setPostCaption}
              multiline
            />

            <Pressable
              style={[styles.publishBtn, isPublishing && { opacity: 0.7 }]}
              onPress={handlePublish}
              disabled={isPublishing}
            >
              <Text style={styles.publishBtnText}>
                {isPublishing ? 'Publishing...' : 'Publish to Channels 🚀'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* TAB 3: QUEUE */}
        {activeTab === 'queue' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Scheduled Publishing Queue</Text>
            <Text style={styles.cardSubtitle}>Upcoming timed posts across channels.</Text>

            {[
              { time: 'Today, 6:00 PM', target: 'Instagram, X', caption: 'Announcing our new AI Voice agent capabilities...' },
              { time: 'Tomorrow, 9:00 AM', target: 'LinkedIn, Facebook', caption: 'How WhatsApp automation boosts lead conversion by 4x.' },
            ].map((q, idx) => (
              <View key={idx} style={styles.queueItem}>
                <Text style={styles.queueTime}>⏰ {q.time}</Text>
                <Text style={styles.queueTarget}>{q.target}</Text>
                <Text style={styles.queueCaption} numberOfLines={2}>{q.caption}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 14,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  tabBtnTextActive: {
    color: colors.primaryForeground,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 12,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformEmoji: {
    fontSize: 22,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
  },
  platformDesc: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 15,
  },
  connBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  connText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    lineHeight: 17,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  platformChip: {
    backgroundColor: colors.muted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  chipTextActive: {
    color: colors.primaryForeground,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 14,
  },
  publishBtn: {
    backgroundColor: colors.products.social,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  queueItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  queueTime: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  queueTarget: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
    marginTop: 2,
  },
  queueCaption: {
    fontSize: 13,
    color: colors.foreground,
    marginTop: 4,
    lineHeight: 18,
  },
});
