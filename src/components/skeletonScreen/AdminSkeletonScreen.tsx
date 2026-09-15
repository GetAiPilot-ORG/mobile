import React from "react";
import { View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function SalesLeadsSkeleton() {
  return (
    <View className="pt-2.5">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} className="mb-3">
          <SkeletonRow className="justify-between mb-2">
            <View className="flex-1 mr-2.5">
              <SkeletonText width={140} height={16} className="mb-1" />
              <SkeletonText width={180} height={12} className="mb-1" />
              <SkeletonText width={110} height={12} />
            </View>
            <Skeleton width={65} height={22} borderRadius={11} />
          </SkeletonRow>
          <SkeletonRow className="justify-between mt-1">
            <SkeletonText width={90} height={11} />
            <Skeleton width={70} height={11} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function AdminTabSkeleton() {
  return (
    <View className="pt-2.5">
      {/* Metrics Row */}
      <SkeletonRow className="justify-between mb-4">
        <View className="w-[48%]">
          <SkeletonCard className="p-3 mb-0">
            <SkeletonCircle size={24} className="mb-1.5" />
            <SkeletonText width={50} height={18} className="mb-1" />
            <SkeletonText width={80} height={10} />
          </SkeletonCard>
        </View>
        <View className="w-[48%]">
          <SkeletonCard className="p-3 mb-0">
            <SkeletonCircle size={24} className="mb-1.5" />
            <SkeletonText width={50} height={18} className="mb-1" />
            <SkeletonText width={80} height={10} />
          </SkeletonCard>
        </View>
      </SkeletonRow>

      {/* Row Items */}
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} className="mb-2.5 p-3">
          <SkeletonRow className="justify-between mb-1.5">
            <SkeletonText width={130} height={14} />
            <Skeleton width={50} height={18} borderRadius={9} />
          </SkeletonRow>
          <SkeletonText width="85%" height={12} className="mb-1" />
          <SkeletonText width={80} height={10} />
        </SkeletonCard>
      ))}
    </View>
  );
}
