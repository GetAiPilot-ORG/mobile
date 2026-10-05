import React from 'react';
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import { useTheme, getColors } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  icon,
  style,
  ...props
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case 'destructive':
        return { backgroundColor: colors.error };
      case 'ghost':
        return { backgroundColor: 'transparent' };
    }
  };

  const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
    xs: {
      container: 'px-md py-sm rounded-sm',
      text: 'text-label-sm',
    },
    sm: {
      container: 'px-lg py-md rounded-md',
      text: 'text-label-md',
    },
    md: {
      container: 'px-xl py-lg rounded-md',
      text: 'text-label-lg',
    },
    lg: {
      container: 'px-xxl py-xl rounded-lg',
      text: 'text-body-md',
    },
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'destructive') return '#FFFFFF';
    if (variant === 'ghost') return colors.primary;
    return colors.text;
  };

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center gap-sm
        ${sizeStyles[size].container}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${isLoading ? 'opacity-75' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      style={[getVariantStyle(), style]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text
            className={`font-semibold ${sizeStyles[size].text}`}
            style={{ color: getTextColor() }}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
