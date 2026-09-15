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
  Text,
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
    <View className="flex-1 bg-[#0B0D10]">
      {activeTab === 'contacts' && <WhatsAppContactsScreen onBack={() => setActiveTab('home')} />}
      {activeTab === 'templates' && <WhatsAppTemplatesScreen onBack={() => setActiveTab('home')} />}
      {activeTab === 'broadcasts' && <WhatsAppBroadcastsScreen onBack={() => setActiveTab('home')} />}

      {activeTab === 'home' && (
        <View className="flex-1">
          {/* Header */}
          <View
            className="flex-row justify-between items-center px-4 pb-3 border-b border-[#262930] bg-[#181A1F]"
            style={{ paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 44) : 12 }}
          >
            <View className="flex-row items-center flex-1">
              <Pressable
                className="w-10 h-10 rounded-full bg-[#111317] border border-[#262930] items-center justify-center mr-3 active:opacity-70"
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
                  color="#F8FAFC"
                />
              </Pressable>

              <Text className="text-lg font-bold text-white tracking-tight">
                WhatsApp Business
              </Text>
            </View>
          </View>

          {statusLoading && !status ? (
            <WhatsAppHomeSkeleton />
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pt-3 pb-32"
              refreshControl={
                <RefreshControl
                  refreshing={statusRefetching}
                  onRefresh={handleRefresh}
                  tintColor="#0084FF"
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

              {/* Metrics 2x2 Grid */}
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">Overview & Capabilities</Text>
              <View className="flex-row flex-wrap gap-2.5 mb-3">
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
              <View className="my-2 px-1">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Product Navigation
                </Text>
              </View>

              {/* Quick Actions Navigation List */}
              <View className="gap-2.5">
                {navigationItems.map((item) => (
                  <Pressable
                    key={item.key}
                    className="flex-row items-center bg-[#181A1F] border border-[#262930] rounded-2xl p-3.5 active:bg-[#262930]"
                    onPress={item.onPress}
                  >
                    <View className="w-10 h-10 rounded-xl bg-[#111317] border border-[#262930] items-center justify-center mr-3.5">
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-white mb-0.5">
                        {item.title}
                      </Text>
                      <Text className="text-xs text-slate-400 leading-tight">
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#64748B"
                    />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Floating Bottom Navigation Bar */}
      <ProductFloatingBottomBar
        items={WHATSAPP_TABS}
        activeKey={activeTab}
        onChangeTab={(tab) => handleSelectTab(tab as WhatsAppTab)}
        accentColor="#0084FF"
        moreMenuTitle="WhatsApp Business Suite"
      />

      {/* Account Switcher Modal */}
      <Modal
        visible={showAccountSwitcher && connectedAccounts.length > 1}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountSwitcher(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl p-5 pb-8">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-base font-bold text-white">
                  WhatsApp Accounts
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Select active business phone number for this workspace
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAccountSwitcher(false)}
                hitSlop={10}
                className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
              {connectedAccounts.map((acc) => {
                const isSelected = activeAccount?.id === acc.id;

                return (
                  <Pressable
                    key={acc.id}
                    className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                      isSelected
                        ? 'border-[#0084FF] bg-[#0084FF]/10'
                        : 'border-[#262930] bg-[#111317] active:bg-[#262930]'
                    }`}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setSelectedAccountId(acc.id);
                      setShowAccountSwitcher(false);
                    }}
                  >
                    <View className="w-9 h-9 rounded-full bg-emerald-500/15 items-center justify-center mr-2.5">
                      <Ionicons
                        name="logo-whatsapp"
                        size={18}
                        color="#22C55E"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-xs font-bold text-white mb-0.5" numberOfLines={1}>
                        {acc.name || 'WhatsApp Number'}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[11px] text-slate-400">
                          {acc.display_phone_number || 'No Phone Number'}
                        </Text>
                        <Text className="text-[10px] text-slate-500">•</Text>
                        <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <Text className="text-[10px] font-semibold text-emerald-400">
                          Connected
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#0084FF" style={{ marginLeft: 8 }} />
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
