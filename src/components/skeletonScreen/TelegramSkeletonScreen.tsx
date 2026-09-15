import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function TelegramSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Bot Connection Card */}
      <SkeletonCard className="mb-4">
        <SkeletonRow className="justify-between mb-3">
          <SkeletonRow>
            <SkeletonCircle size={40} className="mr-3" />
            <View>
              <SkeletonText width={130} height={16} className="mb-1" />
              <SkeletonText width={100} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={70} height={24} borderRadius={12} />
        </SkeletonRow>
        <Skeleton width="100%" height={38} borderRadius={8} />
      </SkeletonCard>

      {/* Tracker & Automation Metrics */}
      <SkeletonRow className="justify-between mb-3.5">
        <SkeletonText width={140} height={15} />
        <SkeletonText width={60} height={12} />
      </SkeletonRow>

      <View className="flex-row justify-between mb-4">
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={45} height={20} className="mb-1" />
            <SkeletonText width={85} height={11} />
          </SkeletonCard>
        </View>
        <View className="w-[48.5%]">
          <SkeletonCard className="p-3.5 mb-0">
            <SkeletonCircle size={28} className="mb-2" />
            <SkeletonText width={55} height={20} className="mb-1" />
            <SkeletonText width={75} height={11} />
          </SkeletonCard>
        </View>
      </View>

      {/* Forwarding Mappings List */}
      <SkeletonText width={150} height={15} className="mb-3" />
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="mb-2.5">
          <SkeletonRow className="justify-between mb-1.5">
            <SkeletonText width={160} height={14} />
            <Skeleton width={50} height={18} borderRadius={6} />
          </SkeletonRow>
          <SkeletonRow className="justify-between">
            <SkeletonText width={120} height={12} />
            <SkeletonText width={70} height={11} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}
