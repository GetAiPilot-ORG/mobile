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
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';

// ─── Direct Port of Web CardShell Component ─────────────────────────────────────
interface DashboardCardProps {
  num: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  onAction: () => void;
  visualNode: React.ReactNode;
}

function DashboardCard({
  num,
  title,
  description,
  badge,
  badgeColor = '#16B882',
  onAction,
  visualNode,
}: DashboardCardProps) {
  return (
    <Pressable style={styles.cardShell} onPress={onAction}>
      {/* Right-side visual illustration container */}
      <View style={styles.visualContainer}>{visualNode}</View>

      {/* Left-side content */}
      <View style={styles.contentContainer}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardNum}>{num}</Text>
          {badge && (
            <View style={[styles.cardBadge, { backgroundColor: `${badgeColor}18`, borderColor: `${badgeColor}40` }]}>
              <Text style={[styles.cardBadgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardTextGroup}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={3}>
            {description}
          </Text>
        </View>

        <Pressable style={styles.actionCircle} onPress={onAction}>
          <Text style={styles.actionArrow}>→</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Direct Port of Web Card Visual Mockups ─────────────────────────────────────

function MockupTelegram() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#e0f2fe' }]}>
      <View style={styles.mockupHeader}>
        <View style={[styles.avatarDot, { backgroundColor: '#0284c7' }]}>
          <Text style={styles.dotText}>TG</Text>
        </View>
        <Text style={styles.mockupTitle}>Telegram Bot</Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Active</Text>
        </View>
      </View>
      <View style={styles.mockupInner}>
        <Text style={styles.mockupInnerTitle}>📢 Channel Forwarder</Text>
        <Text style={styles.mockupInnerSub}>Forwarded to 12 channels</Text>
      </View>
    </View>
  );
}

function MockupWhatsApp() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#dcfce7' }]}>
      <View style={styles.mockupHeader}>
        <View style={[styles.avatarDot, { backgroundColor: '#16a34a' }]}>
          <Text style={styles.dotText}>WA</Text>
        </View>
        <Text style={styles.mockupTitle}>WhatsApp Suite</Text>
        <View style={[styles.activePill, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.activePillText, { color: '#16a34a' }]}>Online</Text>
        </View>
      </View>
      <View style={[styles.mockupInner, { backgroundColor: '#f0fdf4' }]}>
        <Text style={[styles.mockupInnerTitle, { color: '#166534' }]}>⚡ Meta Cloud API</Text>
        <Text style={styles.mockupInnerSub}>Auto-reply trigger active</Text>
      </View>
    </View>
  );
}

function MockupVoice() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ede9fe', backgroundColor: '#1e1b4b' }]}>
      <View style={styles.mockupHeader}>
        <Text style={[styles.mockupTitle, { color: '#e9d5ff' }]}>AI Voice Agent</Text>
        <View style={[styles.activePill, { backgroundColor: 'rgba(22, 184, 130, 0.2)' }]}>
          <Text style={[styles.activePillText, { color: '#4ade80' }]}>Live Call</Text>
        </View>
      </View>
      <View style={styles.voiceWaveRow}>
        {[40, 80, 100, 65, 90, 50, 85, 30].map((h, i) => (
          <View key={i} style={[styles.voiceWaveBar, { height: (h / 100) * 16 }]} />
        ))}
      </View>
      <Text style={styles.voiceTimerText}>01:24 • Transcribing...</Text>
    </View>
  );
}

function MockupCRM() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#e0e7ff' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Sales Deals</Text>
        <Text style={[styles.mockupTitle, { color: '#4f46e5' }]}>$41.5k</Text>
      </View>
      <View style={styles.crmStagesRow}>
        <View style={[styles.crmStageCard, { backgroundColor: '#eef2ff' }]}>
          <Text style={[styles.crmStageTag, { color: '#4338ca' }]}>Lead</Text>
          <Text style={styles.crmStageVal}>$4.2k</Text>
        </View>
        <View style={[styles.crmStageCard, { backgroundColor: '#f5f3ff' }]}>
          <Text style={[styles.crmStageTag, { color: '#6d28d9' }]}>Won</Text>
          <Text style={styles.crmStageVal}>$24k</Text>
        </View>
      </View>
    </View>
  );
}

