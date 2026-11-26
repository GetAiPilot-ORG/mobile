import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSegments } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ChatBotLogo } from './ChatBotLogo';
import { ChatWindow } from './ChatWindow';
import { useTheme } from '@/theme';

type ScrollVisibilityListener = (visible: boolean) => void;
const scrollListeners = new Set<ScrollVisibilityListener>();

/** Global setter to show or hide the floating chatbot button */
export const setChatbotVisible = (visible: boolean) => {
  scrollListeners.forEach((fn) => fn(visible));
};

/**
 * Hook to attach to any ScrollView / FlatList onScroll event.
 * Auto-hides the chatbot when scrolling down, reappears when scrolling up.
 */
export const useChatbotScroll = () => {
  const lastOffsetY = useRef(0);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const diff = currentOffsetY - lastOffsetY.current;

    if (Math.abs(diff) > 12) {
      if (diff > 0 && currentOffsetY > 50) {
        // Scrolling down -> auto-hide so it never covers row content or timestamps
        setChatbotVisible(false);
      } else {
        // Scrolling up -> smoothly reappear
        setChatbotVisible(true);
      }
      lastOffsetY.current = currentOffsetY;
    }
  }, []);

  return { onScroll, scrollEventThrottle: 16 };
};

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark } = useTheme();

  // Vertical hide/show animation on scroll
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    const handleVisibility: ScrollVisibilityListener = (visible) => {
      if (visible) {
        translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
        opacity.value = withTiming(1, { duration: 180 });
      } else {
        translateY.value = withSpring(70, { damping: 18, stiffness: 220 });
        opacity.value = withTiming(0, { duration: 150 });
      }
    };

    scrollListeners.add(handleVisibility);
    return () => {
      scrollListeners.delete(handleVisibility);
    };
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: pressScale.value },
    ],
    opacity: opacity.value,
  }));

  // Hide on auth & onboarding routes
  const segments = useSegments();
  const currentSegment = segments[0] as string | undefined;
  const isAuthOrOnboarding =
    currentSegment === '(auth)' || currentSegment === 'onboarding';

  if (isAuthOrOnboarding) {
    return null;
  }

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setIsOpen(true);
  };

  const handlePressIn = () => {
    pressScale.value = withSpring(0.92, { damping: 15 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15 });
  };

  return (
    <>
      {/* Floating Chat Button: Bottom-Right, positioned cleanly above the bottom nav */}
      <Animated.View
        style={[
          styles.floatingButtonContainer,
          animatedStyle,
          {
            backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
            borderColor: isDark ? 'rgba(185, 168, 255, 0.28)' : 'rgba(112, 85, 232, 0.20)',
            shadowColor: isDark ? '#000000' : 'rgba(112, 85, 232, 0.32)',
          },
        ]}
      >
        <Pressable
          cssInterop={false}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel="Open Chatbot AI Assistant"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.touchArea}
        >
          <ChatBotLogo
            size={28}
            variant="black"
            isAnimated={true}
            interactive={true}
          />
        </Pressable>
      </Animated.View>

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
  floatingButtonContainer: {
    position: 'absolute',
    right: 18,
    bottom: 96, // Clears above the floating bottom nav (which sits at bottom: 24, height: 60)
    zIndex: 9998,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  touchArea: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Chatbot;
