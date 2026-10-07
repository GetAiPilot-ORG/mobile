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

  const inputDynamicStyle = {
    backgroundColor: variant === 'filled' ? colors.surfaceSecondary : colors.surface,
    borderColor: error ? colors.error : (variant === 'filled' ? 'transparent' : colors.border),
    borderWidth: 1,
    color: colors.text,
  };

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text style={{ color: colors.text }} className="text-label-md mb-xs font-semibold">
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
        <Text style={{ color: colors.textMuted }} className="text-label-sm mt-xs">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
