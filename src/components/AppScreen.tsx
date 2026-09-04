import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, SafeAreaView } from 'react-native';
import { useSafeAreaInsets, SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface AppScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean | 'top' | 'bottom';
  backgroundColor?: string;
}

export function AppScreen({ children, style, safeArea = true, backgroundColor = colors.background }: AppScreenProps) {
  const insets = useSafeAreaInsets();

  let paddingTop = 0;
  let paddingBottom = 0;

  if (safeArea === true || safeArea === 'top') {
    paddingTop = insets.top;
  }
  
  if (safeArea === true || safeArea === 'bottom') {
    paddingBottom = insets.bottom;
  }

  return (
    <View style={[{ flex: 1, backgroundColor, paddingTop, paddingBottom }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
