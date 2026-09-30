import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCrmTheme } from '../hooks/useCrmTheme';

interface CrmStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors?: [string, string];
  trend?: string;
  progress?: number;
  onPress?: () => void;
}

export const CrmStatCard: React.FC<CrmStatCardProps> = ({
  label,
  value,
  sub,
  icon,
  gradientColors,
  trend,
  progress,
  onPress,
}) => {
  const { gradient } = useCrmTheme();
  const activeGradient = gradientColors || gradient;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient
        colors={activeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={18} color="#FFFFFF" />
          </View>
          {trend ? (
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={12} color="#10B981" />
              <Text style={styles.trendText}>{trend}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.value} numberOfLines={1}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}

        {typeof progress === 'number' ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.min(Math.max(progress * 100, 4), 100)}%` }]} />
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  sub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
});
