import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NormalizedConversation } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { useTheme, getColors } from '@/theme';

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const time = formatMessageTime(conversation.last_message.created_at);

  return (
    <Pressable cssInterop={false}
      style={({ pressed }) => [
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.avatar, isDark ? styles.avatarDark : styles.avatarLight]}>
        <Text style={[styles.avatarLetter, { color: isDark ? '#F5F3FB' : '#0f172a' }]}>
          {conversation.contact.name ? conversation.contact.name.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: isDark ? '#F5F3FB' : '#0f172a' }]} numberOfLines={1}>
            {conversation.contact.name}
          </Text>
          <Text style={[styles.time, { color: isDark ? '#64748b' : '#777383' }]}>{time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.handle, { color: isDark ? '#64748b' : '#777383' }]} numberOfLines={1}>
            {conversation.contact.handle_or_phone}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {conversation.bot_name ? (
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
                  paddingHorizontal: 6,
                  paddingVertical: 1.5,
                  borderRadius: 5,
                }}
              >
                <Text style={{ fontSize: 9.5, fontWeight: '700', color: isDark ? '#38BDF8' : '#0284C7' }}>
                  {conversation.bot_name}
                </Text>
              </View>
            ) : null}
            <ChannelBadge channel={conversation.channel} />
          </View>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.lastMessage, { color: isDark ? '#777383' : '#64748b' }]} numberOfLines={1}>
            {conversation.last_message.direction === 'outbound' ? 'You: ' : ''}
            {conversation.last_message.content}
          </Text>
          {conversation.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  containerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#E9E6F2',
  },
  pressed: {
    opacity: 0.75,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  avatarDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  avatarLight: {
    backgroundColor: '#F0EEF8',
    borderColor: '#E9E6F2',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    fontSize: 11,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  handle: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
  },
  badge: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
