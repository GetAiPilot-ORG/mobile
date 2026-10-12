import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useAuthStore } from '../../../core/store/authStore';
import { TelegramToolKey } from '../types';

interface Props {
  chats?: any[];
  summary?: any;
  onOpenModal?: (key: TelegramToolKey) => void;
}

export const AutoApproveScreen: React.FC<Props> = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const user = useAuthStore((s) => s.user);

  const telegramUserId =
    (user as any)?.telegram_user_id ||
    (user as any)?.user_metadata?.telegram_user_id ||
    null;

  const handleConnect = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = 'https://t.me/Gapautoapprovebot?start=true';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/Gapautoapprovebot?start=true');
      }
    } catch {
      await Linking.openURL('https://t.me/Gapautoapprovebot?start=true');
    }
  };

  return (
    <View className="py-2.5 items-center w-full">
      <View
        className="w-full rounded-[20px] border p-6 items-center shadow-sm shadow-black/5"
        style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
      >
        {/* App Icon */}
        <View
          className="w-24 h-24 rounded-[20px] border p-1 mb-5 justify-center items-center"
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <Image
            source={require('../../../../assets/images/autoapprove-icon.jpg')}
            className="w-full h-full rounded-2xl"
            resizeMode="cover"
          />
        </View>

        {/* Category Eyebrow */}
        <Text className="text-[11.5px] font-extrabold text-[#0284C7] tracking-wider mb-2 uppercase">
          JOIN REQUEST AUTOMATION
        </Text>

        {/* Title */}
        <Text
          className="text-[26px] font-extrabold mb-2.5 text-center"
          style={{ color: colors.text }}
        >
          GAP Auto Approve
        </Text>

        {/* Subtitle */}
        <Text
          className="text-[14.5px] font-semibold text-center mb-3 max-w-[320px]"
          style={{ color: isDark ? '#94A3B8' : '#334155' }}
        >
          Automatically approve and manage private channel requests.
        </Text>

        {/* Description */}
        <Text className="text-[13px] text-[#64748B] leading-[19px] text-center mb-6 max-w-[340px]">
          Add the bot to your channel as an administrator and let it handle join requests instantly, without manual admin work.
        </Text>

        {/* Connected Telegram ID Pill */}
        {telegramUserId ? (
          <View
            className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl border mb-6"
            style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }}
          >
            <Ionicons name="shield-checkmark" size={16} color="#0284C7" />
            <Text className="text-[13px] font-bold" style={{ color: colors.text }}>
              Connected Telegram ID: {telegramUserId}
            </Text>
          </View>
        ) : null}

        {/* Connect Action Button */}
        <Pressable
          className="flex-row items-center justify-center gap-2.5 bg-[#024AD8] w-full py-3.5 rounded-xl shadow-md shadow-[#024AD8]/30 mb-5 active:opacity-90"
          onPress={handleConnect}
        >
          <Ionicons name="hardware-chip-outline" size={18} color="#FFFFFF" />
          <Text className="text-white text-[13.5px] font-extrabold tracking-wide">
            CONNECT TO TELEGRAM BOT
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>

        {/* Secure Redirect Note */}
        <View
          className="flex-row items-center gap-1.5 border-t pt-4 w-full justify-center"
          style={{ borderTopColor: isDark ? '#27272A' : '#E2E8F0' }}
        >
          <Ionicons name="open-outline" size={14} color="#64748B" />
          <Text className="text-xs text-[#64748B] font-semibold">
            Redirects securely to Telegram app
          </Text>
        </View>
      </View>
    </View>
  );
};
