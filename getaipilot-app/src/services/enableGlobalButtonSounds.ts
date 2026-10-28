import React from 'react';
import * as ReactNative from 'react-native';
import { soundService } from './soundFeedbackService';

/**
 * Global Touch Interceptor for React Native.
 * Automatically equips every `Pressable`, `TouchableOpacity`, `TouchableHighlight`,
 * and `TouchableWithoutFeedback` across the entire application with tactile audio feedback.
 */

let isInitialized = false;

export function initGlobalButtonSounds() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // 1. Intercept Pressable
    const OriginalPressable = ReactNative.Pressable;
    if (OriginalPressable) {
      const SoundPressable = React.forwardRef((props: any, ref: any) => {
        const { onPress, ...rest } = props;
        const wrappedOnPress = onPress
          ? (event: any) => {
              soundService.play('click');
              return onPress(event);
            }
          : undefined;

        return React.createElement(OriginalPressable, {
          ref,
          onPress: wrappedOnPress,
          ...rest,
        });
      });

      Object.assign(SoundPressable, OriginalPressable);
      (SoundPressable as any).displayName = 'Pressable';

      try {
        Object.defineProperty(ReactNative, 'Pressable', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: SoundPressable,
        });
      } catch {
        (ReactNative as any).Pressable = SoundPressable;
      }
    }

    // 2. Intercept TouchableOpacity
    const OriginalTouchableOpacity = ReactNative.TouchableOpacity;
    if (OriginalTouchableOpacity) {
      const SoundTouchableOpacity = React.forwardRef((props: any, ref: any) => {
        const { onPress, ...rest } = props;
        const wrappedOnPress = onPress
          ? (event: any) => {
              soundService.play('click');
              return onPress(event);
            }
          : undefined;

        return React.createElement(OriginalTouchableOpacity, {
          ref,
          onPress: wrappedOnPress,
          ...rest,
        });
      });

      Object.assign(SoundTouchableOpacity, OriginalTouchableOpacity);
      (SoundTouchableOpacity as any).displayName = 'TouchableOpacity';

      try {
        Object.defineProperty(ReactNative, 'TouchableOpacity', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: SoundTouchableOpacity,
        });
      } catch {
        (ReactNative as any).TouchableOpacity = SoundTouchableOpacity;
      }
    }

    // 3. Intercept TouchableHighlight
    const OriginalTouchableHighlight = ReactNative.TouchableHighlight;
    if (OriginalTouchableHighlight) {
      const SoundTouchableHighlight = React.forwardRef((props: any, ref: any) => {
        const { onPress, ...rest } = props;
        const wrappedOnPress = onPress
          ? (event: any) => {
              soundService.play('click');
              return onPress(event);
            }
          : undefined;

        return React.createElement(OriginalTouchableHighlight, {
          ref,
          onPress: wrappedOnPress,
          ...rest,
        });
      });

      Object.assign(SoundTouchableHighlight, OriginalTouchableHighlight);
      (SoundTouchableHighlight as any).displayName = 'TouchableHighlight';

      try {
        Object.defineProperty(ReactNative, 'TouchableHighlight', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: SoundTouchableHighlight,
        });
      } catch {
        (ReactNative as any).TouchableHighlight = SoundTouchableHighlight;
      }
    }
  } catch (err) {
    console.warn('[GlobalButtonSounds] Initialization error:', err);
  }
}

// Auto-run on module load
initGlobalButtonSounds();
