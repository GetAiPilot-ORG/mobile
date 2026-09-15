import React from 'react';
import {
  View,
  ScrollView,
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

  const topPadding = Math.max(insets.top, 12);
  const bottomOffset = Math.max(insets.bottom + 6, 20);

  return (
    <View className="flex-1 bg-[#0B0D10]">
      {/* 1. Header / Top Navigation Bar Skeleton */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 border-b z-10 bg-[#181A1F] border-[#262930]"
        style={{ paddingTop: topPadding + 6 }}
      >
        <SkeletonRow className="items-center">
          <SkeletonCircle size={32} className="mr-2.5" />
          <View>
            <SkeletonText width={95} height={16} borderRadius={4} className="mb-1" />
            <SkeletonText width={60} height={10} borderRadius={3} />
          </View>
        </SkeletonRow>

        <SkeletonRow>
          <SkeletonCircle size={36} className="mr-2" />
          <SkeletonCircle size={36} />
        </SkeletonRow>
      </View>

      {/* 2. Scrollable Body Content Skeleton */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-4"
        style={{ paddingBottom: bottomOffset + 80 }}
      >
        {/* Search Bar Skeleton */}
        <Skeleton
          width="100%"
          height={44}
          borderRadius={14}
          className="mb-4"
        />

        {/* Dual KPI Metric Cards */}
        <View className="flex-row justify-between mb-3.5">
          <View className="w-[48.5%]">
            <SkeletonCard className="p-3.5 mb-0">
              <SkeletonCircle size={28} className="mb-2" />
              <SkeletonText width={64} height={20} className="mb-1" />
              <SkeletonText width={96} height={12} />
            </SkeletonCard>
          </View>
          <View className="w-[48.5%]">
            <SkeletonCard className="p-3.5 mb-0">
              <SkeletonCircle size={28} className="mb-2" />
              <SkeletonText width={64} height={20} className="mb-1" />
              <SkeletonText width={96} height={12} />
            </SkeletonCard>
          </View>
        </View>

        {/* Hero / Ecosystem Status Banner Card */}
        <SkeletonCard className="p-4 mb-4">
          <SkeletonRow className="justify-between items-center">
            <View className="flex-1 mr-3">
              <SkeletonText width={130} height={15} className="mb-1.5" />
              <SkeletonText width="85%" height={12} />
            </View>
            <Skeleton width={72} height={28} borderRadius={14} />
          </SkeletonRow>
        </SkeletonCard>

        {/* Filter Segment Tabs */}
        <SkeletonRow className="mb-4.5">
          <Skeleton width={74} height={32} borderRadius={16} className="mr-2" />
          <Skeleton width={84} height={32} borderRadius={16} className="mr-2" />
          <Skeleton width={78} height={32} borderRadius={16} />
        </SkeletonRow>

        {/* Section Header */}
        <View className="flex-row justify-between items-center mb-3">
          <SkeletonText width={140} height={16} />
          <SkeletonText width={54} height={12} />
        </View>

        {/* Engines Horizontal Row */}
        <View className="flex-row justify-between mb-5">
          {[1, 2, 3].map((item) => (
            <SkeletonCard key={item} className="w-[31%] p-3 items-center mb-0">
              <SkeletonCircle size={36} className="mb-2" />
              <SkeletonText width={80} height={13} className="mb-1.5" />
              <SkeletonText width={60} height={10} />
            </SkeletonCard>
          ))}
        </View>

        {/* Section Header */}
        <View className="flex-row justify-between items-center mb-3">
          <SkeletonText width={120} height={16} />
          <SkeletonText width={50} height={12} />
        </View>

        {/* Tool Cards */}
        {[1, 2].map((item) => (
          <SkeletonCard key={item} className="p-3.5 mb-2.5">
            <SkeletonRow>
              <SkeletonCircle size={38} className="mr-3" />
              <View className="flex-1">
                <SkeletonRow className="justify-between mb-1.5">
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
        className="absolute left-6 right-6 items-center z-[99]"
        style={{ bottom: bottomOffset }}
        pointerEvents="none"
      >
        <View
          className="flex-row items-center justify-around w-full max-w-[380px] h-[58px] rounded-full px-2.5 border bg-[#181A1F] border-[#262930]"
        >
          {[1, 2, 3, 4].map((tab) => (
            <View key={tab} className="flex-1 items-center justify-center">
              <SkeletonCircle size={20} className="mb-1" />
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
