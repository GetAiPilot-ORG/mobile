import React from "react";
import { View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function TemplatesListSkeleton() {
  return (
    <View className="px-4 pt-3.5 pb-24">
      {/* Header Info Card */}
      <SkeletonCard className="mb-4">
        <SkeletonText width={120} height={18} className="mb-1.5" />
        <SkeletonText width="90%" height={13} />
      </SkeletonCard>

      {/* Category Pills */}
      <SkeletonRow className="mb-4">
        {[65, 80, 75, 90].map((w, idx) => (
          <Skeleton key={idx} width={w} height={32} borderRadius={16} className="mr-2" />
        ))}
      </SkeletonRow>

      {/* Template Cards */}
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="mb-4 p-3.5">
          {/* Card Preview Box */}
          <Skeleton width="100%" height={160} borderRadius={12} className="mb-3" />

          <SkeletonRow className="justify-between mb-1.5">
            <SkeletonText width={140} height={16} />
            <Skeleton width={60} height={20} borderRadius={10} />
          </SkeletonRow>
          <SkeletonText width="85%" height={12} className="mb-3" />

          <SkeletonRow className="justify-between items-center">
            <SkeletonText width={90} height={11} />
            <Skeleton width={80} height={32} borderRadius={8} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function QuickFormsSkeleton() {
  return (
    <View className="px-4 pt-3.5 pb-24">
      {/* Search Input */}
      <Skeleton width="100%" height={42} borderRadius={12} className="mb-4" />

      {/* Form List Cards */}
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} className="mb-3">
          <SkeletonRow className="justify-between mb-2">
            <SkeletonRow className="flex-1 mr-2.5">
              <SkeletonCircle size={36} className="mr-2.5" />
              <View className="flex-1">
                <SkeletonText width={130} height={15} className="mb-1" />
                <SkeletonText width={180} height={12} />
              </View>
            </SkeletonRow>
            <Skeleton width={65} height={22} borderRadius={11} />
          </SkeletonRow>

          <SkeletonRow className="justify-between items-center mt-1.5">
            <SkeletonText width={100} height={11} />
            <Skeleton width={70} height={26} borderRadius={6} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function ProductsSkeleton() {
  return (
    <View className="px-4 pt-4 pb-36">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} className="mb-3.5 p-4 rounded-3xl">
          <SkeletonRow>
            <Skeleton width={48} height={48} borderRadius={12} className="mr-3.5" />
            <View className="flex-1">
              <SkeletonRow className="justify-between mb-1.5">
                <SkeletonText width={160} height={16} />
                <Skeleton width={60} height={20} borderRadius={10} />
              </SkeletonRow>
              <SkeletonText width="95%" height={12} className="mb-1" />
              <SkeletonText width="70%" height={12} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}
