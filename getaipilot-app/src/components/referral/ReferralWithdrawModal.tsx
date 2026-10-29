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
  Building2,
  CheckCircle2,
  ShieldCheck,
  X,
  ArrowRight,
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
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [amount, setAmount] = useState<string>(
    availableBalance >= 100 ? String(availableBalance) : "100"
  );
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
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

    if (method === "upi") {
      const cleanUpi = upiId.trim();
      if (!cleanUpi || !cleanUpi.includes("@")) {
        setErrorMessage("Please enter a valid UPI ID (e.g. name@okhdfcbank or mobile@paytm).");
        return;
      }
    } else {
      if (!accountName.trim()) {
        setErrorMessage("Please enter account holder name.");
        return;
      }
      if (!accountNumber.trim()) {
        setErrorMessage("Please enter bank account number.");
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setErrorMessage("Account numbers do not match.");
        return;
      }
      if (!ifscCode.trim() || ifscCode.trim().length < 8) {
        setErrorMessage("Please enter a valid 11-character IFSC code.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await requestReferralWithdrawal({
        userId,
        amount: numericAmount,
        payoutMethod: method,
        upiId: method === "upi" ? upiId.trim() : undefined,
        accountHolderName: method === "bank" ? accountName.trim() : undefined,
        accountNumber: method === "bank" ? accountNumber.trim() : undefined,
        ifscCode: method === "bank" ? ifscCode.trim().toUpperCase() : undefined,
        bankName: method === "bank" ? bankName.trim() : undefined,
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
                  Transfer cash directly to UPI or Bank
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
                Payout of ₹{numericAmount} via {method === "upi" ? `UPI (${upiId})` : "Bank Transfer"} has been initiated. Funds are credited within 24-48 business hours.
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

              {/* Method Switcher */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Payout Method</Text>
              <View style={styles.methodRow}>
                <Pressable
                  onPress={() => setMethod("upi")}
                  style={[
                    styles.methodBtn,
                    {
                      borderColor: method === "upi" ? "#10B981" : colors.border,
                      backgroundColor: method === "upi" ? "rgba(16, 185, 129, 0.1)" : colors.card,
                    },
                  ]}
                >
                  <Smartphone size={16} color={method === "upi" ? "#10B981" : colors.textSecondary} />
                  <Text
                    style={[
                      styles.methodText,
                      { color: method === "upi" ? "#10B981" : colors.text, fontWeight: method === "upi" ? "700" : "500" },
                    ]}
                  >
                    UPI (Instant)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMethod("bank")}
                  style={[
                    styles.methodBtn,
                    {
                      borderColor: method === "bank" ? "#10B981" : colors.border,
                      backgroundColor: method === "bank" ? "rgba(16, 185, 129, 0.1)" : colors.card,
                    },
                  ]}
                >
                  <Building2 size={16} color={method === "bank" ? "#10B981" : colors.textSecondary} />
                  <Text
                    style={[
                      styles.methodText,
                      { color: method === "bank" ? "#10B981" : colors.text, fontWeight: method === "bank" ? "700" : "500" },
                    ]}
                  >
                    Bank Account
                  </Text>
                </Pressable>
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

              {/* Method fields */}
              {method === "upi" ? (
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
              ) : (
                <View style={{ marginTop: 14 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Account Holder Name</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      value={accountName}
                      onChangeText={setAccountName}
                      placeholder="As per bank passbook"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, { color: colors.text }]}
                    />
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>Account Number</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      keyboardType="numeric"
                      secureTextEntry
                      placeholder="Bank account number"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, { color: colors.text }]}
                    />
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>Confirm Number</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      value={confirmAccountNumber}
                      onChangeText={setConfirmAccountNumber}
                      keyboardType="numeric"
                      placeholder="Re-enter account number"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, { color: colors.text }]}
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>IFSC Code</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                          value={ifscCode}
                          onChangeText={(t) => setIfscCode(t.toUpperCase())}
                          autoCapitalize="characters"
                          placeholder="e.g. HDFC0001234"
                          placeholderTextColor={colors.textSecondary}
                          style={[styles.input, { color: colors.text }]}
                        />
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bank Name (Opt)</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                          value={bankName}
                          onChangeText={setBankName}
                          placeholder="e.g. HDFC Bank"
                          placeholderTextColor={colors.textSecondary}
                          style={[styles.input, { color: colors.text }]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Security Banner */}
              <View style={[styles.securityBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={[styles.securityText, { color: colors.textSecondary }]}>
                  Transfers are settled securely to your verified account via IMPS/UPI.
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  methodRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  methodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 12,
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

