import React from 'react';
import { Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/theme';
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
  const { isDark } = useTheme();

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
    <View
      className={`w-full rounded-2xl p-4 border mb-3 shadow-sm ${
        isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-[#E5E7EB]'
      }`}
    >
      {/* Profile & Connection Info Header */}
      <View className="flex-row items-center mb-3.5">
        {/* iOS Avatar with Live Connection Dot */}
        <View className="relative mr-3">
          <View
            className={`w-11 h-11 rounded-xl justify-center items-center border ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/25'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            <Ionicons
              name="logo-whatsapp"
              size={24}
              color={isConnected ? '#22C55E' : isDark ? '#8E8E93' : '#64748B'}
            />
          </View>
          {/* Live Online / Connected Indicator Ring */}
          <View
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
              isDark ? 'border-[#1C1C1E]' : 'border-white'
            }`}
            style={{ backgroundColor: isConnected ? '#22C55E' : '#EF4444' }}
          />
        </View>

        {/* Business Details */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Text
              className={`text-base font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              numberOfLines={1}
            >
              {connection?.display_name || (isConnected ? 'WhatsApp Business' : 'No Active Connection')}
            </Text>
            {isConnected && <Ionicons name="checkmark-circle" size={15} color="#0084FF" />}
          </View>

          <View className="flex-row items-center gap-1.5">
            {connection?.phone_number ? (
              <Pressable className="flex-row items-center gap-1" onPress={handleCopyPhone} hitSlop={6}>
                <Text
                  className={`text-xs font-medium tracking-tight ${
                    isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
                  }`}
                >
                  {connection.phone_number}
                </Text>
                <Ionicons
                  name="copy-outline"
                  size={11.5}
                  color={isDark ? '#64748B' : '#94A3B8'}
                />
              </Pressable>
            ) : (
              <Text
                className={`text-xs font-medium tracking-tight ${
                  isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
                }`}
              >
                No Number Linked
              </Text>
            )}

            <Text className={`text-xs ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>•</Text>

            <Text
              className="text-xs font-semibold tracking-tight"
              style={{ color: isConnected ? '#22C55E' : '#EF4444' }}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Switch Account Action if multiple numbers */}
        {hasMultipleAccounts && onSwitchAccountPress && (
          <Pressable
            className={`flex-row items-center gap-1 px-2 py-1.5 rounded-lg active:opacity-70 ${
              isDark ? 'bg-[#0A84FF]/15' : 'bg-[#007AFF]/10'
            }`}
            onPress={onSwitchAccountPress}
          >
            <Ionicons name="swap-horizontal" size={14} color={isDark ? '#0A84FF' : '#007AFF'} />
            <Text
              className={`text-xs font-semibold ${
                isDark ? 'text-[#0A84FF]' : 'text-[#007AFF]'
              }`}
            >
              Switch
            </Text>
          </Pressable>
        )}
      </View>

      {/* SLA / Connection Notice Row */}
      {isConnected ? (
        <View
          className={`flex-row justify-between items-center border-t pt-2.5 ${
            isDark ? 'border-[#2C2C2E]' : 'border-[#E5E7EB]'
          }`}
        >
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="speedometer-outline" size={13} color={isDark ? '#64748B' : '#94A3B8'} />
            <Text className={`text-xs ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
              Tier Limit:{' '}
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formattedLimit}
              </Text>
            </Text>
          </View>

          <View className="bg-indigo-500/10 px-2 py-0.5 rounded-md">
            <Text className="text-indigo-400 text-[10.5px] font-semibold tracking-tight">
              Meta Cloud API
            </Text>
          </View>
        </View>
      ) : (
        <View
          className={`flex-row items-center border-t pt-2.5 ${
            isDark ? 'border-[#2C2C2E]' : 'border-[#E5E7EB]'
          }`}
        >
          <Ionicons name="information-circle" size={14} color="#EF4444" style={{ marginRight: 6 }} />
          <Text
            className={`text-xs leading-4 flex-1 ${
              isDark ? 'text-red-300' : 'text-red-700'
            }`}
          >
            WhatsApp is disconnected. Link your number in web dashboard to resume messaging.
          </Text>
        </View>
      )}
    </View>
  );
};
