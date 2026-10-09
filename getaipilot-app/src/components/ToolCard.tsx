import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme, getColors } from '@/theme';

interface ToolCardProps {
  title: string;
  category: string;
  description: string;
  icon: string;
  badge?: string;
  onPress: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  category,
  description,
  icon,
  badge,
  onPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Pressable
      className="rounded-2xl p-3.5 mb-3 border shadow-sm active:opacity-80 active:scale-[0.99]"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      onPress={onPress}
    >
      <View className="flex-row items-center mb-2">
        <View
          className="w-10 h-10 rounded-xl justify-center items-center mr-3"
          style={{ backgroundColor: colors.accentSoft }}
        >
          <Text className="text-lg">{icon}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text
            className="text-[11px] font-medium tracking-tight"
            style={{ color: colors.mutedForeground }}
          >
            {category}
          </Text>
          <Text
            className="text-[15px] font-extrabold mt-0.5"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {badge ? (
          <View
            className="px-2 py-0.5 rounded-md"
            style={{ backgroundColor: colors.badgeNeutral }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: colors.badgeNeutralText }}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        className="text-[12.5px] leading-[17px]"
        style={{ color: colors.mutedForeground }}
        numberOfLines={2}
      >
        {description}
      </Text>
    </Pressable>
  );
};
