import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, getColors } from '@/theme';

interface LeadValueBadgeProps {
  value?: number | null;
  currency?: string | null;
}

export const LeadValueBadge: React.FC<LeadValueBadgeProps> = ({
  value = 0,
  currency = 'INR',
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const num = value || 0;
  let formatted = `₹${num.toLocaleString()}`;
  if (num >= 100000) {
    formatted = `₹${(num / 100000).toFixed(1)}L`;
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
      <Text style={[styles.text, { color: colors.success }]}>{formatted}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  text: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
  },
});
