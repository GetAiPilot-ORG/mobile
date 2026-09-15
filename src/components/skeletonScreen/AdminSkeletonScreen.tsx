import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function SalesLeadsSkeleton() {
  return (
    <View style={{ paddingTop: 10 }}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 12 }}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <SkeletonText width={140} height={16} style={styles.mb4} />
              <SkeletonText width={180} height={12} style={styles.mb4} />
              <SkeletonText width={110} height={12} />
            </View>
            <Skeleton width={65} height={22} borderRadius={11} />
          </SkeletonRow>
          <SkeletonRow style={{ justifyContent: "space-between", marginTop: 4 }}>
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
    <View style={{ paddingTop: 10 }}>
      {/* Metrics Row */}
      <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ width: "48%" }}>
          <SkeletonCard style={{ padding: 12, marginBottom: 0 }}>
            <SkeletonCircle size={24} style={styles.mb6} />
            <SkeletonText width={50} height={18} style={styles.mb4} />
            <SkeletonText width={80} height={10} />
          </SkeletonCard>
        </View>
        <View style={{ width: "48%" }}>
          <SkeletonCard style={{ padding: 12, marginBottom: 0 }}>
            <SkeletonCircle size={24} style={styles.mb6} />
            <SkeletonText width={50} height={18} style={styles.mb4} />
            <SkeletonText width={80} height={10} />
          </SkeletonCard>
        </View>
      </SkeletonRow>

      {/* Row Items */}
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10, padding: 12 }}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <SkeletonText width={130} height={14} />
            <Skeleton width={50} height={18} borderRadius={9} />
          </SkeletonRow>
          <SkeletonText width="85%" height={12} style={styles.mb4} />
          <SkeletonText width={80} height={10} />
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
});
