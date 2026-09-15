import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function DeviceSessionsSkeleton() {
  return (
    <View style={{ paddingVertical: 8 }}>
      {[1, 2].map((i) => (
        <SkeletonRow
          key={i}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 4,
            borderBottomWidth: i === 1 ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: "rgba(150, 150, 150, 0.2)",
            justifyContent: "space-between",
          }}
        >
          <SkeletonRow style={{ flex: 1, marginRight: 10 }}>
            <SkeletonCircle size={36} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width={120} height={14} style={styles.mb4} />
              <SkeletonText width={160} height={11} />
            </View>
          </SkeletonRow>
          <Skeleton width={55} height={22} borderRadius={11} />
        </SkeletonRow>
      ))}
    </View>
  );
}

export function AccountSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 50, paddingBottom: 100 }}>
      {/* Profile Banner */}
      <SkeletonCard style={{ alignItems: "center", paddingVertical: 20, marginBottom: 16 }}>
        <SkeletonCircle size={70} style={styles.mb12} />
        <SkeletonText width={140} height={18} style={styles.mb6} />
        <SkeletonText width={180} height={13} style={styles.mb12} />
        <Skeleton width={90} height={24} borderRadius={12} />
      </SkeletonCard>

      {/* Subscription Card */}
      <SkeletonCard style={{ marginBottom: 16 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <SkeletonText width={120} height={15} />
          <Skeleton width={60} height={20} borderRadius={6} />
        </SkeletonRow>
        <SkeletonText width={200} height={12} style={styles.mb12} />
        <Skeleton width="100%" height={38} borderRadius={8} />
      </SkeletonCard>

      {/* Logged in Devices */}
      <SkeletonText width={140} height={13} style={styles.mb8} />
      <SkeletonCard style={{ marginBottom: 16 }}>
        <DeviceSessionsSkeleton />
      </SkeletonCard>

      {/* Preferences / Settings */}
      <SkeletonText width={100} height={13} style={styles.mb8} />
      <SkeletonCard>
        {[1, 2, 3].map((i) => (
          <SkeletonRow
            key={i}
            style={{
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: i < 3 ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: "rgba(150, 150, 150, 0.2)",
            }}
          >
            <SkeletonRow>
              <SkeletonCircle size={30} style={{ marginRight: 10 }} />
              <SkeletonText width={130} height={14} />
            </SkeletonRow>
            <Skeleton width={40} height={22} borderRadius={11} />
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
  mb6: {
    marginBottom: 6,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
});
