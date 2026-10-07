import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, getColors } from '@/theme';

export interface AppScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean | 'top' | 'bottom';
  backgroundColor?: string;
  padding?: boolean;
  className?: string;
  maxWidth?: number;
  centerContent?: boolean;
}

export function AppScreen({
  children,
  style,
  safeArea = false,
  backgroundColor,
  padding = false,
  className = '',
  maxWidth,
  centerContent = false,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const defaultBg = backgroundColor || colors.background;

  let paddingTop = 0;
  let paddingBottom = 0;

  if (safeArea === true || safeArea === 'top') {
    paddingTop = insets.top;
  }

  if (safeArea === true || safeArea === 'bottom') {
    paddingBottom = insets.bottom;
  }

  const bgClass = isDark ? 'bg-[#05080D]' : 'bg-[#F8F9FA]';
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
          alignItems: centerContent ? 'center' : 'stretch',
        },
        style,
      ]}
    >
      {maxWidth ? (
        <View style={{ width: '100%', maxWidth, alignSelf: 'center', flex: 1 }}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}
