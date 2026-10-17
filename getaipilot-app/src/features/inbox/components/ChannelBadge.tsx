import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Facebook01Icon, InstagramIcon, TelegramIcon, WhatsappIcon } from '@/constants/icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { InboxChannel } from '../types';

interface ChannelBadgeProps {
  channel: InboxChannel;
  showLabel?: boolean;
}

const CHANNEL_CONFIG: Record<
  InboxChannel,
  { icon: React.ComponentProps<typeof HugeiconsIcon>['icon']; label: string; bg: string; color: string }
> = {
  whatsapp: {
    icon: WhatsappIcon,
    label: 'WhatsApp',
    bg: 'rgba(34, 197, 94, 0.12)',
    color: '#16a34a',
  },
  telegram: {
    icon: TelegramIcon,
    label: 'Telegram',
    bg: 'rgba(14, 165, 233, 0.12)',
    color: '#0284c7',
  },
  instagram: {
    icon: InstagramIcon,
    label: 'Instagram',
    bg: 'rgba(236, 72, 153, 0.12)',
    color: '#db2777',
  },
  facebook: {
    icon: Facebook01Icon,
    label: 'Facebook',
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#2563eb',
  },
};

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, showLabel = true }) => {
  const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.whatsapp;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <HugeiconsIcon icon={config.icon} size={12} color={config.color} strokeWidth={1.8} />
      {showLabel ? <Text style={[styles.label, { color: config.color }]}>{config.label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
