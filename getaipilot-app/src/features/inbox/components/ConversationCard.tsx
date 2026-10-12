import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NormalizedConversation } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { useTheme, getColors } from '@/theme';

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

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
      className="flex-row items-center p-3.5 rounded-[20px] mb-3 active:opacity-85"
      style={({ pressed }) => [
        {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.07)"
            : colors.cardBorder,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.04,
          shadowRadius: 8,
          elevation: 2,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View
        className="w-[48px] h-[48px] rounded-2xl justify-center items-center mr-3 relative"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-white text-lg font-bold">
          {conversation.contact.name ? conversation.contact.name.charAt(0).toUpperCase() : 'W'}
        </Text>
        {isBotActive && (
          <View
            className="absolute -bottom-1 -right-1 rounded-full p-0.5 border"
            style={{ backgroundColor: colors.card, borderColor: colors.primary }}
          >
            <Text className="text-[9px]">🤖</Text>
          </View>
        )}
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row justify-between items-center mb-0.5">
          <Text
            className="text-[15px] font-bold flex-1 min-w-0 mr-2"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {conversation.contact.name}
          </Text>
          <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
            {time}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-1 gap-1.5">
          <Text
            className="text-[11.5px] flex-1 min-w-0"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            +{conversation.contact.handle_or_phone}
          </Text>

          {/* 24-Hour Meta Window Badge */}
          {windowStatus && (
            <View
              className={`flex-row items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                windowStatus.expired
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              <Ionicons
                name={windowStatus.expired ? 'alert-circle' : 'time'}
                size={10}
                color={windowStatus.expired ? '#f87171' : '#16a34a'}
              />
              <Text
                className={`text-[9.5px] font-extrabold ${
                  windowStatus.expired ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {windowStatus.expired ? '24h Closed' : `24h: ${windowStatus.text}`}
              </Text>
            </View>
          )}

          <ChannelBadge channel={conversation.channel} />
        </View>

        <View className="flex-row justify-between items-center gap-2">
          <Text
            className="text-[12.5px] flex-1 min-w-0"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {conversation.last_message.direction === 'outbound' ? 'You: ' : ''}
            {conversation.last_message.content || 'Media message'}
          </Text>

          <View className="flex-row items-center gap-1.5">
            {assignedName ? (
              <View
                className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-md border max-w-[90px]"
                style={{
                  backgroundColor: isDark ? colors.surfaceDark : colors.background,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="person" size={10} color={colors.textSecondary} />
                <Text
                  className="text-[9.5px] font-semibold"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  {assignedName}
                </Text>
              </View>
            ) : null}

            {conversation.unread_count > 0 && (
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white text-[10px] font-extrabold">
                  {conversation.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};
