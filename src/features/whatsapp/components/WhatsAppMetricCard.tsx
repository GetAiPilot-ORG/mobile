import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface WhatsAppMetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  ioniconsName?: IoniconsName;
  iconColor?: string;
  trend?: string;
}

export const WhatsAppMetricCard: React.FC<WhatsAppMetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  ioniconsName,
  iconColor = '#22C55E',
  trend,
}) => {
  return (
    <View className="flex-1 min-w-[47%] bg-[#181A1F] border border-[#262930] rounded-2xl p-3.5">
      {/* Top row with Label & Icon badge */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-xs font-semibold text-slate-400">
          {label}
        </Text>
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          {ioniconsName ? (
            <Ionicons name={ioniconsName} size={15} color={iconColor} />
          ) : (
            <Text className="text-sm">{icon || '📊'}</Text>
          )}
        </View>
      </View>

      {/* Value */}
      <Text className="text-xl font-bold text-white mb-0.5">
        {value}
      </Text>

      {/* Subtext */}
      {subtext ? (
        <Text className="text-xs text-slate-400">
          {subtext}
        </Text>
      ) : null}

      {/* Optional Trend */}
      {trend ? <Text className="text-[11px] font-semibold text-emerald-400 mt-1">{trend}</Text> : null}
    </View>
  );
};
