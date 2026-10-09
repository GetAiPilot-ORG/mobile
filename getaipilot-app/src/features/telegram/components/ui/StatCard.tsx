import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getColors } from '@/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  sub: string;
  onPress?: () => void;
  isRevenue?: boolean;
  style?: any;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  bg,
  sub,
  onPress,
  isRevenue,
  style,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const valStr = String(value ?? '');
  const valFontSize = valStr.length > 7 ? 'text-lg' : valStr.length > 5 ? 'text-xl' : 'text-2xl';

  return (
    <Pressable
      className="flex-1 min-w-0 w-full p-2.5 rounded-xl border justify-between min-h-[88px] active:opacity-75"
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row justify-between items-center mb-1">
        <Text
          className="text-[9px] font-extrabold tracking-wider flex-1"
          style={{ color: colors.textMuted }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View
          className="w-[22px] h-[22px] rounded-md items-center justify-center"
          style={{ backgroundColor: bg }}
        >
          <Ionicons name={icon as any} size={13} color={color} />
        </View>
      </View>

      <Text
        className={`${valFontSize} font-extrabold tracking-tight ${isRevenue ? 'font-black' : ''}`}
        style={{ color: colors.text }}
        numberOfLines={1}
      >
        {value}
      </Text>

      {sub ? (
        <View className="flex-row justify-between items-center mt-1">
          <Text
            className="text-[10px] font-medium flex-1"
            style={{ color: colors.textMuted }}
            numberOfLines={1}
          >
            {sub}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};
