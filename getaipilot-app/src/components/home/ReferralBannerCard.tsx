import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon, GiftIcon } from "@/constants/icons";
import * as Haptics from "expo-haptics";

interface ReferralBannerCardProps {
  isDark: boolean;
  onPress: () => void;
}

export function ReferralBannerCard({
  isDark,
  onPress,
}: ReferralBannerCardProps) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <View style={styles.outerContainer}>
      <Pressable
        cssInterop={false}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Refer and Earn ₹100 cash"
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDark ? "#17231E" : "#EBF7F0",
            borderColor: isDark
              ? "rgba(16, 185, 129, 0.25)"
              : "rgba(16, 185, 129, 0.2)",
            transform: [{ scale: pressed ? 0.985 : 1 }],
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        {/* Soft background gradient */}
        <LinearGradient
          colors={
            isDark
              ? ["rgba(16, 185, 129, 0.14)", "rgba(23, 35, 30, 0)"]
              : ["rgba(255, 255, 255, 0.6)", "rgba(235, 247, 240, 0)"]
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.contentRow}>
          {/* Left Text details */}
          <View style={styles.textContainer}>
            <View
              style={[
                styles.tag,
                {
                  backgroundColor: isDark
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(16, 185, 129, 0.12)",
                },
              ]}
            >
              <HugeiconsIcon
                icon={GiftIcon}
                size={11}
                color="#10B981"
                strokeWidth={2.4}
              />
              <Text style={styles.tagText}>REFER & EARN CASH</Text>
            </View>

            <Text
              style={[
                styles.title,
                { color: isDark ? "#F5F3FF" : "#1A1726" },
              ]}
            >
              Invite Friends &{"\n"}Earn ₹100 Cash
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: isDark ? "#A39CB2" : "#696575" },
              ]}
            >
              Get ₹100 direct cash into your UPI account for every friend who joins.
            </Text>

            <View style={styles.buttonRow}>
              <View
                style={[
                  styles.ctaButton,
                  {
                    backgroundColor: isDark ? "#10B981" : "#0D1E16",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ctaText,
                    { color: isDark ? "#06281B" : "#FFFFFF" },
                  ]}
                >
                  Start Earning
                </Text>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color={isDark ? "#06281B" : "#FFFFFF"}
                  strokeWidth={2.4}
                />
              </View>
            </View>
          </View>

          {/* Right Visual Stack with Circular Badge */}
          <View style={styles.visualContainer}>
            {/* Circular Badge inspired by the user's reference mockup */}
            <View
              style={[
                styles.circularBadge,
                {
                  backgroundColor: isDark ? "#10B981" : "#1B3B2B",
                  shadowColor: "#10B981",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeAmount,
                  { color: isDark ? "#06281B" : "#A7F3D0" },
                ]}
              >
                ₹100
              </Text>
              <Text
                style={[
                  styles.badgeSub,
                  { color: isDark ? "#06281B" : "#FFFFFF" },
                ]}
              >
                INSTANT
              </Text>
            </View>

            <Image
              source={require("../../../assets/images/money.webp")}
              style={styles.moneyImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    position: "relative",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 2,
  },
  textContainer: {
    flex: 1.3,
    paddingRight: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
    marginLeft: 4,
    includeFontPadding: false,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 5,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
    includeFontPadding: false,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    marginRight: 6,
    includeFontPadding: false,
  },
  visualContainer: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circularBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeAmount: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: -0.2,
    lineHeight: 13,
    includeFontPadding: false,
  },
  badgeSub: {
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
  moneyImage: {
    width: 92,
    height: 92,
    marginTop: 10,
  },
});
