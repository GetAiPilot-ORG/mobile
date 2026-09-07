import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const brandLogo = require('../../assets/images/logo.jpg');

interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBackPress?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  subtitle,
  showBack = false,
  rightElement,
  onBackPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const topPadding = Math.max(insets.top, 12);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPadding, height: 54 + topPadding },
        isDark && styles.containerDark,
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <Pressable style={[styles.backButton, isDark && styles.backButtonDark]} onPress={handleBack} hitSlop={10}>
            <Text style={[styles.backText, isDark && styles.backTextDark]}>‹</Text>
          </Pressable>
        )}
        <View style={styles.titleWrapper}>
          {title ? (
            <Text style={[styles.title, isDark && styles.titleDark]} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.brandRow}>
              <View style={styles.logoWrapper}>
                <Image source={brandLogo} style={styles.logoImage} contentFit="cover" />
              </View>
              <Text style={[styles.brandText, isDark && styles.brandTextDark]}>GetAiPilot</Text>
            </View>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightElement && <View style={styles.rightSection}>{rightElement}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  containerDark: {
    backgroundColor: '#000000',
    borderBottomColor: '#2C2C2E',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonDark: {
    backgroundColor: '#1C1C1E',
  },
  backText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#0084FF',
    lineHeight: 28,
    marginTop: -2,
  },
  backTextDark: {
    color: '#3B82F6',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.5,
  },
  brandTextDark: {
    color: '#FFFFFF',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
