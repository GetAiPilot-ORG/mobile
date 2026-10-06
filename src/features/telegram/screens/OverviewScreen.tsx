import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme, getColors } from '@/theme';

import { DashboardAnalyticsCharts, HubProgressCard, ToolCard } from '../components';
import { StatCard } from '../components/ui/StatCard';
import { TelegramHubTool, TelegramToolKey } from '../types';

type TelegramCategory = 'all' | 'automation' | 'monetization' | 'growth';

const CATEGORIES: { key: TelegramCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All 8 Tools', icon: 'grid-outline' },
  { key: 'automation', label: 'Automation', icon: 'git-compare-outline' },
  { key: 'monetization', label: 'Monetization', icon: 'card-outline' },
  { key: 'growth', label: 'Growth', icon: 'trending-up-outline' },
];

const DEFAULT_TELEGRAM_TOOLS: TelegramHubTool[] = [
  {
    key: 'tracker',
    title: 'GAP Tracker',
    description: 'Connect Telegram bots, track channel joins, and generate deep tracking invite links.',
    badge: 'POPULAR',
    isCompleted: true,
    statusText: 'Active',
    icon: 'share-social',
  },
  {
    key: 'sub_manager',
    title: 'GAP Sub Manager',
    description: 'Manage gated subscription landing pages and process recurring community payments.',
    badge: 'MONETIZE',
    isCompleted: true,
    statusText: 'Active',
    icon: 'card',
  },
  {
    key: 'autoforward',
    title: 'GAP Autoforwarding',
    description: 'Mirror and auto-forward messages across public and private Telegram channels automatically.',
    badge: 'AUTOMATION',
    isCompleted: true,
    statusText: 'Active',
    icon: 'git-compare-outline',
  },
  {
    key: 'report_bot',
    title: 'GAP Report Bot',
    description: 'Turn Telegram trading calls and chart screenshots into branded SEBI research report PDFs.',
    badge: 'SEBI',
    isCompleted: true,
    statusText: 'Active',
    icon: 'document-text',
  },
  {
    key: 'reactions',
    title: 'GAP Reactions',
    description: 'Boost your post engagement with automated Telegram reaction emoji delivery.',
    badge: 'ENGAGEMENT',
    isCompleted: true,
    statusText: 'Active',
    icon: 'sparkles',
  },
  {
    key: 'auto_approve',
    title: 'Auto-Approve Bot',
    description: 'Instantly and automatically accept new group or channel join requests 24/7.',
    badge: 'SMART GATE',
    isCompleted: true,
    statusText: 'Active',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'chatbot',
    title: 'AI Chat Bot',
    description: 'Deploy intelligent ChatGPT-powered Telegram bots to handle user support & sales queries.',
    badge: 'AI DRIVEN',
    isCompleted: true,
    statusText: 'Active',
    icon: 'chatbubbles',
  },
  {
    key: 'broadcast',
    title: 'Broadcast Msg',
    description: 'Send high-converting instant announcements and mass broadcasts to all your bot subscribers.',
    badge: 'BROADCAST',
    isCompleted: true,
    statusText: 'Active',
    icon: 'megaphone',
  },
];

