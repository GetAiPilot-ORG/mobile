import React from 'react';
import { Text, View } from 'react-native';
import { CRMActivity } from '../types';

interface LeadActivityItemProps {
  activity: CRMActivity;
}

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  message: { icon: '💬', color: '#22c55e' },
  call: { icon: '🎙️', color: '#a855f7' },
  meeting: { icon: '📅', color: '#8b5cf6' },
  note: { icon: '📝', color: '#0084FF' },
  task: { icon: '✅', color: '#6366f1' },
  follow_up: { icon: '⏰', color: '#ec4899' },
  email: { icon: '✉️', color: '#0084FF' },
  stage_change: { icon: '🔀', color: '#f59e0b' },
  assignment: { icon: '👤', color: '#ec4899' },
  form_submission: { icon: '📋', color: '#0ea5e9' },
};

export const LeadActivityItem: React.FC<LeadActivityItemProps> = ({ activity }) => {
  const meta = TYPE_ICONS[activity.type] || { icon: '📌', color: '#6366f1' };
  const time = new Date(activity.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className="flex-row items-start py-3 border-b border-[#262930]">
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-3 mt-0.5"
        style={{ backgroundColor: `${meta.color}20` }}
      >
        <Text className="text-sm">{meta.icon}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-sm font-bold text-white">{activity.subject || activity.title || 'Activity'}</Text>
          <Text className="text-[11px] text-slate-400">{time}</Text>
        </View>
        {activity.description ? (
          <Text className="text-xs text-slate-300 leading-relaxed">{activity.description}</Text>
        ) : null}
      </View>
    </View>
  );
};
