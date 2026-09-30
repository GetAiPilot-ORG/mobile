import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProductTheme } from '../hooks/useProductTheme';

interface ProductThemeBadgeProps {
  productKey: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const ProductThemeBadge: React.FC<ProductThemeBadgeProps> = ({
  productKey,
  label,
  size = 'md',
}) => {
  const theme = useProductTheme(productKey);
  const displayText = label || theme.name;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.soft,
          borderColor: theme.border,
        },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: theme.primary }]} />
      <Text
        style={[
          styles.label,
          { color: theme.badge },
          size === 'sm' && styles.labelSm,
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '600',
  },
});
