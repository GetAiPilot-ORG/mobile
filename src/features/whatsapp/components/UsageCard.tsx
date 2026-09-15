import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { WhatsAppUsage } from '../types';

const moneyIcon = require('../../../../assets/images/money.png');

interface UsageCardProps {
  usage?: WhatsAppUsage;
  isLoading?: boolean;
  isConnected?: boolean;
}

export const UsageCard: React.FC<UsageCardProps> = ({ usage, isLoading, isConnected = true }) => {
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
    <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-3">
      {/* Wallet Top Header */}
      <View className="flex-row justify-between items-center mb-1.5">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 items-center justify-center">
            <Image source={moneyIcon} className="w-7 h-7" contentFit="contain" />
          </View>
          <Text className="text-xs font-bold text-slate-300">
            WhatsApp Cloud Wallet
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <View
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`}
          />
          <Text
            className={`text-xs font-semibold ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            {isConnected ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Main Balance Display */}
      <View className="my-2">
        <Text className="text-2xl font-extrabold text-white tracking-tight">
          {balance}
        </Text>
      </View>

      {/* Stats Bar */}
      <View className="flex-row items-center bg-[#111317] border border-[#262930] rounded-xl py-2.5 px-1">
        {/* Sent */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">
            Sent
          </Text>
          <Text className="text-xs font-bold text-white">
            {sent.toLocaleString()}
          </Text>
        </View>

        <View className="w-px h-5 bg-[#262930]" />

        {/* Delivered */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">
            Delivered
          </Text>
          <Text className="text-xs font-bold text-emerald-400">
            {delivered.toLocaleString()}
          </Text>
        </View>

        <View className="w-px h-5 bg-[#262930]" />

        {/* Failed */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">
            Failed
          </Text>
          <Text
            className={`text-xs font-bold ${failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}
          >
            {failed.toLocaleString()}
          </Text>
        </View>

        <View className="w-px h-5 bg-[#262930]" />

        {/* Delivery % */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-[10px] font-semibold text-slate-400 mb-0.5">
            Rate
          </Text>
          <Text className="text-xs font-bold text-[#0084FF]">
            {deliveryRate}%
          </Text>
        </View>
      </View>
    </View>
  );
};
