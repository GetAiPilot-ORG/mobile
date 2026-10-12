import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
  icon?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  badge,
  badgeColor = '#16B882',
  icon,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      className="flex-1 min-w-0 rounded-2xl p-3.5 border shadow-sm"
      style={{
        flexBasis: 0,
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
      }}
    >
      <View className="flex-row justify-between items-center mb-1.5">
        <Text
          className="text-[12.5px] font-medium tracking-tight flex-1 mr-1"
          style={{ color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {icon ? <Text className="text-sm">{icon}</Text> : null}
      </View>
      <View className="flex-row items-baseline gap-2">
        <Text
          className="text-[22px] font-bold tracking-tight"
          style={{ color: colors.cardForeground }}
        >
          {value}
        </Text>
        {badge ? (
          <View
            className="px-1.5 py-0.5 rounded"
            style={{ backgroundColor: badgeColor + '20' }}
          >
            <Text className="text-[10.5px] font-semibold" style={{ color: badgeColor }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {subtext ? (
        <Text
          className="text-[11px] mt-1"
          style={{ color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {subtext}
        </Text>
      ) : null}
    </View>
  );
};
