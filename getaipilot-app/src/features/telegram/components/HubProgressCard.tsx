import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, getColors } from '../../../theme';

interface HubProgressCardProps {
  total: number;
  completed: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const HubProgressCard: React.FC<HubProgressCardProps> = ({
  total,
  completed,
  onRefresh,
  isRefreshing,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const percentage = Math.round((completed / (total || 1)) * 100);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRefresh();
  };

  return (
    <View
      className="rounded-2xl p-3.5 mb-3.5 border shadow-sm shadow-black/5"
      style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
    >
      <View className="flex-row justify-between items-center gap-2 mb-3">
        <View className="flex-1 flex-row items-center gap-2.5 min-w-0">
          <View className="w-9 h-9 rounded-[10px] bg-[#0284C7]/10 justify-center items-center flex-shrink-0">
            <Ionicons name="apps" size={18} color="#0284C7" />
          </View>
          <View className="flex-1 min-w-0">
            <Text
              className="text-sm font-bold tracking-tight"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              Connected Platforms Hub
            </Text>
            <Text className="text-[11px] text-[#64748B] mt-0.5" numberOfLines={1}>
              {completed}/{total} platform modules configured
            </Text>
          </View>
        </View>
        <Pressable
          className={`flex-row items-center gap-1 bg-[#0284C7]/10 px-2 py-1.5 rounded-lg border border-[#0284C7]/20 flex-shrink-0 active:opacity-70 ${
            isRefreshing ? 'opacity-60' : ''
          }`}
          onPress={handleRefresh}
          disabled={isRefreshing}
          hitSlop={6}
        >
          <Ionicons name="refresh" size={12} color="#0284C7" />
          <Text className="text-[11px] font-bold text-[#0284C7]">
            {isRefreshing ? 'Checking...' : 'Refresh'}
          </Text>
        </Pressable>
      </View>

      <View
        className="mt-0.5 p-2.5 rounded-xl"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-[10px] font-bold tracking-wider text-[#64748B]">
            SETUP PROGRESS
          </Text>
          <Text
            className="text-[11px] font-bold"
            style={{ color: percentage === 100 ? '#10B981' : '#0284C7' }}
          >
            {completed}/{total} Completed ({percentage}%)
          </Text>
        </View>
        <View
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.card }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: percentage === 100 ? '#10B981' : '#0284C7',
            }}
          />
        </View>
      </View>
    </View>
  );
};
