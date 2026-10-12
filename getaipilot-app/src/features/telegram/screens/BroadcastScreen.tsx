import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Linking,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuthStore } from '../../../core/store/authStore';
import { AnimatedHero } from '../components/ui/AnimatedHero';
import { TelegramToolKey } from '../types';

interface Props {
  chats?: any[];
  isBroadcasting?: boolean;
  onOpenModal?: (key: TelegramToolKey) => void;
}

export const BroadcastScreen: React.FC<Props> = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const user = useAuthStore((s) => s.user);
  const { width } = useWindowDimensions();

  const telegramUserId =
    (user as any)?.telegram_user_id ||
    (user as any)?.user_metadata?.telegram_user_id ||
    null;

  const handleOpenBot = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = 'https://t.me/Gapgrowbot?start=true';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/Gapgrowbot?start=true');
      }
    } catch {
      await Linking.openURL('https://t.me/Gapgrowbot?start=true');
    }
  };

  const isWide = width >= 768;
  const numColumns = isWide ? 4 : 2;
  const cardWidthPercent = numColumns === 4 ? '23.5%' : '48.5%';

  const kpis = [
    {
      title: 'TARGET REACH',
      value: 'ALL USERS',
      icon: 'people-outline' as const,
      color: '#A855F7',
      subtext: 'Channel wide',
    },
    {
      title: 'DELIVERY SPEED',
      value: 'REAL-TIME',
      icon: 'flash-outline' as const,
      color: '#0284C7',
      subtext: 'High throughput',
    },
    {
      title: 'BROADCAST BOT',
      value: '@Gapgrowbot',
      icon: 'hardware-chip-outline' as const,
      color: '#EC4899',
      subtext: 'Official sender',
    },
    {
      title: 'CONNECTED USER',
      value: telegramUserId ? String(telegramUserId) : 'Not Linked',
      icon: 'person-outline' as const,
      color: '#10B981',
      subtext: telegramUserId ? 'Verified Account' : 'Tap connect below',
    },
  ];

  const features = [
    {
      icon: 'megaphone-outline' as const,
      title: 'Instant Bulk Announcements',
      desc: 'Send trade alerts, breaking news, or promotional announcements to all subscribers who joined via your bots.',
      color: '#A855F7',
    },
    {
      icon: 'stats-chart-outline' as const,
      title: 'Signal & Update Distribution',
      desc: 'Deliver key market signals directly to your community with zero rate limits or throttling bottlenecks.',
      color: '#0284C7',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'Anti-Spam Compliance',
      desc: 'Built with Telegram API best practices to ensure high deliverability and protect sender reputation.',
      color: '#10B981',
    },
  ];

  return (
    <View className="py-2.5 w-full flex-col gap-4">
      {/* 1. Cyber Animated Hero Banner */}
      <AnimatedHero
        variant="broadcast"
        tagText="TELEGRAM BROADCAST HUB"
        tagIcon="megaphone"
        title="GAP Broadcast Hub"
        subtitle="Send bulk messages, signal alerts & announcements to your audience"
      />

      {/* 2. Responsive KPI Command Cards */}
      <View className="flex-row flex-wrap gap-2.5 w-full">
        {kpis.map((kpi, idx) => (
          <View
            key={idx}
            className="p-3.5 rounded-2xl flex-col justify-between"
            style={{
              backgroundColor: colors.card,
              width: cardWidthPercent,
              minHeight: 88,
            }}
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                numberOfLines={1}
              >
                {kpi.title}
              </Text>
              <View
                className="w-6 h-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: `${kpi.color}15` }}
              >
                <Ionicons name={kpi.icon} size={13} color={kpi.color} />
              </View>
            </View>

            <Text
              className="text-sm font-extrabold"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {kpi.value}
            </Text>

            <Text
              className="text-[10px] font-medium mt-0.5"
              style={{ color: isDark ? '#64748B' : '#94A3B8' }}
              numberOfLines={1}
            >
              {kpi.subtext}
            </Text>
          </View>
        ))}
      </View>

      {/* 3. Setup & Features Hub */}
      <View
        className="w-full rounded-2xl p-5"
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-2 h-2 rounded-full bg-[#A855F7]" />
          <Text
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            BROADCAST ENGINE
          </Text>
        </View>

        <Text
          className="text-base font-extrabold mb-1"
          style={{ color: colors.text }}
        >
          Direct Audience Communication
        </Text>
        <Text
          className="text-xs leading-5 mb-4"
          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
        >
          Reach all users who joined your channels through GAP bots. Perfect for high-priority trading alerts, daily recaps, or sponsored updates.
        </Text>

        {/* Feature Items */}
        <View className="flex-col gap-3 mb-5">
          {features.map((item, i) => (
            <View
              key={i}
              className="p-3.5 rounded-xl flex-row items-start gap-3"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mt-0.5"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-bold mb-1"
                  style={{ color: colors.text }}
                >
                  {item.title}
                </Text>
                <Text
                  className="text-[11px] leading-4"
                  style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                >
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Connect Action Button */}
        <Pressable
          className="flex-row items-center justify-center gap-2.5 bg-[#A855F7] w-full py-3.5 rounded-xl active:opacity-90 shadow-md shadow-[#A855F7]/20"
          onPress={handleOpenBot}
        >
          <Ionicons name="megaphone" size={17} color="#FFFFFF" />
          <Text className="text-white text-xs font-extrabold tracking-wide">
            {telegramUserId ? 'OPEN GAP GROW BOT' : 'CONNECT TO TELEGRAM BOT'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>

        {/* Security Footnote */}
        <View className="flex-row items-center justify-center gap-1.5 mt-3.5">
          <Ionicons name="shield-checkmark-outline" size={12} color="#64748B" />
          <Text className="text-[11px] text-[#64748B] font-medium">
            Redirects securely to the official Telegram application
          </Text>
        </View>
      </View>
    </View>
  );
};

