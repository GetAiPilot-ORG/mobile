import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';

interface ToolCardProps {
  title: string;
  category: string;
  description: string;
  icon: string;
  badge?: string;
  onPress: () => void;
  className?: string;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  category,
  description,
  icon,
  badge,
  onPress,
  className,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      className={`rounded-2xl p-3.5 mb-3 border ${
        isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200 shadow-sm"
      } ${className || ''}`}
      onPress={onPress}
    >
      <View className="flex-row items-center mb-2">
        <View
          className={`w-10 h-10 rounded-xl justify-center items-center mr-3 ${
            isDark ? "bg-sky-500/15" : "bg-blue-50"
          }`}
        >
          <Text className="text-lg">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[11px] font-medium text-slate-400 tracking-tight">{category}</Text>
          <Text
            className={`text-[15px] font-extrabold mt-0.5 ${isDark ? "text-white" : "text-black"}`}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {badge ? (
          <View
            className={`px-2 py-0.5 rounded-md ${
              isDark ? "bg-[#262930]" : "bg-slate-100"
            }`}
          >
            <Text className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        className={`text-xs leading-4.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        numberOfLines={2}
      >
        {description}
      </Text>
    </Pressable>
  );
};
