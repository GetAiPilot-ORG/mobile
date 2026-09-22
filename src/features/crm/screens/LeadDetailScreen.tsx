import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
  TextInput,
  Alert,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLead, useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { useDeals, useCreateDeal, useUpdateDealStage } from '../hooks/useDeals';
import { useTasks, useCreateTask, useToggleTask } from '../hooks/useTasks';
import { useActivities, useCreateActivity, useAddLeadNote } from '../hooks/useActivities';
import { ContactStatus, DealStage } from '../types';
import { DealCard } from '../components/DealCard';
import { TaskItem } from '../components/TaskItem';
import { ActivityTimelineItem } from '../components/ActivityTimelineItem';
import { CreateDealModal } from '../components/CreateDealModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { LogActivityModal } from '../components/LogActivityModal';
import { LeadDetailSkeleton } from '../../../components/skeletonScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeadDetailScreenProps {
  leadId: string;
  onBack: () => void;
  onSelectDeal?: (dealId: string) => void;
}

const STATUS_CONFIG: Partial<Record<ContactStatus, { label: string; bg: string; text: string; dot: string }>> = {
  lead: { label: 'New Lead', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', dot: '#3B82F6' },
  prospect: { label: 'Prospect', bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', dot: '#F59E0B' },
  customer: { label: 'Customer', bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', dot: '#10B981' },
  churned: { label: 'Churned', bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', dot: '#EF4444' },
  open: { label: 'Open', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', dot: '#3B82F6' },
  active: { label: 'Active', bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', dot: '#10B981' },
  archived: { label: 'Archived', bg: 'rgba(156, 163, 175, 0.15)', text: '#6B7280', dot: '#6B7280' },
};

const PIPELINE_STEPS: Array<{ key: DealStage; label: string }> = [
  { key: 'lead', label: 'Lead' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'closed_won', label: 'Won' },
];

export const LeadDetailScreen: React.FC<LeadDetailScreenProps> = ({
  leadId,
  onBack,
  onSelectDeal,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: lead, isLoading, refetch } = useLead(leadId);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const { data: deals = [] } = useDeals({ contact_id: leadId });
  const { data: tasks = [] } = useTasks({ contact_id: leadId });
  const { data: activities = [] } = useActivities({ contact_id: leadId });

  const createDeal = useCreateDeal();
  const updateDealStage = useUpdateDealStage();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const createActivity = useCreateActivity();
  const addLeadNote = useAddLeadNote();

  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'tasks' | 'timeline'>('overview');
  const [quickNote, setQuickNote] = useState('');
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);

  // Active Deal stage calculation
  const primaryDeal = deals[0];
  const currentDealStage: DealStage = primaryDeal?.stage || 'lead';
  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.key === currentDealStage);

  // Total deal pipeline value for this contact
  const totalContactDealValue = useMemo(() => {
    return deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  }, [deals]);

  // Dynamic engagement score
  const engagementScore = useMemo(() => {
    let score = 65;
    if (lead?.phone) score += 10;
    if (lead?.email) score += 5;
    if (activities.length > 0) score += Math.min(activities.length * 4, 15);
    if (deals.length > 0) score += 5;
    return Math.min(score, 98);
  }, [lead, activities, deals]);

  const handleCall = () => {
    if (!lead?.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(`tel:${lead.phone}`);
  };

  const handleWhatsApp = () => {
    if (!lead?.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const leadName = lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    const msg = encodeURIComponent(`Hi ${leadName || 'there'}, following up regarding our discussion.`);
    const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${msg}`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${msg}`;

    Linking.canOpenURL(appUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(appUrl);
        } else {
          Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webUrl);
      });
  };

  const handleEmail = () => {
    if (!lead?.email) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(`mailto:${lead.email}`);
  };

  const handleStepPress = (stepKey: DealStage, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (primaryDeal) {
      updateDealStage.mutate({ id: primaryDeal.id, stage: stepKey });
    } else {
      // If no deal exists yet, update lead status mapping
      const statusMap: Record<DealStage, ContactStatus> = {
        lead: 'lead',
        qualified: 'prospect',
        proposal: 'prospect',
        negotiation: 'prospect',
        closed_won: 'customer',
        closed_lost: 'churned',
      };
      if (lead) {
        updateLead.mutate({ id: lead.id, patch: { status: statusMap[stepKey] || 'lead' } });
      }
    }
  };

  const handleStatusChange = (newStatus: ContactStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (lead) {
      updateLead.mutate({ id: lead.id, patch: { status: newStatus } });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (lead) {
              await deleteLead.mutateAsync(lead.id);
              onBack();
            }
          },
        },
      ]
    );
  };

  const handleSendQuickNote = async () => {
    if (!quickNote.trim() || !lead) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await addLeadNote.mutateAsync({ leadId: lead.id, note: quickNote.trim() });
    setQuickNote('');
  };

  if (isLoading || !lead) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]}>
        <LeadDetailSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#1E2028' : '#E2E8F0' }]}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: isDark ? '#181A20' : '#F1F5F9' }]}
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
          {lead.name || `${lead.first_name} ${lead.last_name}`}
        </Text>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: isDark ? '#181A20' : '#F1F5F9' }]}
          onPress={handleDelete}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]}>
              <Text style={styles.avatarText}>
                {(lead.first_name?.[0] || 'L').toUpperCase()}
                {(lead.last_name?.[0] || '').toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameValueRow}>
                <Text style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {lead.name || `${lead.first_name} ${lead.last_name}`}
                </Text>
                {totalContactDealValue > 0 && (
                  <View style={[styles.dealValBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                    <Text style={styles.dealValBadgeText}>
                      ₹{(totalContactDealValue / 100000).toFixed(1)}L
                    </Text>
                  </View>
                )}
              </View>

              {lead.company || lead.job_title ? (
                <Text style={[styles.profileCompany, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  {[lead.job_title, lead.company].filter(Boolean).join(' • ')}
                </Text>
              ) : null}

              {/* Status Pill Switcher */}
              <View style={styles.statusRow}>
                {(['lead', 'prospect', 'customer', 'churned'] as ContactStatus[]).map((s) => {
                  const isCurrent = lead.status === s;
                  const cfg = STATUS_CONFIG[s] || {
                    label: s,
                    bg: 'rgba(59, 130, 246, 0.15)',
                    text: '#3B82F6',
                    dot: '#3B82F6',
                  };
                  return (
                    <Pressable
                      key={s}
                      style={[
                        styles.statusTab,
                        { backgroundColor: isDark ? '#121316' : '#F8FAFC', borderColor: isDark ? '#262A34' : '#E2E8F0' },
                        isCurrent && { backgroundColor: cfg.bg, borderColor: cfg.dot },
                      ]}
                      onPress={() => handleStatusChange(s)}
                    >
                      <Text
                        style={[
                          styles.statusTabText,
                          isCurrent ? { color: cfg.text, fontWeight: '700' } : { color: isDark ? '#6B7280' : '#94A3B8' },
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* 4 Large Touchpoint Action Buttons (Thumb-Zone Ergonomics) */}
        <View style={styles.touchpointsGrid}>
          {/* Call */}
          <Pressable
            style={[
              styles.touchpointLargeBtn,
              isDark ? styles.cardDark : styles.cardLight,
              !lead.phone && styles.touchpointBtnDisabled,
            ]}
            onPress={handleCall}
            disabled={!lead.phone}
          >
            <View style={[styles.touchpointIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="call" size={20} color="#10B981" />
            </View>
            <Text style={[styles.touchpointLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Call</Text>
            <Text style={[styles.touchpointSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
              {lead.phone ? 'Direct dial' : 'No phone'}
            </Text>
          </Pressable>

          {/* WhatsApp */}
          <Pressable
            style={[
              styles.touchpointLargeBtn,
              isDark ? styles.cardDark : styles.cardLight,
              !lead.phone && styles.touchpointBtnDisabled,
            ]}
            onPress={handleWhatsApp}
            disabled={!lead.phone}
          >
            <View style={[styles.touchpointIconCircle, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <Text style={[styles.touchpointLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>WhatsApp</Text>
            <Text style={[styles.touchpointSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
              {lead.phone ? 'Chat now' : 'No phone'}
            </Text>
          </Pressable>

          {/* Email */}
          <Pressable
            style={[
              styles.touchpointLargeBtn,
              isDark ? styles.cardDark : styles.cardLight,
              !lead.email && styles.touchpointBtnDisabled,
            ]}
            onPress={handleEmail}
            disabled={!lead.email}
          >
            <View style={[styles.touchpointIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="mail" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.touchpointLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Email</Text>
            <Text style={[styles.touchpointSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
              {lead.email ? 'Compose' : 'No email'}
            </Text>
          </Pressable>

          {/* Schedule / Task */}
          <Pressable
            style={[styles.touchpointLargeBtn, isDark ? styles.cardDark : styles.cardLight]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShowAddTask(true);
            }}
          >
            <View style={[styles.touchpointIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="calendar" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.touchpointLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Schedule</Text>
            <Text style={[styles.touchpointSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>+ Follow-up</Text>
          </Pressable>
        </View>

        {/* Interactive Deal Stage Stepper */}
        <View style={[styles.stepperCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.stepperHeader}>
            <Text style={[styles.stepperTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Pipeline Progress
            </Text>
            <Text style={styles.stepperStageCurrent}>
              {PIPELINE_STEPS[Math.max(currentStepIndex, 0)].label}
            </Text>
          </View>

          <View style={styles.stepperTrackContainer}>
            {PIPELINE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex || (currentStepIndex === -1 && idx === 0);

              return (
                <React.Fragment key={step.key}>
                  {/* Step Node */}
                  <Pressable
                    style={styles.stepNodeItem}
                    onPress={() => handleStepPress(step.key, idx)}
                  >
                    <View
                      style={[
                        styles.stepCircle,
                        isPast && styles.stepCirclePast,
                        isCurrent && styles.stepCircleCurrent,
                        !isPast && !isCurrent && (isDark ? styles.stepCircleFutureDark : styles.stepCircleFutureLight),
                      ]}
                    >
                      {isPast ? (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            styles.stepNumber,
                            isCurrent && { color: '#FFFFFF', fontWeight: '700' },
                            !isPast && !isCurrent && { color: isDark ? '#6B7280' : '#94A3B8' },
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isCurrent && { color: '#3B82F6', fontWeight: '700' },
                        isPast && { color: isDark ? '#D1D5DB' : '#334155' },
                        !isPast && !isCurrent && { color: isDark ? '#6B7280' : '#94A3B8' },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </Pressable>

                  {/* Connecting Line */}
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        isPast ? styles.stepLinePast : isDark ? styles.stepLineFutureDark : styles.stepLineFutureLight,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Engagement Intent Score Card */}
        <View style={[styles.scoreCard, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.scoreTopRow}>
            <View>
              <Text style={[styles.scoreTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Customer Engagement Score
              </Text>
              <Text style={[styles.scoreSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                AI Intent & Responsiveness Rating
              </Text>
            </View>

            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeNumber}>{engagementScore}</Text>
              <Text style={styles.scoreBadgeTotal}>/100</Text>
            </View>
          </View>

          {/* Score Meter Bar */}
          <View style={[styles.scoreMeterTrack, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]}>
            <View style={[styles.scoreMeterFill, { width: `${engagementScore}%` }]} />
          </View>

          {/* Highlights */}
          <View style={styles.scoreHighlights}>
            <View style={styles.scoreChip}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              <Text style={[styles.scoreChipText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                {activities.length > 0 ? `${activities.length} interactions` : 'Newly assigned'}
              </Text>
            </View>
            <View style={styles.scoreChip}>
              <Ionicons name="flame" size={13} color="#F59E0B" />
              <Text style={[styles.scoreChipText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                High Intent Prospect
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={[styles.tabNav, { borderBottomColor: isDark ? '#1E2028' : '#E2E8F0' }]}>
          {[
            { key: 'overview', label: 'Overview', count: null },
            { key: 'deals', label: 'Deals', count: deals.length },
            { key: 'tasks', label: 'Tasks', count: tasks.length },
            { key: 'timeline', label: 'Timeline', count: activities.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.navTabItem, isSelected && styles.navTabItemSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTab(tab.key as any);
                }}
              >
                <Text
                  style={[
                    styles.navTabText,
                    { color: isDark ? '#9CA3AF' : '#64748B' },
                    isSelected && (isDark ? styles.navTabTextSelectedDark : styles.navTabTextSelectedLight),
                  ]}
                >
                  {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              {/* Contact Details Card */}
              <View style={[styles.infoCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Contact Information
                </Text>

                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>Phone</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>
                      {lead.phone || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>Email</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>
                      {lead.email || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>Company</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>
                      {lead.company || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-circle-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#6B7280' : '#94A3B8' }]}>
                      Assigned Sales Rep
                    </Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#E5E7EB' : '#1E293B' }]}>
                      {lead.assignee?.name || 'Unassigned'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Notes Card */}
              <View style={[styles.infoCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Notes & Context</Text>
                <Text style={[styles.notesText, { color: isDark ? '#D1D5DB' : '#334155' }]}>
                  {lead.notes || 'No general notes logged for this contact.'}
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'deals' && (
            <View>
              <View style={styles.subHeader}>
                <Text style={[styles.subHeaderTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Linked Deals</Text>
                <Pressable
                  style={[styles.subHeaderBtn, { backgroundColor: isDark ? '#262A34' : '#EFF6FF' }]}
                  onPress={() => setShowAddDeal(true)}
                >
                  <Text style={styles.subHeaderBtnText}>+ New Deal</Text>
                </Pressable>
              </View>

              {deals.length === 0 ? (
                <View style={[styles.emptyTabCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="briefcase-outline" size={32} color={isDark ? '#6B7280' : '#94A3B8'} />
                  <Text style={[styles.emptyTabText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    No deals associated with this contact yet.
                  </Text>
                </View>
              ) : (
                deals.map((d) => (
                  <DealCard
                    key={d.id}
                    deal={d}
                    onPress={() => onSelectDeal?.(d.id)}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'tasks' && (
            <View>
              <View style={styles.subHeader}>
                <Text style={[styles.subHeaderTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Follow-ups & Tasks
                </Text>
                <Pressable
                  style={[styles.subHeaderBtn, { backgroundColor: isDark ? '#262A34' : '#EFF6FF' }]}
                  onPress={() => setShowAddTask(true)}
                >
                  <Text style={styles.subHeaderBtnText}>+ New Task</Text>
                </Pressable>
              </View>

              {tasks.length === 0 ? (
                <View style={[styles.emptyTabCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="checkbox-outline" size={32} color={isDark ? '#6B7280' : '#94A3B8'} />
                  <Text style={[styles.emptyTabText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    No open tasks for this contact.
                  </Text>
                </View>
              ) : (
                tasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onToggle={(done) => toggleTask.mutate({ id: t.id, done })}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'timeline' && (
            <View>
              {/* Quick Note Input Bar */}
              <View
                style={[
                  styles.quickNoteBar,
                  { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' },
                ]}
              >
                <TextInput
                  style={[styles.quickNoteInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  placeholder="Add a quick note or update..."
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  value={quickNote}
                  onChangeText={setQuickNote}
                />
                <Pressable
                  style={[styles.quickNoteSendBtn, !quickNote.trim() && { opacity: 0.5 }]}
                  onPress={handleSendQuickNote}
                  disabled={!quickNote.trim() || addLeadNote.isPending}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              {activities.length === 0 ? (
                <View style={[styles.emptyTabCard, isDark ? styles.cardDark : styles.cardLight]}>
                  <Ionicons name="time-outline" size={32} color={isDark ? '#6B7280' : '#94A3B8'} />
                  <Text style={[styles.emptyTabText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    No activity history logged yet.
                  </Text>
                </View>
              ) : (
                activities.map((act, idx) => (
                  <ActivityTimelineItem
                    key={act.id}
                    activity={act}
                    isLast={idx === activities.length - 1}
                  />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <CreateDealModal
        visible={showAddDeal}
        defaultContactId={lead.id}
        onClose={() => setShowAddDeal(false)}
        onSubmit={async (deal) => {
          await createDeal.mutateAsync({ ...deal, contact_id: lead.id });
          refetch();
        }}
        isLoading={createDeal.isPending}
      />

      <CreateTaskModal
        visible={showAddTask}
        defaultContactId={lead.id}
        onClose={() => setShowAddTask(false)}
        onSubmit={async (task) => {
          await createTask.mutateAsync({ ...task, contact_id: lead.id });
          refetch();
        }}
        isLoading={createTask.isPending}
      />

      <LogActivityModal
        visible={showLogActivity}
        defaultContactId={lead.id}
        onClose={() => setShowLogActivity(false)}
        onSubmit={async (act) => {
          await createActivity.mutateAsync({ ...act, contact_id: lead.id });
          refetch();
        }}
        isLoading={createActivity.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: 12,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  cardDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  nameValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  dealValBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  dealValBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  profileCompany: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTabText: {
    fontSize: 11,
  },
  touchpointsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
  },
  touchpointLargeBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  touchpointBtnDisabled: {
    opacity: 0.4,
  },
  touchpointIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  touchpointLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  touchpointSub: {
    fontSize: 10,
    marginTop: 2,
  },
  stepperCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stepperTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepperStageCurrent: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepperTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNodeItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCirclePast: {
    backgroundColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCircleFutureDark: {
    backgroundColor: '#262A34',
  },
  stepCircleFutureLight: {
    backgroundColor: '#E2E8F0',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLinePast: {
    backgroundColor: '#10B981',
  },
  stepLineFutureDark: {
    backgroundColor: '#262A34',
  },
  stepLineFutureLight: {
    backgroundColor: '#E2E8F0',
  },
  scoreCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  scoreTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreBadgeNumber: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
  },
  scoreBadgeTotal: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
  scoreMeterTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreMeterFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  scoreHighlights: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: 18,
    marginBottom: 14,
  },
  navTabItem: {
    paddingVertical: 10,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabItemSelected: {
    borderBottomColor: '#3B82F6',
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navTabTextSelectedDark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navTabTextSelectedLight: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  overviewContainer: {
    gap: 14,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  subHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subHeaderBtnText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTabCard: {
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTabText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  quickNoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  quickNoteInput: {
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 8,
  },
  quickNoteSendBtn: {
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
