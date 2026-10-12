import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTheme, getColors } from '../../../theme';

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
      <View
        className="rounded-2xl border p-3.5 mb-3.5"
        style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
      >
        <View className="flex-col gap-2.5">
          <View className="flex-row items-center gap-2 flex-wrap">
            <View
              className="flex-row items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
            >
              <View className="w-[7px] h-[7px] rounded-full bg-[#10B981]" />
              <Text className="text-[11px] font-bold text-[#10B981]">Database Synced</Text>
            </View>
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(2,132,199,0.1)' }}
            >
              <Text className="text-[11px] font-bold text-[#0284C7]">
                {botsList.length} Bots Connected
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 6 KPI Cards in 3 Guaranteed 2-Item Rows */}
      <View
        className="w-full border-t pt-3 mt-1 gap-2 self-stretch mb-3.5"
        style={{ borderTopColor: isDark ? '#27272A' : '#E2E8F0' }}
      >
        {[
          [
            { label: 'TRACKED BOTS', value: botsList.length, color: '#0284C7', icon: 'hardware-chip-outline', bg: 'rgba(2,132,199,0.12)', tab: 'bots', sub: 'Connected bots' },
            { label: 'CHANNELS', value: (chats || []).length, color: '#10B981', icon: 'megaphone-outline', bg: 'rgba(16,185,129,0.12)', tab: 'bots', sub: 'Mapped channels' },
          ],
          [
            { label: 'DEEP LINKS', value: deepLinksCount, color: '#06B6D4', icon: 'link-outline', bg: 'rgba(6,182,212,0.12)', tab: 'bots', sub: 'Tracked join links' },
            { label: 'FORWARDS', value: (forwardRules || []).length, color: '#8B5CF6', icon: 'git-compare-outline', bg: 'rgba(139,92,246,0.12)', tab: 'automations', sub: 'Active rules' },
          ],
          [
            { label: 'SUB PAGES', value: subManagerPages.length || (subPlans || []).length, color: '#EC4899', icon: 'wallet-outline', bg: 'rgba(236,72,153,0.12)', tab: 'sub_manager', sub: 'Monetized pages' },
            { label: 'REVENUE', value: `₹${(realRevenue ?? 0).toLocaleString()}`, color: '#F59E0B', icon: 'cash-outline', bg: 'rgba(245,158,11,0.12)', tab: 'sub_manager', sub: 'Total collected', isRevenue: true },
          ],
        ].map((pair, rowIndex) => (
          <View key={rowIndex} className="flex-row w-full gap-2.5 self-stretch mb-2.5">
            {pair.map((m, colIndex) => (
              <View key={colIndex} className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                <StatCard
                  label={m.label}
                  value={m.value}
                  icon={m.icon}
                  color={m.color}
                  bg={m.bg}
                  sub={m.sub}
                  onPress={() => onNavigate(m.tab)}
                  isRevenue={m.isRevenue}
                />
              </View>
            ))}
          </View>
        ))}
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
      <View className="mb-3.5" style={{ backgroundColor: colors.backgroundSecondary }}>
        <Text className="text-[15px] font-extrabold mb-2.5" style={{ color: colors.text }}>
          Platform Integration Tools ({filteredTools.length}/8)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                className={`flex-row items-center gap-1.5 px-3 py-[7px] rounded-full border ${
                  isSelected
                    ? 'bg-[#0284C7] border-[#0284C7]'
                    : isDark
                      ? 'bg-[#121212] border-[#27272A]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.key);
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={13}
                  color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                />
                <Text
                  className={`text-xs ${isSelected ? 'text-white font-bold' : 'font-semibold'}`}
                  style={isSelected ? undefined : { color: colors.text }}
                >
                  {cat.label}
                </Text>
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

