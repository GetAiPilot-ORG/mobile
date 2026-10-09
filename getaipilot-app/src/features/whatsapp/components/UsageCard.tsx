import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { WhatsAppUsage } from '../types';

const moneyIcon = require('../../../../assets/images/money.png');

interface UsageCardProps {
  usage?: WhatsAppUsage;
  isLoading?: boolean;
  isConnected?: boolean;
}

export const UsageCard: React.FC<UsageCardProps> = ({ usage, isLoading, isConnected = true }) => {
  const { isDark } = useTheme();

  const rawBalance = usage?.credits_balance ?? 0;
  const balance = isLoading
    ? '₹...'
    : `₹${rawBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sent = usage?.messages_sent ?? 0;
  const delivered = usage?.messages_delivered ?? 0;
  const failed = usage?.messages_failed ?? 0;

  const deliveryRate =
    sent > 0 ? Math.round((delivered / sent) * 100) : 0;

  return (
    <View
      className={`w-full rounded-2xl p-4 border mb-3 shadow-sm ${
        isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-[#E5E7EB]'
      }`}
    >
      {/* Wallet Top Header */}
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 items-center justify-center">
            <Image source={moneyIcon} style={{ width: 32, height: 32 }} contentFit="contain" />
          </View>
          <Text
            className={`text-[13px] font-semibold tracking-tight ${
              isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
            }`}
          >
            WhatsApp Cloud Wallet
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isConnected ? '#22C55E' : isDark ? '#636366' : '#94A3B8' }}
          />
          <Text
            className={`text-xs font-medium ${
              isConnected
                ? isDark
                  ? 'text-emerald-400'
                  : 'text-emerald-600'
                : isDark
                ? 'text-[#8E8E93]'
                : 'text-[#64748B]'
            }`}
          >
            {isConnected ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Main Balance Display */}
      <View className="mt-0.5 mb-3.5">
        <Text
          className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {balance}
        </Text>
      </View>

      {/* Sleek Integrated Stats Bar */}
      <View
        className={`flex-row items-center rounded-xl py-2.5 px-1 border ${
          isDark
            ? 'bg-[#121214] border-white/[0.05]'
            : 'bg-[#F8F9FA] border-[#F2F4F7]'
        }`}
      >
        {/* Sent */}
        <View className="flex-1 min-w-0 items-center justify-center" style={{ flexBasis: 0 }}>
          <Text
            className={`text-[11px] font-medium mb-0.5 ${
              isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Sent
          </Text>
          <Text
            className={`text-[15px] font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {sent.toLocaleString()}
          </Text>
        </View>

        <View
          className={`w-[1px] h-5.5 ${
            isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'
          }`}
        />

        {/* Delivered */}
        <View className="flex-1 min-w-0 items-center justify-center" style={{ flexBasis: 0 }}>
          <Text
            className={`text-[11px] font-medium mb-0.5 ${
              isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Delivered
          </Text>
          <Text
            className="text-[15px] font-bold tracking-tight text-emerald-500"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {delivered.toLocaleString()}
          </Text>
        </View>

        <View
          className={`w-[1px] h-5.5 ${
            isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'
          }`}
        />

        {/* Failed */}
        <View className="flex-1 min-w-0 items-center justify-center" style={{ flexBasis: 0 }}>
          <Text
            className={`text-[11px] font-medium mb-0.5 ${
              isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Failed
          </Text>
          <Text
            className={`text-[15px] font-bold tracking-tight ${
              failed > 0 ? 'text-red-500' : isDark ? 'text-[#8E8E93]' : 'text-[#94A3B8]'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {failed.toLocaleString()}
          </Text>
        </View>

        <View
          className={`w-[1px] h-5.5 ${
            isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'
          }`}
        />

        {/* Delivery % */}
        <View className="flex-1 min-w-0 items-center justify-center" style={{ flexBasis: 0 }}>
          <Text
            className={`text-[11px] font-medium mb-0.5 ${
              isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Delivery %
          </Text>
          <Text
            className={`text-[15px] font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {deliveryRate}%
          </Text>
        </View>
      </View>
    </View>
  );
};
