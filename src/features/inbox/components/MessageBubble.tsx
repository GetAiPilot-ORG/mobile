import React from 'react';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NormalizedMessage } from '../types';
import { useAuthStore } from '../../../core/store/authStore';
import { useTheme, getColors } from '@/theme';

interface MessageBubbleProps {
  message: NormalizedMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id;
  const currentUserName = user?.name;
  const currentUserEmail = user?.email;
  const currentEmailPrefix = currentUserEmail ? currentUserEmail.split('@')[0] : '';

  const isOutbound = message.direction === 'outbound';
  const isBot =
    message.is_bot_reply ||
    message.sender?.type === 'bot' ||
    message.sender_type === 'bot' ||
    message.sender_type === 'ai_agent';
  const isInternalNote = message.is_internal_note;

  // Determine if this message was sent by the currently logged-in user
  const rawSenderName = message.sender?.name || '';
  const isMe =
    isOutbound &&
    !isBot &&
    ((message.sender_user_id && currentUserId && message.sender_user_id === currentUserId) ||
      rawSenderName === 'You' ||
      rawSenderName === 'Agent Support' ||
      (currentUserName && rawSenderName.toLowerCase() === currentUserName.toLowerCase()) ||
      (currentEmailPrefix && rawSenderName.toLowerCase() === currentEmailPrefix.toLowerCase()) ||
      !message.sender_user_id);

  const outboundLabel = isMe
    ? 'You'
    : rawSenderName && rawSenderName !== 'Agent Support'
    ? rawSenderName
    : 'Agent';

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderDeliveryStatus = () => {
    if (!isOutbound || isInternalNote) return null;

    switch (message.status) {
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#53bdeb" style={styles.statusIcon} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color={isDark ? '#8696a0' : '#64748b'} style={styles.statusIcon} />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color={isDark ? '#8696a0' : '#64748b'} style={styles.statusIcon} />;
      case 'failed':
        return <Ionicons name="alert-circle" size={14} color="#ef4444" style={styles.statusIcon} />;
      default:
        return <Ionicons name="checkmark" size={14} color={isDark ? '#8696a0' : '#64748b'} style={styles.statusIcon} />;
    }
  };

  // 1. Internal Team Note Rendering
  if (isInternalNote) {
    return (
      <View style={styles.internalNoteWrapper}>
        <View style={[styles.internalNoteBubble, isDark ? styles.internalNoteBubbleDark : styles.internalNoteBubbleLight]}>
          <View style={styles.internalNoteHeader}>
            <Ionicons name="lock-closed" size={13} color="#f59e0b" />
            <Text style={[styles.internalNoteTitle, { color: isDark ? '#fbbf24' : '#b45309' }]}>
              Internal Note • {outboundLabel}
            </Text>
          </View>
          <Text style={[styles.internalNoteContent, { color: isDark ? '#fef3c7' : '#78350f' }]}>
            {message.content}
          </Text>
          <Text style={[styles.internalNoteTime, { color: isDark ? '#b45309' : '#92400e' }]}>{time}</Text>
        </View>
      </View>
    );
  }

  const template = message.template;

