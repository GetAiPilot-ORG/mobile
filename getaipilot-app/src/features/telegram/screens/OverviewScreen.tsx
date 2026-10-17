import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';

import {
  SmileIcon,
  UserAdd01Icon,
  File01Icon,
  Forward01Icon,
  CrownIcon,
  CheckmarkCircle01Icon,
  Megaphone01Icon,
  BotMessageSquareIcon,
} from '@hugeicons/core-free-icons';
import { ProductHeading, ProductMetrics, ProductRow, ProductSection, useProductPalette } from '@/components/ProductUI';
import { TelegramHubTool, TelegramToolKey } from '../types';

type TelegramCategory = 'all' | 'automation' | 'monetization' | 'growth';

const CATEGORIES: { key: TelegramCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
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
  const colors = useProductPalette();
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

  const routeByTool: Record<string, string> = {
    tracker: 'bots', autoforward: 'automations', sub_manager: 'sub_manager',
    report_bot: 'report_bot', reactions: 'reactions', auto_approve: 'auto_approve',
    chatbot: 'chatbot', broadcast: 'broadcast',
  };
  const names: Record<string, string> = {
    tracker: 'Join tracker', autoforward: 'Auto forward', sub_manager: 'Subscriptions',
    report_bot: 'Report bot', reactions: 'Reactions', auto_approve: 'Auto approve',
    chatbot: 'AI chatbot', broadcast: 'Broadcasts',
  };
  const descriptions: Record<string, string> = {
    tracker: 'Follow channel joins and invite links.', autoforward: 'Route messages between channels.',
    sub_manager: 'Manage paid access to your community.', report_bot: 'Create research reports from trading calls.',
    reactions: 'Manage reactions on channel posts.', auto_approve: 'Accept channel join requests automatically.',
    chatbot: 'Set up automated replies.', broadcast: 'Send a message to your subscribers.',
  };
  const TOOL_ICONS: Record<string, any> = {
    reactions: SmileIcon,
    tracker: UserAdd01Icon,
    report_bot: File01Icon,
    autoforward: Forward01Icon,
    sub_manager: CrownIcon,
    auto_approve: CheckmarkCircle01Icon,
    chatbot: BotMessageSquareIcon,
    broadcast: Megaphone01Icon,
  };
  const tones = ['mint', 'lavender', 'peach', 'pink'] as const;
  return (
    <View>
      <ProductHeading title={"Your community,\nunder control."} />
      <ProductMetrics items={[
        { label: 'Bots', value: botsList.length, onPress: () => onNavigate('bots') },
        { label: 'Channels', value: chats.length, onPress: () => onNavigate('bots') },
        { label: 'Revenue', value: '₹' + realRevenue.toLocaleString(), onPress: () => onNavigate('sub_manager') },
      ]} />
      <View style={{ backgroundColor: colors.mint, borderRadius: 26, padding: 22, marginBottom: 26, gap: 18 }}>
        <Text style={{ fontSize: 21, fontWeight: '500', color: colors.text }}>Keep things moving</Text>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View style={{ flex: 1, gap: 5 }}><Text style={{ fontSize: 24, color: colors.text }}>{forwardRules.length}</Text><Text style={{ fontSize: 12, color: colors.textSecondary }}>Forwarding rules</Text></View>
          <View style={{ flex: 1, gap: 5 }}><Text style={{ fontSize: 24, color: colors.text }}>{deepLinksCount}</Text><Text style={{ fontSize: 12, color: colors.textSecondary }}>Tracking links</Text></View>
        </View>
        <Pressable onPress={() => onNavigate('automations')} accessibilityRole="button" accessibilityLabel="Manage forwarding rules" style={{ alignSelf: 'flex-start', backgroundColor: colors.buttonPrimary, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18 }}><Text style={{ color: colors.buttonPrimaryForeground, fontSize: 13 }}>Manage rules</Text></Pressable>
      </View>
      <ProductSection title="Your tools">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          {CATEGORIES.map((cat) => <Pressable key={cat.key} onPress={() => setSelectedCategory(cat.key)} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === cat.key }} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 24, backgroundColor: selectedCategory === cat.key ? colors.lavender : colors.card }}><Text style={{ fontSize: 13, color: selectedCategory === cat.key ? colors.accent : colors.textSecondary }}>{cat.label}</Text></Pressable>)}
        </ScrollView>
        {filteredTools.map((tool, index) => <ProductRow key={tool.key} title={names[tool.key] || tool.title} detail={descriptions[tool.key] || tool.description} icon={TOOL_ICONS[tool.key] || tool.icon} tone={tones[index % 4]} onPress={() => routeByTool[tool.key] ? onNavigate(routeByTool[tool.key]) : onOpenModal(tool.key)} />)}
      </ProductSection>
    </View>
  );
};
