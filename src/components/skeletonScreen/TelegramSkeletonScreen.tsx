import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function TelegramSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Bot Connection Card */}
      <SkeletonCard style={{ marginBottom: 16 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <SkeletonRow>
            <SkeletonCircle size={40} style={{ marginRight: 12 }} />
            <View>
              <SkeletonText width={130} height={16} style={styles.mb4} />
              <SkeletonText width={100} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={70} height={24} borderRadius={12} />
        </SkeletonRow>
        <Skeleton width="100%" height={38} borderRadius={8} />
      </SkeletonCard>

      {/* Tracker & Automation Metrics */}
      <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <SkeletonText width={140} height={15} />
        <SkeletonText width={60} height={12} />
      </SkeletonRow>

      <View style={styles.grid}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.statCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={45} height={20} style={styles.mb4} />
            <SkeletonText width={85} height={11} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.statCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={55} height={20} style={styles.mb4} />
            <SkeletonText width={75} height={11} />
          </SkeletonCard>
        </View>
      </View>

      {/* Forwarding Mappings List */}
      <SkeletonText width={150} height={15} style={styles.mb12} />
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <SkeletonText width={160} height={14} />
            <Skeleton width={50} height={18} borderRadius={6} />
          </SkeletonRow>
          <SkeletonRow style={{ justifyContent: "space-between" }}>
            <SkeletonText width={120} height={12} />
            <SkeletonText width={70} height={11} />
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
    marginBottom: 16,
  },
  halfCard: {
    width: "48.5%",
  },
  statCard: {
    padding: 14,
    marginBottom: 0,
  },
  mb4: {
    marginBottom: 4,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
});
