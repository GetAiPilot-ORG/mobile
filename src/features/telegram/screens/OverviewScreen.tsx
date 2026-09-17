import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { HubProgressCard, ToolCard, DashboardAnalyticsCharts } from '../components';
import { StatCard } from '../components/ui/StatCard';
import { TelegramToolKey, TelegramHubTool } from '../types';

type TelegramCategory = 'all' | 'automation' | 'monetization' | 'growth';

const CATEGORIES: { key: TelegramCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All 8 Tools', icon: 'grid-outline' },
  { key: 'automation', label: 'Automation', icon: 'git-compare-outline' },
  { key: 'monetization', label: 'Monetization', icon: 'card-outline' },
  { key: 'growth', label: 'Growth', icon: 'trending-up-outline' },
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState<TelegramCategory>('all');

  const hub = summary?.hub || { totalModules: 8, completedModules: 8, tools: [] };

  const filteredTools = (hub.tools || []).filter((tool: TelegramHubTool) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'automation') return ['autoforward', 'auto_approve', 'chatbot', 'reactions'].includes(tool.key);
    if (selectedCategory === 'monetization') return ['sub_manager', 'report_bot'].includes(tool.key);
    if (selectedCategory === 'growth') return ['broadcast', 'tracker', 'auto_approve', 'reactions'].includes(tool.key);
    return true;
  });

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;

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

        {/* 6 KPI Cards */}
        <View style={[styles.metricsGrid, isDark ? styles.borderDark : styles.borderLight, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          {[
            { label: 'TRACKED BOTS', value: botsList.length, color: '#0284C7', icon: 'hardware-chip-outline', bg: 'rgba(2,132,199,0.12)', tab: 'bots', sub: 'Connected bots' },
            { label: 'CHANNELS', value: (chats || []).length, color: '#10B981', icon: 'megaphone-outline', bg: 'rgba(16,185,129,0.12)', tab: 'bots', sub: 'Mapped channels' },
            { label: 'DEEP LINKS', value: deepLinksCount, color: '#06B6D4', icon: 'link-outline', bg: 'rgba(6,182,212,0.12)', tab: 'bots', sub: 'Tracked join links' },
            { label: 'FORWARDS', value: (forwardRules || []).length, color: '#8B5CF6', icon: 'git-compare-outline', bg: 'rgba(139,92,246,0.12)', tab: 'automations', sub: 'Active rules' },
            { label: 'SUB PAGES', value: subManagerPages.length || (subPlans || []).length, color: '#EC4899', icon: 'wallet-outline', bg: 'rgba(236,72,153,0.12)', tab: 'sub_manager', sub: 'Monetized pages' },
            { label: 'REVENUE', value: `₹${(realRevenue ?? 0).toLocaleString()}`, color: '#F59E0B', icon: 'cash-outline', bg: 'rgba(245,158,11,0.12)', tab: 'sub_manager', sub: 'Total collected', isRevenue: true },
          ].map((m, i) => (
            <StatCard
              key={i}
              label={m.label}
              value={m.value}
              icon={m.icon}
              color={m.color}
              bg={m.bg}
              sub={m.sub}
              onPress={() => onNavigate(m.tab)}
              isRevenue={m.isRevenue}
            />
          ))}
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
      <View style={styles.categorySection}>
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
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  metricCard: { width: '48.5%', padding: 10, borderRadius: 12, borderWidth: 1, justifyContent: 'space-between', minHeight: 88 },
  metricCardLight: { backgroundColor: 'rgba(248,250,252,0.9)', borderColor: '#E2E8F0' },
  metricCardDark: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  metricCardPressed: { opacity: 0.75 },
  metricHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metricLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.4, flex: 1 },
  metricIconWrap: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  metricFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metricSub: { fontSize: 10, color: '#64748B', fontWeight: '500', flex: 1 },
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
