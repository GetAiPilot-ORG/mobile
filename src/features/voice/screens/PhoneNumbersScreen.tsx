import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { DedicatedNumber, voiceApi, VoiceAssistant } from '../api/voiceApi';
import {
  AssignAssistantModal,
  BuyDedicatedNumberModal,
  KycRequestModal,
  TopUpCreditsModal,
  TriggerCallModal,
} from '../components';

type ViewTab = 'my_numbers' | 'inventory';

export const PhoneNumbersScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ViewTab>('my_numbers');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Modals state
  const [selectedNumberForAssign, setSelectedNumberForAssign] = useState<DedicatedNumber | null>(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [testCallNumber, setTestCallNumber] = useState<string | null>(null);

  // 1. Queries
  const {
    data: numbersData,
    isLoading: isNumbersLoading,
    refetch: refetchNumbers,
    isRefetching: isNumbersRefetching,
  } = useQuery({
    queryKey: ['voice', 'numbers'],
    queryFn: () => voiceApi.getNumbers(),
  });

  const {
    data: availableNumbers,
    isLoading: isAvailableLoading,
    refetch: refetchAvailable,
  } = useQuery({
    queryKey: ['voice', 'availableNumbers'],
    queryFn: () => voiceApi.getAvailableNumbers(),
  });

  const { data: assistantsData } = useQuery({
    queryKey: ['voice', 'assistants'],
    queryFn: () => voiceApi.getAssistants(),
  });

  const {
    data: balanceData,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['voice', 'balance'],
    queryFn: () => voiceApi.getBalanceStatus(),
  });

  const {
    data: kycData,
    refetch: refetchKyc,
  } = useQuery({
    queryKey: ['voice', 'kyc'],
    queryFn: () => voiceApi.getKycStatus(),
  });

  // 2. Mutations
  const assignMutation = useMutation({
    mutationFn: ({ numberId, assistantId }: { numberId: string; assistantId: string }) =>
      voiceApi.assignPhoneNumber({ numberId, assistantId }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'analytics'] });
    },
    onError: (err: any) => {
      Alert.alert('Assignment Error', err?.message || 'Could not assign assistant.');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (numberId: string) => voiceApi.unassignPhoneNumber(numberId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] });
    },
    onError: (err: any) => {
      Alert.alert('Unassign Error', err?.message || 'Could not unassign number.');
    },
  });

  const claimMutation = useMutation({
    mutationFn: (phoneNumber: string) => voiceApi.claimDedicatedNumber({ phoneNumber }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['voice', 'numbers'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'availableNumbers'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'billing'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'balance'] });
    },
  });

  const topUpMutation = useMutation({
    mutationFn: (amount: number) => voiceApi.topUpCredits(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'billing'] });
    },
  });

  const triggerCallMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.triggerOutboundCall(payload),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['voice', 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'balance'] });
    },
  });

  const kycMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.submitKycRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'kyc'] });
    },
  });

  const isRefreshing = isNumbersRefetching;

  const handleRefresh = () => {
    refetchNumbers();
    refetchAvailable();
    refetchBalance();
    refetchKyc();
  };

  const handleCopy = async (phoneNumber: string) => {
    await Clipboard.setStringAsync(phoneNumber);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedNumber(phoneNumber);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const myNumbers: DedicatedNumber[] = numbersData || [];
  const inventory = availableNumbers || [];
  const assistants: VoiceAssistant[] = assistantsData || [];

  const balance = balanceData || {
    availableBalance: 0,
    availableMinutes: 0,
    totalCreditsEarned: 0,
    totalCreditsUsed: 0,
    reservedCredits: 0,
    status: 'depleted' as const,
    formattedBalance: '₹0.00',
    ratePerMinute: '₹1.00/min',
    planName: '',
    planRenewalDate: '',
    dedicatedNumberEntitlements: 0,
  };

  const activeCount = myNumbers.filter((n) => n.status === 'active' && n.assistants).length;
  const unassignedCount = myNumbers.filter((n) => n.status !== 'active' || !n.assistants).length;
  const isPlanExpired =
    Boolean(balanceData) &&
    (balance.status === 'depleted' || balance.status === 'low' || !balance.planName);

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? '#FFFFFF' : '#8B5CF6'}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TOP HEADER WITH BREADCRUMB & CALLING BALANCE PILL */}
      <View style={styles.headerSection}>
        <View style={styles.headerLeft}>
          <View style={styles.breadcrumbRow}>
            <Text style={styles.breadcrumbText}>// PHONE NUMBERS</Text>
            <View style={styles.liveGatewayBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveGatewayText}>Live Gateway</Text>
            </View>
          </View>
          <Text style={[styles.mainTitle, isDark && styles.textDark]}>Phone Numbers</Text>
          <Text style={styles.mainSubtitle}>
            Bind virtual phone lines directly to your GAP AI Voice Assistants for instant inbound &
            outbound calling.
          </Text>
        </View>

        {/* Top-Right AI Calling Balance Pill */}
        <Pressable
          style={[styles.balancePill, isDark ? styles.balancePillDark : styles.balancePillLight]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsTopUpModalOpen(true);
          }}
        >
          <View style={styles.walletIconCircle}>
            <Ionicons name="wallet-outline" size={15} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.balancePillLabel}>AI Calling Balance</Text>
            <Text style={styles.balancePillValue}>
              <Text style={styles.balanceMinsBold}>
                {balance.availableMinutes.toLocaleString('en-IN')} Mins
              </Text>{' '}
              <Text style={styles.balanceStatusNote}>
                ({isPlanExpired ? 'Plan Expired' : 'Active'})
              </Text>
            </Text>
          </View>
        </Pressable>
      </View>

      {/* 2. PLAN EXPIRED / RENEWAL BANNER */}
      {isPlanExpired && (
        <View style={[styles.expiredBanner, isDark ? styles.expiredBannerDark : styles.expiredBannerLight]}>
          <View style={styles.expiredIconBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.expiredTitle}>
              Your {balance.planName || 'CALL ELITE'} Plan has Expired
            </Text>
            <Text style={styles.expiredDesc}>
              Your wallet balance of{' '}
              <Text style={{ fontWeight: '700' }}>
                {balance.availableMinutes.toLocaleString('en-IN')} AI Mins
              </Text>{' '}
              is preserved. Renew your 30-day plan to keep your dedicated lines and voice agents fully
              active.
            </Text>
          </View>
          <Pressable
            style={styles.renewButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsTopUpModalOpen(true);
            }}
          >
            <Text style={styles.renewButtonText}>Renew Plan</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* 3. TAB SWITCHER BUTTONS */}
      <View style={styles.tabSwitcherRow}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'my_numbers'
              ? isDark
                ? styles.tabActiveDark
                : styles.tabActiveLight
              : styles.tabInactive,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('my_numbers');
          }}
        >
          <Ionicons
            name="call-outline"
            size={15}
            color={
              activeTab === 'my_numbers'
                ? isDark
                  ? '#FFFFFF'
                  : '#111827'
                : '#6B7280'
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'my_numbers' && (isDark ? styles.textDark : styles.textLightBold),
            ]}
          >
            My Numbers
          </Text>
          <View
            style={[
              styles.countBadge,
              activeTab === 'my_numbers' ? styles.countBadgeActive : styles.countBadgeInactive,
            ]}
          >
            <Text style={styles.countBadgeText}>{myNumbers.length}</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.tabButton, styles.tabInactive]}
          onPress={() => {
            Haptics.selectionAsync();
            setIsKycModalOpen(true);
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={15} color="#10B981" />
          <Text style={[styles.tabButtonText, { color: isDark ? '#F3F4F6' : '#374151' }]}>
            Request Number (KYC)
          </Text>
        </Pressable>

        {inventory.length > 0 && (
          <Pressable
            style={[
              styles.tabButton,
              activeTab === 'inventory'
                ? isDark
                  ? styles.tabActiveDark
                  : styles.tabActiveLight
                : styles.tabInactive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('inventory');
            }}
          >
            <Ionicons
              name="globe-outline"
              size={15}
              color={
                activeTab === 'inventory'
                  ? isDark
                    ? '#FFFFFF'
                    : '#111827'
                  : '#6B7280'
              }
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'inventory' && (isDark ? styles.textDark : styles.textLightBold),
              ]}
            >
              Inventory Pool
            </Text>
            <View style={styles.countBadgeInactive}>
              <Text style={styles.countBadgeText}>{inventory.length}</Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* 4. 3 KPI STAT CARDS */}
      <View style={styles.kpiRow}>
        {/* Card 1: PURCHASED LINES */}
        <View style={[styles.kpiCard, isDark ? styles.kpiCardDark : styles.kpiCardLight]}>
          <View style={styles.kpiCardHeader}>
            <Text style={styles.kpiCardLabel}>PURCHASED LINES</Text>
            <View style={[styles.kpiIconBox, { backgroundColor: isDark ? '#26262B' : '#F3F4F6' }]}>
              <Ionicons name="call-outline" size={16} color={isDark ? '#9CA3AF' : '#4B5563'} />
            </View>
          </View>
          <Text style={[styles.kpiCardValue, isDark && styles.textDark]}>{myNumbers.length}</Text>
          <Text style={styles.kpiCardSub}>Total dedicated phone lines in pool</Text>
        </View>

        {/* Card 2: ACTIVE / ASSIGNED */}
        <View style={[styles.kpiCard, isDark ? styles.kpiCardGreenDark : styles.kpiCardGreenLight]}>
          <View style={styles.kpiCardHeader}>
            <Text style={[styles.kpiCardLabel, { color: '#059669' }]}>ACTIVE / ASSIGNED</Text>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="flash" size={16} color="#10B981" />
            </View>
          </View>
          <Text style={[styles.kpiCardValue, { color: '#059669' }]}>{activeCount}</Text>
          <Text style={[styles.kpiCardSub, { color: '#047857' }]}>
            Bound to AI Voice Assistant bots
          </Text>
        </View>

        {/* Card 3: UNASSIGNED POOL */}
        <View style={[styles.kpiCard, isDark ? styles.kpiCardPurpleDark : styles.kpiCardPurpleLight]}>
          <View style={styles.kpiCardHeader}>
            <Text style={[styles.kpiCardLabel, { color: '#7C3AED' }]}>UNASSIGNED POOL</Text>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="mail-outline" size={16} color="#8B5CF6" />
            </View>
          </View>
          <Text style={[styles.kpiCardValue, { color: '#7C3AED' }]}>{unassignedCount}</Text>
          <Text style={[styles.kpiCardSub, { color: '#6D28D9' }]}>
            Available lines ready for assignment
          </Text>
        </View>
      </View>

      {/* 5. TABLE / CARD LIST WITH COLUMN HEADERS */}
      <View style={[styles.tableContainer, isDark ? styles.tableDark : styles.tableLight]}>
        {/* Table Column Headers Bar */}
        <View style={[styles.tableHeaderRow, isDark ? styles.tableHeaderDark : styles.tableHeaderLight]}>
          <Text style={[styles.tableColHeader, { flex: 1.6 }]}>PHONE LINE</Text>
          <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'center' }]}>PROVIDER</Text>
          <Text style={[styles.tableColHeader, { flex: 2 }]}>ASSIGNED AI ASSISTANT</Text>
          <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
          <Text style={[styles.tableColHeader, { flex: 1.4, textAlign: 'right' }]}>QUICK ACTIONS</Text>
        </View>

        {/* Data Rows */}
        {activeTab === 'my_numbers' ? (
          myNumbers.length === 0 ? (
            <View style={styles.emptyTableBox}>
              <Ionicons name="call-outline" size={32} color="#9CA3AF" />
              <Text style={[styles.emptyTableTitle, isDark && styles.textDark]}>
                No Dedicated Numbers Claimed Yet
              </Text>
              <Text style={styles.emptyTableSubtitle}>
                Request a dedicated line or submit enterprise KYC to bind AI assistants.
              </Text>
              <Pressable
                style={[styles.emptyActionBtn, { backgroundColor: '#8B5CF6' }]}
                onPress={() => setIsBuyModalOpen(true)}
              >
                <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Claim Virtual Number</Text>
              </Pressable>
            </View>
          ) : (
            myNumbers.map((item, index) => {
              const isAssigned = item.status === 'active' && item.assistants;
              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.tableRow,
                    index < myNumbers.length - 1 && styles.rowBorderBottom,
                    isDark ? styles.rowDark : styles.rowLight,
                  ]}
                >
                  {/* Col 1: Phone Line */}
                  <View style={[styles.colCell, { flex: 1.6, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    <View style={[styles.phoneIconBox, { backgroundColor: isDark ? '#26262B' : '#F3F4F6' }]}>
                      <Ionicons name="call" size={14} color={isDark ? '#9CA3AF' : '#4B5563'} />
                    </View>
                    <Text style={[styles.phoneNumberText, isDark && styles.textDark]}>
                      {item.phone_number}
                    </Text>
                    <Pressable
                      hitSlop={8}
                      onPress={() => handleCopy(item.phone_number)}
                      style={styles.copyBtn}
                    >
                      <Ionicons
                        name={copiedNumber === item.phone_number ? 'checkmark' : 'copy-outline'}
                        size={14}
                        color={copiedNumber === item.phone_number ? '#10B981' : '#9CA3AF'}
                      />
                    </Pressable>
                  </View>

                  {/* Col 2: Provider */}
                  <View style={[styles.colCell, { flex: 1.2, alignItems: 'center' }]}>
                    <View style={[styles.providerPill, isDark ? styles.providerDark : styles.providerLight]}>
                      <Ionicons name="globe-outline" size={11} color="#6B7280" />
                      <Text style={styles.providerText}>
                        {(item.provider || 'VOICEPILOT').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Col 3: Assigned AI Assistant Dropdown */}
                  <View style={[styles.colCell, { flex: 2 }]}>
                    <Pressable
                      style={[
                        styles.assistantPickerBtn,
                        isDark ? styles.assistantBtnDark : styles.assistantBtnLight,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedNumberForAssign(item);
                      }}
                    >
                      <Ionicons
                        name={item.assistants ? 'hardware-chip-outline' : 'person-outline'}
                        size={13}
                        color={item.assistants ? '#8B5CF6' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.assistantBtnText,
                          isDark && styles.textDark,
                          !item.assistants && { color: '#6B7280' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.assistants?.name || 'Unassigned'}
                      </Text>
                      <Ionicons name="chevron-down" size={12} color="#9CA3AF" />
                    </Pressable>
                  </View>

                  {/* Col 4: Status */}
                  <View style={[styles.colCell, { flex: 1.2, alignItems: 'center' }]}>
                    <View
                      style={[
                        styles.statusPill,
                        isAssigned ? styles.statusPillGreen : styles.statusPillGray,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isAssigned ? '#10B981' : '#9CA3AF' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: isAssigned ? '#059669' : '#6B7280' },
                        ]}
                      >
                        {isAssigned ? 'ACTIVE' : 'UNASSIGNED'}
                      </Text>
                    </View>
                  </View>

                  {/* Col 5: Quick Actions */}
                  <View style={[styles.colCell, { flex: 1.4, alignItems: 'flex-end', justifyContent: 'center' }]}>
                    {isAssigned ? (
                      <View style={styles.actionsRow}>
                        <Pressable
                          style={styles.testCallActionBtn}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setTestCallNumber(item.phone_number);
                          }}
                        >
                          <Ionicons name="call" size={12} color="#3B82F6" />
                          <Text style={styles.testCallActionText}>Test Call</Text>
                        </Pressable>

                        <Pressable
                          style={styles.unassignActionBtn}
                          onPress={() => {
                            Alert.alert(
                              'Unassign Line',
                              `Unbind assistant from ${item.phone_number}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Unassign',
                                  style: 'destructive',
                                  onPress: () => unassignMutation.mutate(item.id),
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="close" size={13} color="#EF4444" />
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.noActionsText}>No actions</Text>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : (
          /* Inventory Pool Tab */
          inventory.length === 0 ? (
            <View style={styles.emptyTableBox}>
              <Ionicons name="globe-outline" size={32} color="#9CA3AF" />
              <Text style={[styles.emptyTableTitle, isDark && styles.textDark]}>
                No Pool Numbers Available
              </Text>
              <Text style={styles.emptyTableSubtitle}>
                All virtual lines are allocated. Submit a custom line request.
              </Text>
            </View>
          ) : (
            inventory.map((item, index) => (
              <View
                key={item.id || index}
                style={[
                  styles.tableRow,
                  index < inventory.length - 1 && styles.rowBorderBottom,
                  isDark ? styles.rowDark : styles.rowLight,
                ]}
              >
                <View style={[styles.colCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <View style={[styles.phoneIconBox, { backgroundColor: isDark ? '#26262B' : '#F3F4F6' }]}>
                    <Ionicons name="call-outline" size={14} color="#8B5CF6" />
                  </View>
                  <Text style={[styles.phoneNumberText, isDark && styles.textDark]}>
                    {item.phone_number}
                  </Text>
                </View>

                <View style={[styles.colCell, { flex: 1.5, alignItems: 'center' }]}>
                  <View style={[styles.providerPill, isDark ? styles.providerDark : styles.providerLight]}>
                    <Text style={styles.providerText}>READY TO CLAIM</Text>
                  </View>
                </View>

                <View style={[styles.colCell, { flex: 2, alignItems: 'flex-end' }]}>
                  <Pressable
                    style={[styles.claimNowBtn, claimMutation.isPending && { opacity: 0.6 }]}
                    disabled={claimMutation.isPending}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      claimMutation.mutate(item.phone_number);
                    }}
                  >
                    {claimMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.claimNowBtnText}>Claim Line</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ))
          )
        )}
      </View>

      {/* Modals */}
      {selectedNumberForAssign && (
        <AssignAssistantModal
          visible={Boolean(selectedNumberForAssign)}
          phoneNumber={selectedNumberForAssign.phone_number}
          numberId={selectedNumberForAssign.id}
          currentAssistantId={selectedNumberForAssign.assistants?.id}
          assistants={assistants}
          onClose={() => setSelectedNumberForAssign(null)}
          onAssign={async (numberId, assistantId) => {
            await assignMutation.mutateAsync({ numberId, assistantId });
          }}
          isLoading={assignMutation.isPending}
        />
      )}

      <TopUpCreditsModal
        visible={isTopUpModalOpen}
        currentBalance={balance.availableBalance}
        onClose={() => setIsTopUpModalOpen(false)}
        onTopUp={async (amount) => {
          await topUpMutation.mutateAsync(amount);
        }}
        isLoading={topUpMutation.isPending}
      />

      <KycRequestModal
        visible={isKycModalOpen}
        kycData={kycData}
        onClose={() => setIsKycModalOpen(false)}
        onSubmit={async (payload) => {
          await kycMutation.mutateAsync(payload);
        }}
        isLoading={kycMutation.isPending}
      />

      <BuyDedicatedNumberModal
        visible={isBuyModalOpen}
        availableNumbers={availableNumbers || []}
        onClose={() => setIsBuyModalOpen(false)}
        onClaim={async (phoneNumber) => {
          await claimMutation.mutateAsync(phoneNumber);
        }}
        isLoading={claimMutation.isPending}
      />

      <TriggerCallModal
        visible={Boolean(testCallNumber)}
        initialPhone={testCallNumber || ''}
        assistants={assistantsData || []}
        onClose={() => setTestCallNumber(null)}
        onSubmit={async (payload) => {
          await triggerCallMutation.mutateAsync(payload);
        }}
        isLoading={triggerCallMutation.isPending}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F9FAFB' },
  containerDark: { backgroundColor: '#09090B' },
  contentContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130, gap: 16 },

  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: { flex: 1 },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  breadcrumbText: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  liveGatewayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveGatewayText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },

  // Balance Pill Top Right
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  balancePillLight: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  balancePillDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  walletIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balancePillLabel: {
    fontSize: 9.5,
    color: '#6B7280',
    fontWeight: '600',
  },
  balancePillValue: {
    fontSize: 12,
    color: '#111827',
    marginTop: 1,
  },
  balanceMinsBold: {
    fontWeight: '800',
  },
  balanceStatusNote: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },

  // Expired Banner
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  expiredBannerLight: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  expiredBannerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  expiredIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  expiredDesc: {
    fontSize: 11.5,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },
  renewButton: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  renewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Tab Switcher
  tabSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabActiveLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  tabActiveDark: {
    backgroundColor: '#1E1E24',
    borderColor: '#2D2D35',
  },
  tabInactive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  textLightBold: {
    color: '#111827',
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: '#111827',
  },
  countBadgeInactive: {
    backgroundColor: '#E5E7EB',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3 KPI Cards
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 105,
    justifyContent: 'space-between',
  },
  kpiCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  kpiCardDark: {
    backgroundColor: '#161618',
    borderColor: '#26262B',
  },
  kpiCardGreenLight: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  kpiCardGreenDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  kpiCardPurpleLight: {
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
  },
  kpiCardPurpleDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  kpiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiCardValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginVertical: 2,
  },
  kpiCardSub: {
    fontSize: 10.5,
    color: '#6B7280',
    lineHeight: 14,
  },

  // Table
  tableContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  tableDark: {
    backgroundColor: '#161618',
    borderColor: '#26262B',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderLight: {
    backgroundColor: '#F9FAFB',
  },
  tableHeaderDark: {
    backgroundColor: '#1E1E24',
    borderBottomColor: '#2D2D35',
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLight: {
    backgroundColor: '#FFFFFF',
  },
  rowDark: {
    backgroundColor: '#161618',
  },
  rowBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  colCell: {
    justifyContent: 'center',
  },
  phoneIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneNumberText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  copyBtn: {
    padding: 3,
  },
  providerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  providerLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  providerDark: {
    backgroundColor: '#202024',
    borderColor: '#2D2D35',
  },
  providerText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  assistantPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  assistantBtnLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  assistantBtnDark: {
    backgroundColor: '#202024',
    borderColor: '#2D2D35',
  },
  assistantBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  statusPillGreen: {
    backgroundColor: '#D1FAE5',
  },
  statusPillGray: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testCallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  testCallActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  unassignActionBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  noActionsText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  claimNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimNowBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyTableBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  emptyTableSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  textDark: { color: '#F9FAFB' },
});
