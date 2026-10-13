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
      {/* Profile & Connection Info Header */}
      <View className="flex-row items-center mb-3.5">
        {/* Avatar with Live Connection Dot */}
        <View className="relative mr-3">
          <View
            className={`w-11 h-11 rounded-xl justify-center items-center ${
              isDark
                ? 'bg-[#25D366]/15'
                : 'bg-[#25D366]/10'
            }`}
          >
            <Ionicons
              name="logo-whatsapp"
              size={24}
              color={isConnected ? '#25D366' : isDark ? '#8E8E93' : '#64748B'}
            />
          </View>
          {/* Live Online / Connected Indicator Ring */}
          <View
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${
              isDark ? 'border-2 border-[#1C1C1E]' : 'border-2 border-white'
            }`}
            style={{ backgroundColor: isConnected ? '#25D366' : '#EF4444' }}
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
            {isConnected && <Ionicons name="checkmark-circle" size={15} color="#25D366" />}
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
              style={{ color: isConnected ? '#25D366' : '#EF4444' }}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Switch Account Action if multiple numbers */}
        {hasMultipleAccounts && onSwitchAccountPress && (
          <Pressable
            className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg active:opacity-70 ${
              isDark ? 'bg-[#25D366]/15' : 'bg-[#25D366]/10'
            }`}
            onPress={onSwitchAccountPress}
          >
            <Ionicons name="swap-horizontal" size={14} color={isDark ? '#25D366' : '#075E54'} />
            <Text
              className={`text-xs font-semibold ${
                isDark ? 'text-[#25D366]' : 'text-[#075E54]'
              }`}
            >
              Switch
            </Text>
          </Pressable>
        )}
      </View>

      {/* SLA / Connection Notice Row (Borderless) */}
      {isConnected ? (
        <View className="flex-row justify-between items-center pt-2.5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="speedometer-outline" size={13} color={isDark ? '#64748B' : '#94A3B8'} />
            <Text className={`text-xs ${isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'}`}>
              Tier Limit:{' '}
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formattedLimit}
              </Text>
            </Text>
          </View>

          <View className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-[#25D366]/15' : 'bg-[#075E54]/10'}`}>
            <Text className={`text-[10.5px] font-semibold tracking-tight ${isDark ? 'text-[#25D366]' : 'text-[#075E54]'}`}>
              Meta Cloud API
            </Text>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center pt-2.5">
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
