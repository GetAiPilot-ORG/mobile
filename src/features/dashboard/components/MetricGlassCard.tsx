import React from 'react';
import { Text, View } from 'react-native';

interface MetricGlassCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  accentColor?: string;
}

export const MetricGlassCard: React.FC<MetricGlassCardProps> = ({
  title,
  value,
  subtitle,
  icon,
}) => {
  return (
    <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930] flex-1 min-w-[140px] m-1.5">
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-lg justify-center items-center mr-2 bg-[#111317]">
          <Text className="text-base font-bold">{icon}</Text>
        </View>
        <Text className="text-[12.5px] font-medium tracking-tight text-slate-400">{title}</Text>
      </View>
      <Text className="text-2xl font-bold mt-1 text-white">{value}</Text>
      {subtitle ? <Text className="text-[11px] mt-1 text-slate-400">{subtitle}</Text> : null}
    </View>
  );
};
