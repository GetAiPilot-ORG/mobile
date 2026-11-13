import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, CheckmarkCircle01Icon } from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';
import { FilterState } from './ActiveFilterChips';
import { TeamMember } from '../types';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  teamMembers?: TeamMember[];
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  teamMembers = [],
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [draft, setDraft] = useState<FilterState>(currentFilters);

  useEffect(() => {
    if (visible) {
      setDraft(currentFilters);
    }
  }, [visible, currentFilters]);

  const handleReset = () => {
    const cleared: FilterState = {
      status: 'ALL',
      dateRange: 'ALL',
      assigneeId: 'ALL',
      assigneeName: undefined,
    };
    setDraft(cleared);
  };

  const handleApply = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch { }
    }
    onApplyFilters(draft);
    onClose();
  };

  const STATUS_OPTIONS: Array<{ id: FilterState['status']; label: string; desc: string }> = [
    { id: 'ALL', label: 'All Statuses', desc: 'Show all active & inactive conversations' },
    { id: 'UNREAD', label: 'Unread', desc: 'Conversations with pending incoming messages' },
    { id: 'UNASSIGNED', label: 'Unassigned', desc: 'No team member is assigned' },
    { id: 'MINE', label: 'Assigned to Me', desc: 'Conversations where you are the agent' },
    { id: 'BOT_ACTIVE', label: 'AI Active', desc: 'Conversations actively handled by AI bot' },
    { id: 'RESOLVED', label: 'Resolved', desc: 'Closed or completed conversations' },
  ];

  const DATE_OPTIONS: Array<{ id: FilterState['dateRange']; label: string }> = [
    { id: 'ALL', label: 'All Time' },
    { id: 'TODAY', label: 'Today' },
    { id: 'WEEK', label: 'Last 7 Days' },
    { id: 'MONTH', label: 'Last 30 Days' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Filter Conversations
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Refine by status, timeframe, and assignee
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close filter sheet"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={20}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Section */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              STATUS
            </Text>
            <View style={styles.statusGroup}>
              {STATUS_OPTIONS.map((item) => {
                const isSelected = draft.status === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setDraft({ ...draft, status: item.id })}
                    style={[
                      styles.statusRow,
                      {
                        backgroundColor: isSelected
                          ? colors.accentSoft
                          : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isSelected
                          ? colors.accent
                          : isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.statusLabel,
                          {
                            color: isSelected ? colors.accent : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.statusDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </View>

                    {isSelected && (
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={18}
                        color={colors.accent}
                        strokeWidth={2.4}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Date Range Section */}
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.textSecondary, marginTop: 18 },
              ]}
            >
              DATE RANGE
            </Text>
            <View style={styles.dateChipRow}>
              {DATE_OPTIONS.map((opt) => {
                const isSelected = draft.dateRange === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setDraft({ ...draft, dateRange: opt.id })}
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor: isSelected
                          ? colors.accentSoft
                          : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isSelected
                          ? colors.accent
                          : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        {
                          color: isSelected ? colors.accent : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Assignee Section */}
            {teamMembers.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: colors.textSecondary, marginTop: 18 },
                  ]}
                >
                  ASSIGNED AGENT
                </Text>
                <View style={styles.dateChipRow}>
                  <Pressable
                    onPress={() =>
                      setDraft({
                        ...draft,
                        assigneeId: 'ALL',
                        assigneeName: undefined,
                      })
                    }
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor:
                          draft.assigneeId === 'ALL'
                            ? colors.accentSoft
                            : isDark
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.04)',
                        borderColor:
                          draft.assigneeId === 'ALL'
                            ? colors.accent
                            : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        {
                          color:
                            draft.assigneeId === 'ALL'
                              ? colors.accent
                              : colors.textPrimary,
                          fontWeight: draft.assigneeId === 'ALL' ? '700' : '500',
                        },
                      ]}
                    >
                      All Agents
                    </Text>
                  </Pressable>

                  {teamMembers.slice(0, 6).map((m) => {
                    const isSelected = draft.assigneeId === m.user_id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() =>
                          setDraft({
                            ...draft,
                            assigneeId: m.user_id,
                            assigneeName: m.name,
                          })
                        }
                        style={[
                          styles.dateChip,
                          {
                            backgroundColor: isSelected
                              ? colors.accentSoft
                              : isDark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.04)',
                            borderColor: isSelected
                              ? colors.accent
                              : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateChipText,
                            {
                              color: isSelected
                                ? colors.accent
                                : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {m.name.split(' ')[0]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleReset}
              style={[
                styles.resetBtn,
                {
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Reset all filters"
            >
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                Reset All
              </Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              style={[
                styles.applyBtn,
                { backgroundColor: colors.buttonPrimary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
            >
              <Text
                style={[
                  styles.applyText,
                  { color: colors.buttonPrimaryForeground },
                ]}
              >
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 24,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    maxHeight: 380,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusGroup: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  statusDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  dateChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateChipText: {
    fontSize: 12.5,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  resetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  resetText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});


