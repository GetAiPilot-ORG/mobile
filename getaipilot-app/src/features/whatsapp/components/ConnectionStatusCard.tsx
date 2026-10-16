import React from 'react';
import { Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ProductButton, useProductPalette } from '@/components/ProductUI';
import { WhatsAppConnection } from '../types';

interface ConnectionStatusCardProps {
  connection?: WhatsAppConnection; isLoading?: boolean; onConnectPress?: () => void;
  onSwitchAccountPress?: () => void; hasMultipleAccounts?: boolean;
}

export const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({ connection, isLoading, onConnectPress, onSwitchAccountPress, hasMultipleAccounts }) => {
  const colors = useProductPalette();
  const connected = connection?.connected === true && Boolean(connection.phone_number);
  return <View style={{ backgroundColor: colors.mint, borderRadius: 26, padding: 22, marginBottom: 26, gap: 14 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Ionicons name="logo-whatsapp" size={30} color={colors.text} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '500' }}>{connection?.display_name || 'WhatsApp Business'}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{isLoading ? 'Checking connection…' : connected ? 'Connected' : 'Not connected'}</Text>
      </View>
      {hasMultipleAccounts && onSwitchAccountPress && <Pressable onPress={onSwitchAccountPress} accessibilityRole="button" accessibilityLabel="Switch WhatsApp account" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="swap-horizontal" size={20} color={colors.text} /></Pressable>}
    </View>
    {connected ? <>
      <Pressable onPress={async () => { await Clipboard.setStringAsync(connection?.phone_number || ''); if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} accessibilityRole="button" accessibilityLabel="Copy phone number" style={{ flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>{connection?.phone_number}</Text><Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
      </Pressable>
      {connection?.messaging_limit && connection.messaging_limit !== 'TIER_NOT_SET' && connection.messaging_limit !== 'null' && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Daily message limit: {connection.messaging_limit.replace('TIER_', '')}</Text>}
    </> : <>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>Link your phone number in the web dashboard to start messaging.</Text>
      {onConnectPress && <ProductButton label="Connect WhatsApp" onPress={onConnectPress} />}
    </>}
  </View>;
};
