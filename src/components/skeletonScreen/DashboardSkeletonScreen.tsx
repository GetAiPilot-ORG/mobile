import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function DashboardSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 50, paddingBottom: 120 }}>
      {/* Workspace Header */}
      <View style={{ marginBottom: 20 }}>
        <SkeletonText width={120} height={12} style={styles.mb6} />
        <SkeletonText width={220} height={24} style={styles.mb8} />
        <SkeletonText width={180} height={13} />
      </View>

      {/* 2x2 Glass Metric Grid */}
      <View style={styles.grid}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={50} height={22} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={65} height={22} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={60} height={22} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={50} height={22} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
      </View>

      {/* Usage Meter Card */}
      <SkeletonCard style={{ marginBottom: 20 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <SkeletonText width={130} height={15} />
          <Skeleton width={50} height={18} borderRadius={6} />
        </SkeletonRow>
        <Skeleton width="100%" height={8} borderRadius={4} style={styles.mb10} />
        <SkeletonRow style={{ justifyContent: "space-between" }}>
          <SkeletonText width={100} height={12} />
          <SkeletonText width={80} height={12} />
        </SkeletonRow>
      </SkeletonCard>

      {/* Product Action Cards */}
      <SkeletonText width={140} height={16} style={styles.mb12} />
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 12 }}>
          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonRow style={{ flex: 1, marginRight: 10 }}>
              <SkeletonCircle size={40} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <SkeletonText width={130} height={15} style={styles.mb4} />
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

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  halfCard: {
    width: "48.5%",
  },
  metricCard: {
    padding: 14,
    marginBottom: 0,
  },
  mb4: {
    marginBottom: 4,
  },
  mb6: {
    marginBottom: 6,
  },
  mb8: {
    marginBottom: 8,
  },
  mb10: {
    marginBottom: 10,
  },
  mb12: {
    marginBottom: 12,
  },
});
