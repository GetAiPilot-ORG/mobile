import React from 'react';
import { View, Text, useColorScheme } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
  icon?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  badge,
  badgeColor = '#10B981',
  icon,
  className,
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className={`flex-1 rounded-2xl p-3.5 border ${
        isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200 shadow-sm"
      } ${className || ''}`}
    >
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className={`text-xs font-medium tracking-tight ${isDark ? "text-slate-400" : "text-slate-500"}`} numberOfLines={1}>
          {label}
        </Text>
        {icon ? <Text className="text-sm">{icon}</Text> : null}
      </View>
      <View className="flex-row items-baseline gap-2">
        <Text className={`text-[22px] font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
          {value}
        </Text>
        {badge ? (
          <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: `${badgeColor}20` }}>
            <Text className="text-[10.5px] font-semibold" style={{ color: badgeColor }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {subtext ? <Text className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtext}</Text> : null}
    </View>
  );
};
