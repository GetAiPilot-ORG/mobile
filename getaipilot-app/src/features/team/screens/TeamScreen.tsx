import {
  Ionicons
} from '@expo/vector-icons';
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getColors, useTheme } from '@/theme';
import {
  AttendanceRecord,
  CRMMember,
  LeaveRequest,
} from '../../crm/types';
import { teamApi } from '../api/team.api';
import { AddMemberModal } from '../components/AddMemberModal';

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
    // {
    //   key: 'attendance',
    //   label: 'Attendance',
    //   icon: 'time-outline',
    // },
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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [activeTab, setActiveTab] =
    useState<TabType>('members');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const queryClient = useQueryClient();

  const createMemberMutation = useMutation({
    mutationFn: (member: Partial<CRMMember>) => teamApi.createMember(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'members'] });
      Alert.alert('Success', 'Team member added successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to add team member');
    },
  });

  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);

  const getMemberMagicLink = (member: CRMMember) => {
    const token = member.access_token || member.id;
    return `https://getaipilot.online/crm/login?token=${encodeURIComponent(token)}&email=${encodeURIComponent(member.email || '')}`;
  };

  const handleCopyMagicLink = async (member: CRMMember) => {
    try {
      const link = getMemberMagicLink(member);
      await Clipboard.setStringAsync(link);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      }
      setCopiedMemberId(member.id);
      setTimeout(() => {
        setCopiedMemberId((prev) => (prev === member.id ? null : prev));
      }, 2500);

      Alert.alert(
        'Magic Link Copied 📋',
        `Magic login link for ${member.name || 'member'} copied to clipboard:\n\n${link}`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Share Link',
            onPress: () => {
              Share.share({
                title: `CRM Access for ${member.name}`,
                message: `Hi ${member.name}, here is your magic login link to access GetAiPilot CRM:\n\n${link}`,
                url: link,
              }).catch(() => { });
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to copy magic link');
    }
  };

  // ─────────────────────────────────────────────
  // Theme
  // ─────────────────────────────────────────────

  const bg = colors.background;
  const card = colors.card;
  const text = colors.text;
  const sub = colors.textSecondary;
  const border = colors.border;
  const inputBg = colors.surface;

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
    // enabled: activeTab === 'attendance',
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
      : activeTab === 'leave'
        ? leaveLoading
        : presenceLoading;

  // ─────────────────────────────────────────────
  // Refresh state
  // ─────────────────────────────────────────────

  const isRefetching =
    activeTab === 'members'
      ? membersRefetching
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
    const isCopied = copiedMemberId === item.id;

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
              backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
            },
          ]}
        >
          <Text
            style={[
              styles.memberAvatarText,
              {
                color: '#3B82F6',
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

        <View style={styles.memberCardActions}>
          <Pressable
            style={[
              styles.actionIconButton,
              {
                backgroundColor: isCopied
                  ? '#ECFDF5'
                  : isDark
                    ? '#1E1B4B'
                    : '#EEF2FF',
              },
            ]}
            onPress={() => handleCopyMagicLink(item)}
            hitSlop={6}
          >
            <Ionicons
              name={isCopied ? 'checkmark' : 'link-outline'}
              size={16}
              color={isCopied ? '#10B981' : '#6366F1'}
            />
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              confirmDelete(item.id, 'member')
            }
            hitSlop={6}
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
  const renderAttendance = ({
    item,
  }: {
    item: AttendanceRecord;
  }) => {
    const statusColor =
      ATTENDANCE_STATUS_COLOR[item.status] || {
        bg: colors.surface,
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
        bg: colors.background,
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
            {item.start_date ? new Date(item.start_date).toLocaleDateString('en-IN') : 'N/A'}
            {' → '}
            {item.end_date ? new Date(item.end_date).toLocaleDateString('en-IN') : 'N/A'}
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

  const isToolStarted = (member: CRMMember) => {
    if (!member) return false;
    const act = member.current_activity;
    if (act && typeof act === 'object' && Object.keys(act).length > 0) {
      if (act.status === 'stopped' || act.is_running === false) return false;
      return true;
    }
    if ((member.focus_score ?? 0) > 0) return true;
    return false;
  };

  const renderPresenceStats = () => {
    const members = presenceData?.members ?? [];
    const totalMembers = members.length;
    const activeNow = members.filter(isToolStarted).length;
    const trackerSync = members.filter((m) => Boolean(m.tracker_key)).length;

    return (
      <View
        style={[
          styles.presenceStatsCard,
          {
            backgroundColor: card,
            borderColor: border,
          },
        ]}
      >
        {/* Active Now */}
        <View style={styles.presenceStatItem}>
          <View style={styles.presenceIndicatorRow}>
            <View style={[styles.presenceDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.presenceStatNum, { color: '#10B981' }]}>
              {activeNow}
            </Text>
          </View>
          <Text style={[styles.presenceStatLabel, { color: sub }]}>
            Active Now
          </Text>
        </View>

        <View style={[styles.presenceStatDivider, { backgroundColor: border }]} />

        {/* Tracker Sync */}
        <View style={styles.presenceStatItem}>
          <View style={styles.presenceIndicatorRow}>
            <Ionicons name="sync-outline" size={13} color="#3B82F6" />
            <Text style={[styles.presenceStatNum, { color: '#3B82F6' }]}>
              {trackerSync}
            </Text>
          </View>
          <Text style={[styles.presenceStatLabel, { color: sub }]}>
            Tracker Sync
          </Text>
        </View>

        <View style={[styles.presenceStatDivider, { backgroundColor: border }]} />

        {/* Total Members */}
        <View style={styles.presenceStatItem}>
          <Text style={[styles.presenceStatNum, { color: text }]}>
            {totalMembers}
          </Text>
          <Text style={[styles.presenceStatLabel, { color: sub }]}>
            Total Members
          </Text>
        </View>
      </View>
    );
  };

  const renderPresence = ({
    item,
  }: {
    item: CRMMember;
  }) => {
    const memberName = item.name || 'Unknown';
    const memberRole = item.role || 'Member';
    const act = item.current_activity || {};
    const hasStarted = isToolStarted(item);
    const activityText = hasStarted
      ? act.active_window || act.window || act.app || act.title || 'Tool Started · Active'
      : item.last_login_at
        ? `Offline · Last seen ${new Date(item.last_login_at).toLocaleDateString('en-IN')}`
        : 'Tool Not Started · Offline';

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
              backgroundColor: hasStarted ? '#ECFDF5' : (isDark ? '#1E293B' : '#F1F5F9'),
            },
          ]}
        >
          <Ionicons
            name={hasStarted ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={hasStarted ? '#10B981' : '#94A3B8'}
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
            {memberName}
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
            {memberRole} · {activityText}
          </Text>

          {item.focus_score !== undefined && item.focus_score > 0 && (
            <Text
              style={[
                styles.memberEmail,
                {
                  color: '#8B5CF6',
                  fontWeight: '600',
                  marginTop: 2,
                },
              ]}
            >
              Focus Score: {item.focus_score}%
            </Text>
          )}
        </View>

        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: hasStarted ? '#ECFDF5' : '#F1F5F9',
            },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              {
                color: hasStarted ? '#10B981' : '#64748B',
                fontWeight: '700',
              },
            ]}
          >
            {hasStarted ? 'Tool Started' : 'Not Started'}
          </Text>
        </View>
      </View>
    );
  };

  const listData =
    activeTab === 'members'
      ? membersData?.members ?? []
      : activeTab === 'leave'
        ? leaveData?.requests ?? []
        : presenceData?.members ?? [];

  const renderItem =
    activeTab === 'members'
      ? renderMember
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

        {activeTab === 'members' && (
          <Pressable
            style={[
              styles.createBtn,
              {
                backgroundColor: '#3B82F6',
              },
            ]}
            onPress={() => setShowAddMemberModal(true)}
          >
            <Ionicons
              name="add"
              size={17}
              color="#FFFFFF"
            />
            <Text style={styles.createBtnText}>
              Add Member
            </Text>
          </Pressable>
        )}

        {activeTab === 'presence' && (
          <Pressable
            style={[
              styles.createBtn,
              {
                backgroundColor: '#8B5CF6',
              },
            ]}
            onPress={onRefresh}
          >
            <Ionicons
              name="refresh-outline"
              size={17}
              color="#FFFFFF"
            />
            <Text style={styles.createBtnText}>
              Refresh
            </Text>
          </Pressable>
        )}
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
          <FlatList<any>
            key={activeTab}
            data={listData}
            keyExtractor={(item: any, index) =>
              item?.id?.toString() ||
              `${activeTab}-${index}`
            }
            renderItem={renderItem as any}
            ListHeaderComponent={
              activeTab === 'presence' ? renderPresenceStats : null
            }
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
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={activeTab === 'presence' ? 'desktop-outline' : 'file-tray-outline'}
                    size={30}
                    color={activeTab === 'presence' ? '#8B5CF6' : '#3B82F6'}
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
                  {activeTab === 'presence' ? 'No Tool Started' : 'No records found'}
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,
                    {
                      color: sub,
                    },
                  ]}
                >
                  {activeTab === 'presence'
                    ? 'Only team members who have started the tracking tool appear here. Currently, no member tool session is running.'
                    : `There are no ${activeTab} records available yet.`}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <AddMemberModal
        visible={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        isLoading={createMemberMutation.isPending}
        onSubmit={async (member) => {
          await createMemberMutation.mutateAsync(member);
        }}
      />
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

  memberCardActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },

  actionIconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  deleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  magicLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },

  magicLinkText: {
    fontSize: 11,
    fontWeight: '700',
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

  // Presence Stats
  presenceStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  presenceStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceStatDivider: {
    width: 1,
    height: 28,
  },
  presenceStatNum: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  presenceStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  presenceIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});