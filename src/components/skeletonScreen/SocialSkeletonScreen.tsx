import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function SocialScreenSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* 2x2 Performance Grid */}
      <View style={styles.grid}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.statCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={55} height={22} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.statCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={70} height={22} style={styles.mb4} />
            <SkeletonText width={85} height={11} />
          </SkeletonCard>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.statCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={60} height={22} style={styles.mb4} />
            <SkeletonText width={80} height={11} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.statCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={45} height={22} style={styles.mb4} />
            <SkeletonText width={75} height={11} />
          </SkeletonCard>
        </View>
      </View>

      {/* Connected Accounts Row */}
      <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <SkeletonText width={130} height={15} />
        <SkeletonText width={50} height={12} />
      </SkeletonRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} style={{ width: 120, padding: 12, marginRight: 10, alignItems: "center" }}>
            <SkeletonCircle size={36} style={styles.mb8} />
            <SkeletonText width={70} height={12} style={styles.mb4} />
            <Skeleton width={50} height={16} borderRadius={8} />
          </SkeletonCard>
        ))}
      </ScrollView>

      {/* Scheduled Queue Preview */}
      <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <SkeletonText width={140} height={15} />
        <SkeletonText width={60} height={12} />
      </SkeletonRow>

      {[1, 2].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <SkeletonRow style={{ marginBottom: 8 }}>
            <SkeletonCircle size={32} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width={120} height={13} style={styles.mb4} />
              <SkeletonText width={70} height={11} />
            </View>
          </SkeletonRow>
          <SkeletonText width="90%" height={12} style={styles.mb4} />
          <SkeletonText width="70%" height={12} />
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}

export function SocialPostsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}>
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 16, padding: 14 }}>
          {/* Post Author */}
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <SkeletonRow>
              <SkeletonCircle size={38} style={{ marginRight: 10 }} />
              <View>
                <SkeletonText width={110} height={14} style={styles.mb4} />
                <SkeletonText width={70} height={11} />
              </View>
            </SkeletonRow>
            <Skeleton width={24} height={24} borderRadius={12} />
          </SkeletonRow>

          {/* Post Text */}
          <SkeletonText width="95%" height={13} style={styles.mb4} />
          <SkeletonText width="80%" height={13} style={styles.mb12} />

          {/* Media placeholder */}
          <Skeleton width="100%" height={160} borderRadius={12} style={{ marginBottom: 12 }} />

          {/* Action pills / metrics */}
          <SkeletonRow style={{ justifyContent: "space-between" }}>
            <Skeleton width={60} height={20} borderRadius={10} />
            <Skeleton width={60} height={20} borderRadius={10} />
            <Skeleton width={60} height={20} borderRadius={10} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function SocialTrendsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <SkeletonText width={60} height={11} style={styles.mb4} />
              <SkeletonText width={140} height={16} style={styles.mb4} />
              <SkeletonText width={90} height={11} />
            </View>
            <Skeleton width={65} height={24} borderRadius={12} />
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
