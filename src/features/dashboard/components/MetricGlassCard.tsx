import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}1A` }]}>
          <Text style={[styles.iconText, { color: accentColor }]}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    minWidth: 140,
    margin: 6,
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
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
});
