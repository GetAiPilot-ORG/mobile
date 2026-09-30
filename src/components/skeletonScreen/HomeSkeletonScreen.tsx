import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";
import { useTheme, getColors } from '@/theme';

export function HomeSkeleton() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={{ backgroundColor: isDark ? "#000000" : "#F2F2F7" }}
    >
      {/* Top Header / Greeting */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <SkeletonText width={120} height={14} style={styles.mb8} />
          <SkeletonText width={200} height={22} borderRadius={6} />
        </View>
        <SkeletonCircle size={40} />
      </View>

      {/* Search Input Bar */}
      <Skeleton
        width="100%"
        height={44}
        borderRadius={14}
        style={styles.mb16}
      />

      {/* Two Metric Cards */}
      <View style={styles.row}>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.kpiCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={60} height={20} style={styles.mb4} />
            <SkeletonText width={90} height={12} />
          </SkeletonCard>
        </View>
        <View style={styles.halfCard}>
          <SkeletonCard style={styles.kpiCard}>
            <SkeletonCircle size={28} style={styles.mb8} />
            <SkeletonText width={60} height={20} style={styles.mb4} />
            <SkeletonText width={90} height={12} />
          </SkeletonCard>
        </View>
      </View>

      {/* Security & Plan Banner */}
      <SkeletonCard style={styles.bannerCard}>
        <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <SkeletonText width={140} height={15} style={styles.mb6} />
            <SkeletonText width={220} height={12} />
          </View>
          <Skeleton width={70} height={28} borderRadius={14} />
        </SkeletonRow>
      </SkeletonCard>

      {/* Filter Tabs */}
      <SkeletonRow style={styles.tabsRow}>
        <Skeleton width={70} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <Skeleton width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <Skeleton width={75} height={32} borderRadius={16} />
      </SkeletonRow>

      {/* Engines Section Header */}
      <View style={styles.sectionTitle}>
        <SkeletonText width={140} height={16} />
        <SkeletonText width={50} height={12} />
      </View>

      {/* Engines Horizontal Row */}
      <View style={styles.enginesRow}>
        {[1, 2, 3].map((item) => (
          <SkeletonCard key={item} style={styles.engineCard}>
            <SkeletonCircle size={36} style={styles.mb8} />
            <SkeletonText width={90} height={14} style={styles.mb6} />
            <SkeletonText width={70} height={11} />
          </SkeletonCard>
        ))}
      </View>

      {/* Tools Section Header */}
      <View style={styles.sectionTitle}>
        <SkeletonText width={120} height={16} />
        <SkeletonText width={60} height={12} />
      </View>

      {/* Tools List Cards */}
      {[1, 2, 3, 4].map((item) => (
        <SkeletonCard key={item} style={styles.toolCard}>
          <SkeletonRow>
            <SkeletonCircle size={38} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <SkeletonText width={130} height={14} />
                <Skeleton width={50} height={18} borderRadius={8} />
              </SkeletonRow>
              <SkeletonText width="90%" height={12} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 130,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  halfCard: {
    width: "48.5%",
  },
  kpiCard: {
    padding: 14,
    marginBottom: 0,
  },
  bannerCard: {
    padding: 16,
    marginBottom: 18,
  },
  tabsRow: {
    marginBottom: 20,
  },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  enginesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  engineCard: {
    width: "31%",
    padding: 12,
    alignItems: "center",
    marginBottom: 0,
  },
  toolCard: {
    padding: 14,
    marginBottom: 10,
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
  mb16: {
    marginBottom: 16,
  },
});
