import React from "react";
import { StyleSheet } from "react-native";
import { SkeletonCard, SkeletonText } from "../Skeleton";

export function CampaignSkeleton({ isDark: _propIsDark }: { isDark?: boolean } = {}) {
  return (
    <SkeletonCard style={styles.card}>
      <SkeletonText width="90%" height={20} borderRadius={6} style={styles.mb12} />
      <SkeletonText width="70%" height={16} borderRadius={5} style={styles.mb12} />
      <SkeletonText width="50%" height={12} borderRadius={4} style={styles.mb8} />
      <SkeletonText width="40%" height={12} borderRadius={4} />
    </SkeletonCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mb12: {
    marginBottom: 12,
  },
  mb8: {
    marginBottom: 8,
  },
});
