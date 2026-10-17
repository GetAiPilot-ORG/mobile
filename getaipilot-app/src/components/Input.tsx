import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { useTheme } from '@/theme';

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
  const { colors } = useTheme();


  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-sm mb-2 font-medium" style={{ color: colors.text }}>
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-xl px-4 py-3 text-base ${className}`}
        placeholderTextColor={placeholderTextColor || colors.inputPlaceholder}
        accessibilityLabel={props.accessibilityLabel || label || props.placeholder}
        style={[{ backgroundColor: colors.inputBackground, color: colors.text, borderRadius: 18, minHeight: 50, borderWidth: error ? 1 : 0, borderColor: colors.destructive }, style]}
        {...props}
      />
      {error ? (
        <Text className="text-xs mt-1 font-medium text-red-500">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
