import React from 'react';
import { View, Text } from 'react-native';

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
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  size = 'md',
  className,
}) => {
  const norm = (variant || status || 'active').toLowerCase();

  let bg = 'bg-emerald-500/15';
  let textColor = '#10B981';
  let displayLabel = label || (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Active');

  if (norm.includes('maint') || norm === 'maintenance') {
    bg = 'bg-red-500/15';
    textColor = '#EF4444';
    displayLabel = label || 'Maintenance';
  } else if (norm.includes('oper') || norm === 'active' || norm === 'verified') {
    bg = 'bg-emerald-500/15';
    textColor = '#10B981';
    displayLabel = label || 'Operational';
  } else if (norm.includes('degrad') || norm === 'warning' || norm === 'trial') {
    bg = 'bg-amber-500/15';
    textColor = '#F59E0B';
    displayLabel = label || 'Degraded';
  } else if (norm.includes('out') || norm === 'expired') {
    bg = 'bg-red-500/15';
    textColor = '#EF4444';
    displayLabel = label || 'Outage';
  }

  return (
    <View
      className={`flex-row items-center self-start ${bg} ${
        size === 'sm' ? 'px-1.5 py-0.5 rounded' : 'px-2 py-1 rounded-md'
      } ${className || ''}`}
    >
      <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: textColor }} />
      <Text
        className={`font-semibold tracking-tight ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}
        style={{ color: textColor }}
      >
        {displayLabel}
      </Text>
    </View>
  );
};
