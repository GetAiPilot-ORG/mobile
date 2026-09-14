import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

interface MetricGlassCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  accentColor?: string;
}

export const MetricGlassCard: React.FC<MetricGlassCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = '#6366f1',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}1A` }]}>
          <Text style={[styles.iconText, { color: accentColor }]}>{icon}</Text>
        </View>
        <Text style={[styles.title, { color: isDark ? '#94a3b8' : '#64748b' }]}>{title}</Text>
      </View>
      <Text style={[styles.value, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{value}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
    borderColor: '#e2e8f0',
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
