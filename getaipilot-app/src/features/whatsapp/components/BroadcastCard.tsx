import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { WhatsAppBroadcast } from '../types';

interface BroadcastCardProps {
  broadcast: WhatsAppBroadcast;
  onPress?: (broadcast: WhatsAppBroadcast) => void;
}

export const BroadcastCard: React.FC<BroadcastCardProps> = ({ broadcast, onPress }) => {
  const { isDark } = useTheme();

  const isCompleted = broadcast.status === 'completed';
  const isQueued = broadcast.status === 'queued' || broadcast.status === 'preparing';
  const isScheduled = broadcast.status === 'scheduled';

  // Authentic WhatsApp Brand status colors
  const statusBg = isCompleted
    ? isDark ? 'rgba(37, 211, 102, 0.16)' : 'rgba(37, 211, 102, 0.10)'
    : isQueued
    ? isDark ? 'rgba(10, 132, 255, 0.16)' : 'rgba(0, 122, 255, 0.10)'
    : isScheduled
    ? isDark ? 'rgba(251, 191, 36, 0.16)' : 'rgba(217, 119, 6, 0.10)'
    : isDark ? 'rgba(255, 69, 58, 0.16)' : 'rgba(220, 38, 38, 0.10)';

  const statusText = isCompleted
    ? isDark ? '#25D366' : '#075E54'
    : isQueued
    ? isDark ? '#0A84FF' : '#007AFF'
    : isScheduled
    ? isDark ? '#FBBF24' : '#B45309'
    : isDark ? '#FF453A' : '#DC2626';

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;

  return (
    <Pressable
      className={`w-full rounded-2xl p-4 mb-3 active:opacity-75 active:scale-[0.99] shadow-sm ${
        isDark ? 'bg-[#1C1C1E]' : 'bg-white'
      }`}
      style={{
        borderWidth: 0,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 4,
      }}
      onPress={() => onPress && onPress(broadcast)}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-2.5">
          <Text
            className={`text-base font-bold tracking-tight mb-0.5 ${
              isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'
            }`}
            numberOfLines={1}
          >
            {broadcast.name}
          </Text>
          <Text
            className={`text-xs font-medium tracking-tight ${
              isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg }}>
          <Text className="text-xs font-bold tracking-tight" style={{ color: statusText }}>
            {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Metrics Row - Borderless WhatsApp Inset Box */}
      <View
        className={`flex-row justify-between rounded-xl py-2.5 px-3 mb-2 ${
          isDark ? 'bg-white/[0.04]' : 'bg-[#F2F4F7]'
        }`}
        style={{ borderWidth: 0 }}
      >
        <View className="items-center flex-1">
          <Text className={`text-[11px] font-medium mb-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
            Audience
          </Text>
          <Text className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
            {broadcast.recipients_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1">
          <Text className={`text-[11px] font-medium mb-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
            Delivered
          </Text>
          <Text className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-[#25D366]' : 'text-[#075E54]'}`}>
            {broadcast.delivered_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1">
          <Text className={`text-[11px] font-medium mb-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
            Read
          </Text>
          <Text className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>
            {broadcast.read_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1">
          <Text className={`text-[11px] font-medium mb-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
            Success
          </Text>
          <Text className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-[#25D366]' : 'text-[#075E54]'}`}>
            {deliveryRate}%
          </Text>
        </View>
      </View>

      {/* Footer without harsh divider lines */}
      <View className="flex-row items-center justify-between pt-1">
        <Text className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
          Cost: ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
        </Text>
        <Text className={`text-xs font-normal ${isDark ? 'text-[#8E8E93]' : 'text-[#94A3B8]'}`}>
          {new Date(broadcast.created_at).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
};
