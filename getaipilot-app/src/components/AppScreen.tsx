
import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, getColors } from '../theme';

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

  // Background color based on the current theme
  const defaultBg = backgroundColor ?? colors.background;

  // Safe area spacing
  const paddingTop =
    safeArea === true || safeArea === 'top' ? insets.top : 0;

  const paddingBottom =
    safeArea === true || safeArea === 'bottom' ? insets.bottom : 0;

  // NativeWind padding class
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
      {maxWidth != null ? (
        <View
          style={{
            width: '100%',
            maxWidth,
            alignSelf: 'center',
            flex: 1,
          }}
        >
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}