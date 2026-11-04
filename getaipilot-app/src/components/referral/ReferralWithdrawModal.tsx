import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Wallet,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  X,
  ArrowRight,
  Zap,
} from "lucide-react-native";
import { requestReferralWithdrawal } from "../../services/referralService";

export interface ReferralWithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  availableBalance: number;
  onSuccess: () => void;
  colors: any;
}

export function ReferralWithdrawModal({
  visible,
  onClose,
  userId,
  availableBalance,
  onSuccess,
  colors,
}: ReferralWithdrawModalProps) {
  const [amount, setAmount] = useState<string>(
    availableBalance >= 100 ? String(availableBalance) : "100"
  );
  const [upiId, setUpiId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setErrorMessage(null);
      setAmount(availableBalance >= 100 ? String(availableBalance) : "100");
    }
  }, [visible, availableBalance]);

  const numericAmount = Number(amount) || 0;
  const isBalanceSufficient = availableBalance >= 100 && numericAmount <= availableBalance;

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!userId) {
      setErrorMessage("Please sign in to withdraw funds.");
      return;
    }

    if (numericAmount < 100) {
      setErrorMessage("Minimum withdrawal amount is ₹100.");
      return;
    }

    if (numericAmount > availableBalance) {
      setErrorMessage(`Insufficient balance. Available: ₹${availableBalance}`);
      return;
    }

    const cleanUpi = upiId.trim();
    if (!cleanUpi || !cleanUpi.includes("@")) {
      setErrorMessage("Please enter a valid UPI ID (e.g. name@okhdfcbank or mobile@paytm).");
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestReferralWithdrawal({
        userId,
        amount: numericAmount,
        payoutMethod: "upi",
        upiId: cleanUpi,
      });

      if (result.success) {
        setSubmitted(true);
        onSuccess();
      } else {
        setErrorMessage(result.message || "Failed to submit withdrawal request.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                <Wallet size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.title, { color: colors.text }]}>Withdraw Referral Cash</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Transfer cash directly to your UPI ID
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Available Balance pill */}
            <View style={[styles.balancePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
              <Text style={styles.balanceValue}>₹{availableBalance}</Text>
            </View>
          </View>

          {submitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconBox}>
                <CheckCircle2 size={36} color="#10B981" />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>
                Withdrawal Requested!
              </Text>
              <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                Payout of ₹{numericAmount} via UPI ({upiId.trim()}) has been initiated. Funds are credited within 24-48 business hours.
              </Text>
              <Pressable
                onPress={onClose}
                style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 18 }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Payout Method Tag */}
              <View style={[styles.methodBadge, { backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.25)" }]}>
                <Smartphone size={16} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.methodBadgeTitle}>Instant UPI Payout</Text>
                  <Text style={[styles.methodBadgeSub, { color: colors.textSecondary }]}>Direct settlement via UPI ID / VPA</Text>
                </View>
                <View style={styles.activeTag}>
                  <Zap size={11} color="#10B981" />
                  <Text style={styles.activeTagText}>Fast</Text>
                </View>
              </View>

              {/* Amount input */}
              <View style={styles.amountHeader}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Withdrawal Amount (₹)</Text>
                {availableBalance >= 100 && (
                  <Pressable onPress={() => setAmount(String(availableBalance))}>
                    <Text style={styles.maxLink}>Withdraw All (₹{availableBalance})</Text>
                  </Pressable>
                )}
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="Min ₹100"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>

              {/* UPI ID input */}
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>UPI ID / VPA</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    placeholder="e.g. mobile@paytm or name@okhdfcbank"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                  Supported: GPay, PhonePe, Paytm, BHIM & all bank UPI apps
                </Text>
              </View>

              {/* Security Banner */}
              <View style={[styles.securityBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={[styles.securityText, { color: colors.textSecondary }]}>
                  Transfers are settled securely to your verified UPI ID via IMPS/UPI.
                </Text>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={submitting || availableBalance < 100 || numericAmount > availableBalance}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor:
                      availableBalance < 100 || numericAmount > availableBalance
                        ? "#9CA3AF"
                        : "#10B981",
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
                      Request ₹{numericAmount} Payout
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxHeight: "88%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  header: {
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  balancePill: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
  },
  formContent: {
    padding: 18,
    paddingBottom: 36,
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  methodBadgeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
  },
  methodBadgeSub: {
    fontSize: 11,
    marginTop: 1,
  },
  activeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  maxLink: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: "700",
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  hintText: {
    fontSize: 10.5,
    marginTop: 4,
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11.5,
    color: "#EF4444",
    fontWeight: "600",
  },
  actionBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  successContainer: {
    padding: 28,
    alignItems: "center",
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
});
