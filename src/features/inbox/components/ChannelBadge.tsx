import React from 'react';
import { Text, View } from 'react-native';
import { InboxChannel } from '../types';

interface ChannelBadgeProps {
  channel: InboxChannel;
  showLabel?: boolean;
}

const CHANNEL_CONFIG: Record<
  InboxChannel,
  { icon: string; label: string; bgClass: string; textClass: string }
> = {
  whatsapp: {
    icon: '💬',
    label: 'WhatsApp',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-500',
  },
  telegram: {
    icon: '✈️',
    label: 'Telegram',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-400',
  },
  instagram: {
    icon: '📸',
    label: 'Instagram',
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-400',
  },
  facebook: {
    icon: '👤',
    label: 'Facebook',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-400',
  },
};

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, showLabel = true }) => {
  const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.whatsapp;

  return (
    <View className={`flex-row items-center px-2 py-0.5 rounded-md ${config.bgClass}`}>
      <Text className="text-[11px] mr-1">{config.icon}</Text>
      {showLabel ? <Text className={`text-[11px] font-semibold ${config.textClass}`}>{config.label}</Text> : null}
    </View>
  );
};
