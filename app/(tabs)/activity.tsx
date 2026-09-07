import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

type WorkspaceKey = 'social_pilot' | 'whatsapp' | 'crm' | 'voice_pilot' | 'telegram' | 'free_tools';

const WORKSPACES: { key: WorkspaceKey; label: string; icon: string; color: string }[] = [
  { key: 'social_pilot', label: 'Social Pilot', icon: '📸', color: '#ec4899' },
  { key: 'whatsapp', label: 'GAP WhatsApp', icon: '💬', color: '#16a34a' },
  { key: 'crm', label: 'GAP CRM', icon: '📊', color: '#f59e0b' },
  { key: 'voice_pilot', label: 'Voice Pilot', icon: '🎙️', color: '#8b5cf6' },
  { key: 'telegram', label: 'GAP Telegram', icon: '📢', color: '#0284c7' },
  { key: 'free_tools', label: 'Free Tools', icon: '⚡', color: '#10b981' },
];

export default function ConnectedPlatformsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasWhatsApp, hasTelegram, hasVoice, hasCRM, hasSocial } = usePlatformSubscription();
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>('social_pilot');

  // Real Multi-Workspace Data Queries
  const {
    data: platformData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['connected-platforms-full-telemetry', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const [
        profileRes,
        socialTokensRes,
        igAccountsRes,
        tgJoinRes,
        tgTrackRes,
        tgForwardRes,
        paymentsRes,
        formsRes,
        shortLinksRes,
        waWalletRes,
        waLogsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('social_tokens').select('*').eq('user_id', user.id),
        supabase.from('instagram_accounts').select('*').eq('user_id', user.id),
        supabase.from('tg_bot_join_links').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('tg_tracker').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('tg_forward_mappings').select('id', { count: 'exact' }),
        supabase.from('payments').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('quick_forms').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('short_links').select('*').eq('user_id', user.id),
        supabase.from('whatsapp_wallets').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('whatsapp_message_usage_logs').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const profile = profileRes.data || {};
      const socialTokens = socialTokensRes.data || [];
      const igAccounts = igAccountsRes.data || [];
      const shortLinks = shortLinksRes.data || [];
      const totalClicks = shortLinks.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0);

      return {
        profile,
        social: {
          connectedCount: socialTokens.length + igAccounts.length,
          tokens: socialTokens,
          accounts: igAccounts,
        },
        whatsapp: {
          wabaPhone: profile.whatsapp_number || 'Linked Business',
          walletBalancePaise: waWalletRes.data?.balance_paise || 0,
          recentLogs: waLogsRes.data || [],
        },
        telegram: {
          joinLinksCount: tgJoinRes.count || 0,
          trackerCount: tgTrackRes.count || 0,
          forwardRulesCount: tgForwardRes.count || 0,
        },
        crm: {
          formsCount: formsRes.count || 0,
          shortLinksCount: shortLinks.length,
          totalClicks,
        },
        payments: paymentsRes.data || [],
      };
    },
  });

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ECOSYSTEM DIRECTORY</Text>
          <Text style={styles.title}>Connected Platforms</Text>
          <Text style={styles.subtitle}>
            Manage omnichannel bots, unified subscriber directories, and live telemetry across all workspaces.
          </Text>
        </View>

        {/* Workspace Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.workspacePillsContainer}
        >
          {WORKSPACES.map((ws) => {
            const isActive = activeWorkspace === ws.key;
            return (
              <Pressable
                key={ws.key}
                style={[
                  styles.workspacePill,
                  isActive && { backgroundColor: ws.color, borderColor: ws.color },
                ]}
                onPress={() => setActiveWorkspace(ws.key)}
              >
                <Text style={styles.pillIcon}>{ws.icon}</Text>
                <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>
                  {ws.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Active Workspace View ────────────────────────────── */}
        {activeWorkspace === 'social_pilot' && (
          <View style={styles.platformCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Text style={{ fontSize: 18 }}>📸</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Social Pilot Workspace</Text>
                <Text style={styles.cardSubtitle}>
                  {platformData?.social?.connectedCount || 0} Accounts Connected
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#fce7f3' }]}>
                <Text style={[styles.badgeText, { color: '#db2777' }]}>Multi-Channel</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>{platformData?.social?.connectedCount || 0}</Text>
                <Text style={styles.metricLbl}>Connected Channels</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>100%</Text>
                <Text style={styles.metricLbl}>Queue Health</Text>
              </View>
            </View>

            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: '#db2777' }]}
              onPress={() => router.push('/products/social' as any)}
            >
              <Text style={styles.primaryActionBtnText}>Open Social Pilot Engine →</Text>
            </Pressable>
          </View>
        )}

        {activeWorkspace === 'whatsapp' && (
          <View style={styles.platformCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(22, 163, 74, 0.15)' }]}>
                <Text style={{ fontSize: 18 }}>💬</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>GAP WhatsApp Suite</Text>
                <Text style={styles.cardSubtitle}>Meta Cloud API Integration</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.badgeText, { color: '#16a34a' }]}>
                  {hasWhatsApp ? 'Active' : 'Connected'}
                </Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>
                  ₹{((platformData?.whatsapp?.walletBalancePaise || 0) / 100).toFixed(2)}
                </Text>
                <Text style={styles.metricLbl}>Wallet Balance</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>
                  {platformData?.whatsapp?.recentLogs?.length || 0}
                </Text>
                <Text style={styles.metricLbl}>Recent Messages</Text>
              </View>
            </View>

            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: '#16a34a' }]}
              onPress={() => router.push('/products/whatsapp' as any)}
            >
              <Text style={styles.primaryActionBtnText}>Manage WhatsApp Bot →</Text>
            </Pressable>
          </View>
        )}

        {activeWorkspace === 'crm' && (
          <View style={styles.platformCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={{ fontSize: 18 }}>📊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>GAP Smart CRM</Text>
                <Text style={styles.cardSubtitle}>Sales Pipelines & Leads</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.badgeText, { color: '#b45309' }]}>Pipeline Active</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>{platformData?.crm?.formsCount || 0}</Text>
                <Text style={styles.metricLbl}>Active Forms</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>{platformData?.crm?.totalClicks || 0}</Text>
                <Text style={styles.metricLbl}>Tracked Clicks</Text>
              </View>
            </View>

            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: '#d97706' }]}
              onPress={() => router.push('/products/crm' as any)}
            >
              <Text style={styles.primaryActionBtnText}>Launch Sales Pipeline →</Text>
            </Pressable>
          </View>
        )}

        {activeWorkspace === 'voice_pilot' && (
          <View style={styles.platformCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Text style={{ fontSize: 18 }}>🎙️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>GAP Voice Pilot</Text>
                <Text style={styles.cardSubtitle}>AI Telecalling & Voice Agent</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#ede9fe' }]}>
                <Text style={[styles.badgeText, { color: '#6d28d9' }]}>AI Agent</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>1</Text>
                <Text style={styles.metricLbl}>Active Voice Persona</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>Whisper + ElevenLabs</Text>
                <Text style={styles.metricLbl}>AI Engine</Text>
              </View>
            </View>

            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: '#7c3aed' }]}
              onPress={() => router.push('/products/voice' as any)}
            >
              <Text style={styles.primaryActionBtnText}>Configure Voice Agent →</Text>
            </Pressable>
          </View>
        )}

        {activeWorkspace === 'telegram' && (
          <View style={styles.platformCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(2, 132, 199, 0.15)' }]}>
                <Text style={{ fontSize: 18 }}>📢</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>GAP Telegram Hub</Text>
                <Text style={styles.cardSubtitle}>Bot Join & Auto-Forward</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#e0f2fe' }]}>
                <Text style={[styles.badgeText, { color: '#0369a1' }]}>Live Engine</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>{platformData?.telegram?.joinLinksCount || 0}</Text>
                <Text style={styles.metricLbl}>Join Links</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>{platformData?.telegram?.forwardRulesCount || 0}</Text>
                <Text style={styles.metricLbl}>Forward Rules</Text>
              </View>
            </View>

            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: '#0284c7' }]}
              onPress={() => router.push('/products/telegram' as any)}
            >
              <Text style={styles.primaryActionBtnText}>Configure Telegram Bots →</Text>
            </Pressable>
          </View>
        )}

        {activeWorkspace === 'free_tools' && (
          <View style={styles.platformCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={{ fontSize: 18 }}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Free Tools Hub</Text>
                <Text style={styles.cardSubtitle}>All 10 No-Code Utilities</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                <Text style={[styles.badgeText, { color: '#065f46' }]}>10 Available</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>10</Text>
                <Text style={styles.metricLbl}>Total Tools</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricVal}>{platformData?.crm?.shortLinksCount || 0}</Text>
                <Text style={styles.metricLbl}>Assets Created</Text>
              </View>
            </View>

            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: '#059669' }]}
              onPress={() => router.push('/(tabs)/tools' as any)}
            >
              <Text style={styles.primaryActionBtnText}>Explore All Tools →</Text>
            </Pressable>
          </View>
        )}

        {/* ── Real Transactions Stream ────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Ecosystem Activity</Text>
        </View>

        {platformData?.payments && platformData.payments.length > 0 ? (
          platformData.payments.map((p: any) => (
            <View key={p.id} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>Platform Transaction: ₹{p.amount || 0}</Text>
                <Text style={styles.activitySub}>Status: {p.status || 'Verified'}</Text>
              </View>
              <Text style={styles.activityTime}>{new Date(p.created_at).toLocaleDateString()}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>All connected services are active and running.</Text>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    backgroundColor: '#F5F4F0',
  },
  header: {
    marginBottom: 16,
    paddingTop: 10,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  workspacePillsContainer: {
    gap: 8,
    paddingVertical: 10,
    marginBottom: 16,
  },
  workspacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2dfd7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  pillIcon: {
    fontSize: 13,
  },
  pillLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  pillLabelActive: {
    color: '#ffffff',
  },
  platformCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2dfd7',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricTile: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLbl: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  primaryActionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2dfd7',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  activitySub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2dfd7',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
  },
});

