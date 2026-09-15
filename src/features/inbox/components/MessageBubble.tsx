import React from 'react';
import { Text, View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NormalizedMessage } from '../types';
import { useAuthStore } from '../../../core/store/authStore';

interface MessageBubbleProps {
  message: NormalizedMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
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
        return <Ionicons name="checkmark-done" size={14} color="#38bdf8" className="ml-0.5" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="#94a3b8" className="ml-0.5" />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="#94a3b8" className="ml-0.5" />;
      case 'failed':
        return <Ionicons name="alert-circle" size={14} color="#ef4444" className="ml-0.5" />;
      default:
        return <Ionicons name="checkmark" size={14} color="#94a3b8" className="ml-0.5" />;
    }
  };

  // 1. Internal Team Note Rendering
  if (isInternalNote) {
    return (
      <View className="my-1 items-center px-2.5">
        <View className="rounded-xl p-2.5 max-w-[92%] w-full border bg-amber-950/40 border-amber-800/60">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="lock-closed" size={13} color="#f59e0b" />
            <Text className="text-[11.5px] font-semibold text-amber-400">
              Internal Note • {outboundLabel}
            </Text>
          </View>
          <Text className="text-[13px] leading-[18px] text-amber-100">
            {message.content}
          </Text>
          <Text className="text-[10px] mt-1 self-end text-amber-500">{time}</Text>
        </View>
      </View>
    );
  }

  const template = message.template;

  return (
    <View className={`my-0.5 flex-row ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[82%] px-3 py-2 rounded-2xl ${
          isOutbound
            ? isBot
              ? 'bg-[#004c3e] border border-emerald-500/40 rounded-br-sm'
              : 'bg-[#005c4b] rounded-br-sm'
            : 'bg-[#181A1F] border border-[#262930] rounded-bl-sm'
        }`}
      >
        {/* Sender Name / Bot Badge */}
        <View className="mb-0.5">
          {isBot ? (
            <View className="bg-emerald-500/20 px-1.5 py-0.5 rounded-md self-start mb-0.5">
              <Text className="text-emerald-400 text-[10px] font-extrabold">🤖 GAP AI Pilot</Text>
            </View>
          ) : isOutbound ? (
            <Text className={`text-[10.5px] font-semibold ${isMe ? 'text-[#0084FF] font-bold' : 'text-slate-400'}`}>
              {outboundLabel}
            </Text>
          ) : (
            <Text className="text-emerald-400 text-[11px] font-bold">{message.sender?.name || 'Contact'}</Text>
          )}
        </View>

        {/* Template Message Card */}
        {template ? (
          <View className="gap-1">
            {template.header?.text && (
              <Text className="text-emerald-400 text-[13px] font-extrabold mb-0.5">{template.header.text}</Text>
            )}
            <Text className="text-[14px] leading-[19px] text-white">
              {template.body || message.content}
            </Text>
            {template.footer && (
              <Text className="text-[11.5px] text-slate-400 mt-1">
                {template.footer}
              </Text>
            )}

            {/* Template Interactive Action Buttons */}
            {template.buttons && template.buttons.length > 0 && (
              <View className="mt-2 border-t border-white/15 pt-1.5 gap-1.5">
                {template.buttons.map((btn, idx) => (
                  <Pressable
                    key={idx}
                    className="flex-row items-center justify-center py-1.5 px-3 rounded-lg bg-black/25 active:bg-black/40"
                    onPress={() => {
                      if (btn.url) Linking.openURL(btn.url).catch(() => {});
                    }}
                  >
                    <Ionicons
                      name={btn.url ? 'open-outline' : btn.phone_number ? 'call-outline' : 'chatbubble-ellipses-outline'}
                      size={14}
                      color="#34d399"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-emerald-400 text-[13px] font-bold">{btn.text}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Standard Free-form Message Content */
          <Text className="text-[14px] leading-[19px] text-white">
            {message.content}
          </Text>
        )}

        {/* Media Attachments Preview */}
        {message.media && message.media.length > 0 && (
          <View className="mt-1.5 gap-1">
            {message.media.map((med, idx) => (
              <View key={idx} className="flex-row items-center px-2.5 py-1.5 rounded-lg gap-2 bg-black/25">
                <Ionicons
                  name={med.type === 'image' ? 'image' : med.type === 'audio' ? 'mic' : 'document'}
                  size={16}
                  color="#e2e8f0"
                />
                <Text className="text-[12.5px] font-semibold text-white">
                  {med.type === 'image' ? 'Photo' : med.type === 'audio' ? 'Voice Note' : 'Document'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Timestamp & Delivery Ticks */}
        <View className="flex-row items-center justify-end mt-1 gap-1">
          <Text className="text-[10.5px] text-slate-400">
            {time}
          </Text>
          {renderDeliveryStatus()}
        </View>
      </View>
    </View>
  );
};
