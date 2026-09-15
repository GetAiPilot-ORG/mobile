import React from 'react';
import { Text, View } from 'react-native';

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
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className="flex-row py-3 border-b border-white/5">
      <View className="w-2 h-2 rounded-full bg-[#0084FF] mt-1.5 mr-3" />
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-sm font-semibold text-white">{title}</Text>
          <Text className="text-[11px] text-slate-400">{formattedTime}</Text>
        </View>
        <Text className="text-xs leading-4 text-slate-400">{description}</Text>
      </View>
    </View>
  );
};
