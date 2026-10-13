import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProductPalette } from '@/components/ProductUI';
import { WhatsAppBroadcast } from '../types';

interface BroadcastCardProps { broadcast: WhatsAppBroadcast; onPress?: (broadcast: WhatsAppBroadcast) => void; }

export const BroadcastCard: React.FC<BroadcastCardProps> = ({ broadcast, onPress }) => {
  const colors = useProductPalette();
  return <Pressable onPress={() => onPress?.(broadcast)} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={broadcast.name}
    style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 14, gap: 18, opacity: pressed ? 0.75 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="megaphone-outline" size={22} color={colors.text} /></View>
      <View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>{broadcast.name}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{broadcast.status.replace(/_/g, ' ')}</Text></View>
      <Ionicons name="chevron-forward" size={17} color={colors.iconSecondary} />
    </View>
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {[{ label: 'Recipients', value: broadcast.recipients_count }, { label: 'Delivered', value: broadcast.delivered_count }, { label: 'Read', value: broadcast.read_count }].map((item) => <View key={item.label} style={{ flex: 1, gap: 5 }}><Text style={{ fontSize: 21, color: colors.text }}>{item.value.toLocaleString()}</Text><Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.label}</Text></View>)}
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text style={{ flex: 1, color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{broadcast.template_name}</Text><Text style={{ fontSize: 12, color: colors.textSecondary }}>₹{((broadcast.actual_cost_paise ?? broadcast.estimated_cost_paise ?? 0) / 100).toFixed(2)}</Text></View>
  </Pressable>;
};
