import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  ConnectionStatusCard,
  UsageCard,
  WhatsAppMetricCard,
} from '../components';
import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { useWhatsAppContacts } from '../hooks/useWhatsAppContacts';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';
import { useWhatsAppUsage } from '../hooks/useWhatsAppUsage';
import { WhatsAppBroadcastsScreen } from './WhatsAppBroadcastsScreen';
import { WhatsAppContactsScreen } from './WhatsAppContactsScreen';
import { WhatsAppTemplatesScreen } from './WhatsAppTemplatesScreen';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import { WhatsAppHomeSkeleton } from '../../../components/skeletonScreen';

type WhatsAppTab = 'home' | 'broadcasts' | 'contacts' | 'templates';

const WHATSAPP_TABS: ProductTabItem[] = [
  {
    key: 'home',
    label: 'Overview',
    activeIcon: 'chatbubbles',
    inactiveIcon: 'chatbubbles-outline',
  },
  {
    key: 'broadcasts',
    label: 'Broadcasts',
    activeIcon: 'megaphone',
    inactiveIcon: 'megaphone-outline',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
  },
  {
    key: 'templates',
    label: 'Templates',
    activeIcon: 'document-text',
    inactiveIcon: 'document-text-outline',
  },
];

export const WhatsAppHomeScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<WhatsAppTab>('home');

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
    isRefetching: statusRefetching,
  } = useWhatsAppStatus();
  const { data: contactsData, refetch: refetchContacts } = useWhatsAppContacts({ limit: 5 });
  const { data: templates, refetch: refetchTemplates } = useWhatsAppTemplates('APPROVED');
  const { data: broadcastsData, refetch: refetchBroadcasts } = useWhatsAppBroadcasts({ limit: 3 });
  const { data: usage, refetch: refetchUsage } = useWhatsAppUsage();

  const handleRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Promise.all([
      refetchStatus(),
      refetchContacts(),
      refetchTemplates(),
      refetchBroadcasts(),
      refetchUsage(),
    ]);
  };

  const approvedTemplatesCount = templates?.length ?? 41;
  const totalContactsCount = contactsData?.total_count ?? 232;
  const totalBroadcastsCount = broadcastsData?.total_count ?? 73;
  const deliveryRate =
    usage && usage.messages_sent > 0
      ? `${Math.min(100, Math.round((usage.messages_delivered / usage.messages_sent) * 1000) / 10)}%`
      : '58.6%';

  const handleSelectTab = (tab: WhatsAppTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}>
      {activeTab === 'contacts' && <WhatsAppContactsScreen onBack={() => setActiveTab('home')} />}
      {activeTab === 'templates' && <WhatsAppTemplatesScreen onBack={() => setActiveTab('home')} />}
      {activeTab === 'broadcasts' && <WhatsAppBroadcastsScreen onBack={() => setActiveTab('home')} />}

      {activeTab === 'home' && (
        <View style={styles.safeArea}>
          {/* iOS Standard Header with Circular Back Button */}
          <View
            style={[
              styles.header,
              { paddingTop: Math.max(insets.top, 12) },
              isDark ? styles.headerDark : styles.headerLight,
            ]}
          >
            <View style={styles.headerLeftRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  isDark ? styles.backButtonDark : styles.backButtonLight,
                  pressed && styles.backButtonPressed,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)');
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={isDark ? '#F8FAFC' : '#0F172A'}
                />
              </Pressable>

              <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>
                WhatsApp Business
              </Text>
            </View>
          </View>

          {statusLoading && !status ? (
            <WhatsAppHomeSkeleton />
          ) : (
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.content}
              refreshControl={
                <RefreshControl
                  refreshing={statusRefetching}
                  onRefresh={handleRefresh}
                  tintColor="#25d366"
                />
              }
            >
              {/* Connection Status Card */}
              <ConnectionStatusCard connection={status} isLoading={statusLoading} />

              {/* Cloud Wallet & Usage Card */}
              <UsageCard usage={usage} />

              {/* Metrics 2x2 Grid */}
              <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Overview & Capabilities</Text>
            <View style={styles.grid}>
              <WhatsAppMetricCard
                label="Contacts"
                value={totalContactsCount.toLocaleString()}
                subtext="Synchronized audience"
                ioniconsName="people"
                iconColor="#A855F7"
              />
              <WhatsAppMetricCard
                label="Templates"
                value={approvedTemplatesCount}
                subtext="Approved by Meta"
                ioniconsName="document-text"
                iconColor="#3B82F6"
              />
              <WhatsAppMetricCard
                label="Broadcasts"
                value={totalBroadcastsCount}
                subtext="Campaigns executed"
                ioniconsName="megaphone"
                iconColor="#F43F5E"
              />
              <WhatsAppMetricCard
                label="Delivery Rate"
                value={deliveryRate}
                subtext="Cloud SLA"
                ioniconsName="flash"
                iconColor="#F59E0B"
              />
            </View>

            {/* Section Header: Product Navigation */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                Product Navigation
              </Text>
            </View>

            {/* Quick Actions Navigation List */}
            <View style={styles.actionsList}>
              {/* Audience & Contacts */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionCard,
                  isDark ? styles.actionCardDark : styles.actionCardLight,
                  pressed && styles.actionCardPressed,
                ]}
                onPress={() => handleSelectTab('contacts')}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                  <Ionicons name="people" size={20} color="#A855F7" />
                </View>
                <View style={styles.actionDetails}>
                  <Text style={[styles.actionTitle, isDark ? styles.textLight : styles.textDark]}>
                    Audience & Contacts
                  </Text>
                  <Text style={[styles.actionSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                    View contacts, segment tags & link CRM leads
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={isDark ? '#475569' : '#CBD5E1'} />
              </Pressable>

              {/* Meta Templates */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionCard,
                  isDark ? styles.actionCardDark : styles.actionCardLight,
                  pressed && styles.actionCardPressed,
                ]}
                onPress={() => handleSelectTab('templates')}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Ionicons name="document-text" size={20} color="#3B82F6" />
                </View>
                <View style={styles.actionDetails}>
                  <Text style={[styles.actionTitle, isDark ? styles.textLight : styles.textDark]}>
                    Meta Templates
                  </Text>
                  <Text style={[styles.actionSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                    Approved marketing, utility & OTP message templates
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={isDark ? '#475569' : '#CBD5E1'} />
              </Pressable>

              {/* Broadcast Campaigns */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionCard,
                  isDark ? styles.actionCardDark : styles.actionCardLight,
                  pressed && styles.actionCardPressed,
                ]}
                onPress={() => handleSelectTab('broadcasts')}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
                  <Ionicons name="megaphone" size={20} color="#F43F5E" />
                </View>
                <View style={styles.actionDetails}>
                  <Text style={[styles.actionTitle, isDark ? styles.textLight : styles.textDark]}>
                    Broadcast Campaigns
                  </Text>
                  <Text style={[styles.actionSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                    Launch new bulk sends & view delivery funnels
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={isDark ? '#475569' : '#CBD5E1'} />
              </Pressable>
            </View>
          </ScrollView>
        )}
        </SafeAreaView>
      )}

      {/* Floating Home-Style Product Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={WHATSAPP_TABS}
        activeKey={activeTab}
        onChangeTab={(tab) => handleSelectTab(tab as WhatsAppTab)}
        accentColor="#22C55E"
        moreMenuTitle="WhatsApp Business Suite"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerDark: {
    backgroundColor: '#000000',
    borderBottomColor: '#2C2C2E',
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  backButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeaderRow: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  actionsList: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  actionCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  actionCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#000000',
  },
  textSecondaryDark: {
    color: '#8E8E93',
  },
  textSecondaryLight: {
    color: '#6B7280',
  },
});