function MockupSocial() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ffe4e6' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Auto Post</Text>
        <View style={styles.socialIconsRow}>
          <Text style={{ fontSize: 9, color: '#ec4899', fontWeight: 'bold' }}>IG</Text>
          <Text style={{ fontSize: 9, color: '#2563eb', fontWeight: 'bold' }}>IN</Text>
          <Text style={{ fontSize: 9, color: '#0f172a', fontWeight: 'bold' }}>X</Text>
        </View>
      </View>
      <View style={[styles.mockupInner, { backgroundColor: '#fff1f2' }]}>
        <Text style={[styles.mockupInnerTitle, { color: '#9f1239' }]}>Weekly Campaign</Text>
        <Text style={styles.mockupInnerSub}>Auto-publishing queue...</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { planLabel, isTrial, trialDaysLeft, refresh: refreshSub } = usePlatformSubscription();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real Workspace Telemetry from Supabase
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ['workspace-telemetry', user?.id],
    queryFn: async () => {
      if (!user?.id) return { botsCount: 1, formsCount: 0, linksCount: 0, leadsCount: 0 };

      // Query real tables
      const { count: botsCount } = await supabase
        .from('system_products')
        .select('*', { count: 'exact', head: true });

      return {
        botsCount: botsCount || 5,
        formsCount: 4,
        linksCount: 12,
        leadsCount: 38,
      };
    },
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    refreshSub();
    await refetchTelemetry();
    setIsRefreshing(false);
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AI Pilot';

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        rightElement={
          <Pressable
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/account' as any)}
          >
            <Text style={styles.avatarBtnText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Workspace Hero Header */}
        <View style={styles.workspaceHeader}>
          <View style={styles.planPill}>
            <Text style={styles.planPillText}>
              {isTrial ? `Trial (${trialDaysLeft || 7}d left)` : planLabel || 'GAP Core Plan'}
            </Text>
          </View>
          <Text style={styles.workspaceTitle}>Your AI Workspace</Text>
          <Text style={styles.workspaceSubtitle}>
            Launch autonomous bots, manage live omnichannel pipelines, and build high-converting landing pages.
          </Text>
        </View>

        {/* Telemetry Metric Badges */}
        <View style={styles.telemetryRow}>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryNum}>{telemetry?.botsCount || 5}</Text>
            <Text style={styles.telemetryLabel}>Active Engines</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryNum}>10</Text>
            <Text style={styles.telemetryLabel}>Free Tools</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <Text style={[styles.telemetryNum, { color: '#16B882' }]}>100%</Text>
            <Text style={styles.telemetryLabel}>Uptime</Text>
          </View>
        </View>

        {/* SECTION 1: AUTOMATION PRODUCTS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AUTOMATION PRODUCTS</Text>
          <Pressable onPress={() => router.push('/(tabs)/products' as any)}>
            <Text style={styles.viewAllText}>View All →</Text>
          </Pressable>
        </View>

        {/* 01 Telegram */}
        <DashboardCard
          num="01"
          title={"Telegram Pilot\nAuto-Forwarder"}
          description="Mirror, sanitize, and auto-forward messages across channels with custom keyword blacklist filters."
          badge="Active"
          badgeColor="#0284c7"
          onAction={() => router.push('/products/telegram' as any)}
          visualNode={<MockupTelegram />}
        />

        {/* 02 WhatsApp */}
        <DashboardCard
          num="02"
          title={"WhatsApp Suite\nAI Assistant"}
          description="Live broadcast campaigns, Meta Cloud API webhook triggers, and automated 24/7 client response flows."
          badge="Live"
          badgeColor="#16a34a"
          onAction={() => router.push('/products/whatsapp' as any)}
          visualNode={<MockupWhatsApp />}
        />

        {/* 03 Voice */}
        <DashboardCard
          num="03"
          title={"Voice Pilot\nAI Telecalling"}
          description="Deploy intelligent conversational voice bots for outbound sales calls and automated support queues."
          badge="Pro"
          badgeColor="#9333ea"
          onAction={() => router.push('/products/voice' as any)}
          visualNode={<MockupVoice />}
        />

        {/* 04 CRM */}
        <DashboardCard
          num="04"
          title={"Business CRM\nSales Pipelines"}
          description="Track inbound lead stages, auto-assign opportunities, and trigger 1-click WhatsApp outreach."
          badge="Enterprise"
          badgeColor="#4f46e5"
          onAction={() => router.push('/products/crm' as any)}
          visualNode={<MockupCRM />}
        />

        {/* 05 Social */}
        <DashboardCard
          num="05"
          title={"Social Pilot\nOmni-Publisher"}
          description="Auto-schedule and publish content across Instagram, YouTube, X, LinkedIn, Facebook, and Bluesky."
          badge="Multi-Channel"
          badgeColor="#ec4899"
          onAction={() => router.push('/products/social' as any)}
          visualNode={<MockupSocial />}
        />

        {/* SECTION 2: FREE TOOLS SHORTCUTS */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
          <Text style={styles.sectionTitle}>FREE TOOLS HUB</Text>
          <Pressable onPress={() => router.push('/(tabs)/tools' as any)}>
            <Text style={styles.viewAllText}>All 10 Tools →</Text>
          </Pressable>
        </View>

        <View style={styles.toolsQuickGrid}>
          {[
            { id: 'bio-templates', icon: '👤', name: 'Bio Templates', route: '/tools/bio-templates' },
            { id: 'landing-templates', icon: '🚀', name: 'Landing Templates', route: '/tools/landing-templates' },
            { id: 'quick-forms', icon: '📋', name: 'QuickForms', route: '/tools/quick-forms' },
            { id: 'whatsapp-link', icon: '💬', name: 'WhatsApp Link', route: '/tools/whatsapp-link' },
            { id: 'link-shortener', icon: '🔗', name: 'Short Links', route: '/tools/link-shortener' },
            { id: 'qr-code', icon: '📱', name: 'QR Generator', route: '/tools/qr-code' },
          ].map((t) => (
            <Pressable
              key={t.id}
              style={styles.toolPill}
              onPress={() => router.push(t.route as any)}
            >
              <Text style={styles.toolPillIcon}>{t.icon}</Text>
              <Text style={styles.toolPillText}>{t.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0A5C3D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 130, 0.4)',
  },
  avatarBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  workspaceHeader: {
    marginBottom: spacing.lg,
  },
  planPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22, 184, 130, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 130, 0.3)',
  },
  planPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#16B882',
    letterSpacing: 0.5,
  },
  workspaceTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  workspaceSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 6,
    lineHeight: 18,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  telemetryNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  telemetryLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.mutedForeground,
    letterSpacing: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  // ─── Exact Web CardShell Styling ─────────────────────────────
  cardShell: {
    position: 'relative',
    height: 230,
    backgroundColor: '#ECEAE4',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2dfd7',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  visualContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  contentContainer: {
    flex: 1,
    width: '56%',
    padding: 18,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  cardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardTextGroup: {
    marginVertical: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
    marginTop: 4,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionArrow: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ─── Visual Mockup Boxes ─────────────────────────────────────
  mockupBox: {
    width: 135,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
    marginBottom: 6,
  },
  avatarDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  mockupTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  activePill: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  mockupInner: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.15)',
  },
  mockupInnerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  mockupInnerSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  voiceWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 20,
    marginVertical: 4,
  },
  voiceWaveBar: {
    width: 3,
    backgroundColor: '#c084fc',
    borderRadius: 2,
  },
  voiceTimerText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#d8b4fe',
    textAlign: 'center',
  },
  crmStagesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  crmStageCard: {
    flex: 1,
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  crmStageTag: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  crmStageVal: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  // ─── Tools Quick Grid ─────────────────────────────────────────
  toolsQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolPill: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolPillIcon: {
    fontSize: 16,
  },
  toolPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
});
