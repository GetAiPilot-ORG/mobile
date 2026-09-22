import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  sub: string;
  onPress?: () => void;
  isRevenue?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bg, sub, onPress, isRevenue }) => {
  const { isDark } = useTheme();
  const txt = isDark ? styles.textDark : styles.textLight;

  return (
    <Pressable
      style={({ pressed }) => [styles.metricCard, isDark ? styles.metricCardDark : styles.metricCardLight, pressed && styles.metricCardPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.metricHeaderRow}>
        <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
        <View style={[styles.metricIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={13} color={color} />
        </View>
      </View>
      <Text style={[styles.metricValue, { color: isRevenue ? '#0284C7' : undefined }, !isRevenue ? txt : {}]}>{value}</Text>
      <View style={styles.metricFooterRow}>
        <Text style={styles.metricSub} numberOfLines={1}>{sub}</Text>
        {onPress && <Ionicons name="chevron-forward" size={11} color={color} />}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  metricCard: { width: '48.5%', padding: 10, borderRadius: 12, borderWidth: 1, justifyContent: 'space-between', minHeight: 88, marginBottom: 8 },
  metricCardLight: { backgroundColor: 'rgba(248,250,252,0.9)', borderColor: '#E2E8F0' },
  metricCardDark: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  metricCardPressed: { opacity: 0.75 },
  metricHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metricLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.4, flex: 1 },
  metricIconWrap: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  metricFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metricSub: { fontSize: 10, color: '#64748B', fontWeight: '500', flex: 1 },
});
