import React from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon } from "@/constants/icons";
import * as Haptics from "expo-haptics";

interface FreeToolsCarouselProps {
  isDark: boolean;
  onOpen: (route: string) => void;
  sectionHeader?: React.ReactNode;
}

interface FreeTool {
  id: string;
  name: string;
  desc: string;
  category: string;
  badge: string;
  image: any;
  route: string;
  accent: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
}

const FREE_TOOLS: FreeTool[] = [
  {
    id: "qr",
    name: "QR Generator",
    desc: "Branded QR vectors",
    category: "BRANDING",
    badge: "FREE",
    image: require("../../../assets/icons/QR-code.webp"),
    route: "/tools/qr-code",
    accent: "#8B5CF6",
    bgLight: "#F5EEFF",
    bgDark: "#26163D",
    borderLight: "rgba(139, 92, 246, 0.22)",
    borderDark: "rgba(192, 132, 252, 0.25)",
  },
  {
    id: "links",
    name: "Link Shortener",
    desc: "Short slugs & clicks",
    category: "ANALYTICS",
    badge: "POPULAR",
    image: require("../../../assets/icons/link-shortner.webp"),
    route: "/tools/link-shortener",
    accent: "#0284C7",
    bgLight: "#E8F5FD",
    bgDark: "#10283A",
    borderLight: "rgba(2, 132, 199, 0.22)",
    borderDark: "rgba(56, 189, 248, 0.25)",
  },
  {
    id: "bio",
    name: "Bio Builder",
    desc: "Bio landing pages",
    category: "PAGES",
    badge: "FREE",
    image: require("../../../assets/icons/bio-template.webp"),
    route: "/tools/bio-templates",
    accent: "#DB2777",
    bgLight: "#FDEEF6",
    bgDark: "#331527",
    borderLight: "rgba(236, 72, 153, 0.22)",
    borderDark: "rgba(244, 114, 182, 0.25)",
  },
  {
    id: "forms",
    name: "QuickForms",
    desc: "Lead intake forms",
    category: "FUNNELS",
    badge: "NEW",
    image: require("../../../assets/icons/quick-form.webp"),
    route: "/tools/quick-forms",
    accent: "#059669",
    bgLight: "#E9F9F1",
    bgDark: "#102E20",
    borderLight: "rgba(16, 185, 129, 0.22)",
    borderDark: "rgba(52, 211, 153, 0.25)",
  },
  {
    id: "speech",
    name: "Speech to Text",
    desc: "AI voice streaming",
    category: "AI AUDIO",
    badge: "PRO",
    image: require("../../../assets/icons/ai-speech.webp"),
    route: "/tools/speech-to-text",
    accent: "#7C3AED",
    bgLight: "#F3EEFE",
    bgDark: "#23143B",
    borderLight: "rgba(124, 58, 237, 0.22)",
    borderDark: "rgba(167, 139, 250, 0.25)",
  },
  {
    id: "audit",
    name: "Website Audit",
    desc: "SEO audit scores",
    category: "SEO SCORE",
    badge: "FREE",
    image: require("../../../assets/icons/file-linker.webp"),
    route: "/tools/website-audit",
    accent: "#D97706",
    bgLight: "#FEF7E8",
    bgDark: "#31230B",
    borderLight: "rgba(245, 158, 11, 0.22)",
    borderDark: "rgba(251, 191, 36, 0.25)",
  },
  {
    id: "landing",
    name: "Landing Funnels",
    desc: "Pre-built lead pages",
    category: "TEMPLATES",
    badge: "READY",
    image: require("../../../assets/icons/event-links.webp"),
    route: "/tools/landing-templates",
    accent: "#EA580C",
    bgLight: "#FEF1EA",
    bgDark: "#351A0E",
    borderLight: "rgba(234, 88, 12, 0.22)",
    borderDark: "rgba(251, 146, 60, 0.25)",
  },
];

// Ultra-compact card width
const CARD_WIDTH = 126;

export function FreeToolsCarousel({
  isDark,
  onOpen,
  sectionHeader,
}: FreeToolsCarouselProps) {
  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {sectionHeader && (
        <View style={styles.headerContainer}>{sectionHeader}</View>
      )}

      {/* Carousel */}
      <FlatList
        horizontal
        data={FREE_TOOLS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        snapToInterval={CARD_WIDTH + 8}
        decelerationRate="fast"
        renderItem={({ item }) => {
          return (
            <Pressable
              cssInterop={false}
              onPress={() => {
                triggerHaptic();
                onOpen(item.route);
              }}
              style={({ pressed }) => [
                styles.toolCard,
                {
                  backgroundColor: isDark ? item.bgDark : item.bgLight,
                  borderColor: isDark ? item.borderDark : item.borderLight,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              {/* Top row: Icon + Badge */}
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "#FFFFFF",
                      shadowColor: item.accent,
                    },
                  ]}
                >
                  <Image
                    source={item.image}
                    style={styles.toolIcon}
                    resizeMode="contain"
                  />
                </View>

                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(255, 255, 255, 0.9)",
                      borderColor: isDark ? item.borderDark : item.borderLight,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: item.accent }]}>
                    {item.badge}
                  </Text>
                </View>
              </View>

              {/* Name and description */}
              <View style={styles.cardBottom}>
                <View style={styles.cardTextCol}>
                  <Text
                    style={[
                      styles.toolTitle,
                      { color: isDark ? "#F5F3FF" : "#1A1726" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.toolDesc,
                      { color: isDark ? "#A39CB2" : "#696575" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.desc}
                  </Text>
                </View>

                <View
                  style={[
                    styles.arrowCircle,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "#FFFFFF",
                    },
                  ]}
                >
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={10}
                    color={item.accent}
                    strokeWidth={2.4}
                  />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scrollList: {
    paddingHorizontal: 20,
  },
  separator: {
    width: 8,
  },
  toolCard: {
    width: CARD_WIDTH,
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toolIcon: {
    width: 17,
    height: 17,
  },
  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 7.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cardTextCol: {
    flex: 1,
    marginRight: 4,
  },
  toolTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 1,
    includeFontPadding: false,
  },
  toolDesc: {
    fontSize: 8.5,
    lineHeight: 11,
    includeFontPadding: false,
  },
  arrowCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
});
