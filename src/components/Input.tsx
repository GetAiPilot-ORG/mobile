import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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

  const variantStyles: Record<InputVariant, string> = {
    default: isDark
      ? 'bg-[#141416] border border-[#2C2C2E] text-white'
      : 'bg-white border border-[#E5E7EB] text-black',
    filled: isDark
      ? 'bg-[#1C1C1E] border border-transparent text-white'
      : 'bg-[#F2F4F7] border border-transparent text-black',
  };

  const placeholderColor = isDark ? '#8E8E93' : '#9CA3AF';

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className={`text-label-md mb-xs font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
          {label}
        </Text>
      )}
      <TextInput
        className={`
          rounded-md px-lg py-md font-body-md
          ${variantStyles[variant]}
          ${error ? 'border-destructive' : ''}
          ${className}
        `}
        placeholderTextColor={placeholderTextColor || placeholderColor}
        style={style}
        {...props}
      />
      {error ? (
        <Text className="text-label-sm text-destructive mt-xs font-medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text className={`text-label-sm mt-xs ${isDark ? 'text-[#8E8E93]' : 'text-foreground-muted'}`}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
