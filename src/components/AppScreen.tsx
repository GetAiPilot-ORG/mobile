import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

export interface AppScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean | 'top' | 'bottom';
  backgroundColor?: string;
  padding?: boolean;
  className?: string;
}

export function AppScreen({
  children,
  style,
  safeArea = false,
  backgroundColor,
  padding = false,
  className = '',
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const defaultBg = backgroundColor || colors.background;

  let paddingTop = 0;
  let paddingBottom = 0;

  if (safeArea === true || safeArea === 'top') {
    paddingTop = insets.top;
  }

  if (safeArea === true || safeArea === 'bottom') {
    paddingBottom = insets.bottom;
  }

  const paddingClass = padding ? 'p-lg' : '';

  return (
    <View
      className={`flex-1 flex-col w-full ${paddingClass} ${className}`}
      style={[
        {
          flex: 1,
          flexDirection: 'column',
          width: '100%',
          backgroundColor: defaultBg,
          paddingTop,
          paddingBottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
