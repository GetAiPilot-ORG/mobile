import React from 'react';
import { Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getColors } from '@/theme';

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View
      className={`flex-1 w-full min-w-0 rounded-2xl p-3 sm:p-3.5 border justify-between shadow-sm ${
        isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-[#E5E7EB]'
      }`}
      style={{
        flexBasis: Platform.OS === 'web' ? 'auto' : 0,
        minHeight: Platform.OS === 'web' ? 96 : 88,
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
      }}
    >
      {/* Top row with Label & Icon badge */}
      <View className="flex-row items-center justify-between mb-2 w-full">
        <Text
          className={`text-xs font-semibold tracking-tight flex-1 mr-1.5 ${
            isDark ? 'text-[#8E8E93]' : 'text-[#6B7280]'
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
        <View
          className="w-7 h-7 rounded-lg items-center justify-center shrink-0"
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
      <Text
        className={`text-xl sm:text-2xl font-bold tracking-tight mb-0.5 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>

      {/* Subtext */}
      {subtext ? (
        <Text
          className={`text-xs font-normal ${
            isDark ? 'text-[#8E8E93]' : 'text-[#6B7280]'
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {subtext}
        </Text>
      ) : null}

      {/* Optional Trend */}
      {trend ? (
        <Text
          className="text-[11px] font-semibold text-emerald-500 mt-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {trend}
        </Text>
      ) : null}
    </View>
  );
};
