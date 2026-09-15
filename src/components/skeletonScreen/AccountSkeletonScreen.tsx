import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function DeviceSessionsSkeleton() {
  return (
    <View className="py-2">
      {[1, 2].map((i) => (
        <SkeletonRow
          key={i}
          className={`py-3 px-1 justify-between ${i === 1 ? 'border-b border-white/10' : ''}`}
        >
          <SkeletonRow className="flex-1 mr-2.5">
            <SkeletonCircle size={36} className="mr-3" />
            <View className="flex-1">
              <SkeletonText width={120} height={14} className="mb-1" />
              <SkeletonText width={160} height={11} />
            </View>
          </SkeletonRow>
          <Skeleton width={55} height={22} borderRadius={11} />
        </SkeletonRow>
      ))}
    </View>
  );
}

export function AccountSkeleton() {
  return (
    <ScrollView contentContainerClassName="p-4 pt-12 pb-24">
      {/* Profile Banner */}
      <SkeletonCard className="items-center py-5 mb-4">
        <SkeletonCircle size={70} className="mb-3" />
        <SkeletonText width={140} height={18} className="mb-1.5" />
        <SkeletonText width={180} height={13} className="mb-3" />
        <Skeleton width={90} height={24} borderRadius={12} />
      </SkeletonCard>

      {/* Subscription Card */}
      <SkeletonCard className="mb-4">
        <SkeletonRow className="justify-between mb-2">
          <SkeletonText width={120} height={15} />
          <Skeleton width={60} height={20} borderRadius={6} />
        </SkeletonRow>
        <SkeletonText width={200} height={12} className="mb-3" />
        <Skeleton width="100%" height={38} borderRadius={8} />
      </SkeletonCard>

      {/* Logged in Devices */}
      <SkeletonText width={140} height={13} className="mb-2" />
      <SkeletonCard className="mb-4">
        <DeviceSessionsSkeleton />
      </SkeletonCard>

      {/* Preferences / Settings */}
      <SkeletonText width={100} height={13} className="mb-2" />
      <SkeletonCard>
        {[1, 2, 3].map((i) => (
          <SkeletonRow
            key={i}
            className={`justify-between py-3 ${i < 3 ? 'border-b border-white/10' : ''}`}
          >
            <SkeletonRow>
              <SkeletonCircle size={30} className="mr-2.5" />
              <SkeletonText width={130} height={14} />
            </SkeletonRow>
            <Skeleton width={40} height={22} borderRadius={11} />
          </SkeletonRow>
        ))}
      </SkeletonCard>
    </ScrollView>
  );
}
