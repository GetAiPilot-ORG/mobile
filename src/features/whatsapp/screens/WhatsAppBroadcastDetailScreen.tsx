import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { WhatsAppBroadcast } from '../types';

interface WhatsAppBroadcastDetailScreenProps {
  broadcast?: WhatsAppBroadcast;
  broadcastId?: string;
  onBack?: () => void;
}

export const WhatsAppBroadcastDetailScreen: React.FC<WhatsAppBroadcastDetailScreenProps> = ({
  broadcast: initialBroadcast,
  broadcastId,
  onBack,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const { data: broadcastsData, isLoading } = useWhatsAppBroadcasts();
  const broadcast = initialBroadcast || broadcastsData?.broadcasts.find((b) => b.id === broadcastId);

  if (isLoading && !broadcast) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        className="flex-1 bg-[#0B0D10]"
      >
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color="#0084FF" />
          <Text className="text-xs font-semibold text-slate-400 mt-3">
            Loading broadcast analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!broadcast) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        className="flex-1 bg-[#0B0D10]"
      >
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-base font-bold text-white mb-4 text-center">
            Broadcast campaign not found
          </Text>
          <Pressable
            className="flex-row items-center bg-[#181A1F] border border-[#262930] px-4 py-2.5 rounded-full active:bg-[#262930]"
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={16} color="#F8FAFC" style={{ marginRight: 4 }} />
            <Text className="text-xs font-bold text-white">
              Return to Broadcasts
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = broadcast.status === 'completed';
  const isQueued = broadcast.status === 'queued' || broadcast.status === 'preparing';
  const isScheduled = broadcast.status === 'scheduled';

  const statusBg = isCompleted
    ? 'bg-emerald-500/15 border-emerald-500/30'
    : isQueued
    ? 'bg-[#0084FF]/15 border-[#0084FF]/30'
    : isScheduled
    ? 'bg-amber-500/15 border-amber-500/30'
    : 'bg-rose-500/15 border-rose-500/30';

  const statusTextColor = isCompleted
    ? 'text-emerald-400'
    : isQueued
    ? 'text-[#0084FF]'
    : isScheduled
    ? 'text-amber-400'
    : 'text-rose-400';

  const deliveryRate =
    broadcast.sent_count > 0
      ? Math.round((broadcast.delivered_count / broadcast.sent_count) * 100)
      : 0;
  const readRate =
    broadcast.sent_count > 0 ? Math.round((broadcast.read_count / broadcast.sent_count) * 100) : 0;

  const funnelSteps = [
    {
      label: 'Total Audience',
      value: broadcast.recipients_count.toLocaleString(),
      icon: 'people-outline' as const,
      iconColor: '#94A3B8',
      bgColor: 'bg-slate-800',
    },
    {
      label: 'Dispatched / Sent',
      value: broadcast.sent_count.toLocaleString(),
      icon: 'paper-plane-outline' as const,
      iconColor: '#0084FF',
      bgColor: 'bg-[#0084FF]/15',
    },
    {
      label: `Delivered (${deliveryRate}%)`,
      value: broadcast.delivered_count.toLocaleString(),
      icon: 'checkmark-done-outline' as const,
      iconColor: '#10B981',
      bgColor: 'bg-emerald-500/15',
    },
    {
      label: `Read / Opened (${readRate}%)`,
      value: broadcast.read_count.toLocaleString(),
      icon: 'mail-open-outline' as const,
      iconColor: '#38BDF8',
      bgColor: 'bg-sky-500/15',
    },
    ...(broadcast.failed_count > 0
      ? [
          {
            label: 'Failed / Undelivered',
            value: broadcast.failed_count.toLocaleString(),
            icon: 'alert-circle-outline' as const,
            iconColor: '#EF4444',
            bgColor: 'bg-rose-500/15',
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-[#0B0D10]"
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-[#262930] bg-[#181A1F]">
        <Pressable
          className="w-10 h-10 rounded-full bg-[#111317] border border-[#262930] items-center justify-center mr-3 active:opacity-70"
          onPress={handleBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color="#F8FAFC"
          />
        </Pressable>
        <Text className="text-lg font-bold text-white tracking-tight flex-1" numberOfLines={1}>
          {broadcast.name}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-36"
        showsVerticalScrollIndicator={false}
      >
        {/* Campaign Summary Card */}
        <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-5">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-semibold text-slate-400">
              Execution Status
            </Text>
            <View className={`px-2.5 py-1 rounded-full border ${statusBg}`}>
              <Text className={`text-[11px] font-bold ${statusTextColor}`}>
                {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
          <Text className="text-lg font-bold text-white mb-1">
            {broadcast.name}
          </Text>
          <Text
            className="text-xs text-slate-400"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Template: {broadcast.template_name} ({broadcast.template_language})
          </Text>
        </View>

        {/* Funnel Telemetry Breakdown */}
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
          Delivery Funnel
        </Text>
        <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden mb-5">
          {funnelSteps.map((step, index) => (
            <React.Fragment key={step.label}>
              <View className="flex-row items-center py-3 px-4">
                <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${step.bgColor}`}>
                  <Ionicons name={step.icon} size={18} color={step.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">
                    {step.label}
                  </Text>
                </View>
                <Text className="text-sm font-bold text-white">
                  {step.value}
                </Text>
              </View>
              {index < funnelSteps.length - 1 && (
                <View className="h-px bg-[#262930] ml-4" />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Campaign Metadata Details */}
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
          Campaign Details
        </Text>
        <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden">
          <View className="flex-row justify-between items-center py-3.5 px-4">
            <Text className="text-xs text-slate-400">
              Audience Segment
            </Text>
            <Text className="text-xs font-bold text-white">
              {broadcast.audience_tag || 'All Contacts'}
            </Text>
          </View>
          <View className="h-px bg-[#262930] ml-4" />

          <View className="flex-row justify-between items-center py-3.5 px-4">
            <Text className="text-xs text-slate-400">
              Audience Type
            </Text>
            <Text className="text-xs font-bold text-white">
              {broadcast.audience_type
                ? broadcast.audience_type.charAt(0).toUpperCase() + broadcast.audience_type.slice(1).toLowerCase()
                : 'Custom'}
            </Text>
          </View>
          <View className="h-px bg-[#262930] ml-4" />

          <View className="flex-row justify-between items-center py-3.5 px-4">
            <Text className="text-xs text-slate-400">
              Cost Incurred
            </Text>
            <Text className="text-xs font-bold text-white">
              ₹{((broadcast.actual_cost_paise || broadcast.estimated_cost_paise || 0) / 100).toFixed(2)}
            </Text>
          </View>
          <View className="h-px bg-[#262930] ml-4" />

          <View className="flex-row justify-between items-center py-3.5 px-4">
            <Text className="text-xs text-slate-400">
              Created At
            </Text>
            <Text className="text-xs font-bold text-white">
              {new Date(broadcast.created_at).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
