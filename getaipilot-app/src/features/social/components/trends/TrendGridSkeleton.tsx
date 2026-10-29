import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export const TrendGridSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const bgPlaceholder = isDark ? '#252230' : '#E9EAF1';
  const cardBg = isDark ? '#1C1A25' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9EAF1';

  return (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4].map((item) => (
        <View
          key={item}
          style={[
            styles.skeletonCard,
            { backgroundColor: cardBg, borderColor: borderCol },
          ]}
        >
          {/* Thumbnail Skeleton */}
          <Animated.View
            style={[
              styles.skeletonThumb,
              { backgroundColor: bgPlaceholder, opacity: shimmerAnim },
            ]}
          />

          {/* Body Skeleton */}
          <View style={styles.skeletonBody}>
            <Animated.View
              style={[
                styles.skeletonLine,
                {
                  width: '45%',
                  height: 10,
                  backgroundColor: bgPlaceholder,
                  opacity: shimmerAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonLine,
                {
                  width: '90%',
                  height: 14,
                  backgroundColor: bgPlaceholder,
                  opacity: shimmerAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonLine,
                {
                  width: '70%',
                  height: 14,
                  backgroundColor: bgPlaceholder,
                  opacity: shimmerAnim,
                },
              ]}
            />

            <View style={styles.skeletonMetricsRow}>
              <Animated.View
                style={[
                  styles.skeletonLine,
                  {
                    width: '35%',
                    height: 11,
                    backgroundColor: bgPlaceholder,
                    opacity: shimmerAnim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.skeletonLine,
                  {
                    width: '35%',
                    height: 11,
                    backgroundColor: bgPlaceholder,
                    opacity: shimmerAnim,
                  },
                ]}
              />
            </View>

            {/* Button Skeleton */}
            <Animated.View
              style={[
                styles.skeletonBtn,
                { backgroundColor: bgPlaceholder, opacity: shimmerAnim },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skeletonCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  skeletonThumb: {
    width: '100%',
    height: 140,
  },
  skeletonBody: {
    padding: 11,
    gap: 7,
  },
  skeletonLine: {
    borderRadius: 4,
  },
  skeletonMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
  },
  skeletonBtn: {
    height: 34,
    borderRadius: 10,
    marginTop: 4,
  },
});

