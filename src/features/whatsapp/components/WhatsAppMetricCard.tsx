import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      {/* Top row with Label & Icon badge */}
      <View style={styles.topRow}>
        <Text style={[styles.label, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          {ioniconsName ? (
            <Ionicons name={ioniconsName} size={15} color={iconColor} />
          ) : (
            <Text style={styles.emojiIcon}>{icon || '📊'}</Text>
          )}
        </View>
      </View>

      {/* Value */}
      <Text style={[styles.value, isDark ? styles.textLight : styles.textDark]} numberOfLines={1}>
        {value}
      </Text>

      {/* Subtext */}
      {subtext ? (
        <Text style={[styles.subtext, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}

      {/* Optional Trend */}
      {trend ? <Text style={styles.trend} numberOfLines={1}>{trend}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    flex: 1,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '400',
  },
  trend: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#000000',
  },
  textSecondaryDark: {
    color: '#8E8E93',
  },
  textSecondaryLight: {
    color: '#6B7280',
  },
});