  return (
    <View style={[styles.wrapper, isOutbound ? styles.outboundWrapper : styles.inboundWrapper]}>
      <View
        style={[
          styles.bubble,
          isOutbound
            ? isBot
              ? isDark
                ? styles.botBubbleDark
                : styles.botBubbleLight
              : isDark
              ? styles.outboundBubbleDark
              : styles.outboundBubbleLight
            : isDark
            ? styles.inboundBubbleDark
            : styles.inboundBubbleLight,
        ]}
      >
        {/* Sender Name / Bot Badge */}
        <View style={styles.senderHeader}>
          {isBot ? (
            <View style={styles.botBadge}>
              <Text style={styles.botBadgeText}>🤖 GAP AI Pilot</Text>
            </View>
          ) : isOutbound ? (
            <Text style={[styles.outboundSenderText, isMe && styles.outboundSenderYou]}>
              {outboundLabel}
            </Text>
          ) : (
            <Text style={styles.inboundSenderText}>{message.sender?.name || 'Contact'}</Text>
          )}
        </View>

        {/* Template Message Card */}
        {template ? (
          <View style={styles.templateCard}>
            {template.header?.text && (
              <Text style={styles.templateHeader}>{template.header.text}</Text>
            )}
            <Text
              style={[
                styles.content,
                { color: isDark ? '#e9edef' : '#111b21' },
              ]}
            >
              {template.body || message.content}
            </Text>
            {template.footer && (
              <Text style={[styles.templateFooter, { color: isDark ? '#8696a0' : '#64748b' }]}>
                {template.footer}
              </Text>
            )}

            {/* Template Interactive Action Buttons */}
            {template.buttons && template.buttons.length > 0 && (
              <View style={[styles.templateButtonsContainer, isDark ? styles.borderDark : styles.borderLight]}>
                {template.buttons.map((btn, idx) => (
                  <Pressable
                    key={idx}
                    style={[styles.templateButton, isDark ? styles.templateBtnDark : styles.templateBtnLight]}
                    onPress={() => {
                      if (btn.url) Linking.openURL(btn.url).catch(() => {});
                    }}
                  >
                    <Ionicons
                      name={btn.url ? 'open-outline' : btn.phone_number ? 'call-outline' : 'chatbubble-ellipses-outline'}
                      size={14}
                      color="#00a884"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.templateButtonText}>{btn.text}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Standard Free-form Message Content */
          <Text
            style={[
              styles.content,
              { color: isDark ? '#e9edef' : '#111b21' },
            ]}
          >
            {message.content}
          </Text>
        )}

        {/* Media Attachments Preview */}
        {message.media && message.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {message.media.map((med, idx) => (
              <View key={idx} style={[styles.mediaBox, isDark ? styles.mediaBoxDark : styles.mediaBoxLight]}>
                <Ionicons
                  name={med.type === 'image' ? 'image' : med.type === 'audio' ? 'mic' : 'document'}
                  size={16}
                  color={isDark ? '#e2e8f0' : '#475569'}
                />
                <Text style={[styles.mediaText, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
                  {med.type === 'image' ? 'Photo' : med.type === 'audio' ? 'Voice Note' : 'Document'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Timestamp & Delivery Ticks */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.time,
              { color: isDark ? (isOutbound ? 'rgba(233, 237, 239, 0.65)' : '#8696a0') : '#667781' },
            ]}
          >
            {time}
          </Text>
          {renderDeliveryStatus()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  outboundWrapper: {
    justifyContent: 'flex-end',
  },
  inboundWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  outboundBubbleDark: {
    backgroundColor: '#005c4b', // WhatsApp Dark Outbound Green
    borderBottomRightRadius: 2,
  },
  outboundBubbleLight: {
    backgroundColor: '#d9fdd3', // WhatsApp Light Outbound Green
    borderBottomRightRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  botBubbleDark: {
    backgroundColor: '#004c3e',
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 132, 0.4)',
  },
  botBubbleLight: {
    backgroundColor: '#cbfcd4',
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 132, 0.3)',
  },
  inboundBubbleDark: {
    backgroundColor: '#202c33', // WhatsApp Dark Inbound Slate
    borderBottomLeftRadius: 2,
  },
  inboundBubbleLight: {
    backgroundColor: '#ffffff', // WhatsApp Light Inbound White
    borderBottomLeftRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  senderHeader: {
    marginBottom: 3,
  },
  botBadge: {
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  botBadgeText: {
    color: '#00a884',
    fontSize: 10,
    fontWeight: '800',
  },
  outboundSenderText: {
    color: '#8696a0',
    fontSize: 10.5,
    fontWeight: '600',
  },
  outboundSenderYou: {
    color: '#0084ff',
    fontWeight: '700',
  },
  inboundSenderText: {
    color: '#00a884',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    fontSize: 14.2,
    lineHeight: 19.5,
  },
  templateCard: {
    gap: 4,
  },
  templateHeader: {
    color: '#00a884',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  templateFooter: {
    fontSize: 11.5,
    marginTop: 4,
  },
  templateButtonsContainer: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    gap: 6,
  },
  borderDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  borderLight: {
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  templateBtnDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  templateBtnLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  templateButtonText: {
    color: '#00a884',
    fontSize: 13,
    fontWeight: '700',
  },
  mediaContainer: {
    marginTop: 6,
    gap: 4,
  },
  mediaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 8,
  },
  mediaBoxDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  mediaBoxLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  mediaText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 3,
  },
  time: {
    fontSize: 10.5,
  },
  statusIcon: {
    marginLeft: 2,
  },
  internalNoteWrapper: {
    marginVertical: 4,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  internalNoteBubble: {
    borderRadius: 12,
    padding: 10,
    maxWidth: '92%',
    width: '100%',
    borderWidth: 1,
  },
  internalNoteBubbleDark: {
    backgroundColor: '#3b200b',
    borderColor: '#78350f',
  },
  internalNoteBubbleLight: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  internalNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  internalNoteTitle: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  internalNoteContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  internalNoteTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

