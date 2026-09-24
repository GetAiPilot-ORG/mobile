import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AttendanceRecord,
  CRMMember,
  LeaveRequest,
} from '../../crm/types';
import { teamApi } from '../api/team.api';

type TabType =
  | 'members'
  | 'attendance'
  | 'leave'
  | 'presence';

const TABS: {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
    {
      key: 'members',
      label: 'Members',
      icon: 'people-outline',
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: 'time-outline',
    },
    {
      key: 'leave',
      label: 'Leave',
      icon: 'calendar-outline',
    },
    {
      key: 'presence',
      label: 'Presence',
      icon: 'eye-outline',
    },
  ];

const LEAVE_STATUS_COLOR: Record<
  string,
  { bg: string; text: string }
> = {
  pending: {
    bg: '#FEF3C7',
    text: '#F59E0B',
  },
  approved: {
    bg: '#ECFDF5',
    text: '#10B981',
  },
  rejected: {
    bg: '#FEF2F2',
    text: '#EF4444',
  },
  cancelled: {
    bg: '#F1F5F9',
    text: '#64748B',
  },
};

const ATTENDANCE_STATUS_COLOR: Record<
  string,
  { bg: string; text: string }
> = {
  present: {
    bg: '#ECFDF5',
    text: '#10B981',
  },
  absent: {
    bg: '#FEF2F2',
    text: '#EF4444',
  },
  late: {
    bg: '#FEF3C7',
    text: '#F59E0B',
  },
  half_day: {
    bg: '#EFF6FF',
    text: '#3B82F6',
  },
  wfh: {
    bg: '#F5F3FF',
    text: '#8B5CF6',
  },
  on_leave: {
    bg: '#FDF2F8',
    text: '#EC4899',
  },
};

