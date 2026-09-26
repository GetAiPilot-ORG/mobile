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
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
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
import { openVoiceWebBilling } from "../utils/voiceBilling";

function getInitials(name: string): string {
  if (!name) return "VP";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ContactsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
            onPress: () => openVoiceWebBilling(queryClient, isDark),
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
    background: isDark ? "#000000" : "#F8F9FA",
    surface: isDark ? "#141418" : "#FFFFFF",
    surfaceAlt: isDark ? "#1C1C22" : "#F1F3F9",
    border: isDark ? "#282832" : "#E2E8F0",
    text: isDark ? "#FFFFFF" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    primary: "#5844E3",
    primaryLight: isDark ? "rgba(88, 68, 227, 0.15)" : "#EEF2FF",
    green: "#16A34A",
    greenLight: isDark ? "rgba(22, 163, 74, 0.15)" : "#DCFCE7",
    amber: "#D97706",
    amberLight: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
    red: "#EF4444",
    redLight: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2",
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
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isContactsRefetching}
          onRefresh={handleRefresh}
          tintColor={isDark ? "#FFFFFF" : colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TITLE & EYEBROW */}
      <View style={styles.headingSection}>
        <Text style={[styles.eyebrowText, { color: colors.textSecondary }]}>
          {activeSubTab === "contacts"
            ? "// AUDIENCE & CRM DATABASE"
            : activeSubTab === "numbers"
            ? "// DEDICATED TELEPHONY LINES"
            : "// VOICE PILOT ENGINE"}
        </Text>
        <Text style={[styles.mainHeading, { color: colors.text }]}>
          {activeSubTab === "contacts"
            ? "Contacts & Leads"
            : activeSubTab === "numbers"
            ? "Dedicated Phone Lines"
            : "AI Voice Assistants"}
        </Text>
        <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
          {activeSubTab === "contacts"
            ? "Manage customer phone numbers and outbound lists."
            : activeSubTab === "numbers"
            ? "Virtual phone lines bound to AI Assistants for calling."
            : "Your AI workforce and their assigned caller IDs."}
        </Text>
      </View>

      {/* 2. 3-WAY SUB-TAB SWITCHER */}
      <View
        style={[
          styles.subTabBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.subTabItem,
            activeSubTab === "contacts" && {
              backgroundColor: colors.primary,
            },
          ]}
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
            style={[
              styles.subTabText,
              {
                color:
                  activeSubTab === "contacts"
                    ? "#FFFFFF"
                    : colors.textSecondary,
                fontWeight: activeSubTab === "contacts" ? "700" : "600",
              },
            ]}
          >
            Contacts ({totalContacts})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.subTabItem,
            activeSubTab === "numbers" && {
              backgroundColor: colors.primary,
            },
          ]}
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
            style={[
              styles.subTabText,
              {
                color:
                  activeSubTab === "numbers"
                    ? "#FFFFFF"
                    : colors.textSecondary,
                fontWeight: activeSubTab === "numbers" ? "700" : "600",
              },
            ]}
          >
            Lines ({totalNumbers})
          </Text>
          {expiredNumbersCount > 0 && (
            <View
              style={[
                styles.expiredBadgeDot,
                {
                  backgroundColor:
                    activeSubTab === "numbers"
                      ? "rgba(255, 255, 255, 0.25)"
                      : isDark
                      ? "rgba(245, 158, 11, 0.2)"
                      : "#FEF3C7",
                },
              ]}
            >
              <Text
                style={[
                  styles.expiredBadgeDotText,
                  {
                    color:
                      activeSubTab === "numbers" ? "#FFFFFF" : "#D97706",
                  },
                ]}
              >
                {expiredNumbersCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.subTabItem,
            activeSubTab === "assistants" && {
              backgroundColor: colors.primary,
            },
          ]}
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
            style={[
              styles.subTabText,
              {
                color:
                  activeSubTab === "assistants"
                    ? "#FFFFFF"
                    : colors.textSecondary,
                fontWeight: activeSubTab === "assistants" ? "700" : "600",
              },
            ]}
          >
            Agents ({assistants.length})
          </Text>
        </Pressable>
      </View>

      {/* 3. CONTACTS TAB VIEW */}
      {activeSubTab === "contacts" && (
        <View style={styles.tabContentContainer}>
          <View style={styles.topActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Import CSV"
              onPress={handleImportCsv}
              style={({ pressed }) => [
                styles.importCsvBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={15}
                color={colors.primary}
              />
              <Text
                style={[styles.importCsvBtnText, { color: colors.primary }]}
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
              style={({ pressed }) => [
                styles.addContactBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addContactBtnText}>Add Contact</Text>
            </Pressable>
          </View>

          {/* 3-Metric Stats Row */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="people-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Contacts
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalContacts}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={13}
                  color={colors.green}
                />
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Reachability
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalContacts > 0 ? "100%" : "0%"}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons name="star" size={13} color={colors.amber} />
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Active Leads
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {activeLeads}
              </Text>
            </View>
          </View>

          {/* Search Input */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={15} color={colors.textSecondary} />
            <TextInput
              style={[
                styles.searchInput,
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
          <View style={styles.dropdownRow}>
            <Pressable
              style={[
                styles.dropdownPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.dropdownPillText, { color: colors.text }]}>
                {statusFilter}
              </Text>
              <Ionicons
                name="chevron-down"
                size={13}
                color={colors.textSecondary}
              />
            </Pressable>

            <Pressable
              style={[
                styles.dropdownPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.dropdownPillText, { color: colors.text }]}>
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
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="people" size={30} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No contacts found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Add Contact or Import CSV to begin.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.contactsListCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {filteredContacts.map((cnt, idx, arr) => {
                const initials = getInitials(cnt.name);
                const role =
                  cnt.company ||
                  ((cnt.calls_count || 0) > 0 ? "Customer" : "Lead");

                return (
                  <View key={cnt.id || idx}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.contactRow,
                        pressed && { opacity: 0.75 },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedContact(cnt);
                      }}
                    >
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: colors.primaryLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarInitials,
                            { color: colors.primary },
                          ]}
                        >
                          {initials}
                        </Text>
                      </View>

                      <View style={styles.contactMainInfo}>
                        <Text
                          style={[
                            styles.contactNameText,
                            { color: colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {cnt.name}
                        </Text>
                        <Text
                          style={[
                            styles.contactRoleText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {cnt.phone} • {role}
                        </Text>
                      </View>

                      <Pressable
                        style={[
                          styles.quickCallBtn,
                          { backgroundColor: colors.primaryLight },
                        ]}
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
                        style={[
                          styles.contactDivider,
                          { backgroundColor: colors.border },
                        ]}
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
        <View style={styles.tabContentContainer}>
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={13}
                  color={colors.primary}
                />
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Lines
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalNumbers}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? colors.border : "#DCFCE7",
                },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color={colors.green}
                />
                <Text
                  style={[styles.statLabel, { color: colors.green }]}
                >
                  Bound
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.green }]}>
                {activeNumbersCount}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark
                    ? colors.border
                    : "rgba(245, 158, 11, 0.25)",
                },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="pause-circle-outline"
                  size={13}
                  color={colors.amber}
                />
                <Text
                  style={[styles.statLabel, { color: colors.amber }]}
                >
                  Expired
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.amber }]}>
                {expiredNumbersCount}
              </Text>
            </View>
          </View>

          {/* Web Billing Banner */}
          <Pressable
            onPress={() => openVoiceWebBilling(queryClient, isDark)}
            style={[
              styles.webManageBanner,
              {
                backgroundColor: isDark ? "#121320" : "#EEF2FF",
                borderColor: isDark ? "#282664" : "#C7D2FE",
              },
            ]}
          >
            <View
              style={[
                styles.webManageIconCircle,
                { backgroundColor: isDark ? "#1E1B4B" : "#EEF2FF" },
              ]}
            >
              <Image
                source={require("../../../../assets/images/logo.png")}
                style={{ width: 22, height: 22, borderRadius: 5 }}
                resizeMode="contain"
              />
            </View>
            <View style={styles.webManageInfo}>
              <Text
                style={[
                  styles.webManageTitle,
                  { color: isDark ? "#FFFFFF" : "#1E1B4B" },
                ]}
              >
                Add Dedicated Phone Lines
              </Text>
              <Text
                style={[
                  styles.webManageSubtitle,
                  { color: isDark ? "#94A3B8" : "#4338CA" },
                ]}
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
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No phone lines found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Get a dedicated telecom line for your assistants on VoicePilot.
              </Text>
              <Pressable
                onPress={() => openVoiceWebBilling(queryClient, isDark)}
                style={styles.addNumberWebButton}
              >
                <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
                <Text style={styles.addNumberWebText}>
                  Get Dedicated Line · ₹1,499/mo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.contactsListCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {numbers.map((num, idx, arr) => {
                const isExpired = num.isExpired || num.status === "expired";
                const isAssigned = Boolean(num.assigned_assistant_id);

                return (
                  <View key={num.id || idx}>
                    <Pressable
                      style={styles.numberRow}
                      onPress={() => handleAssignBot(num)}
                    >
                      <View
                        style={[
                          styles.numberIconCircle,
                          {
                            backgroundColor: isExpired
                              ? colors.amberLight
                              : isAssigned
                              ? colors.greenLight
                              : colors.primaryLight,
                          },
                        ]}
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

                      <View style={styles.numberMainInfo}>
                        <View style={styles.numberHeaderRow}>
                          <Text
                            style={[
                              styles.numberPhoneText,
                              { color: colors.text },
                            ]}
                          >
                            {num.phone_number}
                          </Text>
                          <View
                            style={[
                              styles.numberStatusBadge,
                              {
                                backgroundColor: isExpired
                                  ? colors.amberLight
                                  : isAssigned
                                  ? colors.greenLight
                                  : colors.primaryLight,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.numberStatusText,
                                {
                                  color: isExpired
                                    ? "#D97706"
                                    : isAssigned
                                    ? colors.green
                                    : colors.primary,
                                },
                              ]}
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
                          style={[
                            styles.numberSubText,
                            { color: colors.textSecondary },
                          ]}
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
                        style={[
                          styles.contactDivider,
                          { backgroundColor: colors.border },
                        ]}
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
        <View style={styles.tabContentContainer}>
          <View style={styles.topActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create Voice Agent"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsCreateAgentOpen(true);
              }}
              style={({ pressed }) => [
                styles.addContactBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addContactBtnText}>Create Voice Agent</Text>
            </Pressable>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons name="mic-outline" size={13} color={colors.primary} />
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Agents
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {assistants.length}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? colors.border : "#DCFCE7",
                },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={13}
                  color={colors.green}
                />
                <Text
                  style={[styles.statLabel, { color: colors.green }]}
                >
                  Bound Lines
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.green }]}>
                {boundAssistantsCount}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark
                    ? colors.border
                    : "rgba(245, 158, 11, 0.25)",
                },
              ]}
            >
              <View style={styles.statHeader}>
                <Ionicons
                  name="alert-circle-outline"
                  size={13}
                  color={colors.amber}
                />
                <Text
                  style={[styles.statLabel, { color: colors.amber }]}
                >
                  Unassigned
                </Text>
              </View>
              <Text style={[styles.statValue, { color: colors.amber }]}>
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
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="mic-outline" size={30} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Voice Agents Found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Create your first AI voice assistant to begin calling prospects.
              </Text>
            </View>
          ) : (
            <View style={styles.assistantListContainer}>
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
                    style={[
                      styles.assistantCardItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.astCardHeader}>
                      <View
                        style={[
                          styles.astAvatarWrap,
                          {
                            backgroundColor: isAssigned
                              ? colors.greenLight
                              : colors.primaryLight,
                          },
                        ]}
                      >
                        <Ionicons
                          name="mic"
                          size={16}
                          color={isAssigned ? colors.green : colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <View style={styles.astNameRow}>
                          <Text
                            style={[styles.astTitleText, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {ast.name}
                          </Text>
                          <View
                            style={[
                              styles.astStatusBadge,
                              {
                                backgroundColor: isAssigned
                                  ? colors.greenLight
                                  : colors.primaryLight,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.astStatusBadgeText,
                                {
                                  color: isAssigned
                                    ? colors.green
                                    : colors.primary,
                                },
                              ]}
                            >
                              {ast.status || "active"}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.astVoiceText,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          Voice:{" "}
                          {ast.config_snapshot?.voice?.name || "Neural AI Audio"}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.astLineBar,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.astLineLeft}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isAssigned
                                ? colors.green
                                : colors.textSecondary,
                            },
                          ]}
                        />
                        <Ionicons
                          name="phone-portrait"
                          size={12}
                          color={isAssigned ? colors.green : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.astLineNumberText,
                            {
                              color: isAssigned
                                ? colors.text
                                : colors.textSecondary,
                              fontWeight: isAssigned ? "700" : "500",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {isAssigned
                            ? `Caller ID: ${boundLine?.phone_number}`
                            : "No Dedicated Line Assigned"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.astLinePill,
                          {
                            backgroundColor: isAssigned
                              ? colors.greenLight
                              : colors.amberLight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.astLinePillText,
                            {
                              color: isAssigned ? colors.green : colors.amber,
                            },
                          ]}
                        >
                          {isAssigned ? "Active" : "Unbound"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.astActionsRow}>
                      <Pressable
                        style={[
                          styles.astTestCallBtn,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setCallTarget({ assistantId: ast.id });
                        }}
                      >
                        <Ionicons name="call" size={13} color="#FFFFFF" />
                        <Text style={styles.astTestCallText}>Test Call</Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.astManageLineBtn,
                          {
                            backgroundColor: colors.surfaceAlt,
                            borderColor: colors.border,
                          },
                        ]}
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
                          style={[
                            styles.astManageLineText,
                            { color: colors.text },
                          ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 100,
    gap: 12,
  },
  headingSection: {
    paddingTop: 2,
    gap: 2,
  },
  eyebrowText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  mainHeading: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "500",
  },
  topActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  importCsvBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  importCsvBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  addContactBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  addContactBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 68,
    justifyContent: "space-between",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  statValue: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 0,
    height: "100%",
  },
  dropdownRow: {
    flexDirection: "row",
    gap: 8,
  },
  dropdownPill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  dropdownPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 220,
    lineHeight: 16,
  },
  contactsListCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: "800",
  },
  contactMainInfo: {
    flex: 1,
    gap: 1,
  },
  contactNameText: {
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  contactRoleText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  quickCallBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  contactDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  subTabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  subTabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 9,
    gap: 4,
  },
  subTabText: {
    fontSize: 12,
  },
  expiredBadgeDot: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  expiredBadgeDotText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
  tabContentContainer: {
    gap: 10,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 10,
  },
  numberIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  numberMainInfo: {
    flex: 1,
    gap: 2,
  },
  numberHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  numberPhoneText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  numberStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  numberStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  numberSubText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  webManageBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  webManageIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  webManageInfo: {
    flex: 1,
    gap: 1,
  },
  webManageTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  webManageSubtitle: {
    fontSize: 11,
    fontWeight: "500",
  },
  addNumberWebButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  addNumberWebText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  assistantListContainer: {
    gap: 10,
  },
  assistantCardItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 9,
  },
  astCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  astAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  astNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  astTitleText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  astStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  astStatusBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  astVoiceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  astLineBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  astLineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  astLineNumberText: {
    fontSize: 11.5,
  },
  astLinePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  astLinePillText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  astActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  astTestCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    borderRadius: 8,
  },
  astTestCallText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  astManageLineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
  },
  astManageLineText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