interface OverviewScreenProps {
  summary: any;
  realRevenue: number;
  deepLinksCount: number;
  botsList: any[];
  chats: any[];
  forwardRules: any[];
  subManagerPages: any[];
  subPlans: any[];
  isRefetching: boolean;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  onOpenModal: (key: TelegramToolKey) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  summary,
  realRevenue,
  deepLinksCount,
  botsList,
  chats,
  forwardRules,
  subManagerPages,
  subPlans,
  isRefetching,
  onRefresh,
  onNavigate,
  onOpenModal,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark)
  const [selectedCategory, setSelectedCategory] = useState<TelegramCategory>('all');

  const hub = summary?.hub || { totalModules: 8, completedModules: 8, tools: [] };

  const toolsSource: TelegramHubTool[] =
    hub.tools && hub.tools.length > 0
      ? hub.tools.map((t: TelegramHubTool) => {
          const defaultDef = DEFAULT_TELEGRAM_TOOLS.find((d) => d.key === t.key);
          return {
            ...t,
            badge: t.badge || defaultDef?.badge,
            description: t.description || t.statusText || defaultDef?.description || '',
          };
        })
      : DEFAULT_TELEGRAM_TOOLS;

  const filteredTools = toolsSource.filter((tool: TelegramHubTool) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'automation') return ['autoforward', 'auto_approve', 'chatbot', 'reactions'].includes(tool.key);
    if (selectedCategory === 'monetization') return ['sub_manager', 'report_bot'].includes(tool.key);
    if (selectedCategory === 'growth') return ['broadcast', 'tracker', 'auto_approve', 'reactions'].includes(tool.key);
    return true;
  });

  const card = { backgroundColor: colors.card };
  const txt = { color: colors.text };

  return (
    <>
      {/* HERO: Command Center */}
      <View style={[styles.commandCenterCard, card]}>
        <View style={styles.commandHeader}>
          <View style={styles.sessionPillRow}>
            <View style={styles.syncedBadge}>
              <View style={styles.dotGreen} />
              <Text style={styles.syncedBadgeText}>Database Synced</Text>
            </View>
            <View style={styles.botCountBadge}>
              <Text style={styles.botCountBadgeText}>{botsList.length} Bots Connected</Text>
            </View>
          </View>

          <View style={styles.headerBtnGroup}>
            <Pressable
              style={[styles.refreshBtn, isDark ? styles.refreshBtnDark : styles.refreshBtnLight, isRefetching && { opacity: 0.6 }]}
              onPress={onRefresh}
              disabled={isRefetching}
            >
              <Ionicons name="refresh-outline" size={14} color={isDark ? '#94A3B8' : '#475569'} />
              <Text style={[styles.refreshBtnText, txt]}>Refresh Data</Text>
            </Pressable>

            <Pressable style={styles.connectBtn} onPress={() => onOpenModal('tracker')}>
              <Ionicons name="add" size={15} color="#FFFFFF" />
              <Text style={styles.connectBtnText}>Connect Bot</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 6 Standalone KPI Cards - Identical Layout to Tracker */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <StatCard
            label="TRACKED BOTS"
            value={botsList.length}
            icon="hardware-chip"
            color="#0284C7"
            bg="rgba(2,132,199,0.15)"
            sub="Connected bots"
            onPress={() => onNavigate('bots')}
          />
          <StatCard
            label="CHANNELS"
            value={(chats || []).length}
            icon="megaphone"
            color="#10B981"
            bg="rgba(16,185,129,0.15)"
            sub="Mapped channels"
            onPress={() => onNavigate('bots')}
          />
        </View>

        <View style={styles.metricsRow}>
          <StatCard
            label="DEEP LINKS"
            value={deepLinksCount}
            icon="link"
            color="#06B6D4"
            bg="rgba(6,182,212,0.15)"
            sub="Tracked join links"
            onPress={() => onNavigate('bots')}
          />
          <StatCard
            label="FORWARDS"
            value={(forwardRules || []).length}
            icon="git-compare"
            color="#8B5CF6"
            bg="rgba(139,92,246,0.15)"
            sub="Active rules"
            onPress={() => onNavigate('automations')}
          />
        </View>

        <View style={styles.metricsRow}>
          <StatCard
            label="SUB PAGES"
            value={subManagerPages.length || (subPlans || []).length}
            icon="wallet"
            color="#EC4899"
            bg="rgba(236,72,153,0.15)"
            sub="Monetized pages"
            onPress={() => onNavigate('sub_manager')}
          />
          <StatCard
            label="REVENUE"
            value={`₹${(realRevenue ?? 0).toLocaleString()}`}
            icon="cash"
            color="#F59E0B"
            bg="rgba(245,158,11,0.15)"
            sub="Total collected"
            onPress={() => onNavigate('sub_manager')}
          />
        </View>
      </View>

      {/* Analytics Charts */}
      <DashboardAnalyticsCharts
        joinsCount={deepLinksCount}
        revenue={realRevenue}
      />

      {/* Progress Card */}
      <HubProgressCard
        total={hub.totalModules || 8}
        completed={hub.completedModules || 8}
        onRefresh={onRefresh}
        isRefreshing={isRefetching}
      />

      {/* Category Filter */}
      <View style={[styles.categorySection, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, txt]}>
          Platform Integration Tools ({filteredTools.length}/8)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                style={[styles.catPill, isDark ? styles.pillDark : styles.pillLight, isSelected && styles.catPillSelected]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.key);
                }}
              >
                <Ionicons name={cat.icon as any} size={13} color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} />
                <Text style={[styles.catPillText, txt, isSelected && styles.catPillTextSelected]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tool Cards */}
      {filteredTools.map((tool: TelegramHubTool) => (
        <ToolCard key={tool.key} tool={tool} onPress={() => onOpenModal(tool.key)} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  borderLight: { borderTopColor: '#E2E8F0' },
  borderDark: { borderTopColor: '#27272A' },
  commandCenterCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  commandHeader: { flexDirection: 'column', gap: 10 },
  sessionPillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  syncedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  dotGreen: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' },
  syncedBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  botCountBadge: { backgroundColor: 'rgba(2,132,199,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  botCountBadgeText: { fontSize: 11, fontWeight: '700', color: '#0284C7' },
  headerBtnGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  refreshBtn: { flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 10 },
  refreshBtnLight: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
  refreshBtnDark: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
  refreshBtnText: { fontSize: 12, fontWeight: '700' },
  connectBtn: { flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0284C7', borderRadius: 10 },
  connectBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  metricsContainer: {
    width: '100%',
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  categorySection: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  categoryScroll: { gap: 8, paddingBottom: 4 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  pillDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  catPillSelected: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  catPillText: { fontSize: 12, fontWeight: '600' },
  catPillTextSelected: { color: '#FFFFFF', fontWeight: '700' },
});
