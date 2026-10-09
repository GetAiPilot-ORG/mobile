import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

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
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  icon,
  logoImage,
  themeColor = '#0070F3',
  onPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      className={`rounded-2xl p-3.5 mb-3 border shadow-sm active:opacity-80 active:scale-[0.99] ${
        isDark ? 'border-[#2C2C2E]' : 'border-[#E5E7EB]'
      }`}
      style={{
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
      }}
      onPress={handlePress}
    >
      <View className="flex-row items-center">
        {/* App Squircle Logo */}
        {logoImage ? (
          <Image
            source={logoImage}
            className="w-12 h-12 rounded-xl mr-3"
            resizeMode="contain"
          />
        ) : (
          <View
            className="w-12 h-12 rounded-xl justify-center items-center mr-3"
            style={{ backgroundColor: `${themeColor}22` }}
          >
            <Text className="text-[22px]">{icon || '⚡'}</Text>
          </View>
        )}

        {/* Title & Description */}
        <View className="flex-1 min-w-0 mr-2">
          <Text
            className="text-[15.5px] font-bold tracking-tight mb-0.5"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            className="text-[12px] leading-4"
            style={{ color: colors.textMuted }}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        {/* Apple iOS Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
          className="ml-1"
        />
      </View>
    </Pressable>
  );
};
