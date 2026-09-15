import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function WhatsAppHomeSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Connection Status Card */}
      <SkeletonCard className="mb-3.5">
        <SkeletonRow className="justify-between mb-3">
          <SkeletonRow>
            <SkeletonCircle size={36} className="mr-2.5" />
            <View>
              <SkeletonText width={120} height={15} className="mb-1" />
              <SkeletonText width={160} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={70} height={24} borderRadius={12} />
        </SkeletonRow>
        <Skeleton width="100%" height={36} borderRadius={8} />
      </SkeletonCard>

      {/* Cloud Wallet & Usage Card */}
      <SkeletonCard className="mb-5">
        <SkeletonRow className="justify-between mb-2">
          <SkeletonText width={110} height={13} />
          <Skeleton width={60} height={18} borderRadius={6} />
        </SkeletonRow>
        <SkeletonText width={130} height={28} className="mb-2" />
        <Skeleton width="100%" height={6} borderRadius={3} className="mb-2" />
        <SkeletonRow className="justify-between">
          <SkeletonText width={90} height={11} />
          <SkeletonText width={70} height={11} />
        </SkeletonRow>
      </SkeletonCard>

      {/* 2x2 Metrics Grid */}
      <SkeletonText width={140} height={15} className="mb-3" />
      <View className="flex-row justify-between mb-2.5">
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={50} height={20} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={60} height={20} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
      </View>
      <View className="flex-row justify-between mb-2.5">
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={65} height={20} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={50} height={20} className="mb-1" />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
      </View>
    </ScrollView>
  );
}

export function WhatsAppBroadcastsSkeleton() {
  return (
    <View className="px-4 pt-3 pb-24">
      {/* Tab Filter Pills */}
      <SkeletonRow className="mb-4">
        {[60, 80, 75, 90].map((w, idx) => (
          <Skeleton key={idx} width={w} height={32} borderRadius={16} className="mr-2" />
        ))}
      </SkeletonRow>

      {/* Broadcast Cards */}
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} className="mb-3">
          <SkeletonRow className="justify-between mb-2">
            <SkeletonText width={160} height={16} />
            <Skeleton width={70} height={22} borderRadius={6} />
          </SkeletonRow>
          <SkeletonText width="85%" height={12} className="mb-3" />
          <SkeletonRow className="justify-between items-center">
            <SkeletonText width={100} height={11} />
            <Skeleton width={80} height={12} borderRadius={4} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function WhatsAppTemplatesSkeleton() {
  return (
    <View className="px-4 pt-3 pb-24">
      {/* Category Pills */}
      <SkeletonRow className="mb-4">
        {[70, 90, 80, 85].map((w, idx) => (
          <Skeleton key={idx} width={w} height={32} borderRadius={16} className="mr-2" />
        ))}
      </SkeletonRow>

      {/* Template Cards */}
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} className="mb-3">
          <SkeletonRow className="justify-between mb-2">
            <SkeletonText width={150} height={15} />
            <Skeleton width={60} height={20} borderRadius={6} />
          </SkeletonRow>
          <SkeletonText width="95%" height={12} className="mb-1" />
          <SkeletonText width="70%" height={12} className="mb-3" />
          <SkeletonRow className="justify-between">
            <Skeleton width={70} height={18} borderRadius={4} />
            <Skeleton width={60} height={18} borderRadius={4} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}
