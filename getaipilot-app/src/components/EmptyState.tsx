import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getColors } from '@/theme';

interface EmptyStateProps {
  icon?: string;
  ioniconsName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  ioniconsName = 'folder-open-outline',
  title,
  description,
  actionText,
  onActionPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const iconName = ioniconsName || (icon && icon.length > 2 ? (icon as keyof typeof Ionicons.glyphMap) : 'folder-open-outline');

  return (
    <View
      className="items-center justify-center p-8 rounded-2xl border my-3"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View
        className="w-14 h-14 rounded-full justify-center items-center mb-4"
        style={{ backgroundColor: colors.muted }}
      >
        <Ionicons name={iconName} size={26} color={colors.primary} />
      </View>
      <Text
        className="text-[17px] font-extrabold text-center mb-1.5"
        style={{ color: colors.foreground }}
      >
        {title}
      </Text>
      <Text
        className="text-[13px] text-center leading-[18px] mb-4 max-w-[280px]"
        style={{ color: colors.mutedForeground }}
      >
        {description}
      </Text>
      {actionText && onActionPress && (
        <Pressable
          className="px-5 py-2.5 rounded-lg active:opacity-80"
          style={{ backgroundColor: colors.primary }}
          onPress={onActionPress}
        >
          <Text
            className="font-bold text-[13.5px]"
            style={{ color: colors.primaryForeground }}
          >
            {actionText}
          </Text>
        </Pressable>
      )}
    </View>
  );
};
