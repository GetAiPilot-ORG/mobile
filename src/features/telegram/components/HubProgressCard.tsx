import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  const percentage = Math.round((completed / (total || 1)) * 100);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRefresh();
  };

  return (
    <View className="rounded-2xl p-3.5 mb-3.5 border bg-[#181A1F] border-[#262930]">
      <View className="flex-row justify-between items-center gap-2 mb-3">
        <View className="flex-1 flex-row items-center gap-2.5 min-w-0">
          <View className="w-9 h-9 rounded-xl bg-[#0084FF]/10 justify-center items-center shrink-0">
            <Ionicons name="apps" size={18} color="#0084FF" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-bold tracking-tight text-white" numberOfLines={1}>
              Connected Platforms Hub
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
              {completed}/{total} platform modules configured
            </Text>
          </View>
        </View>
        <Pressable
          className={`flex-row items-center gap-1 bg-[#0084FF]/10 px-2 py-1 rounded-lg border border-[#0084FF]/20 shrink-0 ${
            isRefreshing ? 'opacity-60' : 'active:opacity-80'
          }`}
          onPress={handleRefresh}
          disabled={isRefreshing}
          hitSlop={6}
        >
          <Ionicons name="refresh" size={12} color="#0084FF" />
          <Text className="text-[#0084FF] text-xs font-bold">{isRefreshing ? 'Checking...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View className="mt-0.5">
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-slate-400 text-[10px] font-bold tracking-wider">SETUP PROGRESS</Text>
          <Text className={`text-xs font-bold ${percentage === 100 ? 'text-emerald-400' : 'text-[#0084FF]'}`}>
            {completed}/{total} Completed ({percentage}%)
          </Text>
        </View>
        <View className="h-1.5 rounded-full overflow-hidden bg-[#111317]">
          <View
            className={`h-full rounded-full ${percentage === 100 ? 'bg-emerald-400' : 'bg-[#0084FF]'}`}
            style={{ width: `${percentage}%` }}
          />
        </View>
      </View>
    </View>
  );
};

