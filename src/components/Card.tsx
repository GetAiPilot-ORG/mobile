import React, { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  className = '',
  style,
  ...props
}) => {
  const { isDark } = useTheme();

  const paddingMap = {
    none: 'p-0',
    xs: 'p-xs',
    sm: 'p-sm',
    md: 'p-md',
    lg: 'p-lg',
    xl: 'p-xl',
  };

  const variantStyles: Record<CardVariant, string> = {
    default: isDark
      ? 'bg-[#1C1C1E] border border-[#2C2C2E]'
      : 'bg-white border border-[#E5E7EB]',
    elevated: isDark
      ? 'bg-[#1C1C1E] border border-[#2C2C2E]'
      : 'bg-white border border-[#E5E7EB] shadow-sm',
    outlined: isDark
      ? 'bg-transparent border border-[#2C2C2E]'
      : 'bg-transparent border border-[#E5E7EB]',
  };

  return (
    <View
      className={`
        rounded-lg
        ${variantStyles[variant]}
        ${paddingMap[padding]}
        ${className}
      `}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};
