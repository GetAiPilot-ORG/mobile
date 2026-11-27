import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getRemainingCooldown } from "../../lib/phoneAuthService";
import { maskPhoneDisplay } from "../../lib/phoneUtils";

interface WhatsAppOtpVerificationProps {
  phone: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangePhone: () => void;
  loading: boolean;
  isDark?: boolean;
  buttonLabel?: string;
}

export function WhatsAppOtpVerification({
  phone,
  onVerify,
  onResend,
  onChangePhone,
  loading,
  isDark = false,
  buttonLabel = "Verify & Continue",
}: WhatsAppOtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(() => {
    const remaining = getRemainingCooldown(phone);
    return remaining > 0 ? remaining : 45;
  });
  const [resending, setResending] = useState(false);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleOtpChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    if (digits.length === 6 && !loading) {
      onVerify(digits);
    }
  };

  const handleResendClick = async () => {
    if (countdown > 0 || resending || loading) return;
    setResending(true);
    try {
      await onResend();
      setCountdown(45);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* WhatsApp Notice Card */}
      <View style={[styles.noticeCard, isDark && styles.noticeCardDark]}>
        <View style={styles.noticeHeader}>
          <Ionicons
            name="logo-whatsapp"
            size={16}
            color={isDark ? "#34D399" : "#059669"}
          />
          <Text style={[styles.noticeTitle, isDark && styles.noticeTitleDark]}>
            Verification code sent to WhatsApp
          </Text>
        </View>
        <Text style={[styles.noticeBody, isDark && styles.noticeBodyDark]}>
          We sent a 6-digit code to{" "}
          <Text style={[styles.noticePhone, isDark && styles.noticePhoneDark]}>
            {maskPhoneDisplay(phone)}
          </Text>
          .
        </Text>
      </View>

      {/* 6-Digit OTP Boxes */}
      <Text style={[styles.label, isDark && styles.labelDark]}>
        ENTER 6-DIGIT CODE
      </Text>

      <Pressable
        style={styles.otpContainer}
        onPress={() => inputRef.current?.focus()}
      >
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          autoFocus
          editable={!loading}
          style={styles.hiddenInput}
        />
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const char = otp[index] || "";
          const isFocused = otp.length === index || (otp.length === 6 && index === 5);
          return (
            <View
              key={index}
              style={[
                styles.otpBox,
                isDark && styles.otpBoxDark,
                isFocused && (isDark ? styles.otpBoxFocusedDark : styles.otpBoxFocused),
              ]}
            >
              <Text style={[styles.otpDigit, isDark && styles.otpDigitDark]}>
                {char}
              </Text>
            </View>
          );
        })}
      </Pressable>

      {/* Primary Verify Button */}
      <Pressable
        style={[
          styles.primaryButton,
          (otp.length < 6 || loading) && styles.primaryButtonDisabled,
        ]}
        onPress={() => {
          if (otp.length === 6 && !loading) onVerify(otp);
        }}
        disabled={otp.length < 6 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            style={[
              styles.primaryButtonText,
              otp.length < 6 && styles.primaryButtonTextDisabled,
            ]}
          >
            {buttonLabel}
          </Text>
        )}
      </Pressable>

      {/* Footer Actions: Edit Phone & Resend */}
      <View style={styles.footerRow}>
        <Pressable
          onPress={onChangePhone}
          disabled={loading}
          hitSlop={8}
          style={styles.footerAction}
        >
          <Ionicons
            name="create-outline"
            size={14}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
            Edit phone number
          </Text>
        </Pressable>

        {countdown > 0 ? (
          <Text style={[styles.countdownText, isDark && styles.countdownTextDark]}>
            Resend code in {countdown}s
          </Text>
        ) : (
          <Pressable
            onPress={handleResendClick}
            disabled={resending || loading}
            hitSlop={8}
            style={styles.footerAction}
          >
            <Ionicons
              name="refresh"
              size={14}
              color={isDark ? "#34D399" : "#059669"}
            />
            <Text style={[styles.resendText, isDark && styles.resendTextDark]}>
              {resending ? "Sending..." : "Resend Code"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  noticeCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 4,
  },
  noticeCardDark: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
  noticeTitleDark: {
    color: "#6EE7B7",
  },
  noticeBody: {
    fontSize: 12.5,
    color: "#047857",
    lineHeight: 18,
  },
  noticeBodyDark: {
    color: "#A7F3D0",
  },
  noticePhone: {
    fontWeight: "700",
    color: "#064E3B",
  },
  noticePhoneDark: {
    color: "#ECFDF5",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  labelDark: {
    color: "#9CA3AF",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 22,
    position: "relative",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.01,
    zIndex: 2,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F0EEF8",
    borderWidth: 1.5,
    borderColor: "#E2DFF0",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxDark: {
    backgroundColor: "#252230",
    borderColor: "#3A3549",
  },
  otpBoxFocused: {
    borderColor: "#17171C",
    backgroundColor: "#FFFFFF",
  },
  otpBoxFocusedDark: {
    borderColor: "#A78BFA",
    backgroundColor: "#2E2A3D",
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  otpDigitDark: {
    color: "#FFFFFF",
  },
  primaryButton: {
    backgroundColor: "#17171C",
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: "#F0EEF8",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButtonTextDisabled: {
    color: "#777383",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  footerText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  footerTextDark: {
    color: "#9CA3AF",
  },
  countdownText: {
    fontSize: 12.5,
    color: "#6B7280",
    fontWeight: "500",
  },
  countdownTextDark: {
    color: "#9CA3AF",
  },
  resendText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
  resendTextDark: {
    color: "#34D399",
  },
});
