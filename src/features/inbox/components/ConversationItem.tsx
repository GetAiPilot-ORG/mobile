import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { NormalizedConversation } from '../types';
import { ChannelBadge } from './ChannelBadge';

interface ConversationItemProps {
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

export const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => {
  const time = formatMessageTime(conversation.last_message.created_at);

  return (
    <Pressable
      className="flex-row items-center py-3.5 px-4 rounded-2xl mb-2 bg-[#181A1F] border border-[#262930] active:opacity-75"
      onPress={onPress}
    >
      <View className="w-11 h-11 rounded-full justify-center items-center border border-[#262930] bg-[#111317] mr-3">
        <Text className="text-white text-lg font-bold">
          {conversation.contact.name ? conversation.contact.name.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-0.5">
          <Text className="text-[15px] font-bold text-white flex-1" numberOfLines={1}>
            {conversation.contact.name}
          </Text>
          <Text className="text-[11px] text-slate-400 ml-2">{time}</Text>
        </View>
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-slate-400 flex-1 mr-2" numberOfLines={1}>
            {conversation.contact.handle_or_phone}
          </Text>
          <ChannelBadge channel={conversation.channel} />
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-[13px] text-slate-400 flex-1" numberOfLines={1}>
            {conversation.last_message.direction === 'outbound' ? 'You: ' : ''}
            {conversation.last_message.content}
          </Text>
          {conversation.unread_count > 0 && (
            <View className="bg-[#0084FF] rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-[10px] font-bold">{conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};
