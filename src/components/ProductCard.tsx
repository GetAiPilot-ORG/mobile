import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { StatusBadge } from './StatusBadge';

interface ProductCardProps {
  name: string;
  category: string;
  description: string;
  icon: string;
  themeColor: string;
  status?: string;
  actionText?: string;
  onPress: () => void;
  onActionPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  category,
  description,
  icon,
  themeColor,
  status = 'operational',
  actionText = 'Open Dashboard',
  onPress,
  onActionPress,
}) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: themeColor + '18' }]}>
          <Text style={[styles.iconText, { color: themeColor }]}>{icon}</Text>
        </View>
        <View style={styles.titleInfo}>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <StatusBadge status={status} size="sm" />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.footer}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: themeColor }]}
          onPress={onActionPress || onPress}
        >
          <Text style={styles.actionBtnText}>{actionText} →</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '900',
  },
  titleInfo: {
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 1,
  },
  description: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.muted,
    paddingTop: 10,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
});
