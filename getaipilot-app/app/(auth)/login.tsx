import {
  AppScreen
} from "@/components/AppScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  useEffect,
  useState
} from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthSkeleton } from "../../src/components/skeletonScreen/AuthSkeletonScreen";
import { PhoneInputField } from "../../src/components/auth/PhoneInputField";
import { WhatsAppOtpVerification } from "../../src/components/auth/WhatsAppOtpVerification";
import { useNetwork } from "../../src/contexts/NetworkContext";
import { useAuthStore } from "../../src/core/store/authStore";
import { sendWhatsAppOtp, verifyWhatsAppOtp } from "../../src/lib/phoneAuthService";
import { supabase } from "../../src/lib/supabase";
import { isValidEmail } from "../../src/lib/validators";

const REMEMBER_ME_KEY = "@gap_remember_me";
const SAVE_LOGIN_KEY = "@gap_saved_identifier";
const brandLogo = require("../../assets/images/icon.webp");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const login = useAuthStore((s) => s.login);
  const syncSession = useAuthStore((s) => s.syncSession);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [saveLoginInfo, setSaveLoginInfo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const { isOnline, networkChecked, refresh, isChecking } = useNetwork();

  // Load saved login info on mount
  useEffect(() => {
    (async () => {
      try {
        const savedEnabled = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        if (savedEnabled !== null) {
          setSaveLoginInfo(savedEnabled === "true");
        }
        if (savedEnabled !== "false") {
          const savedEmail = await AsyncStorage.getItem(SAVE_LOGIN_KEY);
          if (savedEmail) {
            setIdentifier(savedEmail);
          }
        }
      } catch { }
    })();
  }, []);



  const triggerHaptic = (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
  ) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const handleToggleSaveLogin = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const nextState = !saveLoginInfo;
    setSaveLoginInfo(nextState);
    AsyncStorage.setItem(REMEMBER_ME_KEY, String(nextState)).catch(() => { });
    if (!nextState) {
      AsyncStorage.removeItem(SAVE_LOGIN_KEY).catch(() => { });
    }
  };

  const isFormValid =
    authMethod === "phone"
      ? isPhoneValid
      : identifier.trim().length > 0 && (authMode === "otp" || password.length > 0);

  const handleSendPhoneOtp = async () => {
    Keyboard.dismiss();
    setFeedback(null);

    if (!isPhoneValid || !normalizedPhone) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: "error",
        message: "Please enter a valid phone number.",
      });
      return;
    }

    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const res = await sendWhatsAppOtp(normalizedPhone, { mode: "login" });
    setLoading(false);

    if (!res.success) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: "error",
        message: res.error || "Failed to send verification code. Please try again.",
      });
    } else {
      setOtpSent(true);
      setFeedback(null);
    }
  };

  const handleVerifyPhoneOtp = async (code: string) => {
    Keyboard.dismiss();
    setFeedback(null);
    setLoading(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const res = await verifyWhatsAppOtp(normalizedPhone, code);
    if (!res.success) {
      setLoading(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: "error",
        message: res.error || "Invalid verification code. Please try again.",
      });
      return;
    }

    try {
      if (res.session) {
        await syncSession(res.session);
      }
      setLoading(false);
      const isOnboarded = useAuthStore.getState().onboardingCompleted;
      if (isOnboarded === false) {
        router.replace("/onboarding" as any);
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setLoading(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: "error",
        message: err?.message || "Failed to complete sign in. Please try again.",
      });
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setFeedback(null);
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback({
        type: "error",
        message: "Please enter your phone number or email.",
      });
      return;
    }

    if (authMode === "password") {
      if (!password) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({ type: "error", message: "Please enter your password." });
        return;
      }

      setLoading(true);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      try {
        await login(cleanIdentifier, password);
        router.replace("/(tabs)");
      } catch (err: any) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({
          type: "error",
          message:
            err.message || "Incorrect email or password. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Magic Link / OTP Mode
      if (!isValidEmail(cleanIdentifier)) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({
          type: "error",
          message: "Please enter a valid email address for Magic Link.",
        });
        return;
      }

      setLoading(true);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanIdentifier,
          options: {
            emailRedirectTo: "getaipilot://auth/callback",
          },
        });

        if (error) throw error;
        setFeedback({
          type: "success",
          message:
            "Magic login link sent to your inbox! Check your email to sign in.",
        });
      } catch (err: any) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        setFeedback({
          type: "error",
          message: err.message || "Failed to send magic link.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!networkChecked) {
    return (
      <AppScreen safeArea={true}>
        <AuthSkeleton />
      </AppScreen>
    );
  }

  if (!isOnline) {
    return (
      <AppScreen safeArea={false}>
        <NetworkStatusScreen
          onRetry={refresh}
          isChecking={isChecking}
        />
      </AppScreen>
    );
  }
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 16, 44),
              paddingBottom: Math.max(insets.bottom + 24, 32),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={brandLogo}
                style={styles.logoImage}
                contentFit="contain"
                transition={200}
              />
            </View>
          </View>

          {/* Heading */}
          <Text style={[styles.heading, isDark && styles.headingDark]}>
            Welcome back
          </Text>

          {/* Inline Feedback Banner */}
          {feedback && (
            <View
              style={[
                styles.feedbackBanner,
                feedback.type === "error"
                  ? styles.feedbackBannerError
                  : styles.feedbackBannerSuccess,
              ]}
            >
              <Text
                style={[
                  styles.feedbackBannerText,
                  feedback.type === "error"
                    ? styles.feedbackErrorText
                    : styles.feedbackSuccessText,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Authentication Method Selector: [ Email ] [ WhatsApp ] */}
          {!otpSent && (
            <View style={[styles.methodSwitcher, isDark && styles.methodSwitcherDark]}>
              <Pressable
                style={[
                  styles.methodTab,
                  authMethod === "email" &&
                    (isDark ? styles.methodTabActiveDark : styles.methodTabActive),
                ]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setAuthMethod("email");
                  setFeedback(null);
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={15}
                  color={
                    authMethod === "email"
                      ? isDark
                        ? "#FFFFFF"
                        : "#17171C"
                      : isDark
                      ? "#9CA3AF"
                      : "#6B7280"
                  }
                />
                <Text
                  style={[
                    styles.methodTabText,
                    isDark && styles.methodTabTextDark,
                    authMethod === "email" &&
                      (isDark ? styles.methodTabTextActiveDark : styles.methodTabTextActive),
                  ]}
                >
                  Email
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.methodTab,
                  authMethod === "phone" &&
                    (isDark ? styles.methodTabActiveDark : styles.methodTabActive),
                ]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  setAuthMethod("phone");
                  setFeedback(null);
                }}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={15}
                  color={
                    authMethod === "phone"
                      ? "#059669"
                      : isDark
                      ? "#9CA3AF"
                      : "#6B7280"
                  }
                />
                <Text
                  style={[
                    styles.methodTabText,
                    isDark && styles.methodTabTextDark,
                    authMethod === "phone" &&
                      (isDark ? styles.methodTabTextActiveDark : styles.methodTabTextActive),
                  ]}
                >
                  WhatsApp OTP
                </Text>
              </Pressable>
            </View>
          )}

          {otpSent ? (
            <WhatsAppOtpVerification
              phone={normalizedPhone}
              onVerify={handleVerifyPhoneOtp}
              onResend={handleSendPhoneOtp}
              onChangePhone={() => {
                setOtpSent(false);
                setFeedback(null);
              }}
              loading={loading}
              isDark={isDark}
              buttonLabel="Verify & Log in"
            />
          ) : authMethod === "phone" ? (
            <>
              <View style={{ marginBottom: 10 }}>
                <PhoneInputField
                  value={phoneRaw}
                  onChange={(raw, normalized, isValid) => {
                    setPhoneRaw(raw);
                    setNormalizedPhone(normalized);
                    setIsPhoneValid(isValid);
                    if (feedback) setFeedback(null);
                  }}
                  disabled={loading}
                  isDark={isDark}
                  placeholderColor={colors.inputPlaceholder}
                  onSubmitEditing={handleSendPhoneOtp}
                />
              </View>

              <View style={styles.whatsappHintRow}>
                <Ionicons
                  name="logo-whatsapp"
                  size={14}
                  color={isDark ? "#34D399" : "#059669"}
                />
                <Text style={[styles.whatsappHintText, isDark && styles.whatsappHintTextDark]}>
                  We'll send a 6-digit verification code to your WhatsApp.
                </Text>
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  !isPhoneValid && styles.primaryButtonDisabled,
                  loading && { opacity: 0.8 },
                ]}
                onPress={handleSendPhoneOtp}
                disabled={!isPhoneValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      !isPhoneValid && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    Continue with WhatsApp
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
          {/* Grouped iOS Input Fields Card */}
          <View style={[styles.inputGroup, isDark && styles.inputGroupDark]}>
            {/* Field 1: Phone / Email */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.nativeInput, isDark && styles.nativeInputDark]}
                placeholder="Phone number or email"
                placeholderTextColor={colors.inputPlaceholder}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
              {identifier.length > 0 && (
                <Pressable
                  onPress={() => setIdentifier("")}
                  hitSlop={10}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
                </Pressable>
              )}
            </View>

            {/* Hairline Divider */}
            {authMode === "password" && (
              <View
                style={[
                  styles.hairlineDivider,
                  isDark && styles.hairlineDividerDark,
                ]}
              />
            )}

            {/* Field 2: Password */}
            {authMode === "password" && (
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.nativeInput,
                    { flex: 1 },
                    isDark && styles.nativeInputDark,
                  ]}
                  placeholder="Password"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                {password.length > 0 && (
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    style={styles.eyeBtn}
                  >
                    <Text
                      style={[
                        styles.eyeBtnText,
                        isDark && styles.eyeBtnTextDark,
                      ]}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Save Login Info Checkbox Row */}
          <Pressable
            style={styles.saveLoginRow}
            onPress={handleToggleSaveLogin}
            hitSlop={6}
          >
            <View
              style={[
                styles.checkbox,
                saveLoginInfo && styles.checkboxActive,
                isDark && !saveLoginInfo && styles.checkboxDark,
              ]}
            >
              {saveLoginInfo && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
            </View>
            <Text
              style={[styles.saveLoginText, isDark && styles.saveLoginTextDark]}
            >
              Save login info
            </Text>
          </Pressable>

          {/* Primary Action Button ("Log in") */}
          <Pressable
            style={[
              styles.primaryButton,
              !isFormValid && styles.primaryButtonDisabled,
              loading && { opacity: 0.8 },
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.primaryButtonText,
                  !isFormValid && styles.primaryButtonTextDisabled,
                ]}
              >
                Log in
              </Text>
            )}
          </Pressable>
            </>
          )}

          {/* Secondary Action Button ("Create new account") */}
          <Pressable
            style={[
              styles.secondaryButton,
              isDark && styles.secondaryButtonDark,
            ]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/signup" as any);
            }}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                isDark && styles.secondaryButtonTextDark,
              ]}
            >
              Create new account
            </Text>
          </Pressable>

          {/* Footer Action Links: Forgot Password & Magic Link toggle */}
          <View style={styles.footerSection}>
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/forgot-password" as any);
              }}
              hitSlop={8}
            >
              <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
            </Pressable>

            {/* Subtle OTP / Magic link mode toggle */}
            <Pressable
              style={styles.otpToggleBtn}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                setAuthMode(authMode === "password" ? "otp" : "password");
                setFeedback(null);
              }}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.otpToggleText,
                  isDark && styles.otpToggleTextDark,
                ]}
              >
                {authMode === "password"
                  ? "Sign in with Magic Link / OTP"
                  : "Sign in with Password"}
              </Text>
            </Pressable>

            {/* Explore App Tour link */}
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8 }}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                router.push("/welcome" as any);
              }}
              hitSlop={8}
            >
              <Ionicons name="compass-outline" size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: "600",
                  color: colors.textSecondary,
                }}
              >
                Explore App Tour
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FB",
  },
  containerDark: {
    backgroundColor: "#14131B",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "stretch",
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },
  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  logoWrapperDark: {
    backgroundColor: "transparent",
  },
  logoImage: {
    width: 80,
    height: 80,
    backgroundColor: "transparent",
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    lineHeight: 31,
    letterSpacing: -0.6,
    marginBottom: 28,
  },
  headingDark: {
    color: "#FFFFFF",
  },
  feedbackBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    marginBottom: 18,
  },
  feedbackBannerError: {
    backgroundColor: "#FEE2E2",
  },
  feedbackBannerSuccess: {
    backgroundColor: "#DCFCE7",
  },
  feedbackBannerText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  feedbackErrorText: {
    color: "#DC2626",
  },
  feedbackSuccessText: {
    color: "#16A34A",
  },
  inputGroup: {
    backgroundColor: "#F0EEF8",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  inputGroupDark: {
    backgroundColor: "#252230",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 52,
  },
  nativeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    paddingVertical: 14,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  nativeInputDark: {
    color: "#FFFFFF",
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E9E6F2",
    marginLeft: 16,
  },
  hairlineDividerDark: {
    backgroundColor: "#3A3549",
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  clearBtnText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "600",
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  eyeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  eyeBtnTextDark: {
    color: "#777383",
  },
  saveLoginRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: "#777383",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDark: {
    borderColor: "#4B5563",
  },
  checkboxActive: {
    backgroundColor: "#17171C",
    borderColor: "#17171C",
  },
  checkmarkIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  saveLoginText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
  },
  saveLoginTextDark: {
    color: "#777383",
  },
  primaryButton: {
    backgroundColor: "#17171C",
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#17171C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: "#F0EEF8",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  primaryButtonTextDisabled: {
    color: "#777383",
  },
  secondaryButton: {
    backgroundColor: "#F0EEF8",
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  secondaryButtonDark: {
    backgroundColor: "#252230",
  },
  secondaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  secondaryButtonTextDark: {
    color: "#FFFFFF",
  },
  footerSection: {
    alignItems: "center",
    gap: 14,
  },
  forgotPasswordLink: {
    color: "#17171C",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  otpToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  otpToggleText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  otpToggleTextDark: {
    color: "#777383",
  },
  methodSwitcher: {
    flexDirection: "row",
    backgroundColor: "#EAE7F5",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  methodSwitcherDark: {
    backgroundColor: "#1F1C29",
  },
  methodTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  methodTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  methodTabActiveDark: {
    backgroundColor: "#2C283A",
  },
  methodTabText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#6B7280",
  },
  methodTabTextDark: {
    color: "#9CA3AF",
  },
  methodTabTextActive: {
    color: "#17171C",
    fontWeight: "600",
  },
  methodTabTextActiveDark: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  whatsappHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  whatsappHintText: {
    fontSize: 12.5,
    color: "#6B7280",
    flex: 1,
  },
  whatsappHintTextDark: {
    color: "#9CA3AF",
  },
});
