import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityType, CRMActivity } from '../types';

interface ActivityTimelineItemProps {
  activity: CRMActivity;
  isLast?: boolean;
}

const TYPE_CONFIG: Partial<Record<ActivityType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }>> = {
  call: { icon: 'call', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  email: { icon: 'mail', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  meeting: { icon: 'calendar', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  note: { icon: 'document-text', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  task: { icon: 'checkbox', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)' },
  follow_up: { icon: 'alarm', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
  message: { icon: 'chatbubbles', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  stage_change: { icon: 'swap-horizontal', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  assignment: { icon: 'person', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
  form_submission: { icon: 'newspaper', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.15)' },
};

export const ActivityTimelineItem: React.FC<ActivityTimelineItemProps> = ({ activity, isLast }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const typeCfg = TYPE_CONFIG[activity.type] || {
    icon: 'document-text' as const,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Timeline track + icon */}
      <View style={styles.timelineLeft}>
        <View style={[styles.iconCircle, { backgroundColor: typeCfg.bg }]}>
          <Ionicons name={typeCfg.icon} size={15} color={typeCfg.color} />
        </View>
        {!isLast ? <View style={[styles.verticalLine, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]} /> : null}
      </View>

      {/* Content card */}
      <View style={[styles.content, isDark ? styles.contentDark : styles.contentLight]}>
        <View style={styles.header}>
          <Text style={[styles.subject, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
            {activity.subject || activity.title || 'Activity Event'}
          </Text>
          <Text style={[styles.timestamp, { color: isDark ? '#6B7280' : '#94A3B8' }]}>{formatDate(activity.created_at)}</Text>
        </View>

        {activity.description ? (
          <Text style={[styles.description, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={3}>
            {activity.description}
          </Text>
        ) : null}

        {/* Links */}
        {activity.contact || activity.deal ? (
          <View style={styles.tagRow}>
            {activity.contact ? (
              <View style={[styles.tag, { backgroundColor: isDark ? '#222630' : '#F1F5F9' }]}>
                <Ionicons name="person-outline" size={10} color={isDark ? '#9CA3AF' : '#64748B'} />
                <Text style={[styles.tagText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  {`${activity.contact.first_name || ''} ${activity.contact.last_name || ''}`.trim()}
                </Text>
              </View>
            ) : null}
            {activity.deal ? (
              <View style={[styles.tag, { backgroundColor: isDark ? '#222630' : '#F1F5F9' }]}>
                <Ionicons name="briefcase-outline" size={10} color={isDark ? '#9CA3AF' : '#64748B'} />
                <Text style={[styles.tagText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>{activity.deal.title}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  content: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  contentDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  contentLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subject: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
  },
});
