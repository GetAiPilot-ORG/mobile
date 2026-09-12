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

interface AutoApproveModalProps {
  visible: boolean;
  onClose: () => void;
  onToggle?: (enabled: boolean) => Promise<void>;
}

export const AutoApproveModal: React.FC<AutoApproveModalProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: status, isLoading } = useQuery({
    queryKey: ['telegram_auto_approve_status'],
    queryFn: telegramApi.getAutoApproveStatus,
    enabled: visible,
  });

  const handleOpenBot = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = status?.botUrl || 'https://t.me/Gapautoapprovebot?start=true';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/Gapautoapprovebot?start=true');
      }
    } catch {
      await Linking.openURL('https://t.me/Gapautoapprovebot?start=true');
    }
  };

  const capabilities = [
    {
      icon: 'shield-checkmark-outline',
      title: 'Instant Join Approval',
      desc: 'Automatically approve pending join requests in private channels 24/7 without manual delay.',
      color: '#0284C7',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Automated Welcome DM',
      desc: 'Send personalized onboarding messages, trading guidelines, or VIP links to users upon approval.',
      color: '#10B981',
    },
    {
      icon: 'people-outline',
      title: 'High-Volume Channel Support',
      desc: 'Effortlessly processes thousands of incoming join requests simultaneously with zero bottleneck.',
      color: '#8B5CF6',
    },
    {
      icon: 'lock-closed-outline',
      title: 'Anti-Spam Filtering',
      desc: 'Safeguard your VIP communities against bots, duplicate accounts, and spam raids.',
      color: '#F59E0B',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="checkmark-done-circle" size={18} color="#0284C7" />
            </View>
            <View>
              <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Auto Approve</Text>
              <Text style={styles.subtitle}>Join Request & Member Verification Automation</Text>
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
                Syncing with GAP Auto Approve engine...
              </Text>
            </View>
          ) : (
            <>
              {/* 🌟 Central Hero Card (1:1 Match with Web Screenshot) */}
              <View style={[styles.heroCard, isDark ? styles.heroCardDark : styles.heroCardLight]}>
                {/* Logo Badge (Black rounded-square with shield & checkmark) */}
                <View style={styles.logoBadgeContainer}>
                  <View style={styles.logoSquare}>
                    <View style={styles.logoShieldCircle}>
                      <Ionicons name="shield-checkmark" size={26} color="#10B981" />
                    </View>
                    <Text style={styles.logoBrandText}>GAP</Text>
                    <Text style={styles.logoSubText}>Auto Approve</Text>
                  </View>
                </View>

                {/* Eyebrow */}
                <View style={styles.eyebrowBadge}>
                  <Ionicons name="flash" size={11} color="#0284C7" />
                  <Text style={styles.eyebrowText}>JOIN REQUEST AUTOMATION</Text>
                </View>

                {/* Main Heading */}
                <Text style={[styles.heroTitle, isDark ? styles.textDark : styles.textLight]}>
                  GAP Auto Approve
                </Text>

                {/* Subtitle */}
                <Text style={[styles.heroSubtitle, isDark ? styles.textDark : styles.textLight]}>
                  Automatically approve and manage private channel requests.
                </Text>

                {/* Description */}
                <Text style={styles.heroDesc}>
                  Add the bot to your channel as an administrator and let it handle join requests instantly, without manual admin work.
                </Text>

                {/* Connected Telegram ID Pill */}
                <View style={[styles.idCard, isDark ? styles.idCardDark : styles.idCardLight]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#0284C7" />
                  <Text style={[styles.idLabel, isDark ? styles.textDark : styles.textLight]}>
                    Connected Telegram ID:{' '}
                    <Text style={styles.idValue}>
                      {status?.telegramUserId ? status.telegramUserId : '1032153257'}
                    </Text>
                  </Text>
                  <View style={styles.activeDot} />
                </View>

                {/* Action CTA Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.openBotBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleOpenBot}
                >
                  <Ionicons name="logo-android" size={20} color="#FFFFFF" />
                  <Text style={styles.openBotBtnText}>CONNECT TO TELEGRAM BOT</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>

                {/* Redirect Footer */}
                <View style={styles.redirectHintRow}>
                  <Ionicons name="arrow-redo-outline" size={12} color="#64748B" />
                  <Text style={styles.redirectHintText}>Redirects securely to Telegram app</Text>
                </View>
              </View>

              {/* Automation Capabilities Grid */}
              <Text style={[styles.sectionHeading, isDark ? styles.textDark : styles.textLight]}>
                Key Capabilities
              </Text>

              <View style={styles.featuresList}>
                {capabilities.map((item, idx) => (
                  <View
                    key={`aa_feat_${idx}`}
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

              {/* Step-by-Step Setup Guide */}
              <View style={[styles.infoBox, isDark ? styles.infoBoxDark : styles.infoBoxLight]}>
                <View style={styles.infoBoxHeader}>
                  <Ionicons name="information-circle" size={16} color="#0284C7" />
                  <Text style={[styles.infoBoxTitle, isDark ? styles.textDark : styles.textLight]}>
                    Quick 3-Step Setup:
                  </Text>
                </View>
                <Text style={styles.infoStepText}>1. Tap <Text style={{ fontWeight: '700', color: '#0284C7' }}>Connect to Telegram Bot</Text> above to open @Gapautoapprovebot.</Text>
                <Text style={styles.infoStepText}>2. Add <Text style={{ fontWeight: '700' }}>@Gapautoapprovebot</Text> as an Administrator to your private channel.</Text>
                <Text style={styles.infoStepText}>3. Enable <Text style={{ fontWeight: '700' }}>"Invite Users via Link"</Text> & <Text style={{ fontWeight: '700' }}>"Manage Join Requests"</Text> admin rights.</Text>
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
    borderRadius: 20,
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
  logoBadgeContainer: {
    marginBottom: 16,
  },
  logoSquare: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoShieldCircle: {
    marginBottom: 2,
  },
  logoBrandText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoSubText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    marginBottom: 12,
  },
  eyebrowText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDesc: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // ID Card
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
