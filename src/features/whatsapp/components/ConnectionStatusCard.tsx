import React from 'react';
import { Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { WhatsAppConnection } from '../types';

interface ConnectionStatusCardProps {
  connection?: WhatsAppConnection;
  isLoading?: boolean;
  onConnectPress?: () => void;
  onSwitchAccountPress?: () => void;
  hasMultipleAccounts?: boolean;
}

export const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({
  connection,
  isLoading,
  onConnectPress,
  onSwitchAccountPress,
  hasMultipleAccounts = false,
}) => {
  const isConnected = connection?.connected === true && Boolean(connection?.phone_number);

  const rawLimit = connection?.messaging_limit;
  const formattedLimit = rawLimit && rawLimit !== 'TIER_NOT_SET' && rawLimit !== 'null'
    ? rawLimit.replace('TIER_', '') + ' msgs / 24h'
    : 'Not Configured';

  const handleCopyPhone = async () => {
    if (connection?.phone_number) {
      await Clipboard.setStringAsync(connection.phone_number);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  return (
    <View className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-3">
      {/* Profile & Connection Info Header */}
      <View className="flex-row items-center mb-3.5">
        {/* Avatar with Live Connection Dot */}
        <View className="relative mr-3">
          <View className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
            <Ionicons
              name="logo-whatsapp"
              size={22}
              color={isConnected ? '#22C55E' : '#64748B'}
            />
          </View>
          {/* Live Online / Connected Indicator Ring */}
          <View
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#181A1F] ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`}
          />
        </View>

        {/* Business Details */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <Text className="text-base font-bold text-white flex-1" numberOfLines={1}>
              {connection?.display_name || (isConnected ? 'WhatsApp Business' : 'No Active Connection')}
            </Text>
            {isConnected && <Ionicons name="checkmark-circle" size={15} color="#0084FF" />}
          </View>

          <View className="flex-row items-center gap-1.5">
            {connection?.phone_number ? (
              <Pressable className="flex-row items-center gap-1" onPress={handleCopyPhone} hitSlop={6}>
                <Text className="text-xs font-medium text-slate-400">
                  {connection.phone_number}
                </Text>
                <Ionicons
                  name="copy-outline"
                  size={11}
                  color="#64748B"
                />
              </Pressable>
            ) : (
              <Text className="text-xs font-medium text-slate-400">
                No Number Linked
              </Text>
            )}

            <Text className="text-xs text-slate-500">•</Text>

            <Text className={`text-xs font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Switch Account Action if multiple numbers */}
        {hasMultipleAccounts && onSwitchAccountPress && (
          <Pressable
            className="flex-row items-center gap-1 bg-[#0084FF]/10 px-2.5 py-1.5 rounded-lg active:opacity-70"
            onPress={onSwitchAccountPress}
          >
            <Ionicons name="swap-horizontal" size={14} color="#0084FF" />
            <Text className="text-xs font-bold text-[#0084FF]">
              Switch
            </Text>
          </Pressable>
        )}
      </View>

      {/* SLA / Connection Notice Row */}
      {isConnected ? (
        <View className="flex-row justify-between items-center border-t border-[#262930] pt-2.5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="speedometer-outline" size={13} color="#94A3B8" />
            <Text className="text-xs text-slate-400">
              Tier Limit:{' '}
              <Text className="font-bold text-white">
                {formattedLimit}
              </Text>
            </Text>
          </View>

          <View className="bg-[#0084FF]/10 border border-[#0084FF]/20 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold text-[#0084FF]">Meta Cloud API</Text>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center border-t border-[#262930] pt-2.5">
          <Ionicons name="information-circle" size={14} color="#EF4444" style={{ marginRight: 6 }} />
          <Text className="text-xs text-rose-300 flex-1">
            WhatsApp is disconnected. Link your number in web dashboard to resume messaging.
          </Text>
        </View>
      )}
    </View>
  );
};
