import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCrmTheme } from '../hooks/useCrmTheme';
import { useTheme, getColors } from '@/theme';

interface CrmStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors?: [string, string];
  trend?: string;
  progress?: number;
  onPress?: () => void;
}

export const CrmStatCard: React.FC<CrmStatCardProps> = ({
  label,
  value,
  sub,
  icon,
  gradientColors,
  trend,
  progress,
  onPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { gradient } = useCrmTheme();
  const activeGradient = gradientColors || gradient;

  return (
    <Pressable
      className="flex-1 min-w-0 rounded-2xl overflow-hidden shadow-md shadow-black/15 active:opacity-90 active:scale-[0.98]"
      style={{ flexBasis: 0 }}
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient
        colors={activeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4 rounded-2xl border border-white/10"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="w-[34px] h-[34px] rounded-[10px] bg-white/20 items-center justify-center">
            <Ionicons name={icon} size={18} color="#FFFFFF" />
          </View>
          {trend ? (
            <View className="flex-row items-center gap-1 bg-[#10B981]/20 px-1.5 py-0.5 rounded-md">
              <Ionicons name="trending-up" size={12} color="#10B981" />
              <Text className="text-[#10B981] text-[11px] font-semibold">{trend}</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-2xl font-bold text-white tracking-tight" numberOfLines={1}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text className="text-[13px] font-semibold text-white/85 mt-1" numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text className="text-[11px] text-white/60 mt-0.5" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}

        {typeof progress === 'number' ? (
          <View className="h-1 rounded-full bg-white/20 mt-2.5 overflow-hidden">
            <View
              className="h-full rounded-full bg-[#10B981]"
              style={{ width: `${Math.min(Math.max(progress * 100, 4), 100)}%` }}
            />
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
};
