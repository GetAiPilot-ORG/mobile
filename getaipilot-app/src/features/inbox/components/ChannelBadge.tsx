import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InboxChannel } from '../types';

interface ChannelBadgeProps {
  channel: InboxChannel;
  showLabel?: boolean;
}

const CHANNEL_CONFIG: Record<
  InboxChannel,
  { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string; color: string }
> = {
  whatsapp: {
    icon: 'logo-whatsapp',
    label: 'WhatsApp',
    bg: 'rgba(34, 197, 94, 0.12)',
    color: '#16a34a',
  },
  telegram: {
    icon: 'paper-plane',
    label: 'Telegram',
    bg: 'rgba(14, 165, 233, 0.12)',
    color: '#0284c7',
  },
  instagram: {
    icon: 'logo-instagram',
    label: 'Instagram',
    bg: 'rgba(236, 72, 153, 0.12)',
    color: '#db2777',
  },
  facebook: {
    icon: 'logo-facebook',
    label: 'Facebook',
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#2563eb',
  },
};

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, showLabel = true }) => {
  const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.whatsapp;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={11} color={config.color} style={{ marginRight: 3.5 }} />
      {showLabel ? <Text style={[styles.label, { color: config.color }]}>{config.label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
});
