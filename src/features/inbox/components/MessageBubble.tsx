import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NormalizedMessage } from '../types';

interface MessageBubbleProps {
  message: NormalizedMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOutbound = message.direction === 'outbound';
  const isBot = message.sender.type === 'bot';

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.wrapper, isOutbound ? styles.outboundWrapper : styles.inboundWrapper]}>
      <View
        style={[
          styles.bubble,
          isOutbound
            ? isBot
              ? styles.botBubble
              : styles.agentBubble
            : styles.inboundBubble,
        ]}
      >
        {/* Sender Label */}
        <View style={styles.senderHeader}>
          <Text
            style={[
              styles.senderName,
              isOutbound
                ? isBot
                  ? styles.botSenderText
                  : styles.agentSenderText
                : styles.inboundSenderText,
            ]}
          >
            {isBot ? '🤖 ' : ''}
            {message.sender.name}
          </Text>
        </View>

        {/* Message Content */}
        <Text
          style={[
            styles.content,
            isOutbound ? styles.outboundContent : styles.inboundContent,
          ]}
        >
          {message.content}
        </Text>

        {/* Media Attachments Preview */}
        {message.media && message.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {message.media.map((med, idx) => (
              <View key={idx} style={styles.mediaBox}>
                <Text style={styles.mediaText}>📎 {med.type.toUpperCase()} Attachment</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Timestamp */}
        <Text style={[styles.time, isOutbound ? styles.outboundTime : styles.inboundTime]}>
          {time}
        </Text>
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
    paddingVertical: 10,
    borderRadius: 16,
  },
  agentBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#0ea5e9',
    borderBottomRightRadius: 4,
  },
  inboundBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  senderHeader: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
  },
  agentSenderText: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  botSenderText: {
    color: '#e0f2fe',
  },
  inboundSenderText: {
    color: '#94a3b8',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  outboundContent: {
    color: '#ffffff',
  },
  inboundContent: {
    color: '#f8fafc',
  },
  mediaContainer: {
    marginTop: 8,
  },
  mediaBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mediaText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  outboundTime: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  inboundTime: {
    color: '#64748b',
  },
});
