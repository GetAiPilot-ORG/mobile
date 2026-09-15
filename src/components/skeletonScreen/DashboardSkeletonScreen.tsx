import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function DashboardSkeleton() {
  return (
    <ScrollView contentContainerClassName="p-4 pt-12 pb-32">
      {/* Workspace Header */}
      <View className="mb-5">
        <SkeletonText width={120} height={12} className="mb-1.5" />
        <SkeletonText width={220} height={24} className="mb-2" />
        <SkeletonText width={180} height={13} />
      </View>

      {/* 2x2 Glass Metric Grid */}
      <View className="flex-row justify-between mb-2.5">
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={50} height={22} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={65} height={22} className="mb-1" />
            <SkeletonText width={80} height={11} />
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
            <SkeletonText width={50} height={22} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
      </View>

      {/* Usage Meter Card */}
      <SkeletonCard className="mb-5">
        <SkeletonRow className="justify-between mb-2.5">
          <SkeletonText width={130} height={15} />
          <Skeleton width={50} height={18} borderRadius={6} />
        </SkeletonRow>
        <Skeleton width="100%" height={8} borderRadius={4} className="mb-2.5" />
        <SkeletonRow className="justify-between">
          <SkeletonText width={100} height={12} />
          <SkeletonText width={80} height={12} />
        </SkeletonRow>
      </SkeletonCard>

      {/* Product Action Cards */}
      <SkeletonText width={140} height={16} className="mb-3" />
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="mb-3">
          <SkeletonRow className="justify-between items-center">
            <SkeletonRow className="flex-1 mr-2.5">
              <SkeletonCircle size={40} className="mr-3" />
              <View className="flex-1">
                <SkeletonText width={130} height={15} className="mb-1" />
                <SkeletonText width="85%" height={12} />
              </View>
            </SkeletonRow>
            <Skeleton width={32} height={32} borderRadius={16} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}
