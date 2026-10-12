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
  summary?: any;
  onOpenModal?: (key: TelegramToolKey) => void;
}

export const AutoApproveScreen: React.FC<Props> = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const user = useAuthStore((s) => s.user);
  const { width } = useWindowDimensions();

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

  const isWide = width >= 768;
  const numColumns = isWide ? 4 : 2;
  const cardWidthPercent = numColumns === 4 ? '23.5%' : '48.5%';

  const kpis = [
    {
      title: 'ENGINE STATUS',
      value: 'ACTIVE 24/7',
      icon: 'shield-checkmark-outline' as const,
      color: '#10B981',
      subtext: 'Auto-pilot live',
    },
    {
      title: 'RESPONSE SPEED',
      value: '< 1.2s',
      icon: 'flash-outline' as const,
      color: '#06B6D4',
      subtext: 'Instant approval',
    },
    {
      title: 'ADMIN BOT',
      value: '@Gapautoapprovebot',
      icon: 'hardware-chip-outline' as const,
      color: '#8B5CF6',
      subtext: 'Official daemon',
    },
    {
      title: 'CONNECTED USER',
      value: telegramUserId ? String(telegramUserId) : 'Not Linked',
      icon: 'person-outline' as const,
      color: '#3B82F6',
      subtext: telegramUserId ? 'Verified Account' : 'Tap connect below',
    },
  ];

  const features = [
    {
      icon: 'flash-outline' as const,
      title: 'Instant Channel Admission',
      desc: 'Users who tap your private channel invite link are verified and granted access in real time without admin delay.',
      color: '#10B981',
    },
    {
      icon: 'shield-outline' as const,
      title: 'Spam & Bot Filtering',
      desc: 'Ensures only genuine prospective members pass through while shielding your VIP community from malicious traffic.',
      color: '#06B6D4',
    },
    {
      icon: 'sync-outline' as const,
      title: 'Automated 24/7 Operations',
      desc: 'Never miss subscriber conversions while you sleep. The daemon operates around the clock on dedicated GAP servers.',
      color: '#8B5CF6',
    },
  ];

  return (
    <View className="py-2.5 w-full flex-col gap-4">
      {/* 1. Cyber Animated Hero Banner */}
      <AnimatedHero
        variant="auto_approve"
        tagText="JOIN REQUEST AUTOMATION"
        tagIcon="checkmark-circle-outline"
        title="GAP Auto Approve"
        subtitle="24/7 automated acceptance for private VIP Telegram channels"
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
          <View className="w-2 h-2 rounded-full bg-[#10B981]" />
          <Text
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            HOW IT WORKS
          </Text>
        </View>

        <Text
          className="text-base font-extrabold mb-1"
          style={{ color: colors.text }}
        >
          Effortless Private Channel Scaling
        </Text>
        <Text
          className="text-xs leading-5 mb-4"
          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
        >
          Add the bot to your private Telegram channel with administrator privileges. It will automatically detect incoming member requests and approve them instantaneously.
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
          className="flex-row items-center justify-center gap-2.5 bg-[#0284C7] w-full py-3.5 rounded-xl active:opacity-90 shadow-md shadow-[#0284C7]/20"
          onPress={handleConnect}
        >
          <Ionicons name="hardware-chip-outline" size={18} color="#FFFFFF" />
          <Text className="text-white text-xs font-extrabold tracking-wide">
            {telegramUserId ? 'OPEN AUTO APPROVE BOT' : 'CONNECT TO TELEGRAM BOT'}
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

