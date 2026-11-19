import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View
} from "react-native";

interface ReferralLoadingScreenProps {
  minDurationMs?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function ReferralLoadingScreen({
  minDurationMs = 2400,
}: ReferralLoadingScreenProps) {
  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const badgeFloat = useRef(new Animated.Value(0)).current;

  // Step verification sequence
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: "Verifying your referral invite code", subtitle: "Instant link validation" },
    { title: "Unlocking flat ₹100 cash bonus", subtitle: "Credited for every friend who joins" },
    { title: "Syncing instant bank withdrawal", subtitle: "Direct UPI & bank transfer ready" },
  ];

  useEffect(() => {
    // 1. Phone & items floating bounce (like 3D mockup in Image 1 & 4)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Gentle scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Floating cashback badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeFloat, {
          toValue: -5,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(badgeFloat, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Smooth progress line
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDurationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 5. Progressive step updates
    const stepDuration = Math.floor(minDurationMs / 3);
    const t1 = setTimeout(() => setActiveStep(1), stepDuration);
    const t2 = setTimeout(() => setActiveStep(2), stepDuration * 2);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [minDurationMs]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["4%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#080714", "#120D28", "#0A0818"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Brand Circular Backdrop Arc (Inspired by Image 2) */}
      <View style={styles.backdropArc} />

      {/* Top Header (Inspired by Image 2 clean typography) */}
      <View style={styles.topHeader}>
        <View style={styles.brandPill}>
          <Users size={12} color="#A855F7" />
          <Text style={styles.brandPillText}>GETAIPILOT REFERRALS</Text>
        </View>
        <Text style={styles.headlineMain}>Referral Program</Text>
        <Text style={styles.headlineReward}>
          Earn <Text style={styles.highlightText}>flat ₹100 cash</Text> on every friend!
        </Text>
      </View>

      {/* Centerpiece: 3D Smartphone with Items Popping Out (Inspired by Image 1 & 4) */}
      <View style={styles.mockupStage}>
        {/* Soft Ambient Lavender Glow */}
        <View style={styles.ambientGlow} />

        {/* 3D Phone with Purple Bags & Cash Card popping forward */}
        <Animated.View
          style={[
            styles.mockupWrap,
            {
              transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require("../../../assets/images/referral-3d-ecommerce.gif")}
            style={styles.mockupImage}
            contentFit="contain"
          />

          {/* Floating Reward Pill (popping out like credit card in Image 1) */}
          <Animated.View
            style={[
              styles.floatingRewardBadge,
              {
                transform: [{ translateY: badgeFloat }],
              },
            ]}
          >
            <LinearGradient
              colors={["#9333EA", "#7E22CE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.floatingRewardBadgeInner}
            >
              <Sparkles size={12} color="#FBBF24" />
              <Text style={styles.floatingRewardBadgeText}>Instant ₹100 Bank Payout</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Bottom Live Verification Card (Navi-style steps) */}
      <View style={styles.bottomSection}>
        <View style={styles.verificationCard}>
          {steps.map((step, idx) => {
            const isCompleted = activeStep > idx;
            const isCurrent = activeStep === idx;

            return (
              <View
                key={`step-${idx}`}
                style={[
                  styles.stepRow,
                  idx !== steps.length - 1 && styles.stepRowBorder,
                  isCurrent && styles.stepRowActive,
                ]}
              >
                <View
                  style={[
                    styles.stepIconWrap,
                    isCompleted && styles.stepIconCompleted,
                    isCurrent && styles.stepIconCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={15} color="#10B981" />
                  ) : isCurrent ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <View style={styles.pendingDot} />
                  )}
                </View>

                <View style={styles.stepInfo}>
                  <Text
                    style={[
                      styles.stepTitle,
                      (isCompleted || isCurrent) && styles.stepTitleActive,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                </View>

                <View style={styles.stepBadge}>
                  <Text
                    style={[
                      styles.stepBadgeText,
                      isCompleted && styles.stepBadgeTextCompleted,
                      isCurrent && styles.stepBadgeTextCurrent,
                    ]}
                  >
                    {isCompleted ? "Verified" : isCurrent ? "Processing..." : "Queued"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Smooth Purple-to-Amber Progress Track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]}>
            <LinearGradient
              colors={["#A855F7", "#F59E0B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Trust Footer */}
        <View style={styles.trustRow}>
          <ShieldCheck size={13} color="#10B981" />
          <Text style={styles.trustText}>
            Direct Bank & UPI Transfer • Zero Withdrawal Fee
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#080714",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9999,
    paddingTop: 48,
    paddingBottom: 32,
  },
  backdropArc: {
    position: "absolute",
    top: -90,
    width: SCREEN_WIDTH * 1.35,
    height: SCREEN_WIDTH * 1.35,
    borderRadius: (SCREEN_WIDTH * 1.35) / 2,
    backgroundColor: "rgba(126, 34, 206, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(168, 85, 247, 0.12)",
  },
  topHeader: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: "rgba(147, 51, 234, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.28)",
    marginBottom: 10,
  },
  brandPillText: {
    color: "#C084FC",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  headlineMain: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  headlineReward: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  highlightText: {
    color: "#FBBF24",
    fontWeight: "800",
  },
  mockupStage: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
    marginVertical: 10,
  },
  ambientGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(147, 51, 234, 0.18)",
  },
  mockupWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mockupImage: {
    width: 250,
    height: 270,
  },
  floatingRewardBadge: {
    position: "absolute",
    bottom: 12,
    zIndex: 15,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingRewardBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  floatingRewardBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
    zIndex: 10,
  },
  verificationCard: {
    width: "100%",
    backgroundColor: "rgba(18, 14, 38, 0.72)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  stepRowActive: {
    backgroundColor: "rgba(168, 85, 247, 0.05)",
    borderRadius: 8,
  },
  stepIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepIconCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  stepIconCurrent: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#F59E0B",
  },
  pendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    color: "#64748B",
    fontSize: 12.5,
    fontWeight: "600",
  },
  stepTitleActive: {
    color: "#F1F5F9",
  },
  stepSubtitle: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "400",
    marginTop: 1,
  },
  stepBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  stepBadgeTextCompleted: {
    color: "#10B981",
  },
  stepBadgeTextCurrent: {
    color: "#F59E0B",
  },
  progressTrack: {
    width: "100%",
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2.5,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
});
