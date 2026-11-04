import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSegments } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { ChatBotLogo } from './ChatBotLogo';
import { ChatWindow } from './ChatWindow';
import { useTheme } from '@/theme';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark } = useTheme();

  // Vertical drag position for convenience on mobile screens
  const translateY = useSharedValue(0);
  const contextY = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Horizontal retraction offset: 0 = fully visible (26px), 16 = small docked handle (10px peek)
  const translateX = useSharedValue(0);
  const isDocked = useSharedValue(false);
  const retractTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interactive gaze shared values steered by touch/pan
  const gazeX = useSharedValue(0);
  const gazeY = useSharedValue(0);

  // Auto-retract to slim handle after 4 seconds of inactivity so it never covers cards or arrows
  const scheduleAutoRetract = () => {
    if (retractTimeoutRef.current) clearTimeout(retractTimeoutRef.current);
    retractTimeoutRef.current = setTimeout(() => {
      translateX.value = withSpring(16, { damping: 18, stiffness: 180 });
      isDocked.value = true;
    }, 4500);
  };

  useEffect(() => {
    scheduleAutoRetract();
    return () => {
      if (retractTimeoutRef.current) clearTimeout(retractTimeoutRef.current);
    };
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
      // Spring out if docked
      translateX.value = withSpring(0, { damping: 15 });
      isDocked.value = false;
    })
    .onUpdate((event) => {
      // Allow moving up and down within screen bounds (-260 to 180)
      const nextY = contextY.value + event.translationY;
      if (nextY >= -260 && nextY <= 180) {
        translateY.value = nextY;
      }

      // If user drags towards the right edge, dock it early
      if (event.translationX > 8) {
        translateX.value = Math.min(16, event.translationX);
      }

      // Steer LiveOrb gaze in the direction of the drag
      gazeY.value = Math.max(-2, Math.min(2, event.translationY * 0.05));
      gazeX.value = Math.max(-2, Math.min(2, event.translationX * 0.05));
    })
    .onEnd((event) => {
      translateY.value = withSpring(translateY.value, { damping: 20 });
      // Reset steered gaze back smoothly so autonomous glancing resumes
      gazeX.value = withSpring(0, { damping: 15 });
      gazeY.value = withSpring(0, { damping: 15 });

      if (event.translationX > 10) {
        translateX.value = withSpring(16, { damping: 18 });
        isDocked.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 18 });
        isDocked.value = false;
        scheduleAutoRetract();
      }
    });

  const animatedTabStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: pressScale.value },
    ],
  }));

  // Hide on auth & onboarding routes
  const segments = useSegments();
  const currentSegment = segments[0] as string | undefined;
  const isAuthOrOnboarding =
    currentSegment === '(auth)' ||
    currentSegment === 'onboarding';

  if (isAuthOrOnboarding) {
    return null;
  }

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // If it was docked, first tap pops it out, second tap opens, or open immediately
    if (isDocked.value) {
      translateX.value = withSpring(0, { damping: 15 });
      isDocked.value = false;
      scheduleAutoRetract();
      return;
    }
    setIsOpen(true);
  };

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, { damping: 15 });
    translateX.value = withSpring(0, { damping: 15 });
    isDocked.value = false;
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15 });
    scheduleAutoRetract();
  };

  return (
    <>
      {/* Website Signature Vertical Edge Tab (Narrow 26px, vertically centered, auto-retracting handle) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.verticalTab,
            animatedTabStyle,
            {
              backgroundColor: isDark ? '#18181B' : '#F8F8F7',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.12)',
              shadowColor: isDark ? '#000000' : 'rgba(15, 23, 42, 0.16)',
            },
          ]}
        >
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
            accessibilityLabel="Open Chatbot"
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 6 }}
            style={styles.touchableArea}
          >
            {/* Signature Interactive LiveOrb Character */}
            <ChatBotLogo
              size={18}
              variant="black"
              isAnimated={true}
              interactive={true}
              gazeX={gazeX}
              gazeY={gazeY}
            />

            {/* Rotated Vertical CHATBOT Label matching getaipilot.in */}
            <View style={styles.labelContainer}>
              <Text
                style={[
                  styles.labelText,
                  {
                    color: isDark ? '#F4F4F5' : '#0F172A',
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                CHATBOT
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Chat Window Dialog / Sheet */}
      {isOpen && (
        <ChatWindow
          onClose={() => setIsOpen(false)}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  verticalTab: {
    position: 'absolute',
    right: 0,
    top: '46%',
    zIndex: 9999,
    width: 26,
    height: 94,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderRightWidth: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowOffset: { width: -3, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    paddingBottom: 4,
    gap: 4,
  },
  labelContainer: {
    width: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    width: 56,
    height: 16,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    opacity: 0.88,
    transform: [{ rotate: '-90deg' }],
    includeFontPadding: false,
  },
});

export default Chatbot;
