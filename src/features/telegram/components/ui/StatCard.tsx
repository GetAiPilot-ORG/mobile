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
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  bg,
  sub,
  onPress,
}) => {
  const themeContext = useTheme();
  const systemScheme = useColorScheme();
  const isDark = themeContext?.isDark ?? (systemScheme === 'dark');
  const txt = isDark ? styles.textDark : styles.textLight;

  const valStr = String(value ?? '');
  const valFontSize = valStr.length > 7 ? 18 : valStr.length > 5 ? 21 : 24;

  const inner = (
    <View style={styles.inner}>
      {/* Label + Icon row */}
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={16} color={color} />
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

  // Outer shell — handles flex sizing, border, bg, radius
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

  // Pressable fills the shell completely (no style prop = no Android flex issues)
  pressable: {
    flex: 1,
  },

  // Inner padding lives here — applied equally for both pressable and static variants
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
});

