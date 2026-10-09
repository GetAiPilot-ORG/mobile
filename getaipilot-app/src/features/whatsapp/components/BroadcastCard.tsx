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

  // Subtle Apple HIG status colors & backgrounds
  const statusBg = isCompleted
    ? isDark ? 'rgba(52, 199, 89, 0.16)' : 'rgba(52, 199, 89, 0.12)'
    : isQueued
    ? isDark ? 'rgba(10, 132, 255, 0.16)' : 'rgba(0, 122, 255, 0.12)'
    : isScheduled
    ? isDark ? 'rgba(255, 159, 10, 0.16)' : 'rgba(255, 149, 0, 0.12)'
    : isDark ? 'rgba(255, 69, 58, 0.16)' : 'rgba(255, 59, 48, 0.12)';

  const statusText = isCompleted
    ? isDark ? '#30D158' : '#248A3D'
    : isQueued
    ? isDark ? '#0A84FF' : '#007AFF'
    : isScheduled
    ? isDark ? '#FF9F0A' : '#D97706'
    : isDark ? '#FF453A' : '#DC2626';

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;

  return (
    <Pressable
      className={`w-full rounded-2xl p-4 border mb-3 active:opacity-75 active:scale-[0.99] shadow-sm ${
        isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-[#E5E7EB]'
      }`}
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
          <Text className="text-xs font-semibold tracking-tight" style={{ color: statusText }}>
            {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Metrics Row - Clean iOS Inset Box */}
      <View
        className={`flex-row justify-between rounded-xl py-2.5 px-3 mb-2 ${
          isDark ? 'bg-white/[0.05]' : 'bg-[#F8F9FA]'
        }`}
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
          <Text className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
            {broadcast.delivered_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1">
          <Text className={`text-[11px] font-medium mb-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
            Read
          </Text>
          <Text className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
            {broadcast.read_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1">
          <Text className={`text-[11px] font-medium mb-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
            Success Rate
          </Text>
          <Text className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
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
