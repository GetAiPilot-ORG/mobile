import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NormalizedConversation } from '../types';
import { ChannelBadge } from './ChannelBadge';

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

interface ConversationCardProps {
  conversation: NormalizedConversation;
  onPress: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, onPress }) => {
  const time = new Date(conversation.last_message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate 24-hour Meta messaging window status
  const windowStatus = useMemo(() => {
    if (conversation.channel !== 'whatsapp') return null;

    const lastMsgTime = conversation.latest_customer_message_at
      ? new Date(conversation.latest_customer_message_at).getTime()
      : new Date(conversation.last_message.created_at).getTime();

    if (isNaN(lastMsgTime) || lastMsgTime <= 0) {
      return { expired: true, text: 'Closed' };
    }

    const diff = CUSTOMER_SERVICE_WINDOW_MS - (Date.now() - lastMsgTime);
    if (diff <= 0) {
      return { expired: true, text: 'Closed' };
    }

    const hours = Math.floor(diff / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return {
      expired: false,
      text: hours > 0 ? `${hours}h` : `${mins}m`,
    };
  }, [conversation]);

  const assignedName = conversation.assigned_agent_name || conversation.assigned_to;
  const isBotActive = conversation.bot_enabled !== false && !conversation.bot_paused;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>
          {conversation.contact.name ? conversation.contact.name.charAt(0).toUpperCase() : 'W'}
        </Text>
        {isBotActive && (
          <View style={styles.botDot}>
            <Text style={{ fontSize: 8 }}>🤖</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {conversation.contact.name}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.handle} numberOfLines={1}>
            +{conversation.contact.handle_or_phone}
          </Text>

          {/* 24-Hour Meta Window Badge */}
          {windowStatus && (
            <View
              style={[
                styles.windowPill,
                windowStatus.expired ? styles.windowClosedPill : styles.windowOpenPill,
              ]}
            >
              <Ionicons
                name={windowStatus.expired ? 'alert-circle' : 'time'}
                size={10}
                color={windowStatus.expired ? '#f87171' : '#34d399'}
              />
              <Text
                style={[
                  styles.windowPillText,
                  { color: windowStatus.expired ? '#fca5a5' : '#6ee7b7' },
                ]}
              >
                24h: {windowStatus.text}
              </Text>
            </View>
          )}

          <ChannelBadge channel={conversation.channel} />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.last_message.direction === 'outbound' ? 'You: ' : ''}
            {conversation.last_message.content || 'Media message'}
          </Text>

          <View style={styles.bottomBadges}>
            {assignedName ? (
              <View style={styles.agentTag}>
                <Ionicons name="person" size={10} color="#8696a0" />
                <Text style={styles.agentTagText} numberOfLines={1}>
                  {assignedName}
                </Text>
              </View>
            ) : null}

            {conversation.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conversation.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#111b21', // WhatsApp dark list item
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#202c33',
  },
  pressed: {
    backgroundColor: '#1f2c34',
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#00a884',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  botDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#111b21',
    borderRadius: 10,
    padding: 1,
    borderWidth: 1,
    borderColor: '#00a884',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    color: '#e9edef',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    color: '#8696a0',
    fontSize: 11,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  handle: {
    color: '#8696a0',
    fontSize: 11.5,
    flex: 1,
  },
  windowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  windowOpenPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  windowClosedPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  windowPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    color: '#8696a0',
    fontSize: 12.5,
    flex: 1,
  },
  bottomBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1f2c34',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 90,
  },
  agentTagText: {
    color: '#8696a0',
    fontSize: 9.5,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#00a884',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});
