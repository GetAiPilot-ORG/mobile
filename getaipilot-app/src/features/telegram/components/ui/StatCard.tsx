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

const styles = StyleSheet.create({

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

