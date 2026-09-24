import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Skeleton,
  SkeletonCard,
  SkeletonCircle,
  SkeletonRow,
  SkeletonText,
} from '../Skeleton';

export function LayoutSkeletonScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const topPadding = Math.max(insets.top, 12);
  const bottomOffset = Math.max(insets.bottom + 6, 20);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#F2F2F7' },
      ]}
    >
      {/* 1. Header / Top Navigation Bar Skeleton */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPadding + 6,
            backgroundColor: isDark
              ? 'rgba(18, 18, 20, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            borderBottomColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <SkeletonRow style={styles.topBarLeft}>
          <SkeletonCircle size={32} style={{ marginRight: 10 }} />
          <View>
            <SkeletonText width={95} height={16} borderRadius={4} style={styles.mb4} />
            <SkeletonText width={60} height={10} borderRadius={3} />
          </View>
        </SkeletonRow>

        <SkeletonRow>
          <SkeletonCircle size={36} style={{ marginRight: 8 }} />
          <SkeletonCircle size={36} />
        </SkeletonRow>
      </View>

      {/* 2. Scrollable Body Content Skeleton */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomOffset + 80 },
        ]}
      >
        {/* Search Bar Skeleton */}
        <Skeleton
          width="100%"
          height={44}
          borderRadius={14}
          style={styles.mb16}
        />

        {/* Dual KPI Metric Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.halfCard}>
            <SkeletonCard style={styles.metricCard}>
              <SkeletonCircle size={28} style={styles.mb8} />
              <SkeletonText width={64} height={20} style={styles.mb4} />
              <SkeletonText width={96} height={12} />
            </SkeletonCard>
          </View>
          <View style={styles.halfCard}>
            <SkeletonCard style={styles.metricCard}>
              <SkeletonCircle size={28} style={styles.mb8} />
              <SkeletonText width={64} height={20} style={styles.mb4} />
              <SkeletonText width={96} height={12} />
            </SkeletonCard>
          </View>
        </View>

        {/* Hero / Ecosystem Status Banner Card */}
        <SkeletonCard style={styles.bannerCard}>
          <SkeletonRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <SkeletonText width={130} height={15} style={styles.mb6} />
              <SkeletonText width="85%" height={12} />
            </View>
            <Skeleton width={72} height={28} borderRadius={14} />
          </SkeletonRow>
        </SkeletonCard>

        {/* Filter Segment Tabs */}
        <SkeletonRow style={styles.tabsRow}>
          <Skeleton width={74} height={32} borderRadius={16} style={{ marginRight: 8 }} />
          <Skeleton width={84} height={32} borderRadius={16} style={{ marginRight: 8 }} />
          <Skeleton width={78} height={32} borderRadius={16} />
        </SkeletonRow>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <SkeletonText width={140} height={16} />
          <SkeletonText width={54} height={12} />
        </View>

        {/* Engines Horizontal Row */}
        <View style={styles.enginesRow}>
          {[1, 2, 3].map((item) => (
            <SkeletonCard key={item} style={styles.engineCard}>
              <SkeletonCircle size={36} style={styles.mb8} />
              <SkeletonText width={80} height={13} style={styles.mb6} />
              <SkeletonText width={60} height={10} />
            </SkeletonCard>
          ))}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <SkeletonText width={120} height={16} />
          <SkeletonText width={50} height={12} />
        </View>

        {/* Tool Cards */}
        {[1, 2].map((item) => (
          <SkeletonCard key={item} style={styles.toolCard}>
            <SkeletonRow>
              <SkeletonCircle size={38} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <SkeletonRow style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                  <SkeletonText width={120} height={14} />
                  <Skeleton width={48} height={18} borderRadius={8} />
                </SkeletonRow>
                <SkeletonText width="80%" height={11} />
              </View>
            </SkeletonRow>
          </SkeletonCard>
        ))}
      </ScrollView>

      {/* 3. Floating Bottom Navigation Bar Skeleton */}
      <View
        style={[
          styles.floatingTabBarWrapper,
          { bottom: bottomOffset },
        ]}
      >
        <View
          style={[
            styles.tabBarContainer,
            isDark ? styles.tabBarContainerDark : styles.tabBarContainerLight,
          ]}
        >
          {[1, 2, 3, 4].map((tab) => (
            <View key={tab} style={styles.tabItem}>
              <SkeletonCircle size={20} style={styles.mb4} />
              <SkeletonText width={34} height={9} borderRadius={3} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// Aliases for seamless imports across different conventions
export { LayoutSkeletonScreen as LayoutSkeleton };
export { LayoutSkeletonScreen as NetworkCheckerSkeleton };
export { LayoutSkeletonScreen as LayoutSkeletonNetworkChecker };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  topBarLeft: {
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  halfCard: {
    width: '48.5%',
  },
  metricCard: {
    padding: 14,
    marginBottom: 0,
  },
  bannerCard: {
    padding: 16,
    marginBottom: 16,
  },
  tabsRow: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enginesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  engineCard: {
    width: '31%',
    padding: 12,
    alignItems: 'center',
    marginBottom: 0,
  },
  toolCard: {
    padding: 14,
    marginBottom: 10,
  },
  floatingTabBarWrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 99,
    pointerEvents: 'none' as any,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 380,
    height: 58,
    borderRadius: 29,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabBarContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      } as any,
      default: {},
    }),
  },
  tabBarContainerDark: {
    backgroundColor: 'rgba(28, 28, 30, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
      } as any,
      default: {},
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mb4: {
    marginBottom: 4,
  },
  mb6: {
    marginBottom: 6,
  },
  mb8: {
    marginBottom: 8,
  },
  mb16: {
    marginBottom: 16,
  },
});
