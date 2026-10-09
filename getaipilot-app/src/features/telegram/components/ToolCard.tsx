import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View, Platform } from 'react-native';
import { useTheme, getColors } from '@/theme';
import { TelegramHubTool } from '../types';

interface ToolCardProps {
  tool: TelegramHubTool;
  onPress: () => void;
}

interface ToolVisualConfig {
  gradient: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  badgeColor: string;
  badgeBg: string;
}

const TOOL_VISUAL_MAP: Record<string, ToolVisualConfig> = {
  reactions: {
    gradient: ['#6366F1', '#8B5CF6'],
    icon: 'sparkles',
    badge: 'ENGAGEMENT',
    badgeColor: '#818CF8',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
  },
  tracker: {
    gradient: ['#0284C7', '#0369A1'],
    icon: 'share-social',
    badge: 'POPULAR',
    badgeColor: '#38BDF8',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
  },
  report_bot: {
    gradient: ['#10B981', '#059669'],
    icon: 'document-text',
    badge: 'SEBI',
    badgeColor: '#34D399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  autoforward: {
    gradient: ['#3B82F6', '#1D4ED8'],
    icon: 'git-compare-outline',
    badge: 'AUTOMATION',
    badgeColor: '#60A5FA',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  sub_manager: {
    gradient: ['#A855F7', '#7E22CE'],
    icon: 'card',
    badge: 'MONETIZE',
    badgeColor: '#C084FC',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
  },
  auto_approve: {
    gradient: ['#14B8A6', '#0D9488'],
    icon: 'checkmark-circle-outline',
    badge: 'SMART GATE',
    badgeColor: '#2DD4BF',
    badgeBg: 'rgba(20, 184, 166, 0.15)',
  },
  chatbot: {
    gradient: ['#F43F5E', '#E11D48'],
    icon: 'chatbubbles',
    badge: 'AI DRIVEN',
    badgeColor: '#FB7185',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
  },
  broadcast: {
    gradient: ['#F59E0B', '#D97706'],
    icon: 'megaphone',
    badge: 'BROADCAST',
    badgeColor: '#FBBF24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
};

const DEFAULT_VISUAL: ToolVisualConfig = {
  gradient: ['#64748B', '#475569'],
  icon: 'cube-outline',
  badge: 'MODULE',
  badgeColor: '#94A3B8',
  badgeBg: 'rgba(100, 116, 139, 0.15)',
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onPress }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const visual = TOOL_VISUAL_MAP[tool.key] || DEFAULT_VISUAL;
  const badgeText = tool.badge || visual.badge;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      className="rounded-2xl border p-3.5 mb-3 active:opacity-85 shadow-sm shadow-black/5"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      onPress={handlePress}
    >
      {/* Top Row: Icon + Title & Badge */}
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-1 flex-row items-center gap-3 mr-2 min-w-0">
          <LinearGradient
            colors={visual.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl justify-center items-center shadow-sm shadow-black/20"
            style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 50 }}
          >
            <Ionicons name={visual.icon} size={22} color="#FFFFFF" />
          </LinearGradient>
          <View className="flex-1 min-w-0">
            <Text
              className="text-[15px] font-bold tracking-tight"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {tool.title}
            </Text>
            <Text className="text-[11px] text-[#64748B] mt-0.5">
              Telegram Integration
            </Text>
          </View>
        </View>

        {badgeText ? (
          <View
            className="px-2 py-1 rounded-full self-start"
            style={{ backgroundColor: visual.badgeBg }}
          >
            <Text
              className="text-[10px] font-extrabold tracking-wider"
              style={{ color: visual.badgeColor }}
            >
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      <Text
        className="text-[12.5px] leading-[18px] text-[#94A3B8] mb-3"
        numberOfLines={2}
      >
        {tool.description}
      </Text>

      {/* Bottom Footer: Launch action button */}
      <View
        className="flex-row justify-between items-center border-t pt-2.5"
        style={{ borderTopColor: isDark ? '#27272A' : '#F1F5F9' }}
      >
        <Text
          className="text-xs font-bold tracking-tight"
          style={{ color: visual.badgeColor }}
        >
          Launch Module
        </Text>
        <View
          className="w-6 h-6 rounded-full justify-center items-center"
          style={{ backgroundColor: visual.badgeBg }}
        >
          <Ionicons
            name="arrow-forward"
            size={13}
            color={visual.badgeColor}
          />
        </View>
      </View>
    </Pressable>
  );
};
