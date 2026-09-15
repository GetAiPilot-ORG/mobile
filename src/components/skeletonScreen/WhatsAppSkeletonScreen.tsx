import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function WhatsAppHomeSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Connection Status Card */}
      <SkeletonCard style={{ marginBottom: 14 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <SkeletonRow>
            <SkeletonCircle size={36} style={{ marginRight: 10 }} />
            <View>
              <SkeletonText width={120} height={15} style={styles.mb4} />
              <SkeletonText width={160} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={70} height={24} borderRadius={12} />
        </SkeletonRow>
        <Skeleton width="100%" height={36} borderRadius={8} />
      </SkeletonCard>

      {/* Cloud Wallet & Usage Card */}
      <SkeletonCard style={{ marginBottom: 20 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <SkeletonText width={110} height={13} />
          <Skeleton width={60} height={18} borderRadius={6} />
        </SkeletonRow>
        <SkeletonText width={130} height={28} style={styles.mb8} />
        <Skeleton width="100%" height={6} borderRadius={3} style={styles.mb8} />
        <SkeletonRow style={{ justifyContent: "space-between" }}>
          <SkeletonText width={90} height={11} />
          <SkeletonText width={70} height={11} />
        </SkeletonRow>
      </SkeletonCard>

      {/* 2x2 Metrics Grid */}
      <SkeletonText width={140} height={15} style={styles.mb12} />
      <View style={styles.grid}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={50} height={20} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={60} height={20} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={65} height={20} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.metricCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={50} height={20} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
      </View>
    </ScrollView>
  );
}

export function WhatsAppBroadcastsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}>
      {/* Tab Filter Pills */}
      <SkeletonRow style={{ marginBottom: 16 }}>
        {[60, 80, 75, 90].map((w, idx) => (
          <Skeleton key={idx} width={w} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        ))}
      </SkeletonRow>

      {/* Broadcast Cards */}
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 12 }}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <SkeletonText width={160} height={16} />
            <Skeleton width={70} height={22} borderRadius={6} />
          </SkeletonRow>
          <SkeletonText width="85%" height={12} style={styles.mb12} />
          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonText width={100} height={11} />
            <Skeleton width={80} height={12} borderRadius={4} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function WhatsAppTemplatesSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}>
      {/* Category Pills */}
      <SkeletonRow style={{ marginBottom: 16 }}>
        {[70, 90, 80, 85].map((w, idx) => (
          <Skeleton key={idx} width={w} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        ))}
      </SkeletonRow>

      {/* Template Cards */}
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 12 }}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <SkeletonText width={150} height={15} />
            <Skeleton width={60} height={20} borderRadius={6} />
          </SkeletonRow>
          <SkeletonText width="95%" height={12} style={styles.mb4} />
          <SkeletonText width="70%" height={12} style={styles.mb12} />
          <SkeletonRow style={{ justifyContent: "space-between" }}>
            <Skeleton width={70} height={18} borderRadius={4} />
            <Skeleton width={60} height={18} borderRadius={4} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
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
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
});
