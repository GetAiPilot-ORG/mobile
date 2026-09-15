import React from 'react';
import { Text, View } from 'react-native';

interface LeadValueBadgeProps {
  value?: number | null;
  currency?: string | null;
}

export const LeadValueBadge: React.FC<LeadValueBadgeProps> = ({
  value = 0,
}) => {
  const num = value || 0;
  let formatted = `₹${num.toLocaleString()}`;
  if (num >= 100000) {
    formatted = `₹${(num / 100000).toFixed(1)}L`;
  }

  return (
    <View className="bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
      <Text className="text-xs font-extrabold text-emerald-400">{formatted}</Text>
    </View>
  );
};
