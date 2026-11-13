import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme, getColors } from '@/theme';

export interface FilterState {
  status: 'ALL' | 'UNREAD' | 'UNASSIGNED' | 'MINE' | 'BOT_ACTIVE' | 'RESOLVED';
  dateRange: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
  assigneeId: string | 'ALL';
  assigneeName?: string;
  tag?: string;
}

interface ActiveFilterChipsProps {
  filters: FilterState;
  onRemoveStatus: () => void;
  onRemoveDateRange: () => void;
  onRemoveAssignee: () => void;
  onClearAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onRemoveStatus,
  onRemoveDateRange,
  onRemoveAssignee,
  onClearAll,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const activePills: Array<{ id: string; label: string; onRemove: () => void }> = [];

  if (filters.status !== 'ALL') {
    const statusLabels: Record<string, string> = {
      UNREAD: 'Unread',
      UNASSIGNED: 'Unassigned',
      MINE: 'Assigned to Me',
      BOT_ACTIVE: 'AI Active',
      RESOLVED: 'Resolved',
    };
    activePills.push({
      id: 'status',
      label: statusLabels[filters.status] || filters.status,
      onRemove: onRemoveStatus,
    });
  }

  if (filters.dateRange !== 'ALL') {
    const dateLabels: Record<string, string> = {
      TODAY: 'Today',
      WEEK: 'Last 7 Days',
      MONTH: 'Last 30 Days',
    };
    activePills.push({
      id: 'dateRange',
      label: dateLabels[filters.dateRange] || filters.dateRange,
      onRemove: onRemoveDateRange,
    });
  }

  if (filters.assigneeId !== 'ALL' && filters.assigneeName) {
    activePills.push({
      id: 'assignee',
      label: `Agent: ${filters.assigneeName.split(' ')[0]}`,
      onRemove: onRemoveAssignee,
    });
  }

  if (activePills.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activePills.map((pill) => (
          <Pressable
            key={pill.id}
            onPress={pill.onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove filter ${pill.label}`}
            style={[
              styles.pill,
              {
                backgroundColor: colors.accentSoft,
                borderColor: colors.accent,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: colors.accent }]}>
              {pill.label}
            </Text>
            <X size={12} color={colors.accent} strokeWidth={2.4} style={{ marginLeft: 4 }} />
          </Pressable>
        ))}

        {activePills.length > 1 && (
          <Pressable
            onPress={onClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all active filters"
            style={[
              styles.clearAllBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text style={[styles.clearAllText, { color: colors.textSecondary }]}>
              Clear all
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

