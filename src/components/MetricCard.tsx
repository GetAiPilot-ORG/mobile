import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, getColors } from '@/theme';

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
          {label}
        </Text>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {subtext ? <Text style={[styles.subtext, { color: colors.mutedForeground }]}>{subtext}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  icon: {
    fontSize: 14,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 11,
    marginTop: 4,
  },
});
