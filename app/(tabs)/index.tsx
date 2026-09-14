import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  useColorScheme,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';
import { DashboardScreen } from '../../src/features/dashboard/screens/DashboardScreen';
import { apiClient } from '../../src/core/api/client';

interface LoginDevice {
  sessionId: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string;
  osVersion: string | null;
  lastSeenAt: string;
  isCurrent: boolean;
}

interface DeviceSessionsResponse {
  activeDeviceCount: number;
  devices: LoginDevice[];
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { planLabel, hasTelegram, hasWhatsApp, hasVoice, hasCRM, hasSocial, refresh: refreshSub } =
    usePlatformSubscription();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'bots' | 'tools'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real Workspace Telemetry from Supabase
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ['workspace-telemetry-ios', user?.id],
    queryFn: async () => {
      if (!user?.id) return { landingPagesCount: 0, quickFormsCount: 0, shortLinksCount: 0, botsCount: 0 };
      try {
        const [pagesRes, formsRes, linksRes] = await Promise.all([
          supabase.from('landing_pages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('quick_forms').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('short_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        return {
          landingPagesCount: pagesRes.count || 0,
          quickFormsCount: formsRes.count || 0,
          shortLinksCount: linksRes.count || 0,
          botsCount: 5,
        };
      } catch {
        return { landingPagesCount: 0, quickFormsCount: 0, shortLinksCount: 0, botsCount: 5 };
      }
    },
  });

  const { data: deviceSessions, isLoading: isLoadingDevices, refetch: refetchDeviceSessions } = useQuery<DeviceSessionsResponse>({
    queryKey: ['auth-device-sessions', user?.id],
    queryFn: () => apiClient.get<DeviceSessionsResponse>('/mobile/v1/auth/device-sessions'),
    enabled: !!user?.id,
    staleTime: 15_000,
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    refreshSub();
    await Promise.all([refetchTelemetry(), refetchDeviceSessions()]);
    setIsRefreshing(false);
  };

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AI Pilot';

  // Primary Automation Engines (Bundled Native Logos)
  const ENGINES = [
    {
      id: 'telegram',
      name: 'Telegram',
      desc: 'Auto-forward feeds, bots & reactions',
      logo: require('../../assets/images/products/telegram.png'),
      iconBg: '#0088CC',
      route: '/products/telegram',
      status: hasTelegram ? 'Active' : 'Pro',
      isLive: hasTelegram,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      desc: 'Broadcasts & 24/7 Meta API triggers',
      logo: require('../../assets/images/products/whatsapp.png'),
      iconBg: '#25D366',
      route: '/products/whatsapp',
      status: hasWhatsApp ? 'Active' : 'Pro',
      isLive: hasWhatsApp,
    },
    {
      id: 'voice',
      name: 'Voice AI',
      desc: 'AI Voice calling agents & speech streaming',
      logo: require('../../assets/images/products/voice.png'),
      iconBg: '#8B5CF6',
      route: '/products/voice',
      status: hasVoice ? 'Active' : 'Pro',
      isLive: hasVoice,
    },
    {
      id: 'crm',
      name: 'Smart CRM',
      desc: 'Pipelines, deals & lead contact automation',
      logo: require('../../assets/images/products/crm.png'),
      iconBg: '#F59E0B',
      route: '/products/crm',
      status: hasCRM ? 'Active' : 'Pro',
      isLive: hasCRM,
    },
    {
      id: 'social',
      name: 'Social Pilot',
      desc: 'Cross-platform auto-poster & queue',
      logo: require('../../assets/images/products/social.png'),
      iconBg: '#E1306C',
      route: '/products/social',
      status: hasSocial ? 'Active' : 'Growth',
      isLive: hasSocial,
    },
  ];

  // Studio & Free Utilities
  const TOOLS = [
    {
      id: 'qr',
      name: 'QR Generator',
      desc: 'Custom branded vectors & logos',
      icon: 'qr-code',
      iconBg: '#4F46E5',
      route: '/tools/qr-code',
    },
    {
      id: 'links',
      name: 'Link Shortener',
      desc: 'Custom slugs with click analytics',
      icon: 'link',
      iconBg: '#0284C7',
      route: '/tools/link-shortener',
    },
    {
      id: 'bio',
      name: 'Bio Builder',
      desc: 'Mobile bio link landing pages',
      icon: 'phone-portrait',
      iconBg: '#EC4899',
      route: '/tools/bio-templates',
    },
    {
      id: 'forms',
      name: 'QuickForms',
      desc: 'Conversational lead intake funnels',
      icon: 'document-text',
      iconBg: '#0D9488',
      route: '/tools/quick-forms',
    },
    {
      id: 'speech',
      name: 'Speech to Text',
      desc: 'AI audio transcription engine',
      icon: 'volume-high',
      iconBg: '#7C3AED',
      route: '/tools/speech-to-text',
    },
    {
      id: 'audit',
      name: 'Website Audit',
      desc: 'SEO & Core Web Vitals health score',
      icon: 'speedometer',
      iconBg: '#059669',
      route: '/tools/website-audit',
    },
  ];

  const filteredEngines = ENGINES.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTools = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppScreen safeArea={false}>
      {/* Top Header */}
      <AppTopBar
        rightElement={
          <Pressable
            style={styles.avatarBtn}
            onPress={() => {
              triggerHaptic();
              router.push('/(tabs)/account' as any);
            }}
          >
            <Text style={styles.avatarBtnText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        style={[styles.scrollView, isDark ? styles.scrollViewDark : styles.scrollViewLight]}
        contentContainerStyle={[
          styles.scrollContent,
          isDark ? styles.scrollContentDark : styles.scrollContentLight,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0A84FF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* iOS Native Search Field */}
        <View style={[styles.searchBarContainer, isDark && styles.searchBarContainerDark]}>
          <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search bots, automation & tools..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </Pressable>
          ) : (
            <Ionicons name="options-outline" size={16} color="#8E8E93" />
          )}
        </View>

        {/* Dual Telemetry Widgets (Apple Inset Dual Cards) */}
        <View style={styles.heroRow}>
          <Pressable
            style={[styles.heroCard, isDark && styles.heroCardDark]}
            onPress={() => {
              triggerHaptic();
              router.push('/account/plans' as any);
            }}
          >
            <View style={[styles.heroIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
              <Ionicons name="diamond" size={17} color="#0A84FF" />
            </View>
            <View style={styles.heroCardTextCol}>
              <Text style={[styles.heroCardEyebrow, isDark && styles.heroCardEyebrowDark]} numberOfLines={1}>
                Workspace Plan
              </Text>
              <Text style={[styles.heroCardTitle, isDark && styles.heroCardTitleDark]} numberOfLines={1}>
                {planLabel || 'GAP Pro Max'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#8E8E93" />
          </Pressable>

          <Pressable
            style={[styles.heroCard, isDark && styles.heroCardDark]}
            onPress={() => {
              triggerHaptic();
              router.push('/(tabs)/activity' as any);
            }}
          >
            <View style={[styles.heroIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
              <Ionicons name="rocket" size={17} color="#30D158" />
            </View>
            <View style={styles.heroCardTextCol}>
              <Text style={[styles.heroCardEyebrow, isDark && styles.heroCardEyebrowDark]} numberOfLines={1}>
                Automation Fleet
              </Text>
              <Text style={[styles.heroCardTitle, isDark && styles.heroCardTitleDark]} numberOfLines={1}>
                5 Engines
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#8E8E93" />
          </Pressable>
        </View>

        {/* Signed-in device summary. Full device management lives in Account > Security. */}
        <Pressable
          style={[styles.loginSecurityCard, isDark && styles.loginSecurityCardDark]}
          onPress={() => {
            triggerHaptic();
            router.push({ pathname: '/(tabs)/account', params: { tab: 'security' } } as any);
          }}
          accessibilityRole="button"
          accessibilityLabel="View logged-in devices in account security"
        >
          <View style={[styles.loginSecurityIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
          </View>
          <View style={styles.loginSecurityContent}>
            <View style={styles.loginSecurityHeader}>
              <Text style={[styles.loginSecurityTitle, isDark && styles.loginSecurityTitleDark]}>Login security</Text>
              <View style={styles.loginSecurityCount}>
                <Text style={styles.loginSecurityCountText}>
                  {isLoadingDevices ? 'Checking…' : `${deviceSessions?.activeDeviceCount ?? 0} active`}
                </Text>
              </View>
            </View>
            {deviceSessions?.devices.length ? (
              <View style={styles.loginDeviceList}>
                {deviceSessions.devices.slice(0, 2).map((device) => (
                  <View key={device.sessionId} style={styles.loginDeviceRow}>
                    <Ionicons
                      name={device.platform === 'web' ? 'globe-outline' : 'phone-portrait-outline'}
                      size={13}
                      color="#8E8E93"
                    />
                    <Text style={[styles.loginDeviceText, isDark && styles.loginDeviceTextDark]} numberOfLines={1}>
                      {device.deviceName}{device.isCurrent ? ' · This device' : ''}
                    </Text>
                  </View>
                ))}
                {deviceSessions.activeDeviceCount > 2 && (
                  <Text style={[styles.loginMoreDevices, isDark && styles.loginMoreDevicesDark]}>
                    +{deviceSessions.activeDeviceCount - 2} more device{deviceSessions.activeDeviceCount - 2 === 1 ? '' : 's'}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[styles.loginSecuritySubtitle, isDark && styles.loginSecuritySubtitleDark]}>
                {isLoadingDevices ? 'Loading signed-in devices' : 'No active device logins found'}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
        </Pressable>

        {/* iOS Native Segmented Filter Bar */}
        <View style={[styles.segmentedTrack, isDark && styles.segmentedTrackDark]}>
          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === 'all' && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActive),
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('all');
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === 'all' && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActive),
              ]}
            >
              All Engines
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === 'bots' && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActive),
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('bots');
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === 'bots' && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActive),
              ]}
            >
              Automation Hub
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === 'tools' && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActive),
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('tools');
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === 'tools' && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActive),
              ]}
            >
              Studio Tools
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: Automation Engines */}
        {(selectedFilter === 'all' || selectedFilter === 'bots') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeaderTitle, isDark && styles.sectionHeaderTitleDark]}>
                Automation Engines
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/(tabs)/products' as any);
                }}
              >
                <Text style={styles.sectionActionText}>See All ›</Text>
              </Pressable>
            </View>

            {/* Inset Grouped Icon Grid */}
            <View style={[styles.gridContainer, isDark && styles.gridContainerDark]}>
              {filteredEngines.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => {
                    triggerHaptic();
                    router.push(item.route as any);
                  }}
                >
                  <Image
                    source={item.logo}
                    style={styles.gridLogoImage}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 2: Studio & Utilities (Apple HIG Inset Grouped List) */}
        {(selectedFilter === 'all' || selectedFilter === 'tools') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeaderTitle, isDark && styles.sectionHeaderTitleDark]}>
                Studio & Utilities
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/(tabs)/tools' as any);
                }}
              >
                <Text style={styles.sectionActionText}>Explore Tools ›</Text>
              </Pressable>
            </View>

            {/* Apple HIG Inset Grouped Unified Card with Hairline Dividers */}
            <View style={[styles.groupedListContainer, isDark && styles.groupedListContainerDark]}>
              {filteredTools.map((tool, index) => {
                const isLast = index === filteredTools.length - 1;
                return (
                  <View key={tool.id}>
                    <Pressable
                      style={styles.groupedListItem}
                      onPress={() => {
                        triggerHaptic();
                        router.push(tool.route as any);
                      }}
                    >
                      <View style={[styles.toolIconBox, { backgroundColor: tool.iconBg }]}>
                        <Ionicons name={tool.icon as any} size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.toolInfo}>
                        <Text style={[styles.toolName, isDark && styles.toolNameDark]}>
                          {tool.name}
                        </Text>
                        <Text style={[styles.toolDesc, isDark && styles.toolDescDark]} numberOfLines={1}>
                          {tool.desc}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
                    </Pressable>
                    {!isLast && <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewLight: {
    backgroundColor: '#F2F2F7',
  },
  scrollViewDark: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 130,
  },
  scrollContentLight: {
    backgroundColor: '#F2F2F7',
  },
  scrollContentDark: {
    backgroundColor: '#000000',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // ─── iOS Native Search Field ───────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 16,
  },
  searchBarContainerDark: {
    backgroundColor: '#1C1C1E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2C2C2E',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 6,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  // ─── Dual Telemetry Widgets ────────────────────────────────────
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  heroCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    gap: 9,
  },
  heroCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  heroIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCardTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  heroCardEyebrow: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  heroCardEyebrowDark: {
    color: '#8E8E93',
  },
  heroCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
  },
  heroCardTitleDark: {
    color: '#FFFFFF',
  },
  loginSecurityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  loginSecurityCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  loginSecurityIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  loginSecurityContent: {
    flex: 1,
  },
  loginSecurityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  loginSecurityTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#000000',
  },
  loginSecurityTitleDark: {
    color: '#FFFFFF',
  },
  loginSecurityCount: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  loginSecurityCountText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '800',
  },
  loginSecuritySubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  loginSecuritySubtitleDark: {
    color: '#8E8E93',
  },
  loginDeviceList: {
    marginTop: 5,
    gap: 3,
  },
  loginDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  loginDeviceText: {
    flex: 1,
    color: '#6B7280',
    fontSize: 12,
  },
  loginDeviceTextDark: {
    color: '#8E8E93',
  },
  loginMoreDevices: {
    color: '#0A84FF',
    fontSize: 11.5,
    fontWeight: '700',
    marginLeft: 18,
  },
  loginMoreDevicesDark: {
    color: '#64B5FF',
  },
  // ─── iOS Native Segmented Track ────────────────────────────────
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#E3E3E8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  segmentedTrackDark: {
    backgroundColor: '#161B22',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#262C36',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedTabActiveDark: {
    backgroundColor: '#262C36',
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentedTabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  segmentedTabTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // ─── Section Header (Apple HIG Style) ──────────────────────────
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: -0.2,
  },
  sectionHeaderTitleDark: {
    color: '#9CA3AF',
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0A84FF',
  },
  // ─── Inset Grouped Grid (5 Engines Row) ────────────────────────
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  gridContainerDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  gridItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLogoImage: {
    width: 50,
    height: 50,
    borderRadius: 13,
  },
  // ─── Inset Grouped List (Apple HIG Settings Style) ─────────────
  groupedListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  groupedListContainerDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  groupedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  toolIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  toolNameDark: {
    color: '#FFFFFF',
  },
  toolDesc: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  toolDescDark: {
    color: '#8E8E93',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 58,
  },
  hairlineDividerDark: {
    backgroundColor: '#262C36',
  },
});
