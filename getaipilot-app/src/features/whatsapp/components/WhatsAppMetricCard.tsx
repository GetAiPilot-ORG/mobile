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
      className={`flex-1 w-full min-w-0 rounded-[24px] p-3 sm:p-3.5 border-0 justify-between  ${
        isDark ? 'bg-[#252230] border-[#3A3549]' : 'bg-white border-transparent'
      }`}
      style={{
        flexBasis: Platform.OS === 'web' ? 'auto' : 0,
        minHeight: Platform.OS === 'web' ? 96 : 88,
        backgroundColor: colors.card,
        borderWidth: 0,
        borderColor: 'transparent',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 4,
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
          ) : icon && icon.length > 2 ? (
            <Ionicons name={icon as IoniconsName} size={15} color={iconColor} />
          ) : (
            <Ionicons name="stats-chart-outline" size={15} color={iconColor} />
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
