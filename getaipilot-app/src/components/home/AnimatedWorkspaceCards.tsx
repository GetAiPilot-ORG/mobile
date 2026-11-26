import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import Layout01Icon from '@hugeicons/core-free-icons/Layout01Icon';
import File01Icon from '@hugeicons/core-free-icons/File01Icon';
import Link01Icon from '@hugeicons/core-free-icons/Link01Icon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HOME_SPACING, HOME_RADIUS } from '@/theme/homeTokens';

interface AnimatedWorkspaceCardsProps {
  isDark: boolean;
  color: any;
  telemetry: {
    landingPagesCount?: number;
    pagesCount?: number;
    quickFormsCount?: number;
    shortLinksCount?: number;
  } | undefined;
  onOpen: (route: string) => void;
}

export const AnimatedWorkspaceCards: React.FC<AnimatedWorkspaceCardsProps> = ({
  isDark,
  color,
  telemetry,
  onOpen,
}) => {
  const reducedMotion = useReducedMotion();

  const pagesVal = telemetry?.pagesCount ?? telemetry?.landingPagesCount ?? 0;
  const formsVal = telemetry?.quickFormsCount ?? 0;
  const linksVal = telemetry?.shortLinksCount ?? 0;

  const items = [
    {
      label: 'Pages',
      value: pagesVal,
      subLine: pagesVal > 0 ? `${pagesVal} published` : '0 published',
      route: '/tools/my-designs',
      icon: Layout01Icon,
      image: require('../../../assets/icons/my-design.webp'),
      gradientLight: ['#F5EFFF', '#E7D8FD'] as const,
      gradientDark: ['#2C1A48', '#1B0F2E'] as const,
      borderColorLight: 'rgba(168, 85, 247, 0.25)',
      borderColorDark: 'rgba(192, 132, 252, 0.32)',
      shadowColor: '#8B5CF6',
      accent: isDark ? '#C084FC' : '#7C3AED',
      labelColor: isDark ? '#E9D5FF' : '#5B21B6',
    },
    {
      label: 'Forms',
      value: formsVal,
      // For 0 Forms: "Tap to create your first form" in the accent color
      subLine: formsVal === 0 ? 'Tap to create your first form' : `${formsVal} active`,
      route: '/tools/quick-forms',
      icon: File01Icon,
      image: require('../../../assets/icons/quick-form.webp'),
      gradientLight: ['#FFF4EB', '#FDE3CE'] as const,
      gradientDark: ['#3D2214', '#24130A'] as const,
      borderColorLight: 'rgba(245, 158, 11, 0.25)',
      borderColorDark: 'rgba(251, 191, 36, 0.32)',
      shadowColor: '#F59E0B',
      accent: isDark ? '#FBBF24' : '#D97706',
      labelColor: isDark ? '#FEF3C7' : '#92400E',
    },
    {
      label: 'Links',
      value: linksVal,
      subLine: linksVal > 0 ? `${linksVal} live links` : '+1 this week',
      route: '/tools/link-shortener',
      icon: Link01Icon,
      image: require('../../../assets/icons/link-shortner.webp'),
      gradientLight: ['#E7F7FC', '#CEF0FA'] as const,
      gradientDark: ['#10303D', '#0A1D25'] as const,
      borderColorLight: 'rgba(6, 182, 212, 0.25)',
      borderColorDark: 'rgba(56, 189, 248, 0.32)',
      shadowColor: '#06B6D4',
      accent: isDark ? '#38BDF8' : '#0284C7',
      labelColor: isDark ? '#E0F2FE' : '#075985',
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => {
        const isZeroForm = item.label === 'Forms' && item.value === 0;

        return (
          <Pressable
            key={item.label}
            cssInterop={false}
            onPress={() => onOpen(item.route)}
            accessibilityRole="button"
            accessibilityLabel={`${item.value} ${item.label}. ${item.subLine}`}
            style={({ pressed }) => [
              styles.card,
              {
                borderColor: isDark ? item.borderColorDark : item.borderColorLight,
                shadowColor: item.shadowColor,
                shadowOpacity: isDark ? 0.3 : 0.08,
                transform: [{ scale: pressed && !reducedMotion ? 0.97 : 1 }],
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            {/* 1. Rich Multi-Stop Gradient Background */}
            <LinearGradient
              colors={isDark ? item.gradientDark : item.gradientLight}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* 2. Specular Top Glass Highlight */}
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255, 255, 255, 0.14)', 'transparent']
                  : ['rgba(255, 255, 255, 0.65)', 'transparent']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0.6, y: 0.5 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* 3. Subtle Tilted 3D Graphic Image in Corner */}
            <View style={styles.graphicWatermark} pointerEvents="none">
              <Image
                source={item.image}
                style={styles.watermarkImage}
                resizeMode="contain"
              />
            </View>

            {/* 4. Card Content */}
            <View style={styles.cardContent}>
              {/* Top Row: Elevated Glossy Icon Badge + Action Button */}
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.14)'
                        : '#FFFFFF',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.18)'
                        : 'rgba(255, 255, 255, 0.9)',
                    },
                  ]}
                >
                  <HugeiconsIcon icon={item.icon} size={18} color={item.accent} strokeWidth={2.2} />
                </View>
                <View
                  style={[
                    styles.arrowBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.75)',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.16)'
                        : 'rgba(255, 255, 255, 0.9)',
                    },
                  ]}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={11} color={item.accent} strokeWidth={2.4} />
                </View>
              </View>

              {/* Bottom: Big Bold Metric, Accented Label & Small Secondary Line */}
              <View style={styles.bottomBlock}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.metricText,
                    { color: color.text },
                  ]}
                >
                  {item.value}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.labelText,
                    { color: item.labelColor },
                  ]}
                >
                  {item.label}
                </Text>

                {/* Secondary line under the label */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.subLineText,
                    {
                      color: isZeroForm
                        ? item.accent
                        : isDark
                        ? '#B3ACCD'
                        : '#5C566E',
                      fontWeight: isZeroForm ? '700' : '500',
                    },
                  ]}
                >
                  {item.subLine}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: HOME_SPACING.xs,
  },
  card: {
    flex: 1,
    minHeight: 122,
    borderRadius: HOME_RADIUS.medium,
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  graphicWatermark: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    opacity: 0.24,
    transform: [{ rotate: '-10deg' }],
  },
  watermarkImage: {
    width: 62,
    height: 62,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 11,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  arrowBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
  },
  bottomBlock: {
    marginTop: 8,
  },
  metricText: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  labelText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  subLineText: {
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});
