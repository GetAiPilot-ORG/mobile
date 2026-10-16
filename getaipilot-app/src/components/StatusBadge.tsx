import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export type StatusVariant =
  | 'operational'
  | 'maintenance'
  | 'degraded'
  | 'outage'
  | 'active'
  | 'expired'
  | 'trial'
  | 'verified';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  size = 'md',
}) => {
  const { colors } = useTheme();
  const norm = (variant || status || 'active').toLowerCase();

  let bg = colors.accentSoft;
  let textColor = colors.accent;
  let displayLabel = label || (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Active');

  if (norm.includes('maint') || norm === 'maintenance') {
    bg = colors.destructiveSoft;
    textColor = colors.destructive;
    displayLabel = label || 'Maintenance';
  } else if (norm.includes('oper') || norm === 'active' || norm === 'verified') {
    bg = colors.successSoft;
    textColor = colors.success;
    displayLabel = label || 'Operational';
  } else if (norm.includes('degrad') || norm === 'warning' || norm === 'trial') {
    bg = colors.warningSoft;
    textColor = colors.warning;
    displayLabel = label || 'Degraded';
  } else if (norm.includes('out') || norm === 'expired') {
    bg = colors.destructiveSoft;
    textColor = colors.destructive;
    displayLabel = label || 'Outage';
  }

  return (
    <View
      className={`flex-row items-center self-start ${
        size === 'sm' ? 'px-1.5 py-0.5 rounded' : 'px-2 py-1 rounded-md'
      }`}
      style={{ backgroundColor: bg }}
    >
      <View
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: textColor }}
      />
      <Text
        className={`font-semibold tracking-tight ${
          size === 'sm' ? 'text-[10px]' : 'text-[11.5px]'
        }`}
        style={{ color: textColor }}
      >
        {displayLabel}
      </Text>
    </View>
  );
};
