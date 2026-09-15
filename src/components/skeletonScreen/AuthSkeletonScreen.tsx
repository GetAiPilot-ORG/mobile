import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function AuthSkeleton() {
  return (
    <View style={styles.container}>
      {/* Brand Logo */}
      <View style={styles.logoContainer}>
        <SkeletonCircle size={72} style={styles.mb16} />
        <SkeletonText width={160} height={22} style={styles.mb8} />
        <SkeletonText width={220} height={14} />
      </View>

      {/* Input Fields */}
      <View style={styles.form}>
        <SkeletonText width={80} height={12} style={styles.mb6} />
        <Skeleton width="100%" height={48} borderRadius={12} style={styles.mb16} />

        <SkeletonText width={70} height={12} style={styles.mb6} />
        <Skeleton width="100%" height={48} borderRadius={12} style={styles.mb16} />

        {/* Remember me & link */}
        <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 24 }}>
          <SkeletonRow>
            <Skeleton width={18} height={18} borderRadius={4} style={{ marginRight: 8 }} />
            <SkeletonText width={90} height={12} />
          </SkeletonRow>
          <SkeletonText width={100} height={12} />
        </SkeletonRow>

        {/* Submit Button */}
        <Skeleton width="100%" height={50} borderRadius={12} style={styles.mb24} />

        {/* Bottom switch link */}
        <View style={{ alignItems: "center" }}>
          <SkeletonText width={180} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  form: {
    width: "100%",
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
  mb24: {
    marginBottom: 24,
  },
});
