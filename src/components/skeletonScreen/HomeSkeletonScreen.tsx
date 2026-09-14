import { ScrollView, StyleSheet, View, useColorScheme } from "react-native";
import Skeleton from "../Skeleton";

export function HomeSkeleton() {
  const isDark = useColorScheme() === "dark";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Search */}
      <Skeleton
        width="100%"
        height={38}
        borderRadius={12}
        style={{ ...styles.mb16, marginTop: 50 }}
      />

      {/* Two Cards */}
      <View style={styles.row}>
        <Skeleton width="48%" height={70} borderRadius={16} />

        <Skeleton width="48%" height={70} borderRadius={16} />
      </View>

      {/* Security Card */}
      <Skeleton
        width="100%"
        height={75}
        borderRadius={16}
        style={styles.mb20}
      />

      {/* Tabs */}
      <Skeleton
        width="100%"
        height={38}
        borderRadius={10}
        style={styles.mb24}
      />

      {/* Section title */}
      <View style={styles.sectionTitle}>
        <Skeleton width={130} height={14} />
        <Skeleton width={50} height={12} />
      </View>

      {/* Engines */}
      <Skeleton
        width="100%"
        height={80}
        borderRadius={18}
        style={styles.mb24}
      />

      {/* Tools title */}
      <View style={styles.sectionTitle}>
        <Skeleton width={120} height={14} />
        <Skeleton width={70} height={12} />
      </View>

      {/* Tools */}
      <Skeleton width="100%" height={250} borderRadius={18} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 130,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  mb16: {
    marginBottom: 16,
  },

  mb20: {
    marginBottom: 20,
  },

  mb24: {
    marginBottom: 24,
  },
});
