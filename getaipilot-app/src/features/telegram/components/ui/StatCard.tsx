import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getColors } from '@/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  sub: string;
  onPress?: () => void;
  isRevenue?: boolean;
  style?: any;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  bg,
  sub,
  onPress,
  isRevenue,
  style,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const valStr = String(value ?? '');
  const valFontSize = valStr.length > 7 ? 18 : valStr.length > 5 ? 21 : 24;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.metricCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        style,
        pressed && styles.metricCardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.metricHeaderRow}>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.metricIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={13} color={color} />
        </View>
      </View>

      <Text
        style={[
          styles.metricValue,
          {
            color: colors.text,
            fontSize: valFontSize,
          },
          isRevenue && styles.metricValueRevenue,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {sub ? (
        <View style={styles.metricFooterRow}>
          <Text style={[styles.metricSub, { color: colors.textMuted }]} numberOfLines={1}>
            {sub}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};
        </View>
      </View>

      {/* Metric value */}
      <Text style={[styles.value, { fontSize: valFontSize }, txt]} numberOfLines={1}>
        {value}
      </Text>

      {/* Subtitle */}
      <Text style={styles.sub} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );

  const cardStyle = [
    styles.card,
    isDark ? styles.cardDark : styles.cardLight,
  ];

  if (onPress) {
    return (
      <View style={cardStyle}>
        <Pressable
          style={styles.pressable}
          onPress={onPress}
          android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
        >
          {inner}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      {inner}
    </View>
  );
};

const styles = StyleSheet.create({
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },

  card: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 118,
    overflow: 'hidden',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#181A20',
    borderColor: '#2A2D36',
  },

  pressable: {
    flex: 1,
  },

  inner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
    textTransform: 'uppercase',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  value: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 15,
  },

  metricCard: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  metricCardPressed: { opacity: 0.75 },
  metricHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metricLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4, flex: 1 },
  metricIconWrap: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  metricValueRevenue: { fontWeight: '900' },
  metricFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metricSub: { fontSize: 10, fontWeight: '500', flex: 1 },
});

