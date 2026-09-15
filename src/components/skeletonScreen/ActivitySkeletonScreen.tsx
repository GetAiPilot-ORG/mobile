import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function ActivityScreenSkeleton() {
  return (
    <ScrollView contentContainerClassName="px-4 pt-3.5 pb-32">
      {/* Segmented Control Track */}
      <Skeleton width="100%" height={38} borderRadius={10} className="mb-4" />

      {/* Telemetry Widget Card */}
      <SkeletonCard className="p-4 mb-5.5 rounded-2xl">
        <SkeletonRow className="justify-between mb-4">
          <SkeletonRow className="flex-1 mr-2.5">
            <SkeletonCircle size={38} className="mr-2.5" />
            <View className="flex-1">
              <SkeletonText width={120} height={16} className="mb-1" />
              <SkeletonText width={180} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={60} height={22} borderRadius={6} />
        </SkeletonRow>

        {/* 3 Metric Columns */}
        <SkeletonRow
          className="justify-around py-3.5 border-t border-b border-white/10 mb-3.5"
        >
          <View className="items-center">
            <SkeletonText width={60} height={18} className="mb-1" />
            <SkeletonText width={75} height={11} />
          </View>
          <View className="items-center">
            <SkeletonText width={55} height={18} className="mb-1" />
            <SkeletonText width={70} height={11} />
          </View>
          <View className="items-center">
            <SkeletonText width={45} height={18} className="mb-1" />
            <SkeletonText width={55} height={11} />
          </View>
        </SkeletonRow>

        {/* Action Button */}
        <Skeleton width="100%" height={38} borderRadius={10} />
      </SkeletonCard>

      {/* Audit Log Header */}
      <SkeletonText width={180} height={12} className="mb-2" />

      {/* Audit List Card */}
      <SkeletonCard className="rounded-2xl">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonRow
            key={i}
            className={`justify-between py-3 ${i < 4 ? 'border-b border-white/10' : ''}`}
          >
            <SkeletonRow className="flex-1 mr-2.5">
              <SkeletonCircle size={24} className="mr-3" />
              <View className="flex-1">
                <SkeletonText width={150} height={14} className="mb-1" />
                <SkeletonText width={120} height={11} />
              </View>
            </SkeletonRow>
            <SkeletonText width={45} height={11} />
          </SkeletonRow>
        ))}
      </SkeletonCard>
    </ScrollView>
  );
}
