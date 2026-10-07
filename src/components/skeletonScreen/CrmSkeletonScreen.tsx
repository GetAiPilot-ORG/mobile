import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";
import { useTheme, getColors } from '@/theme';

export function CrmHomeSkeleton() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={{ paddingBottom: 60 }}>
      {/* 2x2 KPI Stat Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.halfCard}>
            <SkeletonCard style={styles.kpiCard}>
              <SkeletonCircle size={32} style={styles.mb8} />
              <SkeletonText width={60} height={22} style={styles.mb4} />
              <SkeletonText width={90} height={12} />
            </SkeletonCard>
          </View>
          <View style={styles.halfCard}>
            <SkeletonCard style={styles.kpiCard}>
              <SkeletonCircle size={32} style={styles.mb8} />
              <SkeletonText width={75} height={22} style={styles.mb4} />
              <SkeletonText width={80} height={12} />
            </SkeletonCard>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.halfCard}>
            <SkeletonCard style={styles.kpiCard}>
              <SkeletonCircle size={32} style={styles.mb8} />
              <SkeletonText width={80} height={22} style={styles.mb4} />
              <SkeletonText width={95} height={12} />
            </SkeletonCard>
          </View>
          <View style={styles.halfCard}>
            <SkeletonCard style={styles.kpiCard}>
              <SkeletonCircle size={32} style={styles.mb8} />
              <SkeletonText width={55} height={22} style={styles.mb4} />
              <SkeletonText width={70} height={12} />
            </SkeletonCard>
          </View>
        </View>
      </View>

      {/* Pipeline Distribution Bar */}
      <SkeletonCard style={{ marginBottom: 20 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <SkeletonText width={140} height={14} />
          <SkeletonText width={60} height={14} />
        </SkeletonRow>
        <Skeleton width="100%" height={10} borderRadius={5} style={{ marginBottom: 12 }} />
        <SkeletonRow style={{ justifyContent: "space-between" }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={65} height={12} borderRadius={4} />
          ))}
        </SkeletonRow>
      </SkeletonCard>

      {/* Recent Leads Section */}
      <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <SkeletonText width={120} height={15} />
        <SkeletonText width={50} height={13} />
      </SkeletonRow>

      {[1, 2, 3].map((item) => (
        <SkeletonCard key={item} style={styles.leadItemCard}>
          <SkeletonRow>
            <SkeletonCircle size={40} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <SkeletonText width={120} height={15} />
                <Skeleton width={60} height={20} borderRadius={6} />
              </SkeletonRow>
              <SkeletonText width={160} height={12} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CrmListSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}>
      {/* Search & Filter Bar */}
      <Skeleton width="100%" height={42} borderRadius={12} style={{ marginBottom: 14 }} />

      {/* Filter Tabs */}
      <SkeletonRow style={{ marginBottom: 16 }}>
        {[60, 80, 75, 90].map((w, idx) => (
          <Skeleton key={idx} width={w} height={30} borderRadius={15} style={{ marginRight: 8 }} />
        ))}
      </SkeletonRow>

      {/* Lead / Contact Cards */}
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <SkeletonCard key={item} style={styles.leadCard}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <SkeletonRow>
              <SkeletonCircle size={38} style={{ marginRight: 10 }} />
              <View>
                <SkeletonText width={130} height={15} style={styles.mb4} />
                <SkeletonText width={90} height={12} />
              </View>
            </SkeletonRow>
            <Skeleton width={70} height={22} borderRadius={6} />
          </SkeletonRow>

          <SkeletonRow style={{ justifyContent: "space-between", marginTop: 4 }}>
            <SkeletonText width={140} height={12} />
            <Skeleton width={60} height={18} borderRadius={9} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CrmPipelineSkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
      {/* Pipeline Stage Header */}
      <SkeletonRow style={{ marginBottom: 14 }}>
        {[100, 100, 100].map((w, idx) => (
          <Skeleton key={idx} width={w} height={36} borderRadius={10} style={{ marginRight: 10 }} />
        ))}
      </SkeletonRow>

      {/* Pipeline Deals */}
      {[1, 2, 3, 4].map((item) => (
        <SkeletonCard key={item} style={{ marginBottom: 12 }}>
          <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <SkeletonText width={140} height={16} />
            <Skeleton width={65} height={20} borderRadius={6} />
          </SkeletonRow>
          <SkeletonText width={100} height={12} style={styles.mb8} />
          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonCircle size={24} />
            <Skeleton width={80} height={14} borderRadius={4} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function LeadDetailSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Profile Card */}
      <SkeletonCard style={{ alignItems: "center", paddingVertical: 24, marginBottom: 16 }}>
        <SkeletonCircle size={64} style={styles.mb12} />
        <SkeletonText width={160} height={20} style={styles.mb8} />
        <SkeletonText width={120} height={13} style={styles.mb16} />
        <SkeletonRow style={{ justifyContent: "center", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCircle key={i} size={40} />
          ))}
        </SkeletonRow>
      </SkeletonCard>

      {/* Stage Stepper */}
      <SkeletonCard style={{ marginBottom: 16 }}>
        <SkeletonText width={100} height={14} style={styles.mb12} />
        <Skeleton width="100%" height={36} borderRadius={10} />
      </SkeletonCard>

      {/* Information Rows */}
      <SkeletonCard style={{ marginBottom: 16 }}>
        <SkeletonText width={120} height={15} style={styles.mb16} />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <SkeletonText width={80} height={12} />
            <SkeletonText width={140} height={12} />
          </SkeletonRow>
        ))}
      </SkeletonCard>

      {/* Timeline Items */}
      <SkeletonText width={110} height={15} style={styles.mb12} />
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <SkeletonRow>
            <SkeletonCircle size={30} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <SkeletonText width={110} height={13} />
                <SkeletonText width={50} height={11} />
              </SkeletonRow>
              <SkeletonText width="80%" height={11} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </ScrollView>
  );
}

export function CrmActivitySkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 12 }}>
          <SkeletonRow>
            <SkeletonCircle size={36} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <SkeletonText width={130} height={14} />
                <SkeletonText width={50} height={11} />
              </SkeletonRow>
              <SkeletonText width="90%" height={12} style={styles.mb4} />
              <SkeletonText width={90} height={10} />
            </View>
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CrmTaskSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonRow style={{ flex: 1, marginRight: 12 }}>
              <Skeleton width={20} height={20} borderRadius={6} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <SkeletonText width={150} height={14} style={styles.mb4} />
                <SkeletonText width={90} height={11} />
              </View>
            </SkeletonRow>
            <Skeleton width={60} height={20} borderRadius={10} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  halfCard: {
    width: "48.5%",
  },
  kpiCard: {
    padding: 14,
    marginBottom: 0,
  },
  leadCard: {
    padding: 14,
    marginBottom: 10,
  },
  leadItemCard: {
    padding: 12,
    marginBottom: 10,
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
  mb16: {
    marginBottom: 16,
  },
});
