import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

interface UsageMeterCardProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  color?: string;
}

export const UsageMeterCard: React.FC<UsageMeterCardProps> = ({
  label,
  current,
  max,
  unit = '',
  color = '#6366f1',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const percentage = Math.min(Math.round((current / (max || 1)) * 100), 100);

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#0f172a' }]}>{label}</Text>
        <Text style={[styles.values, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {current.toLocaleString()}{unit} / {max.toLocaleString()}{unit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        <View
          style={[
            styles.bar,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  containerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  values: {
    fontSize: 11,
    fontWeight: '500',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
