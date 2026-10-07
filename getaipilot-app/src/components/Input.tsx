import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { useTheme, getColors } from '@/theme';

export type InputVariant = 'default' | 'filled';

export interface InputProps extends TextInputProps {
  variant?: InputVariant;
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  label,
  error,
  helperText,
  placeholderTextColor,
  className = '',
  containerClassName = '',
  style,
  ...props
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const variantStyles: Record<InputVariant, string> = {
    default: isDark
      ? 'bg-[#0A1420] border border-[#1B334A] text-[#F7FAFC]'
      : 'bg-white border border-[#E5E7EB] text-black',
    filled: isDark
      ? 'bg-[#0A111B] border border-transparent text-[#F7FAFC]'
      : 'bg-[#F2F4F7] border border-transparent text-black',
  };

  const placeholderColor = isDark ? '#72869A' : '#9CA3AF';

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className={`text-label-md mb-xs font-semibold ${isDark ? 'text-[#F7FAFC]' : 'text-foreground'}`}>
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-md px-lg py-md font-body-md ${className}`}
        placeholderTextColor={placeholderTextColor || colors.textMuted}
        style={[inputDynamicStyle, style]}
        {...props}
      />
      {error ? (
        <Text style={{ color: colors.error }} className="text-label-sm mt-xs font-medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text className={`text-label-sm mt-xs ${isDark ? 'text-[#8FA3B8]' : 'text-foreground-muted'}`}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
