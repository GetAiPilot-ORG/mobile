import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowRight01Icon,
  Layout01Icon,
  File01Icon,
  Link01Icon,
} from '@hugeicons/core-free-icons';

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
  const items = [
    {
      label: 'Pages',
      value: telemetry?.pagesCount ?? telemetry?.landingPagesCount ?? 0,
      route: '/tools/my-designs',
      icon: Layout01Icon,
      gradientLight: ['#F5EFFF', '#E7D8FD'] as const,
      gradientDark: ['#2C1A48', '#1B0F2E'] as const,
      borderColorLight: 'rgba(168, 85, 247, 0.25)',
      borderColorDark: 'rgba(192, 132, 252, 0.28)',
      shadowColor: '#8B5CF6',
      accent: isDark ? '#C084FC' : '#7C3AED',
      labelColor: isDark ? '#E9D5FF' : '#5B21B6',
    },
    {
      label: 'Forms',
      value: telemetry?.quickFormsCount ?? 0,
      route: '/tools/quick-forms',
      icon: File01Icon,
      gradientLight: ['#FFF4EB', '#FDE3CE'] as const,
      gradientDark: ['#3D2214', '#24130A'] as const,
      borderColorLight: 'rgba(245, 158, 11, 0.25)',
      borderColorDark: 'rgba(251, 191, 36, 0.28)',
      shadowColor: '#F59E0B',
      accent: isDark ? '#FBBF24' : '#D97706',
      labelColor: isDark ? '#FEF3C7' : '#92400E',
    },
    {
      label: 'Links',
      value: telemetry?.shortLinksCount ?? 0,
      route: '/tools/link-shortener',
      icon: Link01Icon,
      gradientLight: ['#E7F7FC', '#CEF0FA'] as const,
      gradientDark: ['#10303D', '#0A1D25'] as const,
      borderColorLight: 'rgba(6, 182, 212, 0.25)',
      borderColorDark: 'rgba(56, 189, 248, 0.28)',
      shadowColor: '#06B6D4',
      accent: isDark ? '#38BDF8' : '#0284C7',
      labelColor: isDark ? '#E0F2FE' : '#075985',
    },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => onOpen(item.route)}
          accessibilityRole="button"
          accessibilityLabel={`${item.value} ${item.label}`}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 110,
            borderRadius: 22,
            borderWidth: 1.2,
            borderColor: isDark ? item.borderColorDark : item.borderColorLight,
            position: 'relative',
            overflow: 'hidden',
            shadowColor: item.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.28 : 0.08,
            shadowRadius: 8,
            elevation: 3,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
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
            colors={['rgba(255, 255, 255, 0.45)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          {/* 3. Subtle Tilted Watermark Icon in Corner */}
          <View
            style={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              opacity: isDark ? 0.16 : 0.09,
              transform: [{ rotate: '-14deg' }],
            }}
            pointerEvents="none"
          >
            <HugeiconsIcon icon={item.icon} size={54} color={item.accent} strokeWidth={1.8} />
          </View>

          {/* 4. Card Content */}
          <View
            style={{
              flex: 1,
              paddingVertical: 13,
              paddingHorizontal: 12,
              justifyContent: 'space-between',
            }}
          >
            {/* Top Row: Elevated Glossy Icon Badge + Action Button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.14)' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.9)',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.07,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <HugeiconsIcon icon={item.icon} size={18} color={item.accent} strokeWidth={2.2} />
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.65)',
                  borderWidth: 0.8,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={11} color={item.accent} strokeWidth={2.4} />
              </View>
            </View>

            {/* Bottom: Big Bold Metric & Accented Label */}
            <View style={{ marginTop: 10 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 25,
                  lineHeight: 29,
                  fontWeight: '800',
                  color: color.text,
                  letterSpacing: -0.6,
                }}
              >
                {item.value}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  lineHeight: 15,
                  fontWeight: '700',
                  color: item.labelColor,
                  marginTop: 2,
                  letterSpacing: -0.1,
                }}
              >
                {item.label}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
};
