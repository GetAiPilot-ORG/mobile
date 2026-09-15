import React from "react";
import { ScrollView, View, useColorScheme } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function CrmHomeSkeleton() {
  const isDark = useColorScheme() === "dark";

  return (
    <View className="pb-16">
      {/* 2x2 KPI Stat Cards */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-2.5">
          <View className="w-[48.5%]">
            <SkeletonCard className="p-3.5 mb-0">
              <SkeletonCircle size={32} className="mb-2" />
              <SkeletonText width={60} height={22} className="mb-1" />
              <SkeletonText width={90} height={12} />
            </SkeletonCard>
          </View>
          <View className="w-[48.5%]">
            <SkeletonCard className="p-3.5 mb-0">
              <SkeletonCircle size={32} className="mb-2" />
              <SkeletonText width={75} height={22} className="mb-1" />
              <SkeletonText width={80} height={12} />
            </SkeletonCard>
          </View>
        </View>

        <View className="flex-row justify-between mb-2.5">
          <View className="w-[48.5%]">
            <SkeletonCard className="p-3.5 mb-0">
              <SkeletonCircle size={32} className="mb-2" />
              <SkeletonText width={80} height={22} className="mb-1" />
              <SkeletonText width={95} height={12} />
            </SkeletonCard>
          </View>
          <View className="w-[48.5%]">
            <SkeletonCard className="p-3.5 mb-0">
              <SkeletonCircle size={32} className="mb-2" />
              <SkeletonText width={55} height={22} className="mb-1" />
              <SkeletonText width={70} height={12} />
            </SkeletonCard>
          </View>
        </View>
      </View>

      {/* Pipeline Distribution Bar */}
      <SkeletonCard className="mb-5">
        <SkeletonRow className="justify-between mb-3">
          <SkeletonText width={140} height={14} />
          <SkeletonText width={60} height={14} />
        </SkeletonRow>
        <Skeleton width="100%" height={10} borderRadius={5} className="mb-3" />
        <SkeletonRow className="justify-between">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={65} height={12} borderRadius={4} />
          ))}
        </SkeletonRow>
      </SkeletonCard>

      {/* Recent Leads Section */}
      <SkeletonRow className="justify-between mb-3">
        <SkeletonText width={120} height={15} />
        <SkeletonText width={50} height={13} />
      </SkeletonRow>

      {[1, 2, 3].map((item) => (
        <SkeletonCard key={item} className="p-3 mb-2.5">
          <SkeletonRow>
            <SkeletonCircle size={40} className="mr-3" />
            <View className="flex-1">
              <SkeletonRow className="justify-between mb-1.5">
                <SkeletonText width={120} height={15} />
                <Skeleton width={60} height={20} borderRadius={6} />
              </SkeletonRow>
              <SkeletonText width={160} height={12} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CrmListSkeleton() {
  return (
    <View className="px-4 pt-2.5 pb-24">
      {/* Search & Filter Bar */}
      <Skeleton width="100%" height={42} borderRadius={12} className="mb-3.5" />

      {/* Filter Tabs */}
      <SkeletonRow className="mb-4">
        {[60, 80, 75, 90].map((w, idx) => (
          <Skeleton key={idx} width={w} height={30} borderRadius={15} className="mr-2" />
        ))}
      </SkeletonRow>

      {/* Lead / Contact Cards */}
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <SkeletonCard key={item} className="p-3.5 mb-2.5">
          <SkeletonRow className="justify-between mb-2">
            <SkeletonRow>
              <SkeletonCircle size={38} className="mr-2.5" />
              <View>
                <SkeletonText width={130} height={15} className="mb-1" />
                <SkeletonText width={90} height={12} />
              </View>
            </SkeletonRow>
            <Skeleton width={70} height={22} borderRadius={6} />
          </SkeletonRow>

          <SkeletonRow className="justify-between mt-1">
            <SkeletonText width={140} height={12} />
            <Skeleton width={60} height={18} borderRadius={9} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CrmPipelineSkeleton() {
  return (
    <View className="flex-1 px-4 pt-2.5">
      {/* Pipeline Stage Header */}
      <SkeletonRow className="mb-3.5">
        {[100, 100, 100].map((w, idx) => (
          <Skeleton key={idx} width={w} height={36} borderRadius={10} className="mr-2.5" />
        ))}
      </SkeletonRow>

      {/* Pipeline Deals */}
      {[1, 2, 3, 4].map((item) => (
        <SkeletonCard key={item} className="mb-3">
          <SkeletonRow className="justify-between mb-2">
            <SkeletonText width={140} height={16} />
            <Skeleton width={65} height={20} borderRadius={6} />
          </SkeletonRow>
          <SkeletonText width={100} height={12} className="mb-2" />
          <SkeletonRow className="justify-between items-center">
            <SkeletonCircle size={24} />
            <Skeleton width={80} height={14} borderRadius={4} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function LeadDetailSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Profile Card */}
      <SkeletonCard className="items-center py-6 mb-4">
        <SkeletonCircle size={64} className="mb-3" />
        <SkeletonText width={160} height={20} className="mb-2" />
        <SkeletonText width={120} height={13} className="mb-4" />
        <SkeletonRow className="justify-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCircle key={i} size={40} />
          ))}
        </SkeletonRow>
      </SkeletonCard>

      {/* Stage Stepper */}
      <SkeletonCard className="mb-4">
        <SkeletonText width={100} height={14} className="mb-3" />
        <Skeleton width="100%" height={36} borderRadius={10} />
      </SkeletonCard>

      {/* Information Rows */}
      <SkeletonCard className="mb-4">
        <SkeletonText width={120} height={15} className="mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} className="justify-between mb-3">
            <SkeletonText width={80} height={12} />
            <SkeletonText width={140} height={12} />
          </SkeletonRow>
        ))}
      </SkeletonCard>

      {/* Timeline Items */}
      <SkeletonText width={110} height={15} className="mb-3" />
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="mb-2.5">
          <SkeletonRow>
            <SkeletonCircle size={30} className="mr-2.5" />
            <View className="flex-1">
              <SkeletonRow className="justify-between mb-1">
                <SkeletonText width={110} height={13} />
                <SkeletonText width={50} height={11} />
              </SkeletonRow>
              <SkeletonText width="80%" height={11} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}

export function CrmActivitySkeleton() {
  return (
    <View className="px-4 pt-2.5 pb-24">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} className="mb-3">
          <SkeletonRow>
            <SkeletonCircle size={36} className="mr-3" />
            <View className="flex-1">
              <SkeletonRow className="justify-between mb-1.5">
                <SkeletonText width={130} height={14} />
                <SkeletonText width={50} height={11} />
              </SkeletonRow>
              <SkeletonText width="90%" height={12} className="mb-1" />
              <SkeletonText width={90} height={10} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CrmTaskSkeleton() {
  return (
    <View className="px-4 pt-2.5 pb-24">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} className="mb-2.5">
          <SkeletonRow className="justify-between items-center">
            <SkeletonRow className="flex-1 mr-3">
              <Skeleton width={20} height={20} borderRadius={6} className="mr-3" />
              <View className="flex-1">
                <SkeletonText width={150} height={14} className="mb-1" />
                <SkeletonText width={90} height={11} />
              </View>
            </SkeletonRow>
            <Skeleton width={60} height={20} borderRadius={10} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}
