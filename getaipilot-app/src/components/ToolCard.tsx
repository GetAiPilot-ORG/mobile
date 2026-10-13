import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
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
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon,
  iconBg,
  badge,
  onPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Pressable
      className="p-4 rounded-[20px] mb-3.5 justify-between active:opacity-85"
      style={
        {
          backgroundColor: colors.card,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.04,
          shadowRadius: 8,
        }
      }
      onPress={onPress}
    >
      {/* Card Header: Icon + Badge */}
      <View className="flex-row items-center justify-between mb-3">
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: iconBg || colors.accentSoft,
          }}
        >
          <HugeiconsIcon icon={icon} size={21} color={colors.text} strokeWidth={1.8} />
        </View>
        {badge ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: colors.accentSoft,
            }}
          >
            <Text
              style={{
                fontSize: 9.5,
                fontWeight: "600",
                letterSpacing: 0.8,
                color: colors.accent,
              }}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Card Body: Category, Title & Description */}
      <View style={{ gap: 3, marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            letterSpacing: -0.3,
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 19,
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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 11,
          borderTopWidth: 0,
          borderTopColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.05)",
        }}
      >
        <Text
          style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}
        >
          Launch Tool
        </Text>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primaryMuted,
          }}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={colors.primary} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
};
