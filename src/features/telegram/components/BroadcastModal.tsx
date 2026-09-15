import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { telegramApi } from '../api/telegramApi';

interface BroadcastModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
  isLoading?: boolean;
  chats?: any[];
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: status, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_broadcast_status'],
    queryFn: telegramApi.getBroadcastStatus,
    enabled: visible,
  });

  const handleOpenBot = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = status?.botUrl || 'https://t.me/GapGrowBot';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/GapGrowBot');
      }
    } catch {
      await Linking.openURL('https://t.me/GapGrowBot');
    }
  };

  const features = [
    {
      icon: 'paper-plane-outline',
      title: 'Targeted Outreach',
      desc: 'Reach all users who joined your channels through GAP bots and tracking links.',
      color: '#0284C7',
    },
    {
      icon: 'flash-outline',
      title: 'Instant Delivery',
      desc: 'Send announcements, trading signals, or daily updates to subscribers concurrently.',
      color: '#F59E0B',
    },
    {
      icon: 'link-outline',
      title: 'Interactive Buttons',
      desc: 'Attach custom inline buttons, deep links, and media attachments to your messages.',
      color: '#10B981',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Secure & Anti-Ban',
      desc: 'Rate-limited broadcast engine ensuring your bot and channels stay 100% compliant.',
      color: '#8B5CF6',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Top Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="megaphone" size={16} color="#0284C7" />
            </View>
            <View>
              <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Broadcast</Text>
              <Text style={styles.subtitle}>Send bulk messages to your audience instantly</Text>
            </View>
          </View>
          <Pressable
            style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={[styles.loadingText, isDark ? styles.textDark : styles.textLight]}>
                Syncing with GAP Broadcast engine...
              </Text>
            </View>
          ) : (
            <>
              {/* Central Broadcast Hero Card (Matches Web 1:1) */}
              <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
                {/* Eyebrow badge */}
                <View style={styles.eyebrowBadge}>
                  <Ionicons name="sparkles" size={12} color="#0284C7" />
                  <Text style={styles.eyebrowText}>TELEGRAM BROADCAST</Text>
                </View>

                {/* Bot Icon with Glow Ring */}
                <View style={styles.iconGlowWrapper}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="rocket" size={36} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={[styles.heroTitle, isDark ? styles.textDark : styles.textLight]}>
                  {status?.botName || 'GAPGrow Bot'}
                </Text>

                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{status?.botUsername || '@GapGrowBot'}</Text>
                </View>

                <Text style={styles.heroDesc}>
                  Reach all users who joined your channels through GAP bots. Perfect for announcements, signals, or daily updates.
                </Text>

                {/* Connected Telegram User ID Pill */}
                <View style={[styles.idCard, isDark ? styles.idCardDark : styles.idCardLight]}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#0284C7" />
                  <Text style={[styles.idLabel, isDark ? styles.textDark : styles.textLight]}>
                    Connected Telegram ID:{' '}
                    <Text style={styles.idValue}>
                      {status?.telegramUserId ? status.telegramUserId : '8891953778'}
                    </Text>
                  </Text>
                  <View style={styles.activeDot} />
                </View>

                {/* Big Vibrant CTA Action Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.openBotBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleOpenBot}
                >
                  <Ionicons name="logo-android" size={20} color="#FFFFFF" />
                  <Text style={styles.openBotBtnText}>OPEN GAP GROW BOT</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>

                <View style={styles.redirectHintRow}>
                  <Ionicons name="arrow-redo-outline" size={12} color="#64748B" />
                  <Text style={styles.redirectHintText}>Redirects securely to official Telegram app</Text>
                </View>
              </View>

              {/* Feature Highlights Grid */}
              <Text style={[styles.sectionHeading, isDark ? styles.textDark : styles.textLight]}>
                Broadcast Capabilities
              </Text>

              <View style={styles.featuresList}>
                {features.map((item, idx) => (
                  <View
                    key={`bc_feat_${idx}`}
                    style={[styles.featureCard, isDark ? styles.featureCardDark : styles.featureCardLight]}
                  >
                    <View style={[styles.featureIconCircle, { backgroundColor: `${item.color}15` }]}>
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={[styles.featureTitle, isDark ? styles.textDark : styles.textLight]}>
                        {item.title}
                      </Text>
                      <Text style={styles.featureDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Instructions Card */}
              <View style={[styles.infoBox, isDark ? styles.infoBoxDark : styles.infoBoxLight]}>
                <View style={styles.infoBoxHeader}>
                  <Ionicons name="information-circle" size={16} color="#0284C7" />
                  <Text style={[styles.infoBoxTitle, isDark ? styles.textDark : styles.textLight]}>
                    How to broadcast messages:
                  </Text>
                </View>
                <Text style={styles.infoStepText}>1. Tap <Text style={{ fontWeight: '700', color: '#0284C7' }}>Open GAP Grow Bot</Text> above to launch Telegram.</Text>
                <Text style={styles.infoStepText}>2. Use the interactive menu in <Text style={{ fontWeight: '700' }}>@GapGrowBot</Text> to craft your text, media, and buttons.</Text>
                <Text style={styles.infoStepText}>3. Select your target audience segment and send instantly.</Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#0B0F19' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  borderLight: { borderBottomColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#1E2430' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '700' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  subtitle: { color: '#64748B', fontSize: 11, marginTop: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#1E2430' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, fontWeight: '500' },

  // Hero Card
  heroCard: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  heroCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroCardDark: {
    backgroundColor: '#121722',
    borderColor: '#1E2430',
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    marginBottom: 16,
  },
  eyebrowText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  iconGlowWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    marginBottom: 12,
  },
  tagText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  heroDesc: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
  },

  // ID Pill Card
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 18,
  },
  idCardLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  idCardDark: {
    backgroundColor: '#161C28',
    borderColor: '#262C36',
  },
  idLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  idValue: {
    color: '#0284C7',
    fontWeight: '800',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginLeft: 4,
  },

  // CTA Button
  openBotBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  openBotBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  redirectHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  redirectHintText: {
    color: '#64748B',
    fontSize: 11,
  },

  // Features List
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  featureCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  featureCardDark: {
    backgroundColor: '#121722',
    borderColor: '#1E2430',
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },

  // Info Step Box
  infoBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoBoxLight: {
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  infoBoxDark: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoStepText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});
