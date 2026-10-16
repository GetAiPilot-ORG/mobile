import React, { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/theme';

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
  const { colors } = useTheme();

  const paddingMap = {
    none: 'p-0',
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6',
  };

  const surfaceStyle = {
    backgroundColor: variant === 'outlined' ? 'transparent' : colors.card,
    borderRadius: 24,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: colors.border,
    ...(variant === 'elevated' ? {
      shadowColor: '#29213E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 2,
    } : {}),
  };

  return (
    <View
      className={`rounded-3xl ${paddingMap[padding]} ${className}`}
      style={[surfaceStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
};
