import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserIcon,
  ArrowRight01Icon,
  BotMessageSquareIcon,
} from '@/constants/icons';
import { NormalizedConversation } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { useTheme, getColors } from '@/theme';
import { useProductPalette } from '@/components/ProductUI';

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
  const palette = useProductPalette();

  const time = formatMessageTime(conversation.last_message.created_at);

  // `assigned_to` is commonly a database UUID. Never expose it as UI copy.
  const assignedLabel = conversation.assigned_agent_name
    || (conversation.assigned_to ? 'Assigned' : null);
  const isBotActive = conversation.bot_enabled !== false && !conversation.bot_paused;

  // Signature pastel avatar matching channel themes
  const avatarTone = conversation.channel === 'whatsapp'
    ? 'mint'
    : conversation.channel === 'telegram'
    ? 'lavender'
    : 'pink';
  const avatarBg = palette[avatarTone];

  return (
    <Pressable
      cssInterop={false}
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.992 : 1 }],
      })}
      onPress={onPress}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 15,
          backgroundColor: avatarBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <HugeiconsIcon icon={UserIcon} size={21} color={palette.text} strokeWidth={1.8} />
        {isBotActive && (
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 17,
              height: 17,
              borderRadius: 9,
              backgroundColor: colors.card,
              borderWidth: 1.5,
              borderColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <HugeiconsIcon icon={BotMessageSquareIcon} size={10} color={colors.accent} strokeWidth={2} />
          </View>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <Text
            style={{ fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 }}
            numberOfLines={1}
          >
            {conversation.contact.name || conversation.contact.handle_or_phone || 'Customer'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>
            {time}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9, gap: 8 }}>
          <Text
            style={{ fontSize: 13, lineHeight: 18, color: colors.textSecondary, flex: 1 }}
            numberOfLines={1}
          >
            {conversation.last_message.direction === 'outbound' ? 'You: ' : ''}
            {conversation.last_message.content || 'Media message'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
            <ChannelBadge channel={conversation.channel} />
            {conversation.bot_name ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                  borderWidth: 0.5,
                  borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#BAE6FD',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: isDark ? '#38BDF8' : '#0284C7',
                  }}
                  numberOfLines={1}
                >
                  {conversation.bot_name}
                </Text>
              </View>
            ) : null}
            {assignedLabel ? (
              <Text style={{ fontSize: 10.5, color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
                {assignedLabel}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {conversation.unread_count > 0 && (
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>
                  {conversation.unread_count}
                </Text>
              </View>
            )}

            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              color={colors.iconSecondary || colors.textSecondary}
              strokeWidth={2}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
};
