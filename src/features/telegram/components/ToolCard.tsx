import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramHubTool } from '../types';

interface ToolCardProps {
  tool: TelegramHubTool;
  onPress: () => void;
}

interface ToolVisualConfig {
  gradient: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
}

const TOOL_VISUAL_MAP: Record<string, ToolVisualConfig> = {
  reactions: {
    gradient: ['#8B5CF6', '#6366F1'],
    icon: 'sparkles',
  },
  tracker: {
    gradient: ['#0284C7', '#0369A1'],
    icon: 'share-social',
  },
  autoforward: {
    gradient: ['#0EA5E9', '#0284C7'],
    icon: 'paper-plane',
  },
  sub_manager: {
    gradient: ['#F43F5E', '#DB2777'],
    icon: 'wallet',
  },
  report_bot: {
    gradient: ['#10B981', '#047857'],
    icon: 'shield-checkmark',
  },
  broadcast: {
    gradient: ['#F59E0B', '#D97706'],
    icon: 'megaphone',
  },
  auto_approve: {
    gradient: ['#14B8A6', '#0F766E'],
    icon: 'checkmark-circle',
  },
  chatbot: {
    gradient: ['#6366F1', '#4F46E5'],
    icon: 'hardware-chip',
  },
};

const DEFAULT_VISUAL: ToolVisualConfig = {
  gradient: ['#0284C7', '#0369A1'],
  icon: 'apps',
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onPress }) => {
  const visual = TOOL_VISUAL_MAP[tool.key] || DEFAULT_VISUAL;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      className="flex-row items-center px-3.5 py-3 rounded-2xl border border-[#262930] bg-[#181A1F] mb-2.5 gap-3 active:opacity-85"
      onPress={handlePress}
    >
      {/* Left: Rich Gradient App Icon */}
      <LinearGradient
        colors={visual.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-11 h-11 rounded-xl justify-center items-center shadow-md"
      >
        <Ionicons name={visual.icon} size={22} color="#FFFFFF" />
      </LinearGradient>

      {/* Middle: Title & Description */}
      <View className="flex-1 justify-center">
        <View className="flex-row items-center mb-0.5">
          <Text
            className="text-[15px] font-bold text-white tracking-tight"
            numberOfLines={1}
          >
            {tool.title}
          </Text>
          {tool.badge === 'NEW' && (
            <View className="bg-emerald-500/15 px-1.5 py-0.5 rounded ml-1.5 border border-emerald-500/30">
              <Text className="text-emerald-400 text-[9px] font-extrabold tracking-wider">NEW</Text>
            </View>
          )}
        </View>
        <Text className="text-slate-400 text-xs leading-4 mt-0.5" numberOfLines={2}>
          {tool.description}
        </Text>
      </View>

      {/* Right: Sleek Chevron Arrow */}
      <Ionicons
        name="chevron-forward"
        size={18}
        color="#94A3B8"
      />
    </Pressable>
  );
};
