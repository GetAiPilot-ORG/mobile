import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function TemplatesListSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 }}>
      {/* Header Info Card */}
      <SkeletonCard style={{ marginBottom: 16 }}>
        <SkeletonText width={120} height={18} style={styles.mb6} />
        <SkeletonText width="90%" height={13} />
      </SkeletonCard>

      {/* Category Pills */}
      <SkeletonRow style={{ marginBottom: 16 }}>
        {[65, 80, 75, 90].map((w, idx) => (
          <Skeleton key={idx} width={w} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        ))}
      </SkeletonRow>

      {/* Template Cards */}
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 16, padding: 14 }}>
          {/* Card Preview Box */}
          <Skeleton width="100%" height={160} borderRadius={12} style={{ marginBottom: 12 }} />

          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <SkeletonText width={140} height={16} />
            <Skeleton width={60} height={20} borderRadius={10} />
          </SkeletonRow>
          <SkeletonText width="85%" height={12} style={styles.mb12} />

          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
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
    <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 }}>
      {/* Search Input */}
      <Skeleton width="100%" height={42} borderRadius={12} style={{ marginBottom: 16 }} />

      {/* Form List Cards */}
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 12 }}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <SkeletonRow style={{ flex: 1, marginRight: 10 }}>
              <SkeletonCircle size={36} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <SkeletonText width={130} height={15} style={styles.mb4} />
                <SkeletonText width={180} height={12} />
              </View>
            </SkeletonRow>
            <Skeleton width={65} height={22} borderRadius={11} />
          </SkeletonRow>

          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
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
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 14, padding: 16, borderRadius: 20 }}>
          <SkeletonRow>
            <Skeleton width={48} height={48} borderRadius={12} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <SkeletonText width={160} height={16} />
                <Skeleton width={60} height={20} borderRadius={10} />
              </SkeletonRow>
              <SkeletonText width="95%" height={12} style={{ marginBottom: 4 }} />
              <SkeletonText width="70%" height={12} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mb4: {
    marginBottom: 4,
  },
  mb6: {
    marginBottom: 6,
  },
  mb12: {
    marginBottom: 12,
  },
});
