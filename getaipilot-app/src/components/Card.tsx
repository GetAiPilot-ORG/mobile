import React, { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme, getColors } from '@/theme';

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
  const colors = getColors(isDark);

  const paddingMap = {
    none: 'p-0',
    xs: 'p-xs',
    sm: 'p-sm',
    md: 'p-md',
    lg: 'p-lg',
    xl: 'p-xl',
  };

  const dynamicCardStyle = {
    backgroundColor: variant === 'outlined' ? 'transparent' : colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
  };

  return (
    <View
      className={`
        rounded-lg
        ${variant === 'elevated' && !isDark ? 'shadow-sm' : ''}
        ${paddingMap[padding]}
        ${className}
      `}
      style={[dynamicCardStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
};

