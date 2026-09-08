import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  const percentage = Math.min(Math.round((current / (max || 1)) * 100), 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {current.toLocaleString()}{unit} / {max.toLocaleString()}{unit}
        </Text>
      </View>
      <View style={styles.track}>
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
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  values: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  track: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
