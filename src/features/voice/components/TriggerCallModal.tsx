import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { voiceApi } from "../api/voiceApi";

interface TriggerCallModalProps {
  visible: boolean;
  assistants: any[];
  initialPhone?: string;
  initialName?: string;
  initialAssistantId?: string;
  onClose: () => void;
  onSubmit: (payload: {
    customerNumber: string;
    customerName?: string;
    assistantId?: string;
    assignedNumber?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const TriggerCallModal: React.FC<TriggerCallModalProps> = ({
  visible,
  assistants,
  initialPhone = "",
  initialName = "",
  initialAssistantId = "",
  onClose,
  onSubmit,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(
    initialAssistantId || assistants[0]?.id || "",
  );
  const [error, setError] = useState<string | null>(null);

  const { data: numbers = [] } = useQuery({
    queryKey: ["voice", "numbers"],
    queryFn: () => voiceApi.getNumbers(),
    enabled: visible,
  });

  const { data: overview } = useQuery({
    queryKey: ["voice", "overview"],
    queryFn: () => voiceApi.getOverview(),
    enabled: visible,
  });

  const isPlanExpired = Boolean(overview?.isPlanExpired);

  const selectedAssistant = assistants.find((a) => a.id === selectedAssistantId);
  const boundNumberObj = numbers.find(
    (n: any) =>
      n.assigned_assistant_id === selectedAssistantId &&
      !n.isExpired &&
      n.status !== "expired",
  );
  const boundPhoneNumber = boundNumberObj?.phone_number || "";

  useEffect(() => {
    if (visible) {
      if (initialPhone) setPhone(initialPhone);
      if (initialName) setName(initialName);
      if (initialAssistantId) {
        setSelectedAssistantId(initialAssistantId);
      } else if (!selectedAssistantId && assistants.length > 0) {
        setSelectedAssistantId(assistants[0].id);
      }
      setError(null);
    }
  }, [visible, initialPhone, initialName, initialAssistantId, assistants]);

  useEffect(() => {
    if (!selectedAssistantId && assistants.length > 0) {
      setSelectedAssistantId(initialAssistantId || assistants[0].id);
    }
  }, [assistants, selectedAssistantId, initialAssistantId]);

  const colors = {
    background: isDark ? "#0D0D10" : "#FFFFFF",
    surface: isDark ? "#16161B" : "#F8FAFC",
    surfaceAlt: isDark ? "#1F1F26" : "#F1F5F9",
    border: isDark ? "#282832" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    primary: "#5844E3",
    primaryLight: isDark ? "rgba(88, 68, 227, 0.15)" : "#EEF2FF",
    green: "#16A34A",
    greenLight: isDark ? "rgba(22, 163, 74, 0.12)" : "#DCFCE7",
    amber: "#D97706",
    amberLight: isDark ? "rgba(245, 158, 11, 0.12)" : "#FEF3C7",
    danger: "#EF4444",
    dangerLight: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2",
  };

  const handleTrigger = async () => {
    setError(null);
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setError("Please enter a destination phone number.");
      return;
    }

    if (cleanPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    if (isPlanExpired) {
      setError("Your Voice plan has expired. Please renew to make calls.");
      return;
    }

    if (!boundPhoneNumber) {
      setError(
        `No dedicated phone line is assigned to ${selectedAssistant?.name || "this agent"}.`,
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await onSubmit({
        customerNumber: cleanPhone,
        customerName: name.trim() || undefined,
        assistantId: selectedAssistantId || undefined,
        assignedNumber: boundPhoneNumber || undefined,
      });
      setPhone("");
      setName("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to initiate AI call.");
    }
  };

  const canSubmit =
    Boolean(phone.trim()) &&
    !isLoading &&
    !isPlanExpired &&
    Boolean(boundPhoneNumber);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Sleek Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Trigger AI Call
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Dispatch a real-time telecalling session
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
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Plan Expired Notice */}
          {isPlanExpired && (
            <View
              style={[
                styles.noticeBanner,
                {
                  backgroundColor: colors.amberLight,
                  borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
                },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.amber} />
              <Text style={[styles.noticeText, { color: colors.amber }]}>
                Plan expired. Dedicated lines are paused until renewed.
              </Text>
            </View>
          )}

          {/* Error Banner */}
          {error && (
            <View
              style={[
                styles.noticeBanner,
                {
                  backgroundColor: colors.dangerLight,
                  borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA",
                },
              ]}
            >
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={[styles.noticeText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Recipient Inputs */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Recipient Phone <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <View
              style={[
                styles.fieldInputWrap,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[
                  styles.fieldTextInput,
                  { color: colors.text },
                  Platform.OS === "web"
                    ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                    : null,
                ]}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Prospect Name <Text style={[styles.optionalTag, { color: colors.textSecondary }]}>Optional</Text>
            </Text>
            <View
              style={[
                styles.fieldInputWrap,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[
                  styles.fieldTextInput,
                  { color: colors.text },
                  Platform.OS === "web"
                    ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                    : null,
                ]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Select AI Voice Agent */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Select Voice Agent
              </Text>
              <Text style={[styles.agentCountLabel, { color: colors.textSecondary }]}>
                {assistants.length} available
              </Text>
            </View>

            {assistants.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.emptyBoxText, { color: colors.textSecondary }]}>
                  No AI voice agents found. Create one first.
                </Text>
              </View>
            ) : (
              <View style={styles.agentList}>
                {assistants.map((ast) => {
                  const isSelected = selectedAssistantId === ast.id;
                  const astBoundLine = numbers.find(
                    (n: any) =>
                      n.assigned_assistant_id === ast.id &&
                      !n.isExpired &&
                      n.status !== "expired",
                  );
                  const isAssigned = Boolean(astBoundLine?.phone_number);

                  return (
                    <Pressable
                      key={ast.id}
                      style={[
                        styles.agentItem,
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
                          styles.agentItemIcon,
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
                          size={15}
                          color={isSelected ? "#FFFFFF" : colors.primary}
                        />
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.agentItemTitleRow}>
                          <Text
                            style={[
                              styles.agentItemName,
                              {
                                color: colors.text,
                                fontWeight: isSelected ? "700" : "600",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {ast.name}
                          </Text>
                          <Text
                            style={[
                              styles.agentItemVoice,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {ast.config_snapshot?.voice?.name || "Neural AI"}
                          </Text>
                        </View>

                        <View style={styles.agentLineStatus}>
                          <View
                            style={[
                              styles.miniDot,
                              {
                                backgroundColor: isAssigned
                                  ? colors.green
                                  : colors.textSecondary,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.agentLineText,
                              {
                                color: isAssigned
                                  ? isDark
                                    ? "#FFFFFF"
                                    : "#0F172A"
                                  : colors.textSecondary,
                                fontWeight: isAssigned ? "600" : "400",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {isAssigned && astBoundLine?.phone_number
                              ? `Line: ${astBoundLine.phone_number}`
                              : "No Caller ID assigned"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.radioIndicator,
                          {
                            borderColor: isSelected
                              ? colors.primary
                              : colors.textSecondary,
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

          {/* Caller ID Summary Pill */}
          <View
            style={[
              styles.callerIdNotice,
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
              name={boundPhoneNumber ? "phone-portrait" : "alert-circle"}
              size={15}
              color={boundPhoneNumber ? colors.green : colors.amber}
            />
            <Text
              style={[
                styles.callerIdNoticeText,
                {
                  color: boundPhoneNumber
                    ? isDark
                      ? "#4ADE80"
                      : "#15803D"
                    : isDark
                    ? "#FBBF24"
                    : "#B45309",
                },
              ]}
              numberOfLines={1}
            >
              {boundPhoneNumber
                ? `Caller ID: ${boundPhoneNumber}`
                : "No active line bound to this agent"}
            </Text>
          </View>

          {/* CTA Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: colors.primary },
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && { opacity: 0.85 },
            ]}
            disabled={!canSubmit}
            onPress={handleTrigger}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isPlanExpired
                    ? "Plan Expired"
                    : !boundPhoneNumber
                    ? "Assign Line to Call"
                    : !phone.trim()
                    ? "Enter Phone Number"
                    : "Start AI Call"}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTextWrap: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    paddingBottom: 36,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  fieldGroup: {
    gap: 5,
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
  optionalTag: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  agentCountLabel: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  fieldInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  fieldTextInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    paddingVertical: 0,
    height: "100%",
  },
  agentList: {
    gap: 6,
  },
  agentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  agentItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  agentItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  agentItemName: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  agentItemVoice: {
    fontSize: 10.5,
    fontWeight: "500",
  },
  agentLineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  miniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  agentLineText: {
    fontSize: 11,
  },
  radioIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyBoxText: {
    fontSize: 12,
  },
  callerIdNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  callerIdNoticeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
