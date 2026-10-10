import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getColors } from '@/theme';

interface ToolCardProps {
  title: string;
  category: string;
  description: string;
  icon: string;
  iconBg?: string;
  badge?: string;
  onPress: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  category,
  description,
  icon,
  iconBg,
  badge,
  onPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const isIonicon = icon && /^[a-z0-9-]+$/i.test(icon);

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
          {isIonicon ? (
            <Ionicons name={icon as any} size={21} color="#FFFFFF" />
          ) : (
            <Text className="text-xl">{icon}</Text>
          )}
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
                fontWeight: "800",
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
            fontSize: 9.5,
            fontWeight: "800",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: colors.textSecondary,
          }}
        >
          {category}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "800",
            letterSpacing: -0.3,
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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 11,
          borderTopWidth: 1,
          borderTopColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.05)",
        }}
      >
        <Text
          style={{ fontSize: 11.5, fontWeight: "700", color: colors.primary }}
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
          <Ionicons name="arrow-forward" size={11} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
};
