import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function ActivityScreenSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130 }}>
      {/* Segmented Control Track */}
      <Skeleton width="100%" height={38} borderRadius={10} style={{ marginBottom: 16 }} />

      {/* Telemetry Widget Card */}
      <SkeletonCard style={{ padding: 16, marginBottom: 22, borderRadius: 18 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <SkeletonRow style={{ flex: 1, marginRight: 10 }}>
            <SkeletonCircle size={38} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width={120} height={16} style={styles.mb4} />
              <SkeletonText width={180} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={60} height={22} borderRadius={6} />
        </SkeletonRow>

        {/* 3 Metric Columns */}
        <SkeletonRow
          style={{
            justifyContent: "space-around",
            paddingVertical: 14,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(150, 150, 150, 0.2)",
            marginBottom: 14,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <SkeletonText width={60} height={18} style={styles.mb4} />
            <SkeletonText width={75} height={11} />
          </View>
          <View style={{ alignItems: "center" }}>
            <SkeletonText width={55} height={18} style={styles.mb4} />
            <SkeletonText width={70} height={11} />
          </View>
          <View style={{ alignItems: "center" }}>
            <SkeletonText width={45} height={18} style={styles.mb4} />
            <SkeletonText width={55} height={11} />
          </View>
        </SkeletonRow>

        {/* Action Button */}
        <Skeleton width="100%" height={38} borderRadius={10} />
      </SkeletonCard>

      {/* Audit Log Header */}
      <SkeletonText width={180} height={12} style={styles.mb8} />

      {/* Audit List Card */}
      <SkeletonCard style={{ borderRadius: 18 }}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonRow
            key={i}
            style={{
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: i < 4 ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: "rgba(150, 150, 150, 0.2)",
            }}
          >
            <SkeletonRow style={{ flex: 1, marginRight: 10 }}>
              <SkeletonCircle size={24} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <SkeletonText width={150} height={14} style={styles.mb4} />
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

const styles = StyleSheet.create({
  mb4: {
    marginBottom: 4,
  },
  mb8: {
    marginBottom: 8,
  },
});
