import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { WhatsAppBroadcast } from '../types';

interface BroadcastCardProps {
  broadcast: WhatsAppBroadcast;
  onPress?: (broadcast: WhatsAppBroadcast) => void;
}

export const BroadcastCard: React.FC<BroadcastCardProps> = ({ broadcast, onPress }) => {
  const isCompleted = broadcast.status === 'completed';
  const isQueued = broadcast.status === 'queued' || broadcast.status === 'preparing';
  const isScheduled = broadcast.status === 'scheduled';

  const statusBg = isCompleted
    ? 'bg-emerald-500/15 border-emerald-500/30'
    : isQueued
    ? 'bg-[#0084FF]/15 border-[#0084FF]/30'
    : isScheduled
    ? 'bg-amber-500/15 border-amber-500/30'
    : 'bg-rose-500/15 border-rose-500/30';

  const statusTextColor = isCompleted
    ? 'text-emerald-400'
    : isQueued
    ? 'text-[#0084FF]'
    : isScheduled
    ? 'text-amber-400'
    : 'text-rose-400';

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;

  return (
    <Pressable
      className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-3 active:bg-[#262930]"
      onPress={() => onPress && onPress(broadcast)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-2.5">
          <Text className="text-base font-bold text-white mb-0.5" numberOfLines={1}>
            {broadcast.name}
          </Text>
          <Text
            className="text-xs font-medium text-slate-400"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        <View className={`px-2.5 py-1 rounded-full border ${statusBg}`}>
          <Text className={`text-[11px] font-bold ${statusTextColor}`}>
            {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View className="flex-row justify-between bg-[#111317] border border-[#262930] rounded-xl py-2.5 px-3 mb-2.5">
        <View className="items-center flex-1">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">Audience</Text>
          <Text className="text-sm font-bold text-white">
            {broadcast.recipients_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1 border-x border-[#262930]">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">Delivered</Text>
          <Text className="text-sm font-bold text-emerald-400">
            {broadcast.delivered_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">Read</Text>
          <Text className="text-sm font-bold text-white">
            {broadcast.read_count.toLocaleString()}
          </Text>
        </View>

        <View className="items-center flex-1 border-l border-[#262930]">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">Rate</Text>
          <Text className="text-sm font-bold text-[#0084FF]">
            {deliveryRate}%
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row justify-between items-center pt-1">
        <Text className="text-xs font-semibold text-slate-400">
          Cost: ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
        </Text>
        <Text className="text-[11px] text-slate-500">
          {new Date(broadcast.created_at).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
};
