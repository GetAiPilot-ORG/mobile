import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/features/theme';
import { CRMActivity } from '../types';

interface LeadActivityItemProps {
  activity: CRMActivity;
}

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  message: { icon: '💬', color: '#22c55e' },
  call: { icon: '🎙️', color: '#a855f7' },
  meeting: { icon: '📅', color: '#8b5cf6' },
  note: { icon: '📝', color: '#3b82f6' },
  task: { icon: '✅', color: '#6366f1' },
  follow_up: { icon: '⏰', color: '#ec4899' },
  email: { icon: '✉️', color: '#3b82f6' },
  stage_change: { icon: '🔀', color: '#f59e0b' },
  assignment: { icon: '👤', color: '#ec4899' },
  form_submission: { icon: '📋', color: '#0ea5e9' },
};

export const LeadActivityItem: React.FC<LeadActivityItemProps> = ({ activity }) => {
  const { isDark, colors } = useTheme();
  const meta = TYPE_ICONS[activity.type] || { icon: '📌', color: '#6366f1' };
  const time = new Date(activity.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: isDark ? `${meta.color}25` : `${meta.color}15` }]}>
        <Text style={styles.iconText}>{meta.icon}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {activity.subject || activity.title || 'Activity'}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{time}</Text>
        </View>
        {activity.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {activity.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iconText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  header: {
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
    fontSize: 13,
    lineHeight: 18,
  },
});
