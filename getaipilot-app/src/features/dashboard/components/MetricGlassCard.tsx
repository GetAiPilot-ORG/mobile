import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getColors } from '@/theme';

interface MetricGlassCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap | string;
  accentColor?: string;
}

export const MetricGlassCard: React.FC<MetricGlassCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = '#6366f1',
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}1A` }]}>
          <Ionicons name={icon as any} size={16} color={accentColor} />
        </View>
        <Text style={[styles.title, { color: isDark ? '#777383' : '#64748b' }]}>{title}</Text>
      </View>
      <Text style={[styles.value, { color: isDark ? '#F5F3FB' : '#0f172a' }]}>{value}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: isDark ? '#64748b' : '#777383' }]}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 0,
    flex: 1,
    minWidth: 140,
    margin: 6,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#E9E6F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },
});
