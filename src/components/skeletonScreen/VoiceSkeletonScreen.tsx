import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function VoiceCallsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 60 }}>
      {/* Telecalling Campaign Card */}
      <SkeletonCard style={{ marginBottom: 16 }}>
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <SkeletonRow>
            <SkeletonCircle size={38} style={{ marginRight: 10 }} />
            <View>
              <SkeletonText width={140} height={15} style={styles.mb4} />
              <SkeletonText width={100} height={12} />
            </View>
          </SkeletonRow>
          <Skeleton width={65} height={22} borderRadius={11} />
        </SkeletonRow>
        <SkeletonRow style={{ justifyContent: "space-between" }}>
          <SkeletonText width={90} height={12} />
          <SkeletonText width={70} height={12} />
        </SkeletonRow>
      </SkeletonCard>

      {/* Call Logs Header */}
      <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <SkeletonText width={150} height={14} />
        <Skeleton width={75} height={26} borderRadius={13} />
      </SkeletonRow>

      {/* Call Log Rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonRow style={{ flex: 1, marginRight: 10 }}>
              <SkeletonCircle size={36} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <SkeletonText width={120} height={14} />
                  <SkeletonText width={45} height={11} />
                </SkeletonRow>
                <SkeletonText width={160} height={12} />
              </View>
            </SkeletonRow>
            <Skeleton width={50} height={18} borderRadius={6} />
          </SkeletonRow>
        </SkeletonCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mb4: {
    marginBottom: 4,
  },
});
