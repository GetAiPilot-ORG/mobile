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
  const { isDark } = useTheme();

  const variantStyles: Record<InputVariant, string> = {
    default: isDark
      ? 'bg-[#0A1420] border border-[#1B334A] text-white'
      : 'bg-white border border-[#E5E7EB] text-slate-900',
    filled: isDark
      ? 'bg-[#0A111B] border border-transparent text-white'
      : 'bg-[#F2F4F7] border border-transparent text-slate-900',
  };

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className={`text-sm mb-1.5 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-xl px-4 py-3 text-base ${variantStyles[variant]} ${className}`}
        placeholderTextColor={placeholderTextColor || (isDark ? '#8FA3B8' : '#94A3B8')}
        style={style}
        {...props}
      />
      {error ? (
        <Text className="text-xs mt-1 font-medium text-red-500">
          {error}
        </Text>
      ) : helperText ? (
        <Text className={`text-xs mt-1 ${isDark ? 'text-[#8FA3B8]' : 'text-slate-500'}`}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
