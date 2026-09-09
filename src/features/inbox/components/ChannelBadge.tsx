import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InboxChannel } from '../types';

interface ChannelBadgeProps {
  channel: InboxChannel;
  showLabel?: boolean;
}

const CHANNEL_CONFIG: Record<
  InboxChannel,
  { icon: string; label: string; bg: string; color: string }
> = {
  whatsapp: {
    icon: '💬',
    label: 'WhatsApp',
    bg: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
  },
  telegram: {
    icon: '✈️',
    label: 'Telegram',
    bg: 'rgba(14, 165, 233, 0.15)',
    color: '#0ea5e9',
  },
  instagram: {
    icon: '📸',
    label: 'Instagram',
    bg: 'rgba(236, 72, 153, 0.15)',
    color: '#ec4899',
  },
  facebook: {
    icon: '👤',
    label: 'Facebook',
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
  },
};

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, showLabel = true }) => {
  const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.whatsapp;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      {showLabel ? <Text style={[styles.label, { color: config.color }]}>{config.label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  icon: {
    fontSize: 11,
    marginRight: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
