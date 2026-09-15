import React from "react";
import { View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function VoiceCallsSkeleton() {
  return (
    <View className="px-4 pt-2.5 pb-16">
      {/* Telecalling Campaign Card */}
      <SkeletonCard className="mb-4">
        <SkeletonRow className="justify-between mb-3">
          <SkeletonRow>
            <SkeletonCircle size={38} className="mr-2.5" />
            <View>
              <SkeletonText width={140} height={15} className="mb-1" />
              <SkeletonText width={100} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={65} height={22} borderRadius={11} />
        </SkeletonRow>
        <SkeletonRow className="justify-between">
          <SkeletonText width={90} height={12} />
          <SkeletonText width={70} height={12} />
        </SkeletonRow>
      </SkeletonCard>

      {/* Call Logs Header */}
      <SkeletonRow className="justify-between mb-3">
        <SkeletonText width={150} height={14} />
        <Skeleton width={75} height={26} borderRadius={13} />
      </SkeletonRow>

      {/* Call Log Rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} className="mb-2.5">
          <SkeletonRow className="justify-between items-center">
            <SkeletonRow className="flex-1 mr-2.5">
              <SkeletonCircle size={36} className="mr-3" />
              <View className="flex-1">
                <SkeletonRow className="justify-between mb-1">
                  <SkeletonText width={120} height={14} />
                  <SkeletonText width={45} height={11} />
                </SkeletonRow>
                <SkeletonText width={160} height={12} />
              </View>
            </SkeletonRow>
            <Skeleton width={50} height={18} borderRadius={6} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}
