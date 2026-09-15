import React from 'react';
import { Text, View } from 'react-native';

interface UsageMeterCardProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  color?: string;
}

export const UsageMeterCard: React.FC<UsageMeterCardProps> = ({
  label,
  current,
  max,
  unit = '',
  color = '#0084FF',
}) => {
  const percentage = Math.min(Math.round((current / (max || 1)) * 100), 100);

  return (
    <View className="rounded-xl p-3 mb-2 bg-[#181A1F] border border-[#262930]">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-xs font-semibold text-white">{label}</Text>
        <Text className="text-[11px] font-medium text-slate-400">
          {current.toLocaleString()}{unit} / {max.toLocaleString()}{unit}
        </Text>
      </View>
      <View className="h-1.5 rounded-full overflow-hidden bg-[#111317]">
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
};
