import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NormalizedConversation } from '../types';
import { ChannelBadge } from './ChannelBadge';

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

interface ConversationCardProps {
  conversation: NormalizedConversation;
  onPress: () => void;
}

const formatMessageTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, onPress }) => {
  const time = formatMessageTime(conversation.last_message.created_at);

  // Calculate 24-hour Meta messaging window status
  const windowStatus = useMemo(() => {
    if (conversation.channel !== 'whatsapp') return null;

    const customerTimeStr = conversation.latest_customer_message_at;
    if (!customerTimeStr) {
      return { expired: true, text: 'Closed' };
    }

    const lastMsgTime = new Date(customerTimeStr).getTime();
    if (isNaN(lastMsgTime) || lastMsgTime <= 0) {
      return { expired: true, text: 'Closed' };
    }

    const elapsed = Date.now() - lastMsgTime;
    const diff = CUSTOMER_SERVICE_WINDOW_MS - elapsed;
    if (diff <= 0) {
      return { expired: true, text: 'Closed' };
    }

    const totalMinutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      expired: false,
      text: hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`,
    };
  }, [conversation]);

  const assignedName = conversation.assigned_agent_name || conversation.assigned_to;
  const isBotActive = conversation.bot_enabled !== false && !conversation.bot_paused;

  return (
    <Pressable
      className="flex-row items-center p-3 rounded-2xl mb-2 bg-[#181A1F] border border-[#262930] active:opacity-85 active:scale-[0.995]"
      onPress={onPress}
    >
      <View className="w-11 h-11 rounded-full bg-emerald-600 justify-center items-center mr-3 relative">
        <Text className="text-white text-lg font-bold">
          {conversation.contact.name ? conversation.contact.name.charAt(0).toUpperCase() : 'W'}
        </Text>
        {isBotActive && (
          <View className="absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 bg-[#111317] border border-emerald-500">
            <Text className="text-[8px]">🤖</Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-0.5">
          <Text className="text-[15px] font-bold text-white flex-1" numberOfLines={1}>
            {conversation.contact.name}
          </Text>
          <Text className="text-[11px] text-slate-400 ml-2">{time}</Text>
        </View>

        <View className="flex-row justify-between items-center mb-1 gap-1.5">
          <Text className="text-xs text-slate-400 flex-1" numberOfLines={1}>
            +{conversation.contact.handle_or_phone}
          </Text>

          {/* 24-Hour Meta Window Badge */}
          {windowStatus && (
            <View
              className={`flex-row items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                windowStatus.expired
                  ? 'bg-rose-500/15 border-rose-500/30'
                  : 'bg-emerald-500/15 border-emerald-500/30'
              }`}
            >
              <Ionicons
                name={windowStatus.expired ? 'alert-circle' : 'time'}
                size={10}
                color={windowStatus.expired ? '#f87171' : '#34d399'}
              />
              <Text
                className={`text-[9.5px] font-extrabold ${
                  windowStatus.expired ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {windowStatus.expired ? '24h Closed' : `24h: ${windowStatus.text}`}
              </Text>
            </View>
          )}

          <ChannelBadge channel={conversation.channel} />
        </View>

        <View className="flex-row justify-between items-center gap-2">
          <Text className="text-[12.5px] text-slate-400 flex-1" numberOfLines={1}>
            {conversation.last_message.direction === 'outbound' ? 'You: ' : ''}
            {conversation.last_message.content || 'Media message'}
          </Text>

          <View className="flex-row items-center gap-1.5">
            {assignedName ? (
              <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#111317] border border-[#262930] max-w-[90px]">
                <Ionicons name="person" size={10} color="#94a3b8" />
                <Text className="text-[9.5px] font-semibold text-slate-400" numberOfLines={1}>
                  {assignedName}
                </Text>
              </View>
            ) : null}

            {conversation.unread_count > 0 && (
              <View className="bg-emerald-600 rounded-full px-2 py-0.5">
                <Text className="text-white text-[10px] font-extrabold">{conversation.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};
