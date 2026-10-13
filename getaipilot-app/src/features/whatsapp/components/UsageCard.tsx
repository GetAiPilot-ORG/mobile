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
      className={`w-full rounded-2xl p-4 mb-3 shadow-sm ${
        isDark ? 'bg-[#1C1C1E]' : 'bg-white'
      }`}
      style={{
        borderWidth: 0,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 4,
      }}
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
            style={{ backgroundColor: isConnected ? '#25D366' : isDark ? '#636366' : '#94A3B8' }}
          />
          <Text
            className={`text-xs font-semibold ${
              isConnected
                ? isDark
                  ? 'text-[#25D366]'
                  : 'text-[#075E54]'
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

      {/* Sleek Borderless Stats Bar */}
      <View
        className={`flex-row items-center rounded-xl py-2.5 px-1 ${
          isDark
            ? 'bg-[#141416]'
            : 'bg-[#F4F6F8]'
        }`}
        style={{ borderWidth: 0 }}
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
          className={`w-[1px] h-5 ${
            isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'
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
            className="text-[15px] font-bold tracking-tight text-[#25D366]"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {delivered.toLocaleString()}
          </Text>
        </View>

        <View
          className={`w-[1px] h-5 ${
            isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'
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
          className={`w-[1px] h-5 ${
            isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'
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
