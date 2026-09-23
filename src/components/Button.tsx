import React from 'react';
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary active:opacity-90',
    secondary: isDark
      ? 'bg-surface dark:bg-[#1C1C1E] border border-border dark:border-[#2C2C2E] active:bg-[#2C2C2E]'
      : 'bg-surface border border-border active:bg-gray-100',
    destructive: 'bg-destructive active:opacity-90',
    ghost: 'bg-transparent active:opacity-70',
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
    if (variant === 'primary' || variant === 'destructive') return 'text-white';
    if (variant === 'ghost') return 'text-primary';
    return isDark ? 'text-white' : 'text-foreground';
  };

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center gap-sm
        ${variantStyles[variant]}
        ${sizeStyles[size].container}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${isLoading ? 'opacity-75' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      style={style}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : '#0084FF'}
        />
      ) : (
        <>
          {icon}
          <Text className={`font-semibold ${sizeStyles[size].text} ${getTextColor()}`}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
