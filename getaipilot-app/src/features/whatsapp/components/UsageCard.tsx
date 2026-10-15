import React from 'react';
import { Text, View } from 'react-native';
import { useProductPalette } from '@/components/ProductUI';
import { WhatsAppUsage } from '../types';

interface UsageCardProps { usage?: WhatsAppUsage; isLoading?: boolean; isConnected?: boolean; }

export const UsageCard: React.FC<UsageCardProps> = ({ usage, isLoading }) => {
  const colors = useProductPalette();
  return <View style={{ backgroundColor: colors.lavender, borderRadius: 26, padding: 22, gap: 18, marginBottom: 26 }}>
    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Messaging balance</Text>
    <Text style={{ fontSize: 30, fontWeight: '500', color: colors.text }}>{isLoading ? 'Loading…' : '₹' + (usage?.credits_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {[{ label: 'Sent', value: usage?.messages_sent ?? 0 }, { label: 'Delivered', value: usage?.messages_delivered ?? 0 }, { label: 'Failed', value: usage?.messages_failed ?? 0 }].map((item) =>
        <View key={item.label} style={{ flex: 1, gap: 6 }}><Text style={{ fontSize: 20, color: colors.text }}>{item.value.toLocaleString()}</Text><Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.label}</Text></View>)}
    </View>
  </View>;
};
