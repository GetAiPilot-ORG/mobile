import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

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
  const norm = (variant || status || 'active').toLowerCase();

  let bg = colors.accentSoft;
  let textColor = colors.accent;
  let displayLabel = label || (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Active');

  if (norm.includes('maint') || norm === 'maintenance') {
    bg = colors.destructiveSoft;
    textColor = colors.destructive;
    displayLabel = label || 'Maintenance';
  } else if (norm.includes('oper') || norm === 'active' || norm === 'verified') {
    bg = colors.accentSoft;
    textColor = '#16B882';
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
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: textColor }]} />
      <Text
        style={[
          styles.text,
          { color: textColor },
          size === 'sm' && styles.textSm,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  textSm: {
    fontSize: 10,
  },
});
