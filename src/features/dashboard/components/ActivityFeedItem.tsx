import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ActivityFeedItemProps {
  product: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  product,
  title,
  description,
  timestamp,
}) => {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    color: '#64748b',
    fontSize: 11,
  },
  description: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
});
