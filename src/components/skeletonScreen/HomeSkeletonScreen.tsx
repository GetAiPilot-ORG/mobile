import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function HomeSkeleton() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 pt-14 pb-32"
      className="bg-[#0B0D10]"
    >
      {/* Top Header / Greeting */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-1">
          <SkeletonText width={120} height={14} className="mb-2" />
          <SkeletonText width={200} height={22} borderRadius={6} />
        </View>
        <SkeletonCircle size={40} />
      </View>

      {/* Search Input Bar */}
      <Skeleton
        width="100%"
        height={44}
        borderRadius={14}
        className="mb-4"
      />

      {/* Two Metric Cards */}
      <View className="flex-row justify-between mb-3.5">
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={60} height={20} className="mb-1" />
            <SkeletonText width={90} height={12} />
          </SkeletonCard>
        </View>
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={60} height={20} className="mb-1" />
            <SkeletonText width={90} height={12} />
          </SkeletonCard>
        </View>
      </View>

      {/* Security & Plan Banner */}
      <SkeletonCard className="p-4 mb-4.5">
        <SkeletonRow className="justify-between items-center">
          <View className="flex-1 mr-3">
            <SkeletonText width={140} height={15} className="mb-1.5" />
            <SkeletonText width={220} height={12} />
          </View>
          <Skeleton width={70} height={28} borderRadius={14} />
        </SkeletonRow>
      </SkeletonCard>

      {/* Filter Tabs */}
      <SkeletonRow className="mb-5">
        <Skeleton width={70} height={32} borderRadius={16} className="mr-2" />
        <Skeleton width={80} height={32} borderRadius={16} className="mr-2" />
        <Skeleton width={75} height={32} borderRadius={16} />
      </SkeletonRow>

      {/* Engines Section Header */}
      <View className="flex-row justify-between items-center mb-3">
        <SkeletonText width={140} height={16} />
        <SkeletonText width={50} height={12} />
      </View>

      {/* Engines Horizontal Row */}
      <View className="flex-row justify-between mb-5.5">
        {[1, 2, 3].map((item) => (
          <SkeletonCard key={item} className="w-[31%] p-3 items-center mb-0">
            <SkeletonCircle size={36} className="mb-2" />
            <SkeletonText width={80} height={13} className="mb-1.5" />
            <SkeletonText width={70} height={11} />
          </SkeletonCard>
        ))}
      </View>

      {/* Tools Section Header */}
      <View className="flex-row justify-between items-center mb-3">
        <SkeletonText width={120} height={16} />
        <SkeletonText width={60} height={12} />
      </View>

      {/* Tools List Cards */}
      {[1, 2, 3, 4].map((item) => (
        <SkeletonCard key={item} className="p-3.5 mb-2.5">
          <SkeletonRow>
            <SkeletonCircle size={38} className="mr-3" />
            <View className="flex-1">
              <SkeletonRow className="justify-between mb-1.5">
                <SkeletonText width={130} height={14} />
                <Skeleton width={50} height={18} borderRadius={8} />
              </SkeletonRow>
              <SkeletonText width="90%" height={12} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}
