import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { VoiceCampaign } from "../api/voiceApi";

interface EditCampaignModalProps {
  visible: boolean;
  campaign: VoiceCampaign | null;
  assistants: any[];
  phoneNumbers: any[];
  onClose: () => void;
  onSubmit: (campaignId: string, payload: any) => Promise<void>;
  isLoading: boolean;
}

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  visible,
  campaign,
  assistants,
  phoneNumbers,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Outreach");
  const [selectedAssistantId, setSelectedAssistantId] = useState("");
  const [selectedNumberId, setSelectedNumberId] = useState("");
  const [status, setStatus] = useState<
    "draft" | "running" | "paused" | "completed" | "failed"
  >("draft");
  const [error, setError] = useState<string | null>(null);

  const colors = {
    background: isDark ? "#0D1117" : "#FFFFFF",
    modalOverlay: isDark ? "rgba(0, 0, 0, 0.75)" : "rgba(15, 23, 42, 0.45)",
    cardBg: isDark ? "#161B22" : "#FFFFFF",
    surfaceAlt: isDark ? "#1C2128" : "#F8FAFC",
    border: isDark ? "#30363D" : "#E2E8F0",
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

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || "");
      setCategory(campaign.category || "Outreach");
      setSelectedAssistantId(campaign.assistant_id || assistants[0]?.id || "");
      setSelectedNumberId(
        campaign.phone_number_id || phoneNumbers[0]?.id || "",
      );
      setStatus(campaign.status || "draft");
    }
  }, [campaign, assistants, phoneNumbers]);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Please provide a campaign name.");
      return;
    }
    if (!campaign) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await onSubmit(campaign.id, {
        name: name.trim(),
        category,
        assistantId: selectedAssistantId,
        phoneNumberId: selectedNumberId,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update campaign details.");
    }
  };

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
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Edit Voice Campaign
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Update Target Agent & Routing Settings
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

            {/* Campaign Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Campaign Title <Text style={{ color: colors.danger }}>*</Text>
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
                  placeholder="e.g. Q3 Enterprise Telecalling Outreach"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Category / Tag
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
                  placeholder="e.g. Sales, Survey, Reminder, Follow-up"
                  placeholderTextColor={colors.textSecondary}
                  value={category}
                  onChangeText={setCategory}
                />
              </View>
            </View>

            {/* Assistant Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Assigned AI Voice Agent
              </Text>
              <View style={styles.optionsList}>
                {assistants.map((ast) => {
                  const isSelected = selectedAssistantId === ast.id;
                  return (
                    <Pressable
                      key={ast.id}
                      style={[
                        styles.optionChip,
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
                      }}
                    >
                      <Ionicons
                        name="mic"
                        size={14}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.optionChipText,
                          {
                            color: colors.text,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {ast.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Status Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Campaign Status
              </Text>
              <View style={styles.statusChipsRow}>
                {(["draft", "running", "paused", "completed"] as const).map(
                  (st) => {
                    const isSelected = status === st;
                    return (
                      <Pressable
                        key={st}
                        style={[
                          styles.statusChip,
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
                          setStatus(st);
                        }}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            {
                              color: isSelected ? colors.primary : colors.text,
                              fontWeight: isSelected ? "700" : "600",
                            },
                          ]}
                        >
                          {st.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
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
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : (pressed ? 0.85 : 1),
                },
              ]}
              disabled={isLoading || !name.trim()}
              onPress={handleSave}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Save Changes</Text>
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
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: -0.1,
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
  optionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 12.5,
  },
  statusChipsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
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
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
  },
});

