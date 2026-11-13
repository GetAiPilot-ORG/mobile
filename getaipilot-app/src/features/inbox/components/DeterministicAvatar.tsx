import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  WhatsappIcon,
  TelegramIcon,
  InstagramIcon,
  Facebook01Icon,
  BotMessageSquareIcon,
  UserIcon,
} from '@/constants/icons';
import { InboxChannel } from '../types';
import { useTheme } from '@/theme';

interface DeterministicAvatarProps {
  name: string;
  phoneOrHandle?: string;
  avatarUrl?: string;
  channel: InboxChannel;
  isBotActive?: boolean;
  isDefaultProfile?: boolean;
  size?: number;
}

const PASTEL_PALETTE_LIGHT = [
  { bg: '#EDE9FE', text: '#5B21B6' }, // Lavender
  { bg: '#DCFCE7', text: '#15803D' }, // Mint
  { bg: '#FCE7F3', text: '#BE185D' }, // Rose
  { bg: '#E0F2FE', text: '#0369A1' }, // Sky
  { bg: '#FEF3C7', text: '#B45309' }, // Amber
  { bg: '#E0E7FF', text: '#4338CA' }, // Indigo
  { bg: '#F3E8FF', text: '#7E22CE' }, // Purple
];

const PASTEL_PALETTE_DARK = [
  { bg: '#2E2856', text: '#DDD6FE' },
  { bg: '#143826', text: '#A7F3D0' },
  { bg: '#40192F', text: '#FBCFE8' },
  { bg: '#13354C', text: '#BAE6FD' },
  { bg: '#3D2810', text: '#FDE68A' },
  { bg: '#212048', text: '#C7D2FE' },
  { bg: '#341E47', text: '#E9D5FF' },
];

const CHANNEL_ICONS: Record<InboxChannel, { icon: any; color: string; bg: string }> = {
  whatsapp: { icon: WhatsappIcon, color: '#16A34A', bg: '#DCFCE7' },
  telegram: { icon: TelegramIcon, color: '#0284C7', bg: '#E0F2FE' },
  instagram: { icon: InstagramIcon, color: '#DB2777', bg: '#FCE7F3' },
  facebook: { icon: Facebook01Icon, color: '#2563EB', bg: '#DBEAFE' },
};

function getInitials(name: string, phoneOrHandle?: string): string {
  const clean = (name || phoneOrHandle || '').trim();
  if (!clean) return '';

  // If identifier is a phone number or non-alphabetic, don't show awkward '#' or digits
  if (/^(\+|\d)/.test(clean)) {
    return '';
  }

  // If it's a generic default title, return empty to trigger default user icon
  const lower = clean.toLowerCase();
  if (['customer', 'whatsapp user', 'telegram user', 'instagram user', 'facebook user', 'guest customer'].includes(lower)) {
    return '';
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const DeterministicAvatar: React.FC<DeterministicAvatarProps> = ({
  name,
  phoneOrHandle,
  avatarUrl,
  channel,
  isBotActive = false,
  isDefaultProfile = false,
  size = 46,
}) => {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState<boolean>(false);

  // Reset image error state if avatarUrl prop changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const initials = useMemo(() => getInitials(name, phoneOrHandle), [name, phoneOrHandle]);

  const palette = useMemo(() => {
    const hash = stringToHash(name || phoneOrHandle || 'user');
    const list = isDark ? PASTEL_PALETTE_DARK : PASTEL_PALETTE_LIGHT;
    return list[hash % list.length];
  }, [name, phoneOrHandle, isDark]);

  const channelConfig = CHANNEL_ICONS[channel] || CHANNEL_ICONS.whatsapp;
  const channelBadgeSize = Math.max(16, Math.round(size * 0.38));
  const channelIconSize = Math.max(10, Math.round(size * 0.23));

  const hasValidImage =
    !!avatarUrl &&
    !imageError &&
    avatarUrl.trim().length > 0 &&
    avatarUrl !== 'null' &&
    avatarUrl !== 'undefined';

  const shouldShowDefaultUserIcon = isDefaultProfile || !initials;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Avatar Circle / Rounded Card */}
      {hasValidImage ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.34 }]}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : shouldShowDefaultUserIcon ? (
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size * 0.34,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : palette.bg,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <HugeiconsIcon
            icon={UserIcon}
            size={Math.round(size * 0.48)}
            color={isDark ? '#E2E8F0' : palette.text}
            strokeWidth={2}
          />
        </View>
      ) : (
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size * 0.34,
              backgroundColor: palette.bg,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                color: palette.text,
                fontSize: Math.round(size * 0.36),
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Channel Icon Badge (Bottom-Right) */}
      <View
        style={[
          styles.channelBadge,
          {
            width: channelBadgeSize,
            height: channelBadgeSize,
            borderRadius: channelBadgeSize / 2,
            backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
            borderColor: isDark ? '#2E2B3D' : '#F1F0F7',
          },
        ]}
      >
        <HugeiconsIcon
          icon={channelConfig.icon}
          size={channelIconSize}
          color={channelConfig.color}
          strokeWidth={2}
        />
      </View>

      {/* AI Bot Sparkle Badge (Top-Right, only when AI bot active) */}
      {isBotActive && (
        <View
          style={[
            styles.botBadge,
            {
              backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
              borderColor: isDark ? '#2E2B3D' : '#F1F0F7',
            },
          ]}
        >
          <HugeiconsIcon
            icon={BotMessageSquareIcon}
            size={10}
            color="#7055E8"
            strokeWidth={2.2}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  channelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  botBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#7055E8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});

