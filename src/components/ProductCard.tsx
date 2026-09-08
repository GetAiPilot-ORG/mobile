import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  actionText = 'Open Engine',
  onPress,
  onActionPress,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onActionPress) {
      onActionPress();
    } else {
      onPress();
    }
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${themeColor}22`, borderColor: `${themeColor}44` }]}>
          <Text style={styles.iconText}>{icon}</Text>
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

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.engineBadge}>
          <View style={[styles.engineDot, { backgroundColor: themeColor }]} />
          <Text style={styles.engineBadgeText}>AI Engine Active</Text>
        </View>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: `${themeColor}25`, borderColor: `${themeColor}66` }]}
          onPress={handleAction}
        >
          <Text style={[styles.actionBtnText, { color: themeColor }]}>{actionText} →</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1117',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1F242F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  iconText: {
    fontSize: 22,
  },
  titleInfo: {
    flex: 1,
    marginRight: 8,
  },
  category: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#161B22',
    paddingTop: 12,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  engineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontWeight: '800',
    fontSize: 12.5,
  },
});
