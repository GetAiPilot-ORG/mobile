import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const brandLogo = require("../../assets/images/logo.jpg");

export interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBackPress?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  subtitle,
  showBack,
  rightElement,
  onBackPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // const handleBack = () => {
  //   if (Platform.OS !== 'web') {
  //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  //   }
  //   if (onBackPress) {
  //     onBackPress();
  //   } else if (router.canGoBack()) {
  //     router.back();
  //   }
  // };

  // Auto-detect: Show back button on all sub-pages with title unless explicitly disabled
  const shouldShowBack = showBack !== undefined ? showBack : !!title;

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onBackPress) {
      onBackPress();
      console.log("Custom back handler executed");
      return;
    }

    if (router.canGoBack()) {
      console.log("Going back");
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const topPadding = Math.max(insets.top, 10);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPadding, minHeight: 52 + topPadding },
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      <View style={styles.leftSection}>
        {shouldShowBack && (
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              isDark ? styles.backButtonDark : styles.backButtonLight,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDark ? '#FFFFFF' : '#007AFF'}
            />
          </Pressable>
        )}
        <View style={styles.titleWrapper}>
          {title ? (
            <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.brandRow}>
              <View style={styles.logoWrapper}>
                <Image
                  source={brandLogo}
                  style={styles.logoImage}
                  contentFit="cover"
                />
              </View>
              <Text style={[styles.brandText, isDark ? styles.brandTextDark : styles.brandTextLight]}>GetAiPilot</Text>
            </View>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]} numberOfLines={1}>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  containerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  containerDark: {
    backgroundColor: 'rgba(18, 18, 20, 0.95)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonLight: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  backButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  titleLight: {
    color: '#000000',
  },
  titleDark: {
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
    letterSpacing: -0.2,
  },
  subtitleLight: {
    color: '#6B7280',
  },
  subtitleDark: {
    color: "#9CA3AF",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  brandText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -0.5,
  },
  brandTextLight: {
    color: '#000000',
  },
  brandTextDark: {
    color: "#FFFFFF",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
});
