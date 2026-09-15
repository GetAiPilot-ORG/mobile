import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
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

const DEFAULT_HUB_TOOLS: TelegramHubTool[] = [
  {
    key: 'autoforward',
    title: 'GAP Autoforwarding',
    description: 'Mirror and auto-forward messages across public and private Telegram channels automatically.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'AUTOMATION',
    icon: 'git-compare-outline',
  },
  {
    key: 'sub_manager',
    title: 'GAP Sub Manager',
    description: 'Manage gated subscription landing pages and process recurring community payments.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'MONETIZE',
    icon: 'card-outline',
  },
  {
    key: 'tracker',
    title: 'GAP Tracker',
    description: 'Connect Telegram bots, track channel joins, and generate deep tracking invite links.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'POPULAR',
    icon: 'share-social-outline',
  },
  {
    key: 'report_bot',
    title: 'GAP Report Bot',
    description: 'Turn Telegram trading calls and chart screenshots into branded SEBI research report PDFs.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'NEW',
    icon: 'document-text-outline',
  },
  {
    key: 'broadcast',
    title: 'Broadcast Msg',
    description: 'Send high-converting instant announcements and mass broadcasts to all your bot subscribers.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'NEW',
    icon: 'megaphone-outline',
  },
  {
    key: 'auto_approve',
    title: 'GAP Auto Approve',
    description: 'Instantly and automatically accept new group or channel join requests 24/7.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'SMART GATE',
    icon: 'checkmark-done-circle-outline',
  },
  {
    key: 'chatbot',
    title: 'Chat Bot Automation',
    description: 'Deploy intelligent ChatGPT-powered Telegram bots to handle user support & sales queries.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'AI DRIVEN',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    key: 'reactions',
    title: 'GAP Reactions',
    description: 'Boost your post engagement with automated Telegram reaction emoji delivery.',
    isCompleted: true,
    statusText: 'Setup complete',
    badge: 'ENGAGEMENT',
    icon: 'sparkles-outline',
  },
];

const TOOL_TAB_MAP: Record<string, string> = {
  autoforward: 'automations',
  sub_manager: 'sub_manager',
  tracker: 'bots',
  report_bot: 'report_bot',
  broadcast: 'broadcast',
  auto_approve: 'auto_approve',
  chatbot: 'chatbot',
  reactions: 'reactions',
};

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  summary,
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
  const [selectedCategory, setSelectedCategory] = useState<TelegramCategory>('all');

  const hubTools = (summary?.hub?.tools && summary.hub.tools.length > 0)
    ? summary.hub.tools
    : DEFAULT_HUB_TOOLS;

  const hub = summary?.hub || { totalModules: 8, completedModules: 8, tools: hubTools };

  const filteredTools = hubTools.filter((tool: TelegramHubTool) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'automation') return ['autoforward', 'auto_approve', 'chatbot', 'reactions'].includes(tool.key);
    if (selectedCategory === 'monetization') return ['sub_manager', 'report_bot'].includes(tool.key);
    if (selectedCategory === 'growth') return ['broadcast', 'tracker', 'auto_approve', 'reactions'].includes(tool.key);
    return true;
  });

  return (
    <>
      {/* HERO: Command Center */}
      <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-3.5 mb-3.5">
        <View className="flex-col gap-2.5">
          <View className="flex-row items-center gap-2 flex-wrap">
            <View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-full">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-[11px] font-bold text-emerald-400">Database Synced</Text>
            </View>
            <View className="bg-sky-500/10 px-2 py-1 rounded-full">
              <Text className="text-[11px] font-bold text-sky-400">{botsList.length} Bots Connected</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2.5 mt-0.5">
            <Pressable
              className={`flex-1 h-9 flex-row items-center justify-center gap-1.5 bg-[#111317] border border-[#262930] rounded-xl active:opacity-70 ${isRefetching ? 'opacity-60' : ''}`}
              onPress={onRefresh}
              disabled={isRefetching}
            >
              <Ionicons name="refresh-outline" size={14} color="#94A3B8" />
              <Text className="text-xs font-bold text-slate-300">Refresh Data</Text>
            </Pressable>

            <Pressable
              className="flex-1 h-9 flex-row items-center justify-center gap-1.5 bg-[#0084FF] rounded-xl active:opacity-80"
              onPress={() => onOpenModal('tracker')}
            >
              <Ionicons name="add" size={15} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">Connect Bot</Text>
            </Pressable>
          </View>
        </View>

        {/* 6 KPI Cards */}
        <View className="flex-row flex-wrap justify-between gap-y-2 border-t border-[#262930] pt-3 mt-3">
          {[
            { label: 'TRACKED BOTS', value: summary?.trackedBotsCount ?? botsList.length, color: '#0284C7', icon: 'hardware-chip-outline', bg: 'rgba(2,132,199,0.12)', tab: 'bots', sub: 'Connected bots' },
            { label: 'CHANNELS', value: summary?.channelsCount ?? (chats || []).length, color: '#10B981', icon: 'megaphone-outline', bg: 'rgba(16,185,129,0.12)', tab: 'bots', sub: 'Mapped channels' },
            { label: 'DEEP LINKS', value: summary?.deepLinksCount ?? 0, color: '#06B6D4', icon: 'link-outline', bg: 'rgba(6,182,212,0.12)', tab: 'bots', sub: 'Tracked join links' },
            { label: 'FORWARDS', value: (forwardRules || []).length, color: '#8B5CF6', icon: 'git-compare-outline', bg: 'rgba(139,92,246,0.12)', tab: 'automations', sub: 'Active rules' },
            { label: 'SUB PAGES', value: subManagerPages.length || summary?.teleSubPagesCount || (subPlans || []).length, color: '#EC4899', icon: 'wallet-outline', bg: 'rgba(236,72,153,0.12)', tab: 'sub_manager', sub: 'Monetized pages' },
            { label: 'REVENUE', value: `₹${(summary?.revenue ?? 0).toLocaleString()}`, color: '#F59E0B', icon: 'cash-outline', bg: 'rgba(245,158,11,0.12)', tab: 'sub_manager', sub: 'Total collected', isRevenue: true },
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
      <DashboardAnalyticsCharts />

      {/* Progress Card */}
      <HubProgressCard
        total={hub.totalModules || 8}
        completed={hub.completedModules || 8}
        onRefresh={onRefresh}
        isRefreshing={isRefetching}
      />

      {/* Category Filter */}
      <View className="mb-3.5">
        <Text className="text-[15px] font-bold text-white mb-2.5">
          Platform Integration Tools ({filteredTools.length}/8)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-[#0084FF] border-[#0084FF]'
                    : 'bg-[#181A1F] border-[#262930] active:bg-[#20232A]'
                }`}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.key);
                }}
              >
                <Ionicons name={cat.icon as any} size={13} color={isSelected ? '#FFFFFF' : '#94A3B8'} />
                <Text className={`text-xs font-semibold ${isSelected ? 'text-white font-bold' : 'text-slate-300'}`}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tool Cards */}
      {filteredTools.map((tool: TelegramHubTool) => (
        <ToolCard
          key={tool.key}
          tool={tool}
          onPress={() => {
            const targetTab = TOOL_TAB_MAP[tool.key] || tool.key;
            onNavigate(targetTab);
          }}
        />
      ))}
    </>
  );
};
