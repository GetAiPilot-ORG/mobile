import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function SocialScreenSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* 2x2 Performance Grid */}
      <View className="flex-row justify-between mb-2.5">
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={55} height={22} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={70} height={22} className="mb-1" />
            <SkeletonText width={85} height={11} />
          </SkeletonCard>
        </View>
      </View>
      <View className="flex-row justify-between mb-2.5">
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={60} height={22} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={45} height={22} className="mb-1" />
            <SkeletonText width={75} height={11} />
          </SkeletonCard>
        </View>
      </View>

      {/* Connected Accounts Row */}
      <SkeletonRow className="justify-between mb-3">
        <SkeletonText width={130} height={15} />
        <SkeletonText width={50} height={12} />
      </SkeletonRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} className="w-[120px] p-3 mr-2.5 items-center">
            <SkeletonCircle size={36} className="mb-2" />
            <SkeletonText width={70} height={12} className="mb-1" />
            <Skeleton width={50} height={16} borderRadius={8} />
          </SkeletonCard>
        ))}
      </ScrollView>

      {/* Scheduled Queue Preview */}
      <SkeletonRow className="justify-between mb-3">
        <SkeletonText width={140} height={15} />
        <SkeletonText width={60} height={12} />
      </SkeletonRow>

      {[1, 2].map((i) => (
        <SkeletonCard key={i} className="mb-2.5">
          <SkeletonRow className="mb-2">
            <SkeletonCircle size={32} className="mr-2.5" />
            <View className="flex-1">
              <SkeletonText width={120} height={13} className="mb-1" />
              <SkeletonText width={70} height={11} />
            </View>
          </SkeletonRow>
          <SkeletonText width="90%" height={12} className="mb-1" />
          <SkeletonText width="70%" height={12} />
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}

export function SocialPostsSkeleton() {
  return (
    <View className="px-4 pt-2.5 pb-24">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="mb-4 p-3.5">
          {/* Post Author */}
          <SkeletonRow className="justify-between mb-3">
            <SkeletonRow>
              <SkeletonCircle size={38} className="mr-2.5" />
              <View>
                <SkeletonText width={110} height={14} className="mb-1" />
                <SkeletonText width={70} height={11} />
              </View>
            </SkeletonRow>
            <Skeleton width={24} height={24} borderRadius={12} />
          </SkeletonRow>

          {/* Post Text */}
          <SkeletonText width="95%" height={13} className="mb-1" />
          <SkeletonText width="80%" height={13} className="mb-3" />

          {/* Media placeholder */}
          <Skeleton width="100%" height={160} borderRadius={12} className="mb-3" />

          {/* Action pills / metrics */}
          <SkeletonRow className="justify-between">
            <Skeleton width={60} height={20} borderRadius={10} />
            <Skeleton width={60} height={20} borderRadius={10} />
            <Skeleton width={60} height={20} borderRadius={10} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function SocialTrendsSkeleton() {
  return (
    <View className="px-4 pt-2.5 pb-24">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} className="mb-2.5">
          <SkeletonRow className="justify-between items-center">
            <View className="flex-1 mr-3">
              <SkeletonText width={60} height={11} className="mb-1" />
              <SkeletonText width={140} height={16} className="mb-1" />
              <SkeletonText width={90} height={11} />
            </View>
            <Skeleton width={65} height={24} borderRadius={12} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}
