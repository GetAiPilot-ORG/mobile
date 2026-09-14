import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

interface ActivityFeedItemProps {
  product: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  title,
  description,
  timestamp,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
      <View style={styles.indicator} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>{title}</Text>
          <Text style={[styles.time, { color: isDark ? '#64748b' : '#94a3b8' }]}>{formattedTime}</Text>
        </View>
        <Text style={[styles.description, { color: isDark ? '#94a3b8' : '#64748b' }]}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginTop: 6,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 11,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
});
