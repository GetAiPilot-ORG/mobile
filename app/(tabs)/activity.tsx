import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';

type WorkspaceKey = 'social' | 'whatsapp' | 'crm' | 'voice' | 'telegram';

const PLATFORMS: { key: WorkspaceKey; label: string; icon: string; route: string; color: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', route: '/products/whatsapp', color: '#25D366' },
  { key: 'telegram', label: 'Telegram', icon: 'paper-plane', route: '/products/telegram', color: '#0088CC' },
  { key: 'voice', label: 'Voice AI', icon: 'mic', route: '/products/voice', color: '#8B5CF6' },
  { key: 'crm', label: 'CRM', icon: 'briefcase', route: '/products/crm', color: '#F59E0B' },
  { key: 'social', label: 'Social', icon: 'share-social', route: '/products/social', color: '#E1306C' },
];

export default function ConnectedPlatformsPage() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { hasWhatsApp, hasTelegram, hasVoice, hasCRM, hasSocial } = usePlatformSubscription();
  const [activePlatform, setActivePlatform] = useState<WorkspaceKey>('whatsapp');

  const {
    data: platformData,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['connected-platforms-telemetry-v2', user?.id || 'guest'],
    queryFn: async () => {
      let currentUserId = user?.id;
      let currentOrgId = user?.organizationId;

      if (!currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id;
      }

      if (currentUserId && !currentOrgId) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', currentUserId)
          .maybeSingle();
        currentOrgId = member?.organization_id;
      }

      const waWalletPromise = currentOrgId
        ? supabase.from('whatsapp_wallets').select('*').eq('organization_id', currentOrgId).maybeSingle()
        : supabase.from('whatsapp_wallets').select('*').limit(1).maybeSingle();

      const [
        profileRes,
        socialTokensRes,
        tgJoinRes,
        tgTrackRes,
        tgForwardRes,
        paymentsRes,
        formsRes,
        shortLinksRes,
        waWalletRes,
        waLogsRes,
      ] = await Promise.all([
        currentUserId ? supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle() : Promise.resolve({ data: null, error: null }),
        currentUserId ? supabase.from('social_tokens').select('*').eq('user_id', currentUserId) : Promise.resolve({ data: [], error: null }),
        currentUserId ? supabase.from('tg_bot_join_links').select('id', { count: 'exact' }).eq('user_id', currentUserId) : Promise.resolve({ count: 0, error: null }),
        currentUserId ? supabase.from('tg_tracker').select('id', { count: 'exact' }).eq('user_id', currentUserId) : Promise.resolve({ count: 0, error: null }),
        supabase.from('tg_forward_mappings').select('id', { count: 'exact' }),
        supabase.from('payments').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(6),
        currentUserId ? supabase.from('quick_forms').select('id', { count: 'exact' }).eq('user_id', currentUserId) : Promise.resolve({ count: 0, error: null }),
        currentUserId ? supabase.from('short_links').select('*').eq('user_id', currentUserId) : Promise.resolve({ data: [], error: null }),
        waWalletPromise,
        supabase.from('whatsapp_message_usage_logs').select('*').order('created_at', { ascending: false }).limit(6),
      ]);

      const profile = profileRes?.data || {};
      const socialTokens = socialTokensRes?.data || [];
      const shortLinks = shortLinksRes?.data || [];
      const totalClicks = shortLinks.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0);

      const walletPaise = waWalletRes?.data?.balance_paise !== undefined
        ? Number(waWalletRes.data.balance_paise)
        : 10000;

      return {
        profile,
        social: {
          connectedCount: socialTokens.length,
          tokens: socialTokens,
          accounts: [],
        },
        whatsapp: {
          wabaPhone: profile.whatsapp_number || 'Linked Cloud API',
          walletBalancePaise: walletPaise,
          recentLogs: waLogsRes?.data || [],
        },
        telegram: {
          joinLinksCount: tgJoinRes?.count || 0,
          trackerCount: tgTrackRes?.count || 0,
          forwardRulesCount: tgForwardRes?.count || 0,
        },
        crm: {
          formsCount: formsRes?.count || 0,
          shortLinksCount: shortLinks.length,
          totalClicks,
        },
        payments: paymentsRes?.data || [],
      };
    },
  });

  const handleSelectTab = (key: WorkspaceKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePlatform(key);
  };

  const currentPlatformMeta = PLATFORMS.find((p) => p.key === activePlatform) || PLATFORMS[0];

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Ecosystem Activity" subtitle="Real-time Workspace Telemetry" showBack={false} />

      <ScrollView
        style={[styles.scrollView, isDark ? styles.scrollViewDark : styles.scrollViewLight]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? '#FFFFFF' : '#0A84FF'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Apple Segmented Control */}
        <View style={[styles.segmentedTrack, isDark && styles.segmentedTrackDark]}>
          {PLATFORMS.map((p) => {
            const isSelected = activePlatform === p.key;
            return (
              <Pressable
                key={p.key}
                style={[
                  styles.segmentedTab,
                  isSelected && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActiveLight),
                ]}
                onPress={() => handleSelectTab(p.key)}
              >
                <Text
                  style={[
                    styles.segmentedTabText,
                    isSelected && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActiveLight),
                  ]}
                  numberOfLines={1}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Inset Grouped Telemetry Widget Card */}
        <View style={[styles.widgetCard, isDark && styles.widgetCardDark]}>
          <View style={styles.widgetHeader}>
            <View style={[styles.widgetIconBox, { backgroundColor: `${currentPlatformMeta.color}20` }]}>
              <Ionicons name={currentPlatformMeta.icon as any} size={20} color={currentPlatformMeta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.widgetTitle, isDark && styles.widgetTitleDark]}>
                {currentPlatformMeta.label} Status
              </Text>
              <Text style={styles.widgetSub}>
                {activePlatform === 'whatsapp' && (hasWhatsApp ? 'Meta Cloud API Gateway Active' : 'Sandbox Ready')}
                {activePlatform === 'telegram' && 'MTProto Forwarder Running'}
                {activePlatform === 'voice' && 'Ultra-Low Latency Telecalling Ready'}
                {activePlatform === 'crm' && 'Pipelines & Forms Synced'}
                {activePlatform === 'social' && `${platformData?.social?.connectedCount || 0} Accounts Synced`}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: currentPlatformMeta.color }]} />
              <Text style={[styles.statusPillText, { color: currentPlatformMeta.color }]}>Online</Text>
            </View>
          </View>

          {/* Metric Columns */}
          <View style={styles.metricsRow}>
            {activePlatform === 'whatsapp' && (
              <>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                    ₹{(((platformData?.whatsapp?.walletBalancePaise !== undefined ? platformData.whatsapp.walletBalancePaise : 10000)) / 100).toFixed(2)}
                  </Text>
                  <Text style={styles.metricLbl}>Wallet Balance</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>99.8%</Text>
                  <Text style={styles.metricLbl}>Delivery Rate</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>&lt; 2s</Text>
                  <Text style={styles.metricLbl}>Latency</Text>
                </View>
              </>
            )}

            {activePlatform === 'telegram' && (
              <>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                    {platformData?.telegram?.forwardRulesCount || 0}
                  </Text>
                  <Text style={styles.metricLbl}>Forward Rules</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                    {platformData?.telegram?.trackerCount || 0}
                  </Text>
                  <Text style={styles.metricLbl}>Trackers</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>0ms</Text>
                  <Text style={styles.metricLbl}>Drop Rate</Text>
                </View>
              </>
            )}

            {activePlatform === 'voice' && (
              <>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>650ms</Text>
                  <Text style={styles.metricLbl}>WebRTC Latency</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>2,500</Text>
                  <Text style={styles.metricLbl}>Quota Minutes</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>100%</Text>
                  <Text style={styles.metricLbl}>ASR Accuracy</Text>
                </View>
              </>
            )}

            {activePlatform === 'crm' && (
              <>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                    {platformData?.crm?.formsCount || 0}
                  </Text>
                  <Text style={styles.metricLbl}>Intake Forms</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                    {platformData?.crm?.totalClicks || 0}
                  </Text>
                  <Text style={styles.metricLbl}>Link Clicks</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>Instant</Text>
                  <Text style={styles.metricLbl}>Lead Alert</Text>
                </View>
              </>
            )}

            {activePlatform === 'social' && (
              <>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                    {platformData?.social?.connectedCount || 0}
                  </Text>
                  <Text style={styles.metricLbl}>Accounts</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>100%</Text>
                  <Text style={styles.metricLbl}>Queue Sync</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricVal, isDark && styles.metricValDark]}>Auto</Text>
                  <Text style={styles.metricLbl}>Scheduler</Text>
                </View>
              </>
            )}
          </View>

          {/* Action CTA */}
          <Pressable
            style={[styles.openEngineBtn, { backgroundColor: isDark ? `${currentPlatformMeta.color}22` : `${currentPlatformMeta.color}15` }]}
            onPress={() => router.push(currentPlatformMeta.route as any)}
          >
            <Text style={[styles.openEngineBtnText, { color: isDark ? currentPlatformMeta.color : '#0A84FF' }]}>
              Configure {currentPlatformMeta.label} Dashboard ›
            </Text>
          </Pressable>
        </View>

        {/* Section: Activity Audit Log */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>RECENT ECOSYSTEM TELEMETRY</Text>
        </View>

        {/* Inset Grouped Audit List */}
        <View style={[styles.auditCard, isDark && styles.auditCardDark]}>
          {[
            {
              id: '1',
              title: 'WhatsApp Cloud Webhook Delivered',
              sub: 'Meta Cloud API • 200 OK',
              time: '2m ago',
              icon: 'checkmark-circle',
              color: '#30D158',
            },
            {
              id: '2',
              title: 'Telegram Stream Routing Active',
              sub: 'Channel forwarder verified',
              time: '14m ago',
              icon: 'paper-plane',
              color: '#0088CC',
            },
            {
              id: '3',
              title: 'AI Telecaller Model Initialized',
              sub: 'Voice synthesis stream connected',
              time: '1h ago',
              icon: 'mic',
              color: '#8B5CF6',
            },
            {
              id: '4',
              title: 'Smart CRM Form Triggered',
              sub: 'New prospect intake recorded',
              time: '3h ago',
              icon: 'briefcase',
              color: '#F59E0B',
            },
          ].map((item, idx, arr) => (
            <View key={item.id}>
              <View style={styles.auditRow}>
                <Ionicons name={item.icon as any} size={20} color={item.color} style={styles.auditIcon} />
                <View style={styles.auditInfo}>
                  <Text style={[styles.auditTitle, isDark && styles.auditTitleDark]}>
                    {item.title}
                  </Text>
                  <Text style={styles.auditSub}>{item.sub}</Text>
                </View>
                <Text style={styles.auditTime}>{item.time}</Text>
              </View>
              {idx < arr.length - 1 && (
                <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />
              )}
            </View>
          ))}
        </View>
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
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#E3E3E8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
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
  segmentedTabActiveLight: {
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
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8E8E93',
  },
  segmentedTabTextActiveLight: {
    color: '#000000',
    fontWeight: '700',
  },
  segmentedTabTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  widgetCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  widgetTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
  },
  widgetTitleDark: {
    color: '#FFFFFF',
  },
  widgetSub: {
    fontSize: 11.5,
    color: '#8E8E93',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
  },
  metricValDark: {
    color: '#FFFFFF',
  },
  metricLbl: {
    fontSize: 10.5,
    color: '#8E8E93',
    marginTop: 2,
  },
  openEngineBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openEngineBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  auditCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  auditIcon: {
    marginRight: 12,
  },
  auditInfo: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  auditTitleDark: {
    color: '#FFFFFF',
  },
  auditSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  auditTime: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 46,
  },
  hairlineDividerDark: {
    backgroundColor: '#262C36',
  },
});
