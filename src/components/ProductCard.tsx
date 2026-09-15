import React from 'react';
import { View, Text, Pressable, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ProductCardProps {
  name: string;
  category?: string;
  description: string;
  icon?: string;
  logoImage?: any;
  themeColor?: string;
  status?: string;
  actionText?: string;
  onPress: () => void;
  onActionPress?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  icon,
  logoImage,
  themeColor = '#0070F3',
  onPress,
  className,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      className={`rounded-[18px] p-3.5 mb-3 border ${
        isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200 shadow-sm"
      } ${className || ''}`}
      style={({ pressed }) => pressed ? { opacity: 0.8, transform: [{ scale: 0.99 }] } : undefined}
      onPress={handlePress}
    >
      <View className="flex-row items-center">
        {/* App Squircle Logo */}
        {logoImage ? (
          <Image source={logoImage} className="w-12 h-12 rounded-xl mr-3" resizeMode="contain" />
        ) : (
          <View
            className="w-12 h-12 rounded-xl justify-center items-center mr-3"
            style={{ backgroundColor: `${themeColor}22` }}
          >
            <Text className="text-xl">{icon || '⚡'}</Text>
          </View>
        )}

        {/* Title & Description */}
        <View className="flex-1 mr-2">
          <Text
            className={`text-base font-bold tracking-tight mb-0.5 ${isDark ? "text-white" : "text-black"}`}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            className={`text-xs leading-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        {/* Apple iOS Chevron */}
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" className="ml-1" />
      </View>
    </Pressable>
  );
};