export function TeamScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] =
    useState<TabType>('members');

  const queryClient = useQueryClient();

  // ─────────────────────────────────────────────
  // Theme
  // ─────────────────────────────────────────────

  const bg = isDark ? '#0F1015' : '#F8FAFC';
  const card = isDark ? '#1A1D26' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#262A34' : '#E2E8F0';
  const inputBg = isDark ? '#262A34' : '#F8FAFC';

  // ─────────────────────────────────────────────
  // Members
  // ─────────────────────────────────────────────

  const {
    data: membersData,
    isLoading: membersLoading,
    refetch: refetchMembers,
    isRefetching: membersRefetching,
  } = useQuery({
    queryKey: ['team-members'],
    queryFn: teamApi.getMembers,
    enabled: activeTab === 'members',
  });

  // ─────────────────────────────────────────────
  // Attendance
  // ─────────────────────────────────────────────

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
    isRefetching: attendanceRefetching,
  } = useQuery({
    queryKey: ['team-attendance'],
    queryFn: () =>
      teamApi.getAttendance({
        limit: 50,
      }),
    enabled: activeTab === 'attendance',
  });

  // ─────────────────────────────────────────────
  // Leave
  // ─────────────────────────────────────────────

  const {
    data: leaveData,
    isLoading: leaveLoading,
    refetch: refetchLeave,
    isRefetching: leaveRefetching,
  } = useQuery({
    queryKey: ['team-leave'],
    queryFn: () =>
      teamApi.getLeaveRequests({
        limit: 50,
      }),
    enabled: activeTab === 'leave',
  });

  // ─────────────────────────────────────────────
  // Presence
  // ─────────────────────────────────────────────

  const {
    data: presenceData,
    isLoading: presenceLoading,
    refetch: refetchPresence,
    isRefetching: presenceRefetching,
  } = useQuery({
    queryKey: ['team-presence'],
    queryFn: () =>
      teamApi.getPresence({
        limit: 50,
      }),
    enabled: activeTab === 'presence',
  });

  // ─────────────────────────────────────────────
  // Delete mutations
  // ─────────────────────────────────────────────

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) =>
      teamApi.deleteMember(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['team-members'],
      });
    },

    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.message || 'Failed to delete member',
      );
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) =>
      teamApi.deleteAttendance(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['team-attendance'],
      });
    },

    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.message || 'Failed to delete attendance',
      );
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (id: string) =>
      teamApi.deleteLeaveRequest(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['team-leave'],
      });
    },

    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.message || 'Failed to delete leave request',
      );
    },
  });

  // ─────────────────────────────────────────────
  // Delete confirmation
  // ─────────────────────────────────────────────

  const confirmDelete = (
    id: string,
    type: 'member' | 'attendance' | 'leave',
  ) => {
    let title = 'Delete Record';
    let message = 'Are you sure you want to delete this record?';

    if (type === 'member') {
      title = 'Delete Member';
      message =
        'Are you sure you want to remove this team member?';
    }

    if (type === 'attendance') {
      title = 'Delete Attendance';
      message =
        'Are you sure you want to delete this attendance record?';
    }

    if (type === 'leave') {
      title = 'Delete Leave';
      message =
        'Are you sure you want to delete this leave request?';
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (type === 'member') {
              deleteMemberMutation.mutate(id);
            }

            if (type === 'attendance') {
              deleteAttendanceMutation.mutate(id);
            }

            if (type === 'leave') {
              deleteLeaveMutation.mutate(id);
            }
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────

  const isLoading =
    activeTab === 'members'
      ? membersLoading
      : activeTab === 'attendance'
        ? attendanceLoading
        : activeTab === 'leave'
          ? leaveLoading
          : presenceLoading;

  // ─────────────────────────────────────────────
  // Refresh state
  // ─────────────────────────────────────────────

  const isRefetching =
    activeTab === 'members'
      ? membersRefetching
      : activeTab === 'attendance'
        ? attendanceRefetching
        : activeTab === 'leave'
          ? leaveRefetching
          : presenceRefetching;

  // ─────────────────────────────────────────────
  // Refresh
  // ─────────────────────────────────────────────

  const onRefresh = () => {
    if (activeTab === 'members') {
      refetchMembers();
      return;
    }

    if (activeTab === 'attendance') {
      refetchAttendance();
      return;
    }

    if (activeTab === 'leave') {
      refetchLeave();
      return;
    }

    refetchPresence();
  };
  const renderMember = ({
    item,
  }: {
    item: CRMMember;
  }) => {
    const firstLetter =
      item.name?.trim()?.charAt(0)?.toUpperCase() || '?';

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <View
          style={[
            styles.memberAvatar,
            {
              backgroundColor: item.is_active
                ? isDark
                  ? '#172554'
                  : '#EFF6FF'
                : isDark
                  ? '#262A34'
                  : '#F1F5F9',
            },
          ]}
        >
          <Text
            style={[
              styles.memberAvatarText,
              {
                color: item.is_active
                  ? '#3B82F6'
                  : '#64748B',
              },
            ]}
          >
            {firstLetter}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[
              styles.memberName,
              {
                color: text,
              },
            ]}
            numberOfLines={1}
          >
            {item.name || 'Unknown'}
          </Text>

          <Text
            style={[
              styles.memberEmail,
              {
                color: sub,
              },
            ]}
            numberOfLines={1}
          >
            {item.email || 'No email'}
          </Text>

          <View style={styles.memberMeta}>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: inputBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  {
                    color: sub,
                  },
                ]}
              >
                {item.role || 'Member'}
              </Text>
            </View>

            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: item.is_active
                    ? '#ECFDF5'
                    : '#FEF2F2',
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  {
                    color: item.is_active
                      ? '#10B981'
                      : '#EF4444',
                  },
                ]}
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.deleteButton}
          onPress={() =>
            confirmDelete(item.id, 'member')
          }
          hitSlop={10}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color="#EF4444"
          />
        </Pressable>
      </View>
    );
  };
  const renderAttendance = ({
    item,
  }: {
    item: AttendanceRecord;
  }) => {
    const statusColor =
      ATTENDANCE_STATUS_COLOR[item.status] || {
        bg: isDark ? '#262A34' : '#F1F5F9',
        text: sub,
      };

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.memberName,
              {
                color: text,
              },
            ]}
            numberOfLines={1}
          >
            {item.member?.name || 'Unknown'}
          </Text>

          <Text
            style={[
              styles.memberEmail,
              {
                color: sub,
              },
            ]}
          >
            {new Date(
              item.attendance_date,
            ).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            })}
          </Text>

          {item.clock_in_time && (
            <Text
              style={[
                styles.memberEmail,
                {
                  color: sub,
                },
              ]}
            >
              {item.clock_in_time.slice(0, 5)}
              {' → '}
              {item.clock_out_time?.slice(0, 5) ||
                'Ongoing'}

              {item.total_work_hours
                ? ` (${item.total_work_hours.toFixed(1)}h)`
                : ''}
            </Text>
          )}
        </View>

        <View style={styles.rightColumn}>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: statusColor.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.roleText,
                {
                  color: statusColor.text,
                },
              ]}
            >
              {item.status?.replace(/_/g, ' ')}
            </Text>
          </View>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              confirmDelete(item.id, 'attendance')
            }
            hitSlop={10}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#EF4444"
            />
          </Pressable>
        </View>
      </View>
    );
  };
  const renderLeave = ({
    item,
  }: {
    item: LeaveRequest;
  }) => {
    const statusColor =
      LEAVE_STATUS_COLOR[item.status] || {
        bg: isDark ? '#262A34' : '#F1F5F9',
        text: sub,
      };

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.memberName,
              {
                color: text,
              },
            ]}
            numberOfLines={1}
          >
            {item.member?.name || 'Unknown'}
          </Text>

          <Text
            style={[
              styles.memberEmail,
              {
                color: sub,
              },
            ]}
            numberOfLines={1}
          >
            {item.leave_type?.replace(/_/g, ' ') ||
              'Leave'}
            {' · '}
            {item.total_days}{' '}
            {item.total_days !== 1 ? 'days' : 'day'}
          </Text>

          <Text
            style={[
              styles.memberEmail,
              {
                color: sub,
              },
            ]}
          >
            {new Date(
              item.start_date,
            ).toLocaleDateString('en-IN')}
            {' → '}
            {new Date(
              item.end_date,
            ).toLocaleDateString('en-IN')}
          </Text>

          {!!item.reason && (
            <Text
              style={[
                styles.memberEmail,
                {
                  color: sub,
                },
              ]}
              numberOfLines={1}
            >
              {item.reason}
            </Text>
          )}
        </View>

        <View style={styles.rightColumn}>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: statusColor.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.roleText,
                {
                  color: statusColor.text,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              confirmDelete(item.id, 'leave')
            }
            hitSlop={10}
          >
            <Ionicons
              name="close-circle-outline"
              size={17}
              color="#EF4444"
            />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderPresence = ({
    item,
  }: {
    item: any;
  }) => {
    const isIdle = Boolean(item.is_idle);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        <View
          style={[
            styles.memberAvatar,
            {
              backgroundColor: isIdle
                ? '#FEF2F2'
                : '#ECFDF5',
            },
          ]}
        >
          <Ionicons
            name={
              isIdle
                ? 'moon-outline'
                : 'radio-button-on'
            }
            size={20}
            color={isIdle ? '#EF4444' : '#10B981'}
          />
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[
              styles.memberName,
              {
                color: text,
              },
            ]}
            numberOfLines={1}
          >
            {item.member?.name || 'Unknown'}
          </Text>

          {!!item.active_window && (
            <Text
              style={[
                styles.memberEmail,
                {
                  color: sub,
                },
              ]}
              numberOfLines={1}
            >
              {item.active_window}
            </Text>
          )}

          {!!item.logged_at && (
            <Text
              style={[
                styles.memberEmail,
                {
                  color: sub,
                },
              ]}
            >
              {new Date(
                item.logged_at,
              ).toLocaleTimeString('en-IN')}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: isIdle
                ? '#FEF2F2'
                : '#ECFDF5',
            },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              {
                color: isIdle
                  ? '#EF4444'
                  : '#10B981',
              },
            ]}
          >
            {isIdle ? 'Idle' : 'Active'}
          </Text>
        </View>
      </View>
    );
  };
  const addBtnConfig: Record<
    TabType,
    {
      label: string;
      color: string;
    }
  > = {
    members: {
      label: 'Add Member',
      color: '#3B82F6',
    },

    attendance: {
      label: 'Log',
      color: '#10B981',
    },

    leave: {
      label: 'Request',
      color: '#F59E0B',
    },

    presence: {
      label: 'Refresh',
      color: '#8B5CF6',
    },
  };

  const btnConf = addBtnConfig[activeTab]

  const listData =
    activeTab === 'members'
      ? membersData?.members ?? []
      : activeTab === 'attendance'
        ? attendanceData?.records ?? []
        : activeTab === 'leave'
          ? leaveData?.requests ?? []
          : presenceData?.logs ?? [];

  const renderItem =
    activeTab === 'members'
      ? renderMember
      : activeTab === 'attendance'
        ? renderAttendance
        : activeTab === 'leave'
          ? renderLeave
          : renderPresence;

  // ─────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: bg,
        },
      ]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.title,
              {
                color: text,
              },
            ]}
          >
            Team
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: sub,
              },
            ]}
          >
            Manage your team
          </Text>
        </View>

        <Pressable
          style={[
            styles.createBtn,
            {
              backgroundColor: btnConf.color,
            },
          ]}
          onPress={() => {
            if (activeTab === 'presence') {
              onRefresh();
            } else {
              Alert.alert(
                'Coming Soon',
                `${btnConf.label} functionality will be available here.`,
              );
            }
          }}
        >
          <Ionicons
            name={
              activeTab === 'presence'
                ? 'refresh-outline'
                : 'add'
            }
            size={17}
            color="#FFFFFF"
          />

          <Text style={styles.createBtnText}>
            {btnConf.label}
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {TABS.map((tab) => {
            const isActive =
              activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive
                      ? '#3B82F6'
                      : card,
                    borderColor: isActive
                      ? '#3B82F6'
                      : border,
                  },
                ]}
                onPress={() =>
                  setActiveTab(tab.key)
                }
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={
                    isActive ? '#FFFFFF' : sub
                  }
                />

                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive
                        ? '#FFFFFF'
                        : sub,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#3B82F6"
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color: sub,
                },
              ]}
            >
              Loading {activeTab}...
            </Text>
          </View>
        ) : (
          <FlatList
            key={activeTab}
            data={listData}
            keyExtractor={(item: any, index) =>
              item?.id?.toString() ||
              `${activeTab}-${index}`
            }
            renderItem={renderItem as any}
            contentContainerStyle={[
              styles.listContent,
              listData.length === 0 &&
              styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                tintColor="#3B82F6"
                colors={['#3B82F6']}
                progressBackgroundColor={card}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: isDark
                        ? '#1A1D26'
                        : '#EFF6FF',
                    },
                  ]}
                >
                  <Ionicons
                    name="file-tray-outline"
                    size={30}
                    color="#3B82F6"
                  />
                </View>

                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: text,
                    },
                  ]}
                >
                  No records found
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,
                    {
                      color: sub,
                    },
                  ]}
                >
                  There are no {activeTab} records
                  available yet.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },

  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  createBtn: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },

  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Tabs
  tabsWrapper: {
    width: '100%',
  },

  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },

  tab: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
    gap: 10,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  // Cards
  card: {
    width: '100%',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },

  deleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  // Avatar
  memberAvatar: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Text
  memberName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },

  memberEmail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  // Member meta
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },

  // Badges
  roleBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  roleText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyDescription: {
    maxWidth: 280,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});