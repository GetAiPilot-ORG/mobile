import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedEngineItem } from './AnimatedEngineItem';

interface EngineItemData {
  id: string;
  name: string;
  logo: any;
  route: string;
}

interface EngineMarqueeProps {
  engines: EngineItemData[];
  pastel: string[];
  textColor: string;
  onOpen: (route: string) => void;
  cycleTick?: number;
  isDark: boolean;
  bgColor?: string;
}

export function EngineMarquee({
  engines,
  pastel,
  // textColor,
  onOpen,
  cycleTick = 0,
  isDark,
  bgColor,
}: EngineMarqueeProps) {
  const [singleWidth, setSingleWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (singleWidth <= 0) return;

    scrollX.setValue(0);
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -singleWidth,
        duration: 16000, // 16s smooth continuous glide
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [singleWidth]);

  const renderEngineSet = (keySuffix: string, isMeasurement = false) => {
    return (
      <View
        style={styles.engineRow}
        onLayout={
          isMeasurement
            ? (e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && Math.abs(w - singleWidth) > 1) {
                setSingleWidth(w);
              }
            }
            : undefined
        }
      >
        {engines.map((item, index) => (
          <View key={`${item.id}-${keySuffix}`} style={styles.engineItemWrap}>
            <AnimatedEngineItem
              item={item}
              index={index}
              bgColor={pastel[index % pastel.length]}
              // textColor={textColor}
              onPress={() => onOpen(item.route)}
              cycleTick={cycleTick}
            />
          </View>
        ))}
      </View>
    );
  };

  const bgCanvas = bgColor || (isDark ? '#14131B' : '#F5F3FB');
  const transparentBg = isDark ? 'rgba(20, 19, 27, 0)' : 'rgba(245, 243, 251, 0)';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.track,
          { transform: [{ translateX: scrollX }] },
        ]}
      >
        {/* Set 1: measures exact pixel width */}
        {renderEngineSet('s1', true)}

        {/* Set 2: seamless duplicate loop */}
        {renderEngineSet('s2', false)}

        {/* Set 3: wide-screen buffer */}
        {renderEngineSet('s3', false)}
      </Animated.View>

      {/* Left/Right smooth edge gradient fade masks */}
      <LinearGradient
        colors={[bgCanvas, transparentBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.leftFadeMask}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[transparentBg, bgCanvas]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rightFadeMask}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    height: 86,
    justifyContent: 'center',
    marginVertical: 4,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  engineItemWrap: {
    width: 74,
  },
  leftFadeMask: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
  rightFadeMask: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
});
