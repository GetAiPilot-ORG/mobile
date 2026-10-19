import {
  ProductButton,
  ProductEmpty,
  ProductHeading,
  ProductMetrics,
  ProductRow,
  ProductSection,
} from "@/components/ProductUI";
import { ArrowRight01Icon } from "@/constants/icons";
import { getColors, useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
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
  VoicePlanExpiredBanner,
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
            text: "Renew on VoicePilot",
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
    primary: themeColors.products?.voice || "#5B3AF5",
    primaryLight:
      themeColors.products?.voiceSoft ||
      (isDark ? "rgba(91, 58, 245, 0.2)" : "#EDE9FE"),
    green: themeColors.success,
    greenLight: themeColors.successSoft,
    amber: themeColors.warning,
    amberLight: themeColors.warningSoft,
    red: themeColors.destructive,
    redLight: themeColors.destructiveSoft,
    card: themeColors.card,
    mint: isDark ? "#263D3D" : "#D8F0F0",
    lavender: isDark ? "#39304A" : "#E7DEFA",
    peach: isDark ? "#49372D" : "#F9E5D4",
    pink: isDark ? "#46303C" : "#F7DFE9",
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
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 120,
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
      {/* 1. HEADING */}
      <ProductHeading
        title={
          activeSubTab === "contacts"
            ? "Contacts & Leads"
            : activeSubTab === "numbers"
              ? "Dedicated Lines"
              : "Voice Agents"
        }
        description={
          activeSubTab === "contacts"
            ? "Manage customer phone numbers and outbound lists."
            : activeSubTab === "numbers"
              ? "Virtual phone lines bound to AI Assistants for calling."
              : "Your AI workforce and their assigned caller IDs."
        }
      />

      {/* PLAN EXPIRED BANNER */}
      {Boolean(overviewData?.isPlanExpired) && (
        <VoicePlanExpiredBanner overview={overviewData} />
      )}

      {/* 2. SUB-TAB SWITCHER */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: 30,
          padding: 4,
          marginBottom: 16,
          gap: 4,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 24,
            gap: 6,
            backgroundColor:
              activeSubTab === "contacts" ? colors.primary : "transparent",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSubTab("contacts");
          }}
        >
          <Ionicons
            name="people"
            size={14}
            color={
              activeSubTab === "contacts" ? "#FFFFFF" : colors.textSecondary
            }
          />
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: activeSubTab === "contacts" ? "700" : "500",
              color:
                activeSubTab === "contacts" ? "#FFFFFF" : colors.textSecondary,
            }}
          >
            Contacts ({totalContacts})
          </Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 24,
            gap: 6,
            backgroundColor:
              activeSubTab === "numbers" ? colors.primary : "transparent",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSubTab("numbers");
          }}
        >
          <Ionicons
            name="phone-portrait"
            size={14}
            color={
              activeSubTab === "numbers" ? "#FFFFFF" : colors.textSecondary
            }
          />
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: activeSubTab === "numbers" ? "700" : "500",
              color:
                activeSubTab === "numbers" ? "#FFFFFF" : colors.textSecondary,
            }}
          >
            Lines ({totalNumbers})
          </Text>
          {expiredNumbersCount > 0 && (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor:
                  activeSubTab === "numbers"
                    ? "rgba(255, 255, 255, 0.25)"
                    : colors.amberLight,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: activeSubTab === "numbers" ? "#FFFFFF" : colors.amber,
                }}
              >
                {expiredNumbersCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 24,
            gap: 6,
            backgroundColor:
              activeSubTab === "assistants" ? colors.primary : "transparent",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSubTab("assistants");
          }}
        >
          <Ionicons
            name="mic"
            size={14}
            color={
              activeSubTab === "assistants" ? "#FFFFFF" : colors.textSecondary
            }
          />
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: activeSubTab === "assistants" ? "700" : "500",
              color:
                activeSubTab === "assistants" ? "#FFFFFF" : colors.textSecondary,
            }}
          >
            Agents ({assistants.length})
          </Text>
        </Pressable>
      </View>

      {/* 3. CONTACTS TAB VIEW */}
      {activeSubTab === "contacts" && (
        <>
          {/* Side-by-Side Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              width: "100%",
            }}
          >
            <View style={{ flex: 1 }}>
              <ProductButton
                label="Add Contact"
                icon="add"
                fullWidth
                onPress={() => setIsCreateModalOpen(true)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ProductButton
                label="Import CSV"
                secondary
                icon="cloud-upload-outline"
                fullWidth
                onPress={handleImportCsv}
              />
            </View>
          </View>

          <ProductMetrics
            items={[
              { label: "Contacts", value: totalContacts },
              {
                label: "Reachability",
                value: totalContacts > 0 ? "100%" : "0%",
              },
              { label: "Active leads", value: activeLeads },
            ]}
          />

          {/* Search input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 20,
              paddingHorizontal: 16,
              height: 48,
              marginBottom: 16,
              gap: 10,
            }}
          >
            <Ionicons name="search" size={17} color={colors.textSecondary} />
            <TextInput
              style={[
                {
                  flex: 1,
                  fontSize: 13.5,
                  color: colors.text,
                  height: "100%",
                  paddingVertical: 0,
                },
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
              <Pressable hitSlop={8} onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          <ProductSection title="All contacts">
            {isContactsLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : filteredContacts.length === 0 ? (
              <ProductEmpty
                title="No contacts found"
                description="Add contacts or import a CSV list to start reaching out."
                action="Add contact"
                onAction={() => setIsCreateModalOpen(true)}
              />
            ) : (
              filteredContacts.map((cnt, idx) => {
                const role =
                  cnt.company ||
                  ((cnt.calls_count || 0) > 0 ? "Customer" : "Lead");

                return (
                  <ProductRow
                    key={cnt.id || idx}
                    title={cnt.name}
                    detail={[cnt.phone, role].filter(Boolean).join(" · ")}
                    icon="person-outline"
                    tone="lavender"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedContact(cnt);
                    }}
                    trailing={
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Pressable
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Call ${cnt.name}`}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: colors.primaryLight,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onPress={(e) => {
                            e.stopPropagation();
                            Haptics.ImpactFeedbackStyle &&
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Medium,
                              );
                            setCallTarget({ phone: cnt.phone, name: cnt.name });
                          }}
                        >
                          <Ionicons
                            name="call"
                            size={15}
                            color={colors.primary}
                          />
                        </Pressable>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={16}
                          color={colors.textSecondary}
                          strokeWidth={2}
                        />
                      </View>
                    }
                  />
                );
              })
            )}
          </ProductSection>
        </>
      )}

      {/* 4. PHONE LINES TAB VIEW */}
      {activeSubTab === "numbers" && (
        <>
          <View style={{ marginBottom: 16, width: "100%" }}>
            <ProductButton
              label="Get Dedicated Line"
              icon="globe-outline"
              fullWidth
              onPress={() => openVoicePhoneNumbersSSO(queryClient, isDark)}
            />
          </View>

          <ProductMetrics
            items={[
              { label: "Phone lines", value: totalNumbers },
              { label: "Active", value: activeNumbersCount },
              { label: "Expired", value: expiredNumbersCount },
            ]}
          />

          {/* Web Billing Link Card */}
          <Pressable
            onPress={() => openVoicePhoneNumbersSSO(queryClient, isDark)}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: 22,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: colors.lavender,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../../../../assets/images/logobag.png")}
                style={{ width: 24, height: 24, borderRadius: 6 }}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: colors.text }}
              >
                Add Dedicated Phone Lines
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Buy &amp; renew business numbers on VoicePilot Web
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
          </Pressable>

          <ProductSection title="Dedicated phone lines">
            {isNumbersLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : numbers.length === 0 ? (
              <ProductEmpty
                title="No phone lines found"
                description="Get a dedicated telecom line for your assistants on VoicePilot."
                action="Get dedicated line"
                onAction={() => openVoicePhoneNumbersSSO(queryClient, isDark)}
              />
            ) : (
              numbers.map((num, idx) => {
                const isExpired = num.isExpired || num.status === "expired";
                const isAssigned = Boolean(num.assigned_assistant_id);

                return (
                  <ProductRow
                    key={num.id || idx}
                    title={num.phone_number}
                    detail={
                      num.assistants?.name
                        ? `Bound to: ${num.assistants.name}`
                        : isAssigned
                          ? "Bound to Voice Assistant"
                          : "Available (Tap to bind)"
                    }
                    icon="phone-portrait-outline"
                    tone={isExpired ? "pink" : isAssigned ? "mint" : "lavender"}
                    onPress={() => handleAssignBot(num)}
                    trailing={
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 14,
                            backgroundColor: isExpired
                              ? colors.amberLight
                              : isAssigned
                                ? colors.greenLight
                                : colors.primaryLight,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: isExpired
                                ? colors.amber
                                : isAssigned
                                  ? colors.green
                                  : colors.primary,
                            }}
                          >
                            {isExpired
                              ? "Expired"
                              : isAssigned
                                ? "Active"
                                : "Unbound"}
                          </Text>
                        </View>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={16}
                          color={colors.textSecondary}
                          strokeWidth={2}
                        />
                      </View>
                    }
                  />
                );
              })
            )}
          </ProductSection>
        </>
      )}

      {/* 5. AI ASSISTANTS TAB VIEW */}
      {activeSubTab === "assistants" && (
        <>
          <View style={{ marginBottom: 16, width: "100%" }}>
            <ProductButton
              label="Create Voice Agent"
              icon="add"
              fullWidth
              onPress={() => setIsCreateAgentOpen(true)}
            />
          </View>

          <ProductMetrics
            items={[
              { label: "Voice agents", value: assistants.length },
              { label: "Bound lines", value: boundAssistantsCount },
              {
                label: "Unassigned",
                value: Math.max(0, assistants.length - boundAssistantsCount),
              },
            ]}
          />

          <ProductSection title="All voice agents">
            {isAssistantsLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : assistants.length === 0 ? (
              <ProductEmpty
                title="No voice agents found"
                description="Create your first AI voice assistant to begin calling prospects."
                action="Create agent"
                onAction={() => setIsCreateAgentOpen(true)}
              />
            ) : (
              assistants.map((ast) => {
                const boundLine = numbers.find(
                  (n) =>
                    n.assigned_assistant_id === ast.id &&
                    !n.isExpired &&
                    n.status !== "expired",
                );
                const isAssigned = Boolean(boundLine?.phone_number);

                return (
                  <ProductRow
                    key={ast.id}
                    title={ast.name}
                    detail={
                      isAssigned
                        ? `Bound: ${boundLine?.phone_number}`
                        : `No line assigned · ${ast.config_snapshot?.voice?.name || "Neural AI Audio"}`
                    }
                    icon="mic-outline"
                    tone={isAssigned ? "mint" : "peach"}
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
                    trailing={
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Pressable
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Test call ${ast.name}`}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                            backgroundColor: colors.primary,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 18,
                          }}
                          onPress={(e) => {
                            e.stopPropagation();
                            Haptics.ImpactFeedbackStyle &&
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Medium,
                              );
                            setCallTarget({ assistantId: ast.id });
                          }}
                        >
                          <Ionicons name="call" size={12} color="#FFFFFF" />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: "#FFFFFF",
                            }}
                          >
                            Test Call
                          </Text>
                        </Pressable>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={16}
                          color={colors.textSecondary}
                          strokeWidth={2}
                        />
                      </View>
                    }
                  />
                );
              })
            )}
          </ProductSection>
        </>
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

