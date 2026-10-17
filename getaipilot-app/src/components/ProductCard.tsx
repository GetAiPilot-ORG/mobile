import React from 'react';
import { View, Text, Pressable, Image, Platform, StyleSheet } from 'react-native';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

interface ProductCardProps {
  name: string;
  category?: string;
  description: string;
  icon?: string;
  logoImage?: any;
  themeColor?: string;
  status?: string;
  isEnabled?: boolean;
  actionText?: string;
  onPress: () => void;
  onActionPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  category,
  description,
  icon,
  logoImage,
  themeColor = '#0070F3',
  status = 'operational',
  isEnabled = false,
  onPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const isMaintenance = status === 'maintenance';
  const statusLabel = isMaintenance ? 'Maintenance' : isEnabled ? 'Active' : 'Explore';
  const statusBackground = isMaintenance
    ? (isDark ? '#49372D' : '#F9E5D4')
    : isEnabled
      ? (isDark ? '#303B32' : '#E0F1E6')
      : colors.accentSoft;
  const statusColor = isMaintenance
    ? (isDark ? '#F3C38C' : '#8A4B08')
    : isEnabled
      ? (isDark ? '#A7DCB7' : '#277344')
      : colors.accent;

  return (
    <Pressable
      cssInterop={false}
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <View style={styles.header}>
        {logoImage ? (
          <View style={[styles.logoSurface]}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          </View>
        ) : (
          <View
            style={[styles.logoSurface]}
          >
            <Text style={styles.fallbackIcon}>{icon || '⚡'}</Text>
          </View>
        )}
        <View style={[styles.status, { backgroundColor: statusBackground }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.copy}>
        {category ? (
          <Text style={[styles.category, { color: colors.textSecondary }]} numberOfLines={1}>
            {category}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {description}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Text style={[styles.actionText, { color: colors.accent }]}>Open product</Text>
        <View style={[styles.arrow, { backgroundColor: colors.accentSoft }]}>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.accent} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 17,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  logoSurface: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },
  fallbackIcon: {
    fontSize: 22,
  },
  copy: {
    minHeight: 76,
  },
  category: {
    marginBottom: 5,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  title: {
    marginBottom: 5,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  status: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
