import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface CreateCampaignModalProps {
  visible: boolean;
  assistants: any[];
  phoneNumbers: any[];
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    assistantId: string;
    phoneNumberId?: string;
    numbers?: string;
    contacts?: Array<{ name?: string; phone: string; details?: string }>;
  }) => Promise<void>;
  isLoading: boolean;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  visible,
  assistants,
  phoneNumbers = [],
  onClose,
  onSubmit,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [campaignName, setCampaignName] = useState("");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(
    assistants[0]?.id || "",
  );
  const [numbersText, setNumbersText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const colors = {
    background: isDark ? "#0D1117" : "#FFFFFF",
    modalOverlay: isDark ? "rgba(0, 0, 0, 0.75)" : "rgba(15, 23, 42, 0.45)",
    cardBg: isDark ? "#161B22" : "#FFFFFF",
    surfaceAlt: isDark ? "#1C2128" : "#F8FAFC",
    border: isDark ? "#30363D" : "#E2E8F0",
    borderFocus: isDark ? "#5844E3" : "#5B3AF5",
    text: isDark ? "#F0F6FC" : "#0F172A",
    textSecondary: isDark ? "#8B949E" : "#64748B",
    primary: "#5B3AF5",
    primaryLight: isDark ? "rgba(91, 58, 245, 0.15)" : "#EEF2FF",
    green: "#16A34A",
    greenLight: isDark ? "rgba(22, 163, 74, 0.15)" : "#DCFCE7",
    amber: "#D97706",
    amberLight: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
    danger: "#EF4444",
    dangerLight: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2",
  };

  const selectedAssistant = assistants.find((a) => a.id === selectedAssistantId);
  const boundNumberObj = phoneNumbers.find(
    (n: any) =>
      n.assigned_assistant_id === selectedAssistantId &&
      !n.isExpired &&
      n.status !== "expired",
  );
  const boundPhoneNumber = boundNumberObj?.phone_number || "";

  React.useEffect(() => {
    if (!selectedAssistantId && assistants.length > 0) {
      setSelectedAssistantId(assistants[0].id);
    }
  }, [assistants, selectedAssistantId]);

  React.useEffect(() => {
    if (visible) {
      setError(null);
    }
  }, [visible]);

  // Parse phone numbers count
  const detectedCount = useMemo(() => {
    if (!numbersText.trim()) return 0;
    const items = numbersText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 7);
    return items.length;
  }, [numbersText]);

  const handleLaunch = async () => {
    setError(null);
    if (!campaignName.trim()) {
      setError("Please enter a campaign name.");
      return;
    }
    if (!selectedAssistantId) {
      setError("Please select an AI Assistant.");
      return;
    }
    if (!boundPhoneNumber) {
      setError(
        "The selected assistant has no phone number assigned. Please bind a line in Contacts > Phone Lines before launching a campaign.",
      );
      return;
    }
    if (!numbersText.trim() || detectedCount === 0) {
      setError("Please enter at least one valid recipient phone number.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await onSubmit({
        name: campaignName.trim(),
        assistantId: selectedAssistantId,
        phoneNumberId: boundNumberObj?.id || undefined,
        numbers: numbersText.trim(),
      });
      setCampaignName("");
      setNumbersText("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to launch bulk campaign.");
    }
  };

  const canSubmit =
    Boolean(campaignName.trim()) &&
    Boolean(selectedAssistantId) &&
    Boolean(boundPhoneNumber) &&
    detectedCount > 0 &&
    !isLoading;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={Platform.OS === "web"}
      presentationStyle={Platform.OS === "web" ? "overFullScreen" : "pageSheet"}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalWrapper,
          Platform.OS === "web" && { backgroundColor: colors.modalOverlay },
        ]}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTextWrap}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="rocket-outline" size={19} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Start Campaign
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Queue up automated calls to a list of contacts.
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Banner */}
            {error && (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.dangerLight,
                    borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA",
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.bannerText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Campaign Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Campaign Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    { color: colors.text },
                    Platform.OS === "web"
                      ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                      : null,
                  ]}
                  placeholder="e.g. Q3 Sales Outreach"
                  placeholderTextColor={colors.textSecondary}
                  value={campaignName}
                  onChangeText={(val) => {
                    setCampaignName(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="sentences"
                />
              </View>
            </View>

            {/* Select AI Voice Agent */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Select Assistant <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <Text
                  style={[styles.agentCountText, { color: colors.textSecondary }]}
                >
                  {assistants.length} available
                </Text>
              </View>

              {assistants.length === 0 ? (
                <View
                  style={[
                    styles.emptyNotice,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="mic-off-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.emptyNoticeText, { color: colors.textSecondary }]}>
                    No assistants found. Create an assistant first.
                  </Text>
                </View>
              ) : (
                <View style={styles.assistantList}>
                  {assistants.map((ast) => {
                    const isSelected = selectedAssistantId === ast.id;
                    const astBoundLine = phoneNumbers.find(
                      (n: any) =>
                        n.assigned_assistant_id === ast.id &&
                        !n.isExpired &&
                        n.status !== "expired",
                    );
                    const hasLine = Boolean(astBoundLine?.phone_number);

                    return (
                      <Pressable
                        key={ast.id}
                        style={[
                          styles.assistantCard,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryLight
                              : colors.surfaceAlt,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() => {
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedAssistantId(ast.id);
                          if (error) setError(null);
                        }}
                      >
                        <View
                          style={[
                            styles.assistantIconBox,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : isDark
                                ? "#242430"
                                : "#E2E8F0",
                            },
                          ]}
                        >
                          <Ionicons
                            name="mic"
                            size={14}
                            color={isSelected ? "#FFFFFF" : colors.primary}
                          />
                        </View>

                        <View style={styles.assistantInfoWrap}>
                          <Text
                            style={[
                              styles.assistantName,
                              {
                                color: colors.text,
                                fontWeight: isSelected ? "700" : "600",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {ast.name}
                          </Text>
                          <View style={styles.assistantLineMetaRow}>
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor: hasLine
                                    ? colors.green
                                    : colors.amber,
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.assistantLineText,
                                {
                                  color: hasLine
                                    ? colors.green
                                    : colors.textSecondary,
                                },
                              ]}
                            >
                              {hasLine
                                ? `${astBoundLine?.phone_number} (Active Line)`
                                : "No Line Assigned"}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isSelected
                                ? colors.primary
                                : colors.border,
                              backgroundColor: isSelected
                                ? colors.primary
                                : "transparent",
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Outbound Caller ID Notice Box */}
            {selectedAssistantId && (
              <View
                style={[
                  styles.callerIdBanner,
                  {
                    backgroundColor: boundPhoneNumber
                      ? colors.greenLight
                      : colors.amberLight,
                    borderColor: boundPhoneNumber
                      ? isDark
                        ? "rgba(22, 163, 74, 0.3)"
                        : "#BBF7D0"
                      : isDark
                      ? "rgba(245, 158, 11, 0.3)"
                      : "#FDE68A",
                  },
                ]}
              >
                <Ionicons
                  name={boundPhoneNumber ? "call" : "warning"}
                  size={15}
                  color={boundPhoneNumber ? colors.green : colors.amber}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.callerIdBannerTitle,
                      {
                        color: boundPhoneNumber ? colors.green : colors.amber,
                      },
                    ]}
                  >
                    {boundPhoneNumber
                      ? `Outbound Caller ID: ${boundPhoneNumber}`
                      : "Unassigned Phone Line"}
                  </Text>
                  <Text
                    style={[
                      styles.callerIdBannerSub,
                      {
                        color: boundPhoneNumber
                          ? isDark
                            ? "#86EFAC"
                            : "#166534"
                          : isDark
                          ? "#FCD34D"
                          : "#92400E",
                      },
                    ]}
                  >
                    {boundPhoneNumber
                      ? "Verified dedicated line for outbound telecalling"
                      : `Assign a line to ${selectedAssistant?.name || "this agent"} in Contacts > Phone Lines`}
                  </Text>
                </View>
              </View>
            )}

            {/* Phone Numbers / Target Contacts */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Phone Numbers <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                {detectedCount > 0 && (
                  <View
                    style={[
                      styles.counterBadge,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.counterBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      {detectedCount} {detectedCount === 1 ? "contact" : "contacts"}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.textAreaWrap,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.textAreaInput,
                    { color: colors.text },
                    Platform.OS === "web"
                      ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                      : null,
                  ]}
                  placeholder="+919876543210, +919811223344, +919988776655"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={numbersText}
                  onChangeText={(val) => {
                    setNumbersText(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                />
              </View>
              <Text
                style={[styles.fieldHelpText, { color: colors.textSecondary }]}
              >
                Enter comma-separated phone numbers in E.164 format.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions matching GAP_VoicePilot */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
                pressed && styles.pressed,
              ]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: canSubmit ? colors.primary : colors.surfaceAlt,
                  opacity: canSubmit ? (pressed ? 0.85 : 1) : 0.5,
                },
              ]}
              disabled={!canSubmit}
              onPress={handleLaunch}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="paper-plane-outline"
                    size={15}
                    color={canSubmit ? "#FFFFFF" : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.submitBtnText,
                      {
                        color: canSubmit ? "#FFFFFF" : colors.textSecondary,
                      },
                    ]}
                  >
                    Start Calling
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Platform.OS === "web" ? 16 : 0,
  },
  modalContainer: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 500 : undefined,
    height: Platform.OS === "web" ? "auto" : "100%",
    maxHeight: Platform.OS === "web" ? "88%" : undefined,
    borderRadius: Platform.OS === "web" ? 16 : 0,
    borderWidth: Platform.OS === "web" ? 1 : 0,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
    marginRight: 10,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 18,
    gap: 14,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 12.5,
    fontWeight: "600",
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  agentCountText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  inputWrap: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 13.5,
    fontWeight: "500",
    padding: 0,
    margin: 0,
  },
  textAreaWrap: {
    height: 94,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textAreaInput: {
    fontSize: 13,
    fontWeight: "500",
    padding: 0,
    margin: 0,
    height: "100%",
    textAlignVertical: "top",
  },
  fieldHelpText: {
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 2,
  },
  counterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  emptyNoticeText: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  assistantList: {
    gap: 7,
  },
  assistantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  assistantIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  assistantInfoWrap: {
    flex: 1,
    gap: 2,
  },
  assistantName: {
    fontSize: 13.5,
    letterSpacing: -0.1,
  },
  assistantLineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  assistantLineText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  callerIdBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  callerIdBannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  callerIdBannerSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  submitBtn: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
  },
});

