import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
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
                color={windowStatus.expired ? '#f87171' : '#16a34a'}
              />
              <Text
                style={[
                  styles.windowPillText,
                  { color: windowStatus.expired ? '#dc2626' : '#15803d' },
                ]}
              >
                {windowStatus.expired ? '24h Closed' : `24h: ${windowStatus.text}`}
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
                <Ionicons name="person" size={10} color={colors.textSecondary} />
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

function createStyles(colors: ReturnType<typeof getColors>, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 13,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 5,
      elevation: 2,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.995 }],
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primary,
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
      borderRadius: 10,
      padding: 1,
      borderWidth: 1,
      backgroundColor: colors.card,
      borderColor: colors.primary,
    },
    content: {
      flex: 1,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
      color: colors.textPrimary,
    },
    time: {
      fontSize: 11,
      marginLeft: 8,
      color: colors.textSecondary,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
      gap: 6,
    },
    handle: {
      fontSize: 11.5,
      flex: 1,
      color: colors.textSecondary,
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
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    windowClosedPill: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
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
      fontSize: 12.5,
      flex: 1,
      color: colors.textSecondary,
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
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 8,
      maxWidth: 90,
      backgroundColor: isDark ? colors.surfaceDark : colors.background,
      borderColor: colors.border,
      borderWidth: 1,
    },
    agentTagText: {
      fontSize: 9.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
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
}
