import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "@/constants/icons";
import * as Haptics from "expo-haptics";

interface FreeToolsUsageSectionProps {
  isDark: boolean;
  onOpen: (route: string) => void;
  telemetry?: {
    pagesCount?: number;
    landingPagesCount?: number;
    quickFormsCount?: number;
    shortLinksCount?: number;
  };
  sectionHeader?: React.ReactNode;
}

export function FreeToolsUsageSection({
  isDark,
  onOpen,
  telemetry,
  sectionHeader,
}: FreeToolsUsageSectionProps) {
  const { width: windowWidth } = useWindowDimensions();
  // 40 for left+right padding (20 + 20), 10 for space between 2 columns
  const cardWidth = Math.floor((windowWidth - 40 - 10) / 2);

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const pagesCount = telemetry?.pagesCount ?? telemetry?.landingPagesCount ?? 0;
  const formsCount = telemetry?.quickFormsCount ?? 0;
  const linksCount = telemetry?.shortLinksCount ?? 0;

  const usageCards = [
    {
      id: "pages",
      title: "Landing & Bio Pages",
      count: pagesCount,
      countLabel: "created",
      desc: "Bio sites, funnels & landing pages",
      image: require("../../../assets/icons/my-design.webp"),
      route: "/tools/my-designs",
      accent: "#8B5CF6",
      bgLight: "#FAF5FF",
      bgDark: "#22133B",
      borderLight: "rgba(139, 92, 246, 0.2)",
      borderDark: "rgba(192, 132, 252, 0.22)",
      actionText: "Manage",
    },
    {
      id: "forms",
      title: "QuickForms Funnels",
      count: formsCount,
      countLabel: "active",
      desc: "Lead capture & intake forms",
      image: require("../../../assets/icons/quick-form.webp"),
      route: "/tools/quick-forms",
      accent: "#059669",
      bgLight: "#F0FDF4",
      bgDark: "#102B1E",
      borderLight: "rgba(16, 185, 129, 0.2)",
      borderDark: "rgba(52, 211, 153, 0.22)",
      actionText: "Manage",
    },
    {
      id: "links",
      title: "Short Links & Slugs",
      count: linksCount,
      countLabel: "generated",
      desc: "Branded URLs with click analytics",
      image: require("../../../assets/icons/link-shortner.webp"),
      route: "/tools/link-shortener",
      accent: "#0284C7",
      bgLight: "#F0F9FF",
      bgDark: "#0E2435",
      borderLight: "rgba(2, 132, 199, 0.2)",
      borderDark: "rgba(56, 189, 248, 0.22)",
      actionText: "Manage",
    },
    {
      id: "qr",
      title: "Branded QR Codes",
      count: "Ready",
      countLabel: "unlimited",
      desc: "Custom vectors & trackable scans",
      image: require("../../../assets/icons/QR-code.webp"),
      route: "/tools/qr-code",
      accent: "#D97706",
      bgLight: "#FFFBEB",
      bgDark: "#2E1F09",
      borderLight: "rgba(245, 158, 11, 0.2)",
      borderDark: "rgba(251, 191, 36, 0.22)",
      actionText: "Create",
    },
  ];

  return (
    <View style={styles.container}>
      {sectionHeader && (
        <View style={styles.headerContainer}>{sectionHeader}</View>
      )}

      {/* Grid of 4 Tool Usage Cards with fixed pixel width per column */}
      <View style={styles.cardsGrid}>
        {usageCards.map((card) => {
          return (
            <Pressable
              key={card.id}
              cssInterop={false}
              onPress={() => {
                triggerHaptic();
                onOpen(card.route);
              }}
              style={({ pressed }) => [
                styles.usageCard,
                {
                  width: cardWidth,
                  backgroundColor: isDark ? card.bgDark : card.bgLight,
                  borderColor: isDark ? card.borderDark : card.borderLight,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "#FFFFFF",
                    },
                  ]}
                >
                  <Image
                    source={card.image}
                    style={styles.cardIcon}
                    resizeMode="contain"
                  />
                </View>

                {/* Counter Badge */}
                <View
                  style={[
                    styles.metricBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "#FFFFFF",
                      borderColor: isDark ? card.borderDark : card.borderLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.metricCount,
                      { color: card.accent },
                    ]}
                  >
                    {card.count}
                  </Text>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: isDark ? "#A39CB2" : "#696575" },
                    ]}
                  >
                    {card.countLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#F5F3FF" : "#1A1726" },
                  ]}
                  numberOfLines={1}
                >
                  {card.title}
                </Text>
                <Text
                  style={[
                    styles.cardDesc,
                    { color: isDark ? "#A39CB2" : "#696575" },
                  ]}
                  numberOfLines={1}
                >
                  {card.desc}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text
                  style={[
                    styles.actionText,
                    { color: card.accent },
                  ]}
                >
                  {card.actionText}
                </Text>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={12}
                  color={card.accent}
                  strokeWidth={2.4}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Free Tier Status / Health Banner */}
      <View style={styles.headerContainer}>
        <View
          style={[
            styles.tierBanner,
            {
              backgroundColor: isDark ? "#1C1929" : "#FFFFFF",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
            },
          ]}
        >
          <View style={styles.tierBannerLeft}>
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={18}
              color="#10B981"
              strokeWidth={2.4}
            />
            <View style={styles.tierBannerTextWrapper}>
              <Text
                style={[
                  styles.tierBannerTitle,
                  { color: isDark ? "#F5F3FF" : "#1A1726" },
                ]}
              >
                Free Tools Quota Active
              </Text>
              <Text
                style={[
                  styles.tierBannerSub,
                  { color: isDark ? "#A39CB2" : "#696575" },
                ]}
              >
                Enjoy high-speed access to all free creation and utility engines.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  cardsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  usageCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
    justifyContent: "space-between",
    minHeight: 132,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIcon: {
    width: 24,
    height: 24,
  },
  metricBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  metricCount: {
    fontSize: 12,
    fontWeight: "800",
    marginRight: 4,
    includeFontPadding: false,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: "500",
    includeFontPadding: false,
  },
  cardContent: {
    marginTop: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 2,
    includeFontPadding: false,
  },
  cardDesc: {
    fontSize: 10,
    lineHeight: 13,
    includeFontPadding: false,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "700",
    marginRight: 3,
    includeFontPadding: false,
  },
  tierBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tierBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tierBannerTextWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  tierBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  tierBannerSub: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 1,
    includeFontPadding: false,
  },
});
