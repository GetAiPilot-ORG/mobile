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

interface AutoApproveModalProps {
  visible: boolean;
  onClose: () => void;
  onToggle?: (enabled: boolean) => Promise<void>;
}

export const AutoApproveModal: React.FC<AutoApproveModalProps> = ({
  visible,
  onClose,
}) => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['telegram_auto_approve_status'],
    queryFn: telegramApi.getAutoApproveStatus,
    enabled: visible,
  });

  const handleOpenBot = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = status?.botUrl || 'https://t.me/Gapautoapprovebot?start=true';
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

  const capabilities = [
    {
      icon: 'shield-checkmark-outline',
      title: 'Instant Join Approval',
      desc: 'Automatically approve pending join requests in private channels 24/7 without manual delay.',
      color: '#0084FF',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Automated Welcome DM',
      desc: 'Send personalized onboarding messages, trading guidelines, or VIP links to users upon approval.',
      color: '#10B981',
    },
    {
      icon: 'people-outline',
      title: 'High-Volume Channel Support',
      desc: 'Effortlessly processes thousands of incoming join requests simultaneously with zero bottleneck.',
      color: '#8B5CF6',
    },
    {
      icon: 'lock-closed-outline',
      title: 'Anti-Spam Filtering',
      desc: 'Safeguard your VIP communities against bots, duplicate accounts, and spam raids.',
      color: '#F59E0B',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0B0D10]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-[#262930] bg-[#181A1F]">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-xl bg-[#0084FF]/10 items-center justify-center">
              <Ionicons name="checkmark-done-circle" size={18} color="#0084FF" />
            </View>
            <View>
              <Text className="text-base font-bold text-white">GAP Auto Approve</Text>
              <Text className="text-xs text-slate-400">Join Request & Member Verification Automation</Text>
            </View>
          </View>
          <Pressable
            className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center"
            onPress={onClose}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-12" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="py-16 items-center justify-center gap-3">
              <ActivityIndicator size="large" color="#0084FF" />
              <Text className="text-xs font-semibold text-slate-400">
                Syncing with GAP Auto Approve engine...
              </Text>
            </View>
          ) : (
            <>
              {/* 🌟 Central Hero Card */}
              <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-5 items-center mb-5">
                {/* Logo Badge */}
                <View className="mb-4">
                  <View className="w-20 h-20 rounded-2xl bg-[#111317] border border-[#262930] items-center justify-center shadow-lg">
                    <Ionicons name="shield-checkmark" size={28} color="#10B981" />
                    <Text className="text-[10px] font-black text-[#0084FF] tracking-widest mt-1">GAP</Text>
                    <Text className="text-[9px] font-semibold text-white">Auto Approve</Text>
                  </View>
                </View>

                {/* Eyebrow */}
                <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0084FF]/10 border border-[#0084FF]/20 mb-3">
                  <Ionicons name="flash" size={10} color="#0084FF" />
                  <Text className="text-[10px] font-extrabold text-[#0084FF] tracking-wider">JOIN REQUEST AUTOMATION</Text>
                </View>

                {/* Main Heading */}
                <Text className="text-xl font-extrabold text-white text-center mb-1">
                  GAP Auto Approve
                </Text>

                {/* Subtitle */}
                <Text className="text-xs font-semibold text-slate-300 text-center mb-2">
                  Automatically approve and manage private channel requests.
                </Text>

                {/* Description */}
                <Text className="text-xs text-slate-400 text-center leading-relaxed mb-4 px-2">
                  Add the bot to your channel as an administrator and let it handle join requests instantly, without manual admin work.
                </Text>

                {/* Connected Telegram ID Pill */}
                <View className="flex-row items-center justify-center gap-2 bg-[#111317] border border-[#262930] px-3.5 py-2.5 rounded-xl w-full mb-4">
                  <Ionicons name="shield-checkmark-outline" size={15} color="#0084FF" />
                  <Text className="text-xs font-semibold text-slate-300">
                    Connected Telegram ID:{' '}
                    <Text className="text-[#0084FF] font-bold">
                      {status?.telegramUserId ? status.telegramUserId : '1032153257'}
                    </Text>
                  </Text>
                  <View className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
                </View>

                {/* Action CTA Button */}
                <Pressable
                  className="bg-[#0084FF] flex-row items-center justify-center gap-2 w-full py-3.5 rounded-xl active:opacity-80"
                  onPress={handleOpenBot}
                >
                  <Ionicons name="logo-android" size={18} color="#FFFFFF" />
                  <Text className="text-xs font-extrabold text-white tracking-wider">CONNECT TO TELEGRAM BOT</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>

                {/* Redirect Footer */}
                <View className="flex-row items-center gap-1.5 mt-2.5">
                  <Ionicons name="arrow-redo-outline" size={11} color="#64748B" />
                  <Text className="text-[11px] text-slate-500">Redirects securely to Telegram app</Text>
                </View>
              </View>

              {/* Automation Capabilities Grid */}
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                Key Capabilities
              </Text>

              <View className="gap-2.5 mb-5">
                {capabilities.map((item, idx) => (
                  <View
                    key={`aa_feat_${idx}`}
                    className="flex-row items-start gap-3 bg-[#181A1F] border border-[#262930] p-3.5 rounded-xl"
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mt-0.5"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-white mb-0.5">
                        {item.title}
                      </Text>
                      <Text className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Step-by-Step Setup Guide */}
              <View className="bg-[#181A1F] border border-[#0084FF]/20 p-4 rounded-xl">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Ionicons name="information-circle" size={16} color="#0084FF" />
                  <Text className="text-xs font-bold text-white">
                    Quick 3-Step Setup:
                  </Text>
                </View>
                <Text className="text-[11px] text-slate-400 mb-1 leading-relaxed">1. Tap <Text className="font-bold text-[#0084FF]">Connect to Telegram Bot</Text> above to open @Gapautoapprovebot.</Text>
                <Text className="text-[11px] text-slate-400 mb-1 leading-relaxed">2. Add <Text className="font-bold text-white">@Gapautoapprovebot</Text> as an Administrator to your private channel.</Text>
                <Text className="text-[11px] text-slate-400 leading-relaxed">3. Enable <Text className="font-bold text-white">"Invite Users via Link"</Text> & <Text className="font-bold text-white">"Manage Join Requests"</Text> admin rights.</Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
