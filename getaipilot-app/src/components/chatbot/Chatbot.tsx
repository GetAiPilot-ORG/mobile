import React, { useState } from 'react';
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

  // Interactive gaze shared values steered by touch/pan
  const gazeX = useSharedValue(0);
  const gazeY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Allow moving up and down within screen bounds (-260 to 180)
      const nextY = contextY.value + event.translationY;
      if (nextY >= -260 && nextY <= 180) {
        translateY.value = nextY;
      }

      // Steer LiveOrb gaze in the direction of the drag
      gazeY.value = Math.max(-2, Math.min(2, event.translationY * 0.05));
      gazeX.value = Math.max(-2, Math.min(2, event.translationX * 0.05));
    })
    .onEnd(() => {
      translateY.value = withSpring(translateY.value, { damping: 20 });
      // Reset steered gaze back smoothly so autonomous glancing resumes
      gazeX.value = withSpring(0, { damping: 15 });
      gazeY.value = withSpring(0, { damping: 15 });
    });

  const animatedTabStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
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
    setIsOpen(true);
  };

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15 });
  };

  return (
    <>
      {/* Website Signature Vertical Edge Tab */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.verticalTab,
            animatedTabStyle,
            {
              backgroundColor: isDark ? '#18181B' : '#F8F8F7',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
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
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 0 }}
            style={styles.touchableArea}
          >
            {/* Signature Interactive LiveOrb Character */}
            <ChatBotLogo
              size={24}
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
    top: '52%',
    zIndex: 9999,
    width: 32,
    height: 110,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderRightWidth: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowOffset: { width: -4, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 6,
  },
  labelContainer: {
    width: 32,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    width: 68,
    height: 18,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.85,
    transform: [{ rotate: '-90deg' }],
    includeFontPadding: false,
  },
});

export default Chatbot;
