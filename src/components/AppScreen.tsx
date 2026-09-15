import React from 'react';
import { View, StyleProp, ViewStyle, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export interface AppScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  safeArea?: boolean | 'top' | 'bottom';
  backgroundColor?: string;
}

export function AppScreen({
  children,
  style,
  className,
  safeArea = false,
  backgroundColor,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const defaultBg = backgroundColor || (isDark ? colors.backgroundDark : colors.background);

  let paddingTop = 0;
  let paddingBottom = 0;

  if (safeArea === true || safeArea === 'top') {
    paddingTop = insets.top;
  }

  if (safeArea === true || safeArea === 'bottom') {
    paddingBottom = insets.bottom;
  }

  return (
    <View
      className={className}
      style={[
        {
          flex: 1,
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
