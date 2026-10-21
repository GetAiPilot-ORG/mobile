import React from 'react';
import { View, Text, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { ArrowRight01Icon } from '@/constants/icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useTheme, getColors } from '@/theme';

interface ToolCardProps {
  title: string;
  category: string;
  description: string;
  icon: React.ComponentProps<typeof HugeiconsIcon>['icon'];
  iconBg?: string;
  badge?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon,
  iconBg,
  badge,
  onPress,
  style,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Pressable
      style={[
        {
          padding: 13,
          borderRadius: 18,
          justifyContent: 'space-between',
          backgroundColor: colors.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : colors.cardBorder,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        },
        style,
      ]}
      onPress={onPress}
    >
      {/* Card Header: Icon + Badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: iconBg || colors.accentSoft,
          }}
        >
          <HugeiconsIcon icon={icon} size={20} color={'#000000'} strokeWidth={1.8} />
        </View>
        {badge ? (
          <View
            style={{
              paddingHorizontal: 7,
              paddingVertical: 2.5,
              borderRadius: 6,
              backgroundColor: colors.accentSoft,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 0.6,
                color: colors.accent,
              }}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Card Body: Title & Description */}
      <View style={{ gap: 3, flex: 1, marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            letterSpacing: -0.2,
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 11.5,
            lineHeight: 16,
            color: colors.textSecondary,
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {/* Card Footer: Launch CTA */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.04)',
        }}
      >
        <Text
          style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}
        >
          Launch
        </Text>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryMuted,
          }}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={11} color={colors.primary} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
};
