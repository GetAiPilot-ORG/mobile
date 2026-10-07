import { Dimensions, View } from "react-native";
import { useTheme, getColors } from '@/theme';

const width = Dimensions.get("window").width;
export function CampaignSkeleton({ isDark: propIsDark }: { isDark?: boolean }) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const colors = getColors(isDark);

  return (
    <View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.skeletonLarge,
          {
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      />

      <View
        style={[
          styles.skeletonMedium,
          {
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      />

      <View
        style={[
          styles.skeletonLine,
          {
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      />

      <View
        style={[
          styles.skeletonLine,
          {
            backgroundColor: colors.surfaceSecondary,
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
