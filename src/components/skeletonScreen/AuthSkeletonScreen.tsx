import React from "react";
import { View } from "react-native";
import { Skeleton, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function AuthSkeleton() {
  return (
    <View className="flex-1 px-6 justify-center pb-16">
      {/* Brand Logo */}
      <View className="items-center mb-9">
        <SkeletonCircle size={72} className="mb-4" />
        <SkeletonText width={160} height={22} className="mb-2" />
        <SkeletonText width={220} height={14} />
      </View>

      {/* Input Fields */}
      <View className="w-full">
        <SkeletonText width={80} height={12} className="mb-1.5" />
        <Skeleton width="100%" height={48} borderRadius={12} className="mb-4" />

        <SkeletonText width={70} height={12} className="mb-1.5" />
        <Skeleton width="100%" height={48} borderRadius={12} className="mb-4" />

        {/* Remember me & link */}
        <SkeletonRow className="justify-between mb-6">
          <SkeletonRow>
            <Skeleton width={18} height={18} borderRadius={4} className="mr-2" />
            <SkeletonText width={90} height={12} />
          </SkeletonRow>
          <SkeletonText width={100} height={12} />
        </SkeletonRow>

        {/* Submit Button */}
        <Skeleton width="100%" height={50} borderRadius={12} className="mb-6" />

        {/* Bottom switch link */}
        <View className="items-center">
          <SkeletonText width={180} height={14} />
        </View>
      </View>
    </View>
  );
}
