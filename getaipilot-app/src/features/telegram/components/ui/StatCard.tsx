import React from 'react';
import { Pressable, Text } from 'react-native';
import { useProductPalette } from '@/components/ProductUI';

interface StatCardProps {
  label: string; value: string | number; icon: string; color: string; bg: string;
  sub: string; onPress?: () => void; isRevenue?: boolean; style?: any;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, onPress, style }) => {
  const colors = useProductPalette();
  const readableLabel = label.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  return <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={readableLabel + ': ' + value}
    style={[{ flex: 1, minWidth: 0, padding: 18, borderRadius: 22, backgroundColor: colors.card, gap: 8, minHeight: 100 }, style]}>
    <Text style={{ fontSize: 26, fontWeight: '500', color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textSecondary }}>{readableLabel}</Text>
  </Pressable>;
};
