import { Dimensions, View } from "react-native";

const width = Dimensions.get("window").width;
export function CampaignSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: isDark ? "#17181C" : "#FFFFFF",
          borderColor: isDark ? "#292B32" : "#E5E7EB",
        },
      ]}
    >
      <View
        style={[
          styles.skeletonLarge,
          {
            backgroundColor: isDark ? "#292B32" : "#E5E7EB",
          },
        ]}
      />

      <View
        style={[
          styles.skeletonMedium,
          {
            backgroundColor: isDark ? "#292B32" : "#E5E7EB",
          },
        ]}
      />

      <View
        style={[
          styles.skeletonLine,
          {
            backgroundColor: isDark ? "#292B32" : "#E5E7EB",
          },
        ]}
      />

      <View
        style={[
          styles.skeletonLine,
          {
            backgroundColor: isDark ? "#292B32" : "#E5E7EB",
          },
        ]}
      />
    </View>
  );
}

const styles = {
  skeletonCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  skeletonLarge: {
    width: width - 64,
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonMedium: {
    width: width - 100,
    height: 16,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonLine: {
    width: width - 150,
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
};
