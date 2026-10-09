import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { DedicatedNumber, VoiceContact, voiceApi } from "../api/voiceApi";
import {
  AssignNumberModal,
  ContactDetailsModal,
  CreateAgentModal,
  CreateContactModal,
  EditContactModal,
  TriggerCallModal,
} from "../components";
import {
  openVoicePhoneNumbersSSO,
  openVoiceWebBilling,
} from "../utils/voiceBilling";

function getInitials(name: string): string {
  if (!name) return "VP";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ContactsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<
    "contacts" | "numbers" | "assistants"
  >("contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [selectedContact, setSelectedContact] = useState<VoiceContact | null>(
    null,
  );
  const [editingContact, setEditingContact] = useState<VoiceContact | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [callTarget, setCallTarget] = useState<{
    phone?: string;
    name?: string;
    assistantId?: string;
  } | null>(null);
  const [selectedNumberToAssign, setSelectedNumberToAssign] =
    useState<DedicatedNumber | null>(null);

  // Queries
  const {
    data: contactsData,
    isLoading: isContactsLoading,
    refetch: refetchContacts,
    isRefetching: isContactsRefetching,
  } = useQuery({
    queryKey: ["voice", "contacts"],
    queryFn: () => voiceApi.getContacts(),
  });

  const {
    data: assistantsData,
    isLoading: isAssistantsLoading,
    refetch: refetchAssistants,
  } = useQuery({
    queryKey: ["voice", "assistants"],
    queryFn: () => voiceApi.getAssistants(),
  });

  const {
    data: numbersData,
    isLoading: isNumbersLoading,
    refetch: refetchNumbers,
  } = useQuery({
    queryKey: ["voice", "numbers"],
    queryFn: () => voiceApi.getNumbers(),
  });

  const { data: overviewData, refetch: refetchOverview } = useQuery({
    queryKey: ["voice", "overview"],
    queryFn: () => voiceApi.getOverview(),
  });

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.createContact(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setIsCreateModalOpen(false);
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      voiceApi.updateContact(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "contacts"] });
      setEditingContact(null);
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => voiceApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setSelectedContact(null);
    },
    onError: (err: any) => {
      Alert.alert("Delete Error", err?.message || "Failed to delete contact.");
    },
  });

  const triggerCallMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.triggerOutboundCall(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "calls"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "contacts"] });
      setCallTarget(null);
    },
  });

  const assignPhoneNumberMutation = useMutation({
    mutationFn: (payload: { numberId: string; assistantId: string }) =>
      voiceApi.assignPhoneNumber(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "numbers"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setSelectedNumberToAssign(null);
      Alert.alert("Success", "Assistant bound to phone line successfully.");
    },
    onError: (err: any) => {
      Alert.alert(
        "Assignment Error",
        err?.message || "Failed to assign assistant.",
      );
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.createAssistant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice", "assistants"] });
      queryClient.invalidateQueries({ queryKey: ["voice", "overview"] });
      setIsCreateAgentOpen(false);
    },
  });

  const handleRefresh = () => {
    refetchContacts();
    refetchNumbers();
    refetchAssistants();
    refetchOverview();
  };

  const handleAssignBot = (num: DedicatedNumber) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const isExpired = num.isExpired || num.status === "expired";

    if (isExpired) {
      Alert.alert(
        `Line Expired (${num.phone_number})`,
        "This dedicated phone line has expired. Please renew your workspace line subscription on VoicePilot to resume inbound/outbound calls.",
        [
          {
            text: "Renew on VoicePilot 🌐",
            onPress: () => openVoicePhoneNumbersSSO(queryClient, isDark),
          },
          { text: "Dismiss", style: "cancel" },
        ],
      );
      return;
    }

    setSelectedNumberToAssign(num);
  };

  const contacts: VoiceContact[] = contactsData || [];
  const assistants: any[] = assistantsData || [];
  const numbers: DedicatedNumber[] = numbersData || [];

  const totalContacts = contacts.length;
  const activeLeads = contacts.filter((c) => (c.calls_count || 0) === 0).length;

  const totalNumbers = numbers.length;
  const expiredNumbersCount = numbers.filter(
    (n) => n.isExpired || n.status === "expired",
  ).length;
  const activeNumbersCount = numbers.filter(
    (n) => !n.isExpired && n.status !== "expired" && n.assigned_assistant_id,
  ).length;

  const boundAssistantsCount = assistants.filter((ast) =>
    numbers.some(
      (n) =>
        n.assigned_assistant_id === ast.id &&
        !n.isExpired &&
        n.status !== "expired",
    ),
  ).length;

  const colors = {
    ...themeColors,
    background: themeColors.background,
    surface: themeColors.surface,
    surfaceAlt: themeColors.surfaceSecondary,
    border: themeColors.border,
    text: themeColors.text,
    textSecondary: themeColors.textMuted,
    primary: themeColors.products.voice || "#5844E3",
    primaryLight: themeColors.products.voiceSoft || (isDark ? "rgba(88, 68, 227, 0.15)" : "#EEF2FF"),
    green: themeColors.success,
    greenLight: themeColors.successSoft,
    amber: themeColors.warning,
    amberLight: themeColors.warningSoft,
    red: themeColors.destructive,
    redLight: themeColors.destructiveSoft,
  };

  const filteredContacts = contacts.filter((cnt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cnt.name.toLowerCase().includes(q) ||
      cnt.phone.toLowerCase().includes(q) ||
      (cnt.company && cnt.company.toLowerCase().includes(q)) ||
      (cnt.email && cnt.email.toLowerCase().includes(q))
    );
  });

  const handleImportCsv = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Import CSV Contacts",
      "Upload or paste comma-separated leads (Name, Phone, Company).\n\nTap + Add Contact for manual entry.",
    );
  };

  return (
    <ScrollView
      className="flex-1 w-full"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 100,
        gap: 12,
        width: "100%",
      }}
      refreshControl={
        <RefreshControl
          refreshing={isContactsRefetching}
          onRefresh={handleRefresh}
          tintColor={isDark ? "#FFFFFF" : colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TITLE SECTION */}
      <View className="pt-0.5 gap-0.5 w-full">
        <Text
          className="text-2xl leading-7 font-extrabold tracking-tight"
          style={{ color: colors.text }}
        >
          {activeSubTab === "contacts"
            ? "Contacts & Leads"
            : activeSubTab === "numbers"
              ? "Dedicated Phone Lines"
              : "AI Voice Assistants"}
        </Text>
        <Text
          className="text-[12.5px] leading-[17px] font-medium"
          style={{ color: colors.textSecondary }}
        >
          {activeSubTab === "contacts"
            ? "Manage customer phone numbers and outbound lists."
            : activeSubTab === "numbers"
              ? "Virtual phone lines bound to AI Assistants for calling."
              : "Your AI workforce and their assigned caller IDs."}
        </Text>
      </View>

      {/* 2. 3-WAY SUB-TAB SWITCHER */}
      <View
        className="flex-row items-center p-1 rounded-2xl border w-full gap-1 mb-1"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Pressable
          className="flex-1 flex-row items-center justify-center py-2 px-2 rounded-xl gap-1.5 active:opacity-80"
          style={activeSubTab === "contacts" ? { backgroundColor: colors.primary } : undefined}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSubTab("contacts");
          }}
        >
          <Ionicons
            name="people"
            size={13}
            color={
              activeSubTab === "contacts" ? "#FFFFFF" : colors.textSecondary
            }
          />
          <Text
            className="text-xs tracking-tight"
            style={{
              color:
                activeSubTab === "contacts"
                  ? "#FFFFFF"
                  : colors.textSecondary,
              fontWeight: activeSubTab === "contacts" ? "700" : "600",
            }}
          >
            Contacts ({totalContacts})
          </Text>
        </Pressable>

        <Pressable
          className="flex-1 flex-row items-center justify-center py-2 px-2 rounded-xl gap-1.5 active:opacity-80"
          style={activeSubTab === "numbers" ? { backgroundColor: colors.primary } : undefined}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSubTab("numbers");
          }}
        >
          <Ionicons
            name="phone-portrait"
            size={13}
            color={
              activeSubTab === "numbers" ? "#FFFFFF" : colors.textSecondary
            }
          />
          <Text
            className="text-xs tracking-tight"
            style={{
              color:
                activeSubTab === "numbers"
                  ? "#FFFFFF"
                  : colors.textSecondary,
              fontWeight: activeSubTab === "numbers" ? "700" : "600",
            }}
          >
            Lines ({totalNumbers})
          </Text>
          {expiredNumbersCount > 0 && (
            <View
              className="px-1.5 py-0.5 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  activeSubTab === "numbers"
                    ? "rgba(255, 255, 255, 0.25)"
                    : isDark
                      ? "rgba(245, 158, 11, 0.2)"
                      : "#FEF3C7",
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{
                  color:
                    activeSubTab === "numbers" ? "#FFFFFF" : "#D97706",
                }}
              >
                {expiredNumbersCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          className="flex-1 flex-row items-center justify-center py-2 px-2 rounded-xl gap-1.5 active:opacity-80"
          style={activeSubTab === "assistants" ? { backgroundColor: colors.primary } : undefined}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSubTab("assistants");
          }}
        >
          <Ionicons
            name="mic"
            size={13}
            color={
              activeSubTab === "assistants" ? "#FFFFFF" : colors.textSecondary
            }
          />
          <Text
            className="text-xs tracking-tight"
            style={{
              color:
                activeSubTab === "assistants"
                  ? "#FFFFFF"
                  : colors.textSecondary,
              fontWeight: activeSubTab === "assistants" ? "700" : "600",
            }}
          >
            Agents ({assistants.length})
          </Text>
        </Pressable>
      </View>

      {/* 3. CONTACTS TAB VIEW */}
      {activeSubTab === "contacts" && (
        <View className="gap-2.5">
          <View className="flex-row gap-2 w-full">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Import CSV"
              onPress={handleImportCsv}
              className="flex-1 h-[42px] rounded-xl border flex-row items-center justify-center gap-1.5 active:opacity-80"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={15}
                color={colors.primary}
              />
              <Text
                className="text-[13px] font-bold"
                style={{ color: colors.primary }}
              >
                Import CSV
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add Contact"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsCreateModalOpen(true);
              }}
              className="flex-1 h-[42px] rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-85"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="text-white text-[13.5px] font-bold">Add Contact</Text>
            </Pressable>
          </View>

          {/* 3-Metric Stats Row */}
          <View className="flex-row gap-2 w-full">
            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{ flexBasis: 0, backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="people-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Contacts
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.text }}
              >
                {totalContacts}
              </Text>
            </View>

            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{ flexBasis: 0, backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={13}
                  color={colors.green}
                />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Reachability
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.text }}
              >
                {totalContacts > 0 ? "100%" : "0%"}
              </Text>
            </View>

            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{ flexBasis: 0, backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={13} color={colors.amber} />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Active Leads
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.text }}
              >
                {activeLeads}
              </Text>
            </View>
          </View>

          {/* Search Input */}
          <View
            className="flex-row items-center h-10 rounded-xl border px-2.5 gap-1.5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Ionicons name="search" size={15} color={colors.textSecondary} />
            <TextInput
              className="flex-1 text-[13px] font-medium py-0 h-full"
              style={[
                { color: colors.text },
                Platform.OS === "web"
                  ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                  : null,
              ]}
              placeholder="Search name, mobile, email, or company"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={15}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          {/* Filter Dropdowns Row */}
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 h-9 rounded-xl border flex-row items-center justify-between px-2.5 active:opacity-80"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.text }}
              >
                {statusFilter}
              </Text>
              <Ionicons
                name="chevron-down"
                size={13}
                color={colors.textSecondary}
              />
            </Pressable>

            <Pressable
              className="flex-1 h-9 rounded-xl border flex-row items-center justify-between px-2.5 active:opacity-80"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.text }}
              >
                {sourceFilter}
              </Text>
              <Ionicons
                name="chevron-down"
                size={13}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          {/* Contacts List */}
          {isContactsLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 30 }}
            />
          ) : filteredContacts.length === 0 ? (
            <View
              className="rounded-2xl border py-9 px-4 items-center justify-center gap-2"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View
                className="w-[60px] h-[60px] rounded-full items-center justify-center mb-0.5"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="people" size={30} color={colors.primary} />
              </View>
              <Text
                className="text-base font-extrabold tracking-tight"
                style={{ color: colors.text }}
              >
                No contacts found
              </Text>
              <Text
                className="text-xs font-medium text-center max-w-[220px] leading-4"
                style={{ color: colors.textSecondary }}
              >
                Add Contact or Import CSV to begin.
              </Text>
            </View>
          ) : (
            <View
              className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              {filteredContacts.map((cnt, idx, arr) => {
                const initials = getInitials(cnt.name);
                const role =
                  cnt.company ||
                  ((cnt.calls_count || 0) > 0 ? "Customer" : "Lead");

                return (
                  <View key={cnt.id || idx}>
                    <Pressable
                      className="flex-row items-center py-2.5 px-3 gap-2.5 active:opacity-75"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedContact(cnt);
                      }}
                    >
                      <View
                        className="w-[34px] h-[34px] rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primaryLight }}
                      >
                        <Text
                          className="text-xs font-extrabold"
                          style={{ color: colors.primary }}
                        >
                          {initials}
                        </Text>
                      </View>

                      <View className="flex-1 min-w-0 gap-0.5">
                        <Text
                          className="text-[13.5px] font-bold tracking-tight"
                          style={{ color: colors.text }}
                          numberOfLines={1}
                        >
                          {cnt.name}
                        </Text>
                        <Text
                          className="text-[11.5px] font-medium"
                          style={{ color: colors.textSecondary }}
                          numberOfLines={1}
                        >
                          {cnt.phone} • {role}
                        </Text>
                      </View>

                      <Pressable
                        className="w-[30px] h-[30px] rounded-full items-center justify-center mr-0.5 active:opacity-70"
                        style={{ backgroundColor: colors.primaryLight }}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Medium,
                          );
                          setCallTarget({ phone: cnt.phone, name: cnt.name });
                        }}
                      >
                        <Ionicons
                          name="call"
                          size={14}
                          color={colors.primary}
                        />
                      </Pressable>

                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={colors.textSecondary}
                      />
                    </Pressable>

                    {idx < arr.length - 1 && (
                      <View
                        className="h-[1px] ml-14"
                        style={{ backgroundColor: colors.border }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 4. PHONE LINES TAB VIEW */}
      {activeSubTab === "numbers" && (
        <View className="gap-2.5">
          <View className="flex-row gap-2 w-full">
            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{ flexBasis: 0, backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="phone-portrait-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Lines
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.text }}
              >
                {totalNumbers}
              </Text>
            </View>

            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{
                flexBasis: 0,
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : "#DCFCE7",
              }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color={colors.green}
                />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.green }}
                  numberOfLines={1}
                >
                  Bound
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.green }}
              >
                {activeNumbersCount}
              </Text>
            </View>

            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{
                flexBasis: 0,
                backgroundColor: colors.surface,
                borderColor: isDark
                  ? colors.border
                  : "rgba(245, 158, 11, 0.25)",
              }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="pause-circle-outline"
                  size={13}
                  color={colors.amber}
                />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.amber }}
                  numberOfLines={1}
                >
                  Expired
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.amber }}
              >
                {expiredNumbersCount}
              </Text>
            </View>
          </View>

          {/* Web Billing Banner */}
          <Pressable
            onPress={() => openVoicePhoneNumbersSSO(queryClient, isDark)}
            className="flex-row items-center p-2.5 rounded-xl border gap-2.5 active:opacity-85"
            style={{
              backgroundColor: isDark ? "#121320" : "#EEF2FF",
              borderColor: isDark ? "#282664" : "#C7D2FE",
            }}
          >
            <View
              className="w-[30px] h-[30px] rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#1E1B4B" : "#EEF2FF" }}
            >
              <Image
                source={require("../../../../assets/images/logobag.png")}
                style={{ width: 22, height: 22, borderRadius: 5 }}
                resizeMode="contain"
              />
            </View>
            <View className="flex-1 min-w-0 gap-0.5">
              <Text
                className="text-[13px] font-bold tracking-tight"
                style={{ color: isDark ? "#FFFFFF" : "#1E1B4B" }}
                numberOfLines={1}
              >
                Add Dedicated Phone Lines
              </Text>
              <Text
                className="text-[11px] font-medium"
                style={{ color: isDark ? "#94A3B8" : "#4338CA" }}
                numberOfLines={1}
              >
                Buy &amp; renew business numbers on VoicePilot Web
              </Text>
            </View>
            <Ionicons
              name="open-outline"
              size={16}
              color={isDark ? "#818CF8" : "#4F46E5"}
            />
          </Pressable>

          {/* Phone Numbers List */}
          {isNumbersLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 30 }}
            />
          ) : numbers.length === 0 ? (
            <View
              className="rounded-2xl border py-9 px-4 items-center justify-center gap-2"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View
                className="w-[60px] h-[60px] rounded-full items-center justify-center mb-0.5"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text
                className="text-base font-extrabold tracking-tight"
                style={{ color: colors.text }}
              >
                No phone lines found
              </Text>
              <Text
                className="text-xs font-medium text-center max-w-[220px] leading-4"
                style={{ color: colors.textSecondary }}
              >
                Get a dedicated telecom line for your assistants on VoicePilot.
              </Text>
              <Pressable
                onPress={() => openVoicePhoneNumbersSSO(queryClient, isDark)}
                className="mt-2.5 flex-row items-center justify-center bg-[#4F46E5] py-2 px-3.5 rounded-lg gap-1.5 active:opacity-85"
              >
                <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold">
                  Get Dedicated Line · ₹1,499/mo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              {numbers.map((num, idx, arr) => {
                const isExpired = num.isExpired || num.status === "expired";
                const isAssigned = Boolean(num.assigned_assistant_id);

                return (
                  <View key={num.id || idx}>
                    <Pressable
                      className="flex-row items-center py-2.5 px-3 gap-2.5 active:opacity-75"
                      onPress={() => handleAssignBot(num)}
                    >
                      <View
                        className="w-[34px] h-[34px] rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isExpired
                            ? colors.amberLight
                            : isAssigned
                              ? colors.greenLight
                              : colors.primaryLight,
                        }}
                      >
                        <Ionicons
                          name="phone-portrait"
                          size={16}
                          color={
                            isExpired
                              ? colors.amber
                              : isAssigned
                                ? colors.green
                                : colors.primary
                          }
                        />
                      </View>

                      <View className="flex-1 min-w-0 gap-0.5">
                        <View className="flex-row items-center justify-between gap-1.5">
                          <Text
                            className="text-sm font-extrabold tracking-tight"
                            style={{ color: colors.text }}
                            numberOfLines={1}
                          >
                            {num.phone_number}
                          </Text>
                          <View
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: isExpired
                                ? colors.amberLight
                                : isAssigned
                                  ? colors.greenLight
                                  : colors.primaryLight,
                            }}
                          >
                            <Text
                              className="text-[10px] font-bold"
                              style={{
                                color: isExpired
                                  ? "#D97706"
                                  : isAssigned
                                    ? colors.green
                                    : colors.primary,
                              }}
                            >
                              {isExpired
                                ? "Plan Expired"
                                : isAssigned
                                  ? "Active / Bound"
                                  : "Unassigned"}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className="text-[11.5px] font-medium"
                          style={{ color: colors.textSecondary }}
                          numberOfLines={1}
                        >
                          {num.assistants?.name
                            ? `Bound to: ${num.assistants.name}`
                            : isAssigned
                              ? "Bound to Voice Assistant"
                              : "Available (Tap to Bind)"}
                        </Text>
                      </View>

                      <Ionicons
                        name="swap-horizontal"
                        size={15}
                        color={colors.textSecondary}
                      />
                    </Pressable>

                    {idx < arr.length - 1 && (
                      <View
                        className="h-[1px] ml-14"
                        style={{ backgroundColor: colors.border }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 5. AI ASSISTANTS TAB VIEW */}
      {activeSubTab === "assistants" && (
        <View className="gap-2.5">
          <View className="flex-row gap-2 w-full">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create Voice Agent"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsCreateAgentOpen(true);
              }}
              className="flex-1 h-[42px] rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-85"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="text-white text-[13.5px] font-bold">Create Voice Agent</Text>
            </Pressable>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-2 w-full">
            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{ flexBasis: 0, backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons name="mic-outline" size={13} color={colors.primary} />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  Agents
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.text }}
              >
                {assistants.length}
              </Text>
            </View>

            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{
                flexBasis: 0,
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : "#DCFCE7",
              }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="phone-portrait-outline"
                  size={13}
                  color={colors.green}
                />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.green }}
                  numberOfLines={1}
                >
                  Bound Lines
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.green }}
              >
                {boundAssistantsCount}
              </Text>
            </View>

            <View
              className="flex-1 p-2.5 rounded-xl border min-h-[68px] justify-between shadow-sm min-w-0"
              style={{
                flexBasis: 0,
                backgroundColor: colors.surface,
                borderColor: isDark
                  ? colors.border
                  : "rgba(245, 158, 11, 0.25)",
              }}
            >
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="alert-circle-outline"
                  size={13}
                  color={colors.amber}
                />
                <Text
                  className="text-[11px] font-semibold flex-1 min-w-0"
                  style={{ color: colors.amber }}
                  numberOfLines={1}
                >
                  Unassigned
                </Text>
              </View>
              <Text
                className="text-[19px] font-extrabold tracking-tight mt-0.5"
                style={{ color: colors.amber }}
              >
                {Math.max(0, assistants.length - boundAssistantsCount)}
              </Text>
            </View>
          </View>

          {/* Assistants List */}
          {isAssistantsLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 30 }}
            />
          ) : assistants.length === 0 ? (
            <View
              className="rounded-2xl border py-9 px-4 items-center justify-center gap-2"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View
                className="w-[60px] h-[60px] rounded-full items-center justify-center mb-0.5"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="mic-outline" size={30} color={colors.primary} />
              </View>
              <Text
                className="text-base font-extrabold tracking-tight"
                style={{ color: colors.text }}
              >
                No Voice Agents Found
              </Text>
              <Text
                className="text-xs font-medium text-center max-w-[220px] leading-4"
                style={{ color: colors.textSecondary }}
              >
                Create your first AI voice assistant to begin calling prospects.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {assistants.map((ast) => {
                const boundLine = numbers.find(
                  (n) =>
                    n.assigned_assistant_id === ast.id &&
                    !n.isExpired &&
                    n.status !== "expired",
                );
                const isAssigned = Boolean(boundLine?.phone_number);

                return (
                  <View
                    key={ast.id}
                    className="rounded-2xl border p-3 gap-2.5 shadow-sm"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-row items-center gap-2.5">
                      <View
                        className="w-[34px] h-[34px] rounded-xl items-center justify-center"
                        style={{
                          backgroundColor: isAssigned
                            ? colors.greenLight
                            : colors.primaryLight,
                        }}
                      >
                        <Ionicons
                          name="mic"
                          size={16}
                          color={isAssigned ? colors.green : colors.primary}
                        />
                      </View>
                      <View className="flex-1 min-w-0 gap-0.5">
                        <View className="flex-row items-center justify-between gap-1.5">
                          <Text
                            className="text-sm font-bold tracking-tight"
                            style={{ color: colors.text }}
                            numberOfLines={1}
                          >
                            {ast.name}
                          </Text>
                          <View
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: isAssigned
                                ? colors.greenLight
                                : colors.primaryLight,
                            }}
                          >
                            <Text
                              className="text-[9.5px] font-bold capitalize"
                              style={{
                                color: isAssigned
                                  ? colors.green
                                  : colors.primary,
                              }}
                            >
                              {ast.status || "active"}
                            </Text>
                          </View>
                        </View>
                        <Text
                          className="text-[11px] font-medium"
                          style={{ color: colors.textSecondary }}
                          numberOfLines={1}
                        >
                          Voice:{" "}
                          {ast.config_snapshot?.voice?.name || "Neural AI Audio"}
                        </Text>
                      </View>
                    </View>

                    <View
                      className="flex-row items-center justify-between px-2.5 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-row items-center gap-1.5 flex-1 min-w-0">
                        <View
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isAssigned
                              ? colors.green
                              : colors.textSecondary,
                          }}
                        />
                        <Ionicons
                          name="phone-portrait"
                          size={12}
                          color={isAssigned ? colors.green : colors.textSecondary}
                        />
                        <Text
                          className={`text-[11.5px] ${isAssigned ? 'font-bold' : 'font-medium'}`}
                          style={{
                            color: isAssigned
                              ? colors.text
                              : colors.textSecondary,
                          }}
                          numberOfLines={1}
                        >
                          {isAssigned
                            ? `Caller ID: ${boundLine?.phone_number}`
                            : "No Dedicated Line Assigned"}
                        </Text>
                      </View>

                      <View
                        className="px-1.5 py-0.5 rounded ml-2"
                        style={{
                          backgroundColor: isAssigned
                            ? colors.greenLight
                            : colors.amberLight,
                        }}
                      >
                        <Text
                          className="text-[9.5px] font-bold"
                          style={{
                            color: isAssigned ? colors.green : colors.amber,
                          }}
                        >
                          {isAssigned ? "Active" : "Unbound"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable
                        className="flex-1 flex-row items-center justify-center gap-1.5 h-9 rounded-lg active:opacity-85"
                        style={{ backgroundColor: colors.primary }}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setCallTarget({ assistantId: ast.id });
                        }}
                      >
                        <Ionicons name="call" size={13} color="#FFFFFF" />
                        <Text className="text-white text-xs font-bold">Test Call</Text>
                      </Pressable>

                      <Pressable
                        className="flex-1 flex-row items-center justify-center gap-1.5 h-9 rounded-lg border active:opacity-80"
                        style={{
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border,
                        }}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          if (boundLine) {
                            setSelectedNumberToAssign(boundLine);
                          } else if (numbers.length > 0) {
                            setSelectedNumberToAssign(numbers[0]);
                          } else {
                            setActiveSubTab("numbers");
                          }
                        }}
                      >
                        <Ionicons
                          name="link-outline"
                          size={13}
                          color={colors.text}
                        />
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: colors.text }}
                        >
                          {isAssigned ? "Manage Line" : "Assign Line"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Modals */}
      <CreateContactModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (payload) => {
          await createContactMutation.mutateAsync(payload);
        }}
        isLoading={createContactMutation.isPending}
      />

      <CreateAgentModal
        visible={isCreateAgentOpen}
        onClose={() => setIsCreateAgentOpen(false)}
        onSubmit={async (payload) => {
          await createAgentMutation.mutateAsync(payload);
        }}
        isLoading={createAgentMutation.isPending}
      />

      <EditContactModal
        visible={Boolean(editingContact)}
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onSubmit={async (contactId, payload) => {
          await updateContactMutation.mutateAsync({ id: contactId, payload });
        }}
        isLoading={updateContactMutation.isPending}
      />

      <ContactDetailsModal
        visible={Boolean(selectedContact)}
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onCall={(contact) => {
          setSelectedContact(null);
          setCallTarget({ phone: contact.phone, name: contact.name });
        }}
        onEdit={(contact) => {
          setSelectedContact(null);
          setEditingContact(contact);
        }}
        onDelete={async (contactId) => {
          await deleteContactMutation.mutateAsync(contactId);
        }}
      />

      {callTarget && (
        <TriggerCallModal
          visible={Boolean(callTarget)}
          initialPhone={callTarget.phone || ""}
          initialName={callTarget.name || ""}
          initialAssistantId={callTarget.assistantId || ""}
          assistants={assistants}
          onClose={() => setCallTarget(null)}
          onSubmit={async (payload) => {
            await triggerCallMutation.mutateAsync(payload);
          }}
          isLoading={triggerCallMutation.isPending}
        />
      )}

      <AssignNumberModal
        visible={Boolean(selectedNumberToAssign)}
        phoneNumber={selectedNumberToAssign}
        assistants={assistants}
        isLoading={assignPhoneNumberMutation.isPending}
        onClose={() => setSelectedNumberToAssign(null)}
        onAssign={async (numberId, assistantId) => {
          await assignPhoneNumberMutation.mutateAsync({
            numberId,
            assistantId,
          });
        }}
      />
    </ScrollView>
  );
};

