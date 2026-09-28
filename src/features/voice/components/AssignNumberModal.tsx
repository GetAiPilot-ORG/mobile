import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export interface DedicatedNumber {
  id: string;
  phone_number: string;
  provider?: string;
  provider_resource_id?: string;
  assigned_assistant_id?: string | null;
  status: string;
  isExpired?: boolean;
  current_period_end?: string | null;
  assistants?: {
    id: string;
    name: string;
  } | null;
}

export interface AssistantOption {
  id: string;
  name: string;
  model?: string;
  provider?: string;
}

interface AssignNumberModalProps {
  visible: boolean;
  phoneNumber: DedicatedNumber | null;
  assistants: AssistantOption[];
  isLoading?: boolean;
  onClose: () => void;
  onAssign: (numberId: string, assistantId: string) => Promise<void> | void;
}

export const AssignNumberModal: React.FC<AssignNumberModalProps> = ({
  visible,
  phoneNumber,
  assistants,
  isLoading = false,
  onClose,
  onAssign,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedAstId, setSelectedAstId] = useState<string>("");

  React.useEffect(() => {
    if (phoneNumber) {
      setSelectedAstId(phoneNumber.assigned_assistant_id || "");
    }
  }, [phoneNumber, visible]);

  if (!phoneNumber) return null;

  const isExpired = phoneNumber.isExpired || phoneNumber.status === "expired";
  const currentAssignedId = phoneNumber.assigned_assistant_id;

  const colors = {
    bg: isDark ? "#0F0F12" : "#F8FAFC",
    surface: isDark ? "#18181D" : "#FFFFFF",
    surfaceAlt: isDark ? "#22222A" : "#F1F5F9",
    border: isDark ? "#2E2E38" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    primary: "#6D3CF5",
    primaryLight: isDark ? "rgba(109, 60, 245, 0.2)" : "#EEF2FF",
    success: "#10B981",
    successLight: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
    danger: "#EF4444",
    dangerLight: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
  };

  const handleSave = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onAssign(phoneNumber.id, selectedAstId);
  };

  const handleUnassign = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onAssign(phoneNumber.id, "");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleWrap}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isExpired
                      ? colors.dangerLight
                      : colors.primaryLight,
                  },
                ]}
              >
                <Ionicons
                  name="phone-portrait"
                  size={20}
                  color={isExpired ? colors.danger : colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Bind Phone Line
                </Text>
                <Text
                  style={[styles.headerSubtitle, { color: colors.textSecondary }]}
                >
                  {phoneNumber.phone_number}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Summary Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Current Status:
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isExpired
                        ? colors.dangerLight
                        : currentAssignedId
                        ? colors.successLight
                        : colors.primaryLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: isExpired
                          ? colors.danger
                          : currentAssignedId
                          ? colors.success
                          : colors.primary,
                      },
                    ]}
                  >
                    {isExpired
                      ? "EXPIRED"
                      : currentAssignedId
                      ? "ACTIVE / BOUND"
                      : "AVAILABLE / UNASSIGNED"}
                  </Text>
                </View>
              </View>

              {phoneNumber.current_period_end && (
                <View style={styles.infoRow}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Subscription Valid Till:
                  </Text>
                  <Text style={[styles.infoVal, { color: colors.text }]}>
                    {new Date(
                      phoneNumber.current_period_end,
                    ).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Instruction Title */}
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.text, marginTop: 12 },
              ]}
            >
              Select AI Voice Assistant
            </Text>
            <Text
              style={[
                styles.sectionSubheading,
                { color: colors.textSecondary, marginBottom: 10 },
              ]}
            >
              Incoming and outgoing telecalling for this phone line will be
              routed to the selected bot.
            </Text>

            {/* Assistants Radio List */}
            {assistants.length === 0 ? (
              <View
                style={[
                  styles.emptyAssistantBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="hardware-chip-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyAstText, { color: colors.text }]}>
                  No AI Assistants found
                </Text>
                <Text
                  style={[styles.emptyAstSub, { color: colors.textSecondary }]}
                >
                  Create an assistant first from the Overview tab.
                </Text>
              </View>
            ) : (
              assistants.map((ast) => {
                const isSelected = selectedAstId === ast.id;
                return (
                  <Pressable
                    key={ast.id}
                    onPress={() => setSelectedAstId(ast.id)}
                    style={[
                      styles.assistantItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.surfaceAlt,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.astItemLeft}>
                      <View
                        style={[
                          styles.astAvatar,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : isDark
                              ? "#33333F"
                              : "#CBD5E1",
                          },
                        ]}
                      >
                        <Text style={styles.astAvatarText}>
                          {(ast.name || "A").slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.astItemName,
                            { color: colors.text, fontWeight: isSelected ? "700" : "600" },
                          ]}
                        >
                          {ast.name}
                        </Text>
                        <Text
                          style={[
                            styles.astItemSub,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {ast.provider || "VoicePilot"} AI Engine
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
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
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.footerRow,
              { borderTopColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {currentAssignedId ? (
              <Pressable
                onPress={handleUnassign}
                disabled={isLoading}
                style={[
                  styles.unassignBtn,
                  {
                    borderColor: colors.danger,
                    backgroundColor: colors.dangerLight,
                  },
                ]}
              >
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={[styles.unassignBtnText, { color: colors.danger }]}>
                  Unassign
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleSave}
              disabled={isLoading || !selectedAstId}
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
                (!selectedAstId || isLoading) && { opacity: 0.5 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="link" size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {selectedAstId === currentAssignedId
                      ? "Save Binding"
                      : "Bind to Assistant"}
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "85%",
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    maxHeight: 450,
  },
  bodyContent: {
    padding: 20,
    gap: 10,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  infoVal: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSubheading: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyAssistantBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  emptyAstText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyAstSub: {
    fontSize: 12,
    textAlign: "center",
  },
  assistantItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  astItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  astAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  astAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  astItemName: {
    fontSize: 14,
  },
  astItemSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  unassignBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  unassignBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
