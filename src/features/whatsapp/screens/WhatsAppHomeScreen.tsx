import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Modal,
  BackHandler,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import { WhatsAppHomeSkeleton } from '../../../components/skeletonScreen';
import {
  ConnectionStatusCard,
  UsageCard,
  WhatsAppMetricCard,
} from '../components';
import { useWhatsAppAccounts } from '../hooks/useWhatsAppAccounts';
import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { useWhatsAppContacts } from '../hooks/useWhatsAppContacts';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';
import { useWhatsAppUsage } from '../hooks/useWhatsAppUsage';
import { WhatsAppBroadcastsScreen } from './WhatsAppBroadcastsScreen';
import { WhatsAppContactsScreen } from './WhatsAppContactsScreen';
import { WhatsAppTemplatesScreen } from './WhatsAppTemplatesScreen';

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
  const [showAccountSwitcher, setShowAccountSwitcher] = useState<boolean>(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
    isRefetching: statusRefetching,
  } = useWhatsAppStatus();
  const { data: accountsData, refetch: refetchAccounts } = useWhatsAppAccounts();
  const { data: contactsData, refetch: refetchContacts } = useWhatsAppContacts({ limit: 5 });
  const { data: templates, refetch: refetchTemplates } = useWhatsAppTemplates('APPROVED');
  const { data: broadcastsData, refetch: refetchBroadcasts } = useWhatsAppBroadcasts({ limit: 3 });
  const { data: usage, refetch: refetchUsage } = useWhatsAppUsage();

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(tabs)/products');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [activeTab]);

  const handleRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Promise.all([
      refetchStatus(),
      refetchAccounts(),
      refetchContacts(),
      refetchTemplates(),
      refetchBroadcasts(),
      refetchUsage(),
    ]);
  };

  const accounts = accountsData || [];
  const connectedAccounts = accounts.filter((a) => a.status === 'connected');
  const activeAccount = connectedAccounts.find((a) => a.id === selectedAccountId) || connectedAccounts[0];

  // Effective connection state based on selected connected account or global status
  const currentConnection = activeAccount
    ? {
        connected: true,
        status: 'connected',
        phone_number: activeAccount.display_phone_number,
        display_name: activeAccount.name,
        quality_rating: activeAccount.quality_rating,
        messaging_limit: activeAccount.messaging_limit,
      }
    : (status?.connected ? status : undefined);

  const isConnected = Boolean(currentConnection?.connected && currentConnection?.phone_number);

  const approvedTemplatesCount = templates?.length ?? 0;
  const totalContactsCount = contactsData?.total_count ?? (contactsData?.contacts?.length ?? 0);
  const totalBroadcastsCount = broadcastsData?.total_count ?? (broadcastsData?.broadcasts?.length ?? 0);
  const deliveryRate =
    usage && usage.messages_sent > 0
      ? `${Math.min(100, Math.round((usage.messages_delivered / usage.messages_sent) * 1000) / 10)}%`
      : '0%';

  const handleSelectTab = (tab: WhatsAppTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const navigationItems = [
    {
      key: 'contacts',
      title: 'Audience & Contacts',
      subtitle: 'View contacts, segment tags & link CRM leads',
      icon: 'people',
      color: '#A855F7',
      badge: totalContactsCount > 0 ? `${totalContactsCount}` : undefined,
      onPress: () => handleSelectTab('contacts'),
    },
    {
      key: 'templates',
      title: 'Meta Templates',
      subtitle: 'Approved marketing, utility & OTP message templates',
      icon: 'document-text',
      color: '#3B82F6',
      badge: approvedTemplatesCount > 0 ? `${approvedTemplatesCount}` : undefined,
      onPress: () => handleSelectTab('templates'),
    },
    {
      key: 'broadcasts',
      title: 'Broadcast Campaigns',
      subtitle: 'Launch new bulk sends & view delivery funnels',
      icon: 'megaphone',
      color: '#F43F5E',
      badge: totalBroadcastsCount > 0 ? `${totalBroadcastsCount}` : undefined,
      onPress: () => handleSelectTab('broadcasts'),
    },
  ];

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}>
      {activeTab === 'contacts' && <WhatsAppContactsScreen onBack={() => setActiveTab('home')} />}
      {activeTab === 'templates' && <WhatsAppTemplatesScreen onBack={() => setActiveTab('home')} />}
      {activeTab === 'broadcasts' && <WhatsAppBroadcastsScreen onBack={() => setActiveTab('home')} />}

      {activeTab === 'home' && (
        <View style={styles.safeArea}>
          {/* Standard Safe Header with Circular Back Button */}
          <View
            style={[
              styles.header,
              { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 12) },
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
                    router.replace('/(tabs)/products');
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
              <ConnectionStatusCard
                connection={currentConnection}
                isLoading={statusLoading}
                hasMultipleAccounts={connectedAccounts.length > 1}
                onSwitchAccountPress={() => setShowAccountSwitcher(true)}
              />

              {/* Cloud Wallet & Usage Card */}
              <UsageCard usage={usage} isConnected={isConnected} />

              {/* Section Header: Overview & Capabilities */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                  Overview & Capabilities
                </Text>
              </View>

              {/* Metrics 2x2 Grid */}
              <View style={styles.gridContainer}>
                <View style={styles.gridRow}>
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
                </View>
                <View style={styles.gridRow}>
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
              </View>

              {/* Section Header: Product Navigation */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                  Product Navigation
                </Text>
              </View>

              {/* Quick Actions Navigation List */}
              <View style={styles.actionsList}>
                {navigationItems.map((item) => (
                  <Pressable
                    key={item.key}
                    style={({ pressed }) => [
                      styles.actionCard,
                      isDark ? styles.actionCardDark : styles.actionCardLight,
                      pressed && styles.actionCardPressed,
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={styles.actionDetails}>
                      <Text style={[styles.actionTitle, isDark ? styles.textLight : styles.textDark]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.actionSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={isDark ? '#636366' : '#C7C7CC'}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Bottom Spacing to avoid overlap with Floating Bottom Bar */}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* Floating Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={WHATSAPP_TABS}
        activeKey={activeTab}
        onChangeTab={(tab) => handleSelectTab(tab as WhatsAppTab)}
        accentColor="#0A84FF"
        moreMenuTitle="WhatsApp Business Suite"
      />

      {/* Account Switcher Modal (iOS Bottom Sheet) */}
      <Modal
        visible={showAccountSwitcher && connectedAccounts.length > 1}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountSwitcher(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.switcherBox, isDark ? styles.switcherBoxDark : styles.switcherBoxLight]}>
            <View style={styles.switcherHeader}>
              <View>
                <Text style={[styles.switcherTitle, isDark ? styles.textLight : styles.textDark]}>
                  WhatsApp Accounts
                </Text>
                <Text style={[styles.switcherSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                  Select active business phone number for this workspace
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAccountSwitcher(false)}
                hitSlop={10}
              >
                <Ionicons name="close-circle" size={24} color={isDark ? '#636366' : '#C7C7CC'} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {connectedAccounts.map((acc) => {
                const isSelected = activeAccount?.id === acc.id;

                return (
                  <Pressable
                    key={acc.id}
                    style={({ pressed }) => [
                      styles.accountRow,
                      isDark ? styles.accountRowDark : styles.accountRowLight,
                      isSelected && (isDark ? styles.accountRowSelectedDark : styles.accountRowSelectedLight),
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setSelectedAccountId(acc.id);
                      setShowAccountSwitcher(false);
                    }}
                  >
                    <View style={styles.accountAvatar}>
                      <Ionicons
                        name="logo-whatsapp"
                        size={20}
                        color="#22C55E"
                      />
                    </View>

                    <View style={styles.accountDetails}>
                      <Text style={[styles.accountName, isDark ? styles.textLight : styles.textDark]} numberOfLines={1}>
                        {acc.name || 'WhatsApp Number'}
                      </Text>
                      <View style={styles.accountPhoneRow}>
                        <Text style={[styles.accountPhone, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                          {acc.display_phone_number || 'No Phone Number'}
                        </Text>
                        <Text style={[styles.dotSeparator, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>•</Text>
                        <View style={[styles.statusMiniDot, { backgroundColor: '#22C55E' }]} />
                        <Text style={[styles.statusMiniText, { color: '#22C55E' }]}>
                          Connected
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#007AFF" style={{ marginLeft: 8 }} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 14,
    maxWidth: 150,
  },
  accountPillDark: {
    backgroundColor: '#1C1C1E',
  },
  accountPillLight: {
    backgroundColor: '#F2F2F7',
  },
  accountPillText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
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
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  gridContainer: {
    gap: 10,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  switcherBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    borderWidth: StyleSheet.hairlineWidth,
  },
  switcherBoxDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  switcherBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
  },
  switcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  switcherTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  switcherSub: {
    fontSize: 12,
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  accountRowDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  accountRowLight: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  accountRowSelectedDark: {
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
  },
  accountRowSelectedLight: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountPhone: {
    fontSize: 12,
  },
  dotSeparator: {
    fontSize: 10,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusMiniText: {
    fontSize: 11,
    fontWeight: '600',
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

