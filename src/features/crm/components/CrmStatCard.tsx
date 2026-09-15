import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CrmStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  trend?: string;
  onPress?: () => void;
}

export const CrmStatCard: React.FC<CrmStatCardProps> = ({
  label,
  value,
  sub,
  icon,
  gradientColors,
  trend,
  onPress,
}) => {
  return (
    <Pressable
      className="flex-1 min-w-[140px] rounded-2xl overflow-hidden active:opacity-90 active:scale-95"
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4 rounded-2xl border border-white/10"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center">
            <Ionicons name={icon} size={18} color="#FFFFFF" />
          </View>
          {trend ? (
            <View className="flex-row items-center gap-1 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
              <Ionicons name="trending-up" size={11} color="#10B981" />
              <Text className="text-[11px] font-bold text-emerald-400">{trend}</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-2xl font-extrabold text-white tracking-tight" numberOfLines={1}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text className="text-xs font-semibold text-white/80 mt-1" numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text className="text-[11px] text-white/60 mt-0.5" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
};
