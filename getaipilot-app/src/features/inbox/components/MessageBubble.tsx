import React from 'react';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NormalizedMessage, InboxChannel } from '../types';
import { useAuthStore } from '../../../core/store/authStore';
import { useTheme, getColors } from '@/theme';

interface MessageBubbleProps {
  message: NormalizedMessage;
  channel?: InboxChannel;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, channel: propChannel }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const channel = (message.channel || propChannel || 'whatsapp') as InboxChannel;
  const isInstagram = channel === 'instagram';
  const isTelegram = channel === 'telegram';
  const isWhatsApp = !isInstagram && !isTelegram;

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

  // Format date/time (e.g. "10:51 AM" or "Oct 15")
  const dateObj = new Date(message.created_at);
  const time = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const renderDeliveryStatus = () => {
    if (!isOutbound || isInternalNote) return null;

    let tickColor: string;
    if (isInstagram) {
      tickColor = 'rgba(255, 255, 255, 0.9)';
    } else if (isTelegram) {
      tickColor = 'rgba(255, 255, 255, 0.9)';
    } else {
      tickColor = message.status === 'read' ? '#53bdeb' : isDark ? '#8696a0' : '#64748b';
    }

    switch (message.status) {
      case 'read':
      case 'delivered':
        return <Ionicons name="checkmark-done" size={13} color={tickColor} style={styles.statusIcon} />;
      case 'sent':
        return <Ionicons name="checkmark" size={13} color={tickColor} style={styles.statusIcon} />;
      case 'failed':
        return <Ionicons name="alert-circle" size={13} color="#ef4444" style={styles.statusIcon} />;
      default:
        return <Ionicons name="checkmark-done" size={13} color={tickColor} style={styles.statusIcon} />;
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

  // Text color per platform
  let textColor: string;
  if (isOutbound) {
    if (isInstagram || isTelegram) {
      textColor = '#FFFFFF';
    } else {
      textColor = isDark ? '#e9edef' : '#111b21';
    }
  } else {
    if (isInstagram) {
      textColor = isDark ? '#FFFFFF' : '#111827';
    } else if (isTelegram) {
      textColor = isDark ? '#FFFFFF' : '#0F172A';
    } else {
      textColor = isDark ? '#e9edef' : '#111b21';
    }
  }

  // Time color per platform
  let timeColor: string;
  if (isOutbound) {
    if (isInstagram || isTelegram) {
      timeColor = 'rgba(255, 255, 255, 0.85)';
    } else {
      timeColor = isDark ? 'rgba(233, 237, 239, 0.65)' : '#667781';
    }
  } else {
    if (isInstagram) {
      timeColor = '#9CA3AF';
    } else if (isTelegram) {
      timeColor = '#94A3B8';
    } else {
      timeColor = isDark ? '#8696a0' : '#667781';
    }
  }

  // Bubble style selection
  let bubbleStyle;
  if (isOutbound) {
    if (isInstagram) {
      bubbleStyle = styles.instagramOutbound;
    } else if (isTelegram) {
      bubbleStyle = styles.telegramOutbound;
    } else {
      bubbleStyle = isBot
        ? isDark
          ? styles.botBubbleDark
          : styles.botBubbleLight
        : isDark
        ? styles.outboundBubbleDark
        : styles.outboundBubbleLight;
    }
  } else {
    if (isInstagram) {
      bubbleStyle = isDark ? styles.instagramInboundDark : styles.instagramInboundLight;
    } else if (isTelegram) {
      bubbleStyle = isDark ? styles.telegramInboundDark : styles.telegramInboundLight;
    } else {
      bubbleStyle = isDark ? styles.inboundBubbleDark : styles.inboundBubbleLight;
    }
  }

  return (
    <View style={[styles.wrapper, isOutbound ? styles.outboundWrapper : styles.inboundWrapper]}>
      <View style={[styles.bubble, bubbleStyle]}>
        {/* Only WhatsApp displays the header/chips inside the bubble. Instagram & Telegram are clean as shown in screenshots */}
        {isWhatsApp && (
          <View style={styles.senderHeader}>
            {isBot ? (
              <View style={styles.botBadge}>
                <Ionicons name="hardware-chip-outline" size={11} color="#00a884" style={{ marginRight: 3 }} />
                <Text style={styles.botBadgeText}>GAP AI Pilot</Text>
              </View>
            ) : isOutbound ? (
              <Text style={[styles.outboundSenderText, isMe && styles.outboundSenderYou]}>
                {outboundLabel}
              </Text>
            ) : (
              <Text style={styles.inboundSenderText}>{message.sender?.name || 'Contact'}</Text>
            )}
          </View>
        )}

        {/* Template Message Card */}
        {template ? (
          <View style={styles.templateCard}>
            {template.header?.text && (
              <Text style={[styles.templateHeader, { color: isInstagram ? '#db2777' : isTelegram ? '#0284c7' : '#00a884' }]}>
                {template.header.text}
              </Text>
            )}
            <Text style={[styles.content, { color: textColor }]}>
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
                      color={isInstagram ? '#db2777' : isTelegram ? '#0284c7' : '#00a884'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.templateButtonText,
                        { color: isInstagram ? '#db2777' : isTelegram ? '#0284c7' : '#00a884' },
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Standard Free-form Message Content */
          <Text style={[styles.content, { color: textColor }]}>
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
                  color={isDark ? '#E9E6F2' : '#475569'}
                />
                <Text style={[styles.mediaText, { color: isDark ? '#F5F3FB' : '#1e293b' }]}>
                  {med.type === 'image' ? 'Photo' : med.type === 'audio' ? 'Voice Note' : 'Document'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Timestamp & Delivery Ticks */}
        <View style={styles.footerRow}>
          <Text style={[styles.time, { color: timeColor }]}>
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
    marginVertical: 4,
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
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  // ── 1. InstaPilot (Instagram) ────────────────────────────────────────────
  // Exactly matches Screenshot 1: Rich Magenta / Hot Pink outbound, Clean White inbound with gray border
  instagramOutbound: {
    backgroundColor: '#DB2777', // Rich Instagram Pink / Magenta
    borderRadius: 18,
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  instagramInboundLight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instagramInboundDark: {
    backgroundColor: '#262626',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#363636',
  },

  // ── 2. Telegram ──────────────────────────────────────────────────────────
  // Exactly matches Screenshot 2: Vibrant Blue outbound, Crisp White card inbound
  telegramOutbound: {
    backgroundColor: '#0284C7', // Vibrant Telegram Blue
    borderRadius: 18,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  telegramInboundLight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  telegramInboundDark: {
    backgroundColor: '#182533',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242F3D',
  },

  // ── 3. WhatsApp ──────────────────────────────────────────────────────────
  outboundBubbleDark: {
    backgroundColor: '#005c4b',
    borderRadius: 14,
    borderBottomRightRadius: 2,
  },
  outboundBubbleLight: {
    backgroundColor: '#d9fdd3',
    borderRadius: 14,
    borderBottomRightRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  botBubbleDark: {
    backgroundColor: '#004c3e',
    borderRadius: 14,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 132, 0.4)',
  },
  botBubbleLight: {
    backgroundColor: '#cbfcd4',
    borderRadius: 14,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 132, 0.3)',
  },
  inboundBubbleDark: {
    backgroundColor: '#202c33',
    borderRadius: 14,
    borderBottomLeftRadius: 2,
  },
  inboundBubbleLight: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },

  // ── Typography & Headers ─────────────────────────────────────────────────
  senderHeader: {
    marginBottom: 3,
  },
  botBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14.5,
    lineHeight: 20.5,
  },

  // ── Templates ────────────────────────────────────────────────────────────
  templateCard: {
    gap: 4,
  },
  templateHeader: {
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
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Media ────────────────────────────────────────────────────────────────
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

  // ── Footers ──────────────────────────────────────────────────────────────
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 3,
  },
  time: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 2,
  },

  // ── Internal Notes ───────────────────────────────────────────────────────
  internalNoteWrapper: {
    marginVertical: 4,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  internalNoteBubble: {
    borderRadius: 14,
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
