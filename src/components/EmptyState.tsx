import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📂',
  title,
  description,
  actionText,
  onActionPress,
  className,
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className={`items-center justify-center p-8 rounded-2xl border my-3 ${
        isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
      } ${className || ''}`}
    >
      <View
        className={`w-15 h-15 rounded-full justify-center items-center mb-4 ${
          isDark ? "bg-[#262930]" : "bg-slate-100"
        }`}
      >
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className={`text-base font-extrabold text-center mb-1.5 ${isDark ? "text-white" : "text-black"}`}>
        {title}
      </Text>
      <Text className={`text-xs text-center leading-4.5 mb-4 max-w-[280px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {description}
      </Text>
      {actionText && onActionPress && (
        <Pressable className="bg-[#0284C7] px-5 py-2.5 rounded-lg" onPress={onActionPress}>
          <Text className="text-white font-bold text-xs">{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};
