import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import { LiveOrb } from './LiveOrb';
import { ChatWindow } from './ChatWindow';
import { useTheme } from '@/theme';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark } = useTheme();

  // Vertical drag position for convenience on mobile screens
  const translateY = useSharedValue(0);
  const contextY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Allow moving up and down within bounds (-250 to 200)
      const nextY = contextY.value + event.translationY;
      if (nextY >= -260 && nextY <= 180) {
        translateY.value = nextY;
      }
    })
    .onEnd(() => {
      translateY.value = withSpring(translateY.value, { damping: 20 });
    });

  const animatedEdgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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

  return (
    <>
      {/* Edge-docked floating tab (Kinare me) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.edgeTabContainer,
            animatedEdgeStyle,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : 'rgba(15, 23, 42, 0.12)',
              shadowColor: isDark ? '#000000' : '#4F46E5',
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setIsOpen(true)}
            activeOpacity={0.8}
            style={styles.touchableArea}
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 0 }}
          >
            {/* Pulsing Live Orb */}
            <LiveOrb size={22} variant="black" />

            {/* Vertical Chatbot Text */}
            <View style={styles.verticalTextWrap}>
              <Text
                style={[
                  styles.verticalLetter,
                  { color: isDark ? '#F1F5F9' : '#1E293B' },
                ]}
              >
                C
              </Text>
              <Text
                style={[
                  styles.verticalLetter,
                  { color: isDark ? '#F1F5F9' : '#1E293B' },
                ]}
              >
                H
              </Text>
              <Text
                style={[
                  styles.verticalLetter,
                  { color: isDark ? '#F1F5F9' : '#1E293B' },
                ]}
              >
                A
              </Text>
              <Text
                style={[
                  styles.verticalLetter,
                  { color: isDark ? '#F1F5F9' : '#1E293B' },
                ]}
              >
                T
              </Text>
            </View>
          </TouchableOpacity>
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
  edgeTabContainer: {
    position: 'absolute',
    right: 0,
    top: '54%',
    zIndex: 9999,
    width: 34,
    height: 108,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderWidth: 1,
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: -3, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 12,
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  verticalTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  verticalLetter: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default Chatbot;
