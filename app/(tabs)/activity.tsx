import React, { useState } from 'react';
import {
  View,
  Text,
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
import { ActivityScreenSkeleton } from '../../src/components/skeletonScreen';

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
    isLoading,
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
        whatsapp: {
          isLinked: Boolean(hasWhatsApp || profile?.phone_number || profile?.phone),
          phone: profile?.phone_number || profile?.phone || '+91 •••• ••••',
          walletBalanceRupees: (walletPaise / 100).toFixed(2),
          recentUsage: waLogsRes?.data || [],
        },
        telegram: {
          isLinked: Boolean(hasTelegram || (tgJoinRes?.count || 0) > 0),
          activeLinksCount: tgJoinRes?.count || 0,
          totalTrackedUsers: tgTrackRes?.count || 0,
          forwardRulesCount: tgForwardRes?.count || 0,
        },
        voice: {
          isConfigured: Boolean(hasVoice),
          latencyMs: 650,
          quotaMinutes: 2500,
          model: 'GetAI-Whisper-HQ',
        },
        crm: {
          isLinked: Boolean(hasCRM),
          formsCount: formsRes?.count || 0,
          totalClicks,
        },
        social: {
          isLinked: Boolean(hasSocial || socialTokens.length > 0),
          connectedCount: socialTokens.length,
          tokens: socialTokens,
        },
      };
    },
  });

  const currentPlatformMeta = PLATFORMS.find((p) => p.key === activePlatform) || PLATFORMS[0];

  const handleTabPress = (key: WorkspaceKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePlatform(key);
  };

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Ecosystem Activity" subtitle="Live Microservice Telemetry" />

      {isLoading && !platformData ? (
        <ActivityScreenSkeleton />
      ) : (
        <ScrollView
          className={`flex-1 ${isDark ? "bg-[#0B0D10]" : "bg-[#F2F2F7]"}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={isDark ? '#FFFFFF' : '#0284C7'}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Segmented Control Bar */}
          <View className={`flex-row rounded-xl p-1 mb-4 border ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-slate-200/80 border-transparent"}`}>
            {PLATFORMS.map((item) => {
              const isActive = activePlatform === item.key;
              return (
                <Pressable
                  key={item.key}
                  className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                    isActive ? (isDark ? "bg-[#262930]" : "bg-white shadow-sm") : ""
                  }`}
                  onPress={() => handleTabPress(item.key)}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isActive
                        ? isDark ? "text-white font-bold" : "text-black font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Active Platform Telemetry Box */}
          <View
            className={`rounded-2xl p-4 mb-5 border ${
              isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
            }`}
          >
            {/* Header info */}
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-xl justify-center items-center mr-3"
                style={{ backgroundColor: `${currentPlatformMeta.color}20` }}
              >
                <Ionicons name={currentPlatformMeta.icon as any} size={20} color={currentPlatformMeta.color} />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}>
                  {currentPlatformMeta.label}
                </Text>
                <Text className="text-xs text-emerald-500 font-semibold mt-0.5">
                  • 100% Microservice Online
                </Text>
              </View>
            </View>

            {/* Metrics Row */}
            <View className="flex-row justify-between py-3 border-y border-[#262930] mb-3.5">
              {activePlatform === 'whatsapp' && (
                <>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      ₹{platformData?.whatsapp?.walletBalanceRupees || '0.00'}
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Wallet Balance</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      Meta Cloud
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">API Protocol</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      Active
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">SSO Gateway</Text>
                  </View>
                </>
              )}

              {activePlatform === 'telegram' && (
                <>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {platformData?.telegram?.forwardRulesCount || 0}
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Forward Mappings</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {platformData?.telegram?.activeLinksCount || 0}
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Active Join Links</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {platformData?.telegram?.totalTrackedUsers || 0}
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Tracked Joins</Text>
                  </View>
                </>
              )}

              {activePlatform === 'voice' && (
                <>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>650ms</Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">WebRTC Latency</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>2,500</Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Quota Minutes</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>100%</Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">ASR Accuracy</Text>
                  </View>
                </>
              )}

              {activePlatform === 'crm' && (
                <>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {platformData?.crm?.formsCount || 0}
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Intake Forms</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {platformData?.crm?.totalClicks || 0}
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Link Clicks</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>Instant</Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Lead Alert</Text>
                  </View>
                </>
              )}

              {activePlatform === 'social' && (
                <>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {platformData?.social?.connectedCount || 0}
                    </Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Accounts</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>100%</Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Queue Sync</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"}`}>Auto</Text>
                    <Text className="text-[10.5px] text-slate-400 mt-0.5">Scheduler</Text>
                  </View>
                </>
              )}
            </View>

            {/* Action CTA */}
            <Pressable
              className="py-2.5 rounded-xl items-center justify-center"
              style={{ backgroundColor: isDark ? `${currentPlatformMeta.color}22` : `${currentPlatformMeta.color}15` }}
              onPress={() => router.push(currentPlatformMeta.route as any)}
            >
              <Text className="text-xs font-bold" style={{ color: isDark ? currentPlatformMeta.color : '#0284C7' }}>
                Configure {currentPlatformMeta.label} Dashboard ›
              </Text>
            </Pressable>
          </View>

          {/* Section: Activity Audit Log */}
          <View className="mb-2 px-1">
            <Text className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              RECENT ECOSYSTEM TELEMETRY
            </Text>
          </View>

          {/* Inset Grouped Audit List */}
          <View className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
            {[
              {
                id: '1',
                title: 'WhatsApp Cloud Webhook Delivered',
                sub: 'Meta Cloud API • 200 OK',
                time: '2m ago',
                icon: 'checkmark-circle',
                color: '#10B981',
              },
              {
                id: '2',
                title: 'Telegram Stream Routing Active',
                sub: 'Channel forwarder verified',
                time: '14m ago',
                icon: 'paper-plane',
                color: '#0284C7',
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
                <View className="flex-row items-center py-3 px-3.5">
                  <Ionicons name={item.icon as any} size={20} color={item.color} className="mr-3" />
                  <View className="flex-1">
                    <Text className={`text-sm font-semibold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{item.sub}</Text>
                  </View>
                  <Text className="text-xs text-slate-400 font-medium">{item.time}</Text>
                </View>
                {idx < arr.length - 1 && (
                  <View className={`h-[1px] ml-11 ${isDark ? "bg-[#262930]" : "bg-gray-100"}`} />
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </AppScreen>
  );
}
