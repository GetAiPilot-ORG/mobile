import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityType, CRMActivity } from '../types';

interface ActivityTimelineItemProps {
  activity: CRMActivity;
  isLast?: boolean;
}

const TYPE_CONFIG: Partial<Record<ActivityType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }>> = {
  call: { icon: 'call', color: '#10B981', bg: 'bg-emerald-500/20' },
  email: { icon: 'mail', color: '#0084FF', bg: 'bg-[#0084FF]/20' },
  meeting: { icon: 'calendar', color: '#8B5CF6', bg: 'bg-purple-500/20' },
  note: { icon: 'document-text', color: '#F59E0B', bg: 'bg-amber-500/20' },
  task: { icon: 'checkbox', color: '#6366F1', bg: 'bg-indigo-500/20' },
  follow_up: { icon: 'alarm', color: '#EC4899', bg: 'bg-pink-500/20' },
  message: { icon: 'chatbubbles', color: '#10B981', bg: 'bg-emerald-500/20' },
  stage_change: { icon: 'swap-horizontal', color: '#F59E0B', bg: 'bg-amber-500/20' },
  assignment: { icon: 'person', color: '#EC4899', bg: 'bg-pink-500/20' },
  form_submission: { icon: 'newspaper', color: '#0EA5E9', bg: 'bg-sky-500/20' },
};

export const ActivityTimelineItem: React.FC<ActivityTimelineItemProps> = ({ activity, isLast }) => {
  const typeCfg = TYPE_CONFIG[activity.type] || {
    icon: 'document-text' as const,
    color: '#F59E0B',
    bg: 'bg-amber-500/20',
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
    <View className="flex-row mb-2">
      {/* Timeline track + icon */}
      <View className="items-center w-8 mr-2.5">
        <View className={`w-8 h-8 rounded-full items-center justify-center z-10 ${typeCfg.bg}`}>
          <Ionicons name={typeCfg.icon} size={15} color={typeCfg.color} />
        </View>
        {!isLast ? <View className="w-0.5 flex-1 my-1 bg-[#262930]" /> : null}
      </View>

      {/* Content card */}
      <View className="flex-1 rounded-xl p-3 bg-[#181A1F] border border-[#262930] mb-2">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs font-bold text-white flex-1 mr-2" numberOfLines={1}>
            {activity.subject || activity.title || 'Activity Event'}
          </Text>
          <Text className="text-[11px] text-slate-400">{formatDate(activity.created_at)}</Text>
        </View>

        {activity.description ? (
          <Text className="text-xs text-slate-300 leading-relaxed mt-0.5" numberOfLines={3}>
            {activity.description}
          </Text>
        ) : null}

        {/* Links */}
        {activity.contact || activity.deal ? (
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {activity.contact ? (
              <View className="flex-row items-center gap-1 bg-[#111317] border border-[#262930] px-1.5 py-0.5 rounded">
                <Ionicons name="person-outline" size={10} color="#94A3B8" />
                <Text className="text-[10px] text-slate-400">
                  {`${activity.contact.first_name || ''} ${activity.contact.last_name || ''}`.trim()}
                </Text>
              </View>
            ) : null}
            {activity.deal ? (
              <View className="flex-row items-center gap-1 bg-[#111317] border border-[#262930] px-1.5 py-0.5 rounded">
                <Ionicons name="briefcase-outline" size={10} color="#94A3B8" />
                <Text className="text-[10px] text-slate-400">{activity.deal.title}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
};
