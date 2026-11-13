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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HOME_SPACING } from "@/theme/homeTokens";

interface FiveProductsSectionProps {
  isDark: boolean;
  onOpen: (route: string) => void;
  sectionHeader?: React.ReactNode;
  activeSubscriptions?: {
    telegram?: boolean;
    whatsapp?: boolean;
    voice?: boolean;
    crm?: boolean;
    social?: boolean;
  };
}

interface ProductEngine {
  id: string;
  name: string;
  badge: string;
  image: any;
  route: string;
  accent: string;
  gradientLight: readonly [string, string];
  gradientDark: readonly [string, string];
  borderLight: string;
  borderDark: string;
  shadowColor: string;
}

const FIVE_PRODUCTS: ProductEngine[] = [
  {
    id: "telegram",
    name: "Telegram",
    badge: "Bot Hub",
    image: require("../../../assets/images/products/telegram.webp"),
    route: "/products/telegram",
    accent: "#0284C7",
    gradientLight: ["#E7F7FC", "#CEF0FA"],
    gradientDark: ["#0E2A38", "#071A24"],
    borderLight: "rgba(2, 132, 199, 0.25)",
    borderDark: "rgba(56, 189, 248, 0.32)",
    shadowColor: "#0284C7",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    badge: "Inbox",
    image: require("../../../assets/images/products/whatsapp.webp"),
    route: "/products/whatsapp",
    accent: "#10B981",
    gradientLight: ["#EDFDF5", "#D1FAE5"],
    gradientDark: ["#062E1F", "#031C13"],
    borderLight: "rgba(16, 185, 129, 0.25)",
    borderDark: "rgba(52, 211, 153, 0.32)",
    shadowColor: "#10B981",
  },
  {
    id: "social",
    name: "Social",
    badge: "Schedule",
    image: require("../../../assets/images/products/social.webp"),
    route: "/products/social",
    accent: "#EC4899",
    gradientLight: ["#FDF2F8", "#FCE7F3"],
    gradientDark: ["#381128", "#230818"],
    borderLight: "rgba(236, 72, 153, 0.25)",
    borderDark: "rgba(244, 114, 182, 0.32)",
    shadowColor: "#EC4899",
  },
  {
    id: "voice",
    name: "Voice AI",
    badge: "Calling",
    image: require("../../../assets/images/products/voice.webp"),
    route: "/products/voice",
    accent: "#8B5CF6",
    gradientLight: ["#F5F3FF", "#EDE9FE"],
    gradientDark: ["#28164C", "#180B32"],
    borderLight: "rgba(139, 92, 246, 0.25)",
    borderDark: "rgba(167, 139, 250, 0.32)",
    shadowColor: "#8B5CF6",
  },
  {
    id: "crm",
    name: "CRM",
    badge: "Pipelines",
    image: require("../../../assets/images/products/crm.webp"),
    route: "/products/crm",
    accent: "#F59E0B",
    gradientLight: ["#FFFBEB", "#FEF3C7"],
    gradientDark: ["#3A2209", "#241404"],
    borderLight: "rgba(245, 158, 11, 0.25)",
    borderDark: "rgba(251, 191, 36, 0.32)",
    shadowColor: "#F59E0B",
  },
];

export function FiveProductsSection({
  isDark,
  onOpen,
  sectionHeader,
}: FiveProductsSectionProps) {
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  // Responsive calculation: Fit all 5 cards in 1 row with prominent large icons
  const totalPadding = Math.min(32, Math.max(24, Math.round(windowWidth * 0.07)));
  const totalGaps = 18; // 4 * 4.5px
  const itemWidth = Math.floor((windowWidth - totalPadding - totalGaps) / 5);
  const itemHeight = Math.round(itemWidth * 1.26);
  // Large prominent 3D icon size: 48px to 54px (fills ~74% of card width)
  const iconSize = Math.round(itemWidth * 0.74);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header aligned to 16px margin */}
      {sectionHeader && (
        <View style={styles.headerContainer}>{sectionHeader}</View>
      )}

      {/* Single Non-Scrolling Row fitting all 5 products with LARGE 3D icons */}
      <View style={styles.rowContainer}>
        {FIVE_PRODUCTS.map((item) => {
          const borderColor = isDark ? item.borderDark : item.borderLight;
          const gradientColors = isDark ? item.gradientDark : item.gradientLight;

          return (
            <View key={item.id} style={[styles.cardWrapper, { width: itemWidth }]}>
              <Pressable
                cssInterop={false}
                onPress={() => {
                  triggerHaptic();
                  onOpen(item.route);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                style={({ pressed }) => [
                  styles.productCard,
                  {
                    width: itemWidth,
                    height: itemHeight,
                    borderColor: borderColor,
                    shadowColor: item.shadowColor,
                    shadowOpacity: isDark ? 0.38 : 0.14,
                    transform: [{ scale: pressed && !reducedMotion ? 0.97 : 1 }],
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                {/* 1. Multi-Stop 3D Gradient Surface */}
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* 2. Top Specular Glass Reflection */}
                <LinearGradient
                  colors={
                    isDark
                      ? ["rgba(255, 255, 255, 0.16)", "transparent"]
                      : ["rgba(255, 255, 255, 0.75)", "transparent"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.6, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                {/* 3. Large Prominent 3D Product Icon as Focus Element */}
                <View style={styles.iconContainer}>
                  <Image
                    source={item.image}
                    style={{ width: iconSize, height: iconSize }}
                    resizeMode="contain"
                  />
                </View>

                {/* 4. Clean Title at Bottom */}
                <Text
                  style={[
                    styles.productName,
                    { color: isDark ? "#F5F3FF" : "#1A1726" },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: HOME_SPACING.lg,
  },
  headerContainer: {
    paddingHorizontal: HOME_SPACING.md,
    marginBottom: HOME_SPACING.sm,
  },
  rowContainer: {
    paddingHorizontal: HOME_SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardWrapper: {
    position: "relative",
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    paddingTop: 8,
    paddingBottom: 7,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  iconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 2,
    zIndex: 2,
  },
  productName: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
    includeFontPadding: false,
    zIndex: 2,
    marginBottom: 1,
  },
});
