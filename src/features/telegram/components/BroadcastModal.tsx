import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { telegramApi } from '../api/telegramApi';

interface BroadcastModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
  isLoading?: boolean;
  chats?: any[];
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  visible,
  onClose,
}) => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['telegram_broadcast_status'],
    queryFn: telegramApi.getBroadcastStatus,
    enabled: visible,
  });

  const handleOpenBot = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = status?.botUrl || 'https://t.me/GapGrowBot';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/GapGrowBot');
      }
    } catch {
      await Linking.openURL('https://t.me/GapGrowBot');
    }
  };

  const features = [
    {
      icon: 'paper-plane-outline',
      title: 'Targeted Outreach',
      desc: 'Reach all users who joined your channels through GAP bots and tracking links.',
      color: '#0084FF',
    },
    {
      icon: 'flash-outline',
      title: 'Instant Delivery',
      desc: 'Send announcements, trading signals, or daily updates to subscribers concurrently.',
      color: '#F59E0B',
    },
    {
      icon: 'link-outline',
      title: 'Interactive Buttons',
      desc: 'Attach custom inline buttons, deep links, and media attachments to your messages.',
      color: '#10B981',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Secure & Anti-Ban',
      desc: 'Rate-limited broadcast engine ensuring your bot and channels stay 100% compliant.',
      color: '#8B5CF6',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0B0D10]">
        {/* Top Header */}
        <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-[#262930] bg-[#181A1F]">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-lg bg-[#0084FF]/10 justify-center items-center">
              <Ionicons name="megaphone" size={16} color="#0084FF" />
            </View>
            <View>
              <Text className="text-base font-bold text-white">GAP Broadcast</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Send bulk messages to your audience instantly</Text>
            </View>
          </View>
          <Pressable
            className="w-8 h-8 rounded-full bg-[#111317] justify-center items-center active:opacity-70"
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="py-16 justify-center items-center gap-3">
              <ActivityIndicator size="large" color="#0084FF" />
              <Text className="text-xs font-medium text-slate-400">
                Syncing with GAP Broadcast engine...
              </Text>
            </View>
          ) : (
            <>
              {/* Central Broadcast Hero Card */}
              <View className="rounded-2xl p-6 items-center border border-[#262930] bg-[#181A1F] mb-6">
                {/* Eyebrow badge */}
                <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-[#0084FF]/10 mb-4">
                  <Ionicons name="sparkles" size={12} color="#0084FF" />
                  <Text className="text-[#0084FF] text-[10px] font-extrabold tracking-wider">TELEGRAM BROADCAST</Text>
                </View>

                {/* Bot Icon with Glow Ring */}
                <View className="w-16 h-16 rounded-full bg-[#0084FF]/20 justify-center items-center mb-3">
                  <View className="w-12 h-12 rounded-full bg-[#0084FF] justify-center items-center shadow-lg shadow-[#0084FF]/40">
                    <Ionicons name="rocket" size={26} color="#FFFFFF" />
                  </View>
                </View>

                <Text className="text-xl font-extrabold text-white mb-1">
                  {status?.botName || 'GAPGrow Bot'}
                </Text>

                <View className="px-2.5 py-0.5 rounded-lg bg-[#0084FF]/10 mb-3">
                  <Text className="text-[#0084FF] text-xs font-bold">{status?.botUsername || '@GapGrowBot'}</Text>
                </View>

                <Text className="text-slate-400 text-xs leading-5 text-center mb-4 px-2">
                  Reach all users who joined your channels through GAP bots. Perfect for announcements, signals, or daily updates.
                </Text>

                {/* Connected Telegram User ID Pill */}
                <View className="flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#262930] bg-[#111317] w-full justify-center mb-4">
                  <Ionicons name="hardware-chip-outline" size={16} color="#0084FF" />
                  <Text className="text-xs font-semibold text-slate-300">
                    Connected Telegram ID:{' '}
                    <Text className="text-[#0084FF] font-extrabold">
                      {status?.telegramUserId ? status.telegramUserId : '8891953778'}
                    </Text>
                  </Text>
                  <View className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
                </View>

                {/* Big Vibrant CTA Action Button */}
                <Pressable
                  className="bg-[#0084FF] flex-row items-center justify-center gap-2.5 w-full py-3.5 rounded-xl active:opacity-90 shadow-md shadow-[#0084FF]/30"
                  onPress={handleOpenBot}
                >
                  <Ionicons name="logo-android" size={18} color="#FFFFFF" />
                  <Text className="text-white text-xs font-extrabold tracking-wide">OPEN GAP GROW BOT</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>

                <View className="flex-row items-center gap-1 mt-2.5">
                  <Ionicons name="arrow-redo-outline" size={12} color="#64748B" />
                  <Text className="text-slate-400 text-[11px]">Redirects securely to official Telegram app</Text>
                </View>
              </View>

              {/* Feature Highlights Grid */}
              <Text className="text-sm font-bold tracking-tight text-white mb-3">
                Broadcast Capabilities
              </Text>

              <View className="gap-2.5 mb-5">
                {features.map((item, idx) => (
                  <View
                    key={`bc_feat_${idx}`}
                    className="flex-row items-start gap-3 p-3.5 rounded-xl border border-[#262930] bg-[#181A1F]"
                  >
                    <View
                      className="w-9 h-9 rounded-lg justify-center items-center mt-0.5"
                      style={{ backgroundColor: `${item.color}18` }}
                    >
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-white mb-0.5">
                        {item.title}
                      </Text>
                      <Text className="text-slate-400 text-xs leading-4">{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Instructions Card */}
              <View className="p-3.5 rounded-xl border border-[#0084FF]/25 bg-[#0084FF]/10">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Ionicons name="information-circle" size={16} color="#0084FF" />
                  <Text className="text-xs font-bold text-white">
                    How to broadcast messages:
                  </Text>
                </View>
                <Text className="text-slate-300 text-xs leading-5 mb-1">1. Tap <Text className="font-bold text-[#0084FF]">Open GAP Grow Bot</Text> above to launch Telegram.</Text>
                <Text className="text-slate-300 text-xs leading-5 mb-1">2. Use the interactive menu in <Text className="font-bold text-white">@GapGrowBot</Text> to craft your text, media, and buttons.</Text>
                <Text className="text-slate-300 text-xs leading-5">3. Select your target audience segment and send instantly.</Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

