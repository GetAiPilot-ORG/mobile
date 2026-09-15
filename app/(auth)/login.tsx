import { AppScreen } from "@/components/AppScreen";
import { NetworkStatusScreen } from "@/components/StatusScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthSkeleton } from "../../src/components/skeletonScreen/AuthSkeletonScreen";
import { useNetwork } from "../../src/contexts/NetworkContext";
import { useAuthStore } from "../../src/core/store/authStore";
import { supabase } from "../../src/lib/supabase";
import { isValidEmail } from "../../src/lib/validators";

const REMEMBER_ME_KEY = "@gap_remember_me";
const SAVE_LOGIN_KEY = "@gap_saved_identifier";
const brandLogo = require("../../assets/images/logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
    identifier.trim().length > 0 && (authMode === "otp" || password.length > 0);

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
    <View className="flex-1 bg-[#0B0D10]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-6 justify-center max-w-[500px] w-full self-center"
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 16, 44),
            paddingBottom: Math.max(insets.bottom + 24, 32),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Logo Section */}
          <View className="items-center mb-6">
            <View className="w-[92px] h-[92px] rounded-full overflow-hidden bg-[#181A1F] border border-[#262930] shadow-lg shadow-purple-500/20">
              <Image
                source={brandLogo}
                className="w-full h-full rounded-full"
                contentFit="cover"
                transition={200}
              />
            </View>
          </View>

          {/* Heading */}
          <Text className="text-2xl font-extrabold text-white text-center leading-8 tracking-tight mb-7">
            Log in with your phone{"\n"}number or account
          </Text>

          {/* Inline Feedback Banner */}
          {feedback && (
            <View
              className={`py-2.5 px-3.5 rounded-xl mb-4.5 ${
                feedback.type === "error"
                  ? "bg-red-500/15 border border-red-500/30"
                  : "bg-emerald-500/15 border border-emerald-500/30"
              }`}
            >
              <Text
                className={`text-xs font-semibold text-center leading-5 ${
                  feedback.type === "error" ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Grouped Input Fields Card */}
          <View className="bg-[#181A1F] border border-[#262930] rounded-2xl overflow-hidden mb-4">
            {/* Field 1: Phone / Email */}
            <View className="flex-row items-center px-4 min-h-[52px]">
              <TextInput
                className="flex-1 text-base font-normal text-white py-3.5"
                placeholder="Phone number or email"
                placeholderTextColor="#636366"
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
                  className="w-5 h-5 rounded-full bg-slate-700 justify-center items-center ml-2"
                >
                  <Text className="text-[10px] text-slate-300 font-extrabold">✕</Text>
                </Pressable>
              )}
            </View>

            {/* Hairline Divider */}
            {authMode === "password" && (
              <View className="h-[1px] bg-[#262930] ml-4" />
            )}

            {/* Field 2: Password */}
            {authMode === "password" && (
              <View className="flex-row items-center px-4 min-h-[52px]">
                <TextInput
                  className="flex-1 text-base font-normal text-white py-3.5"
                  placeholder="Password"
                  placeholderTextColor="#636366"
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
                    className="px-2 py-1.5"
                  >
                    <Text className="text-xs font-semibold text-slate-400">
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Save Login Info Checkbox Row */}
          <Pressable
            className="flex-row items-center mb-5 gap-2.5"
            onPress={handleToggleSaveLogin}
            hitSlop={6}
          >
            <View
              className={`w-5 h-5 rounded-md border-[1.8px] justify-center items-center ${
                saveLoginInfo
                  ? "bg-[#0084FF] border-[#0084FF]"
                  : "border-slate-600 bg-transparent"
              }`}
            >
              {saveLoginInfo && <Text className="text-white text-xs font-black">✓</Text>}
            </View>
            <Text className="text-sm font-medium text-slate-400">
              Save login info
            </Text>
          </Pressable>

          {/* Primary Action Button */}
          <Pressable
            className={`py-4 rounded-full items-center justify-center mb-3 shadow-md shadow-blue-500/20 ${
              !isFormValid
                ? "bg-[#181A1F] border border-[#262930]"
                : "bg-[#0084FF]"
            } ${loading ? "opacity-80" : ""}`}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                className={`text-base font-bold tracking-tight ${
                  !isFormValid ? "text-slate-500" : "text-white"
                }`}
              >
                Log in
              </Text>
            )}
          </Pressable>

          {/* Secondary Action Button */}
          <Pressable
            className="bg-[#181A1F] border border-[#262930] py-4 rounded-full items-center justify-center mb-6"
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/signup" as any);
            }}
          >
            <Text className="text-white text-base font-bold tracking-tight">
              Create new account
            </Text>
          </Pressable>

          {/* Footer Action Links */}
          <View className="items-center gap-3.5">
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/forgot-password" as any);
              }}
              hitSlop={8}
            >
              <Text className="text-[#0084FF] text-[15px] font-semibold tracking-tight">
                Forgot password?
              </Text>
            </Pressable>

            <Pressable
              className="py-1.5 px-3"
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                setAuthMode(authMode === "password" ? "otp" : "password");
                setFeedback(null);
              }}
              hitSlop={8}
            >
              <Text className="text-xs text-slate-400 font-medium">
                {authMode === "password"
                  ? "Sign in with Magic Link / OTP"
                  : "Sign in with Password"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

