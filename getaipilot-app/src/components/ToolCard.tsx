import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ArrowRight01Icon } from '@/constants/icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useTheme, getColors } from '@/theme';
import { soundService } from '../services/soundFeedbackService';

export interface ToolCardProps {
  title: string;
  category?: string;
  description: string;
  icon: React.ComponentProps<typeof HugeiconsIcon>['icon'];
  image?: any;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon,
  image,
  iconBg,
  iconColor,
  badge,
  badgeBg,
  badgeColor,
  onPress,
  style,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const resolvedIconColor = iconColor || (isDark ? '#FFFFFF' : '#17171C');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        soundService.play('pop');
        onPress?.();
      }}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
        },
        style,
      ]}
    >
      {/* 1. Header: Icon Surface Badge + Status Pill */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconSurface,
            { backgroundColor: iconBg || colors.accentSoft },
          ]}
        >
          <HugeiconsIcon icon={icon} size={20} color={resolvedIconColor} strokeWidth={1.8} />
        </View>

        {badge ? (
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: badgeBg || (isDark ? 'rgba(255, 255, 255, 0.08)' : colors.accentSoft),
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: badgeColor || colors.accent },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 2. Body: Title & Description */}
      <View style={styles.body}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.description, { color: colors.textSecondary }]}
        >
          {description}
        </Text>
      </View>

      {/* 3. Bottom Side Stage: Launch CTA + 3D Illustration */}
      <View
        style={[
          styles.bottomRow,
          {
            borderTopColor: isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <View style={styles.launchGroup}>
          <Text style={[styles.launchText, { color: colors.primary }]}>
            Launch
          </Text>
          <View
            style={[
              styles.arrowCircle,
              { backgroundColor: colors.primaryMuted },
            ]}
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={11}
              color={colors.primary}
              strokeWidth={2.4}
            />
          </View>
        </View>

        {/* 3D Illustration Asset on the Bottom Side */}
        {image ? (
          <View style={styles.imageWrapper}>
            <Image
              source={image}
              style={styles.bottomImage}
              resizeMode="contain"
            />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
    minHeight: 184,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconSurface: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  body: {
    gap: 3,
    flex: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    height: 44,
  },
  launchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  launchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
});
